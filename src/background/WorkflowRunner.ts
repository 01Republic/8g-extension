import { TabManager } from './TabManager';
import type { Workflow } from '@/sdk/types';

// 코드 리팩토링 필요 - 너무 커짐
export class WorkflowRunner {
  constructor(private tabManager: TabManager) {}

  async run(workflow: Workflow, tabId: number) {
    const context: any = { steps: {}, vars: {} };
    const stepsById = new Map(workflow.steps.map((s) => [s.id, s]));
    let currentId: string | undefined = workflow.start;
    const results: any[] = [];
    while (currentId) {
      const step = stepsById.get(currentId);
      if (!step) break;

      const startedAt = new Date().toISOString();
      let skipped = false;
      let success = true;
      let message = '';
      let result: any = null;
      let attempts = 0;

      const shouldRun = this.evaluateWhen(step.when, context);
      if (!shouldRun) {
        skipped = true;
      } else if (step.block) {
        // repeat 설정이 있으면 반복 실행
        if (step.repeat) {
          result = await this.executeWithRepeat(step, context, tabId);
          success = !result?.hasError;
          message = result?.message || '';
        } else {
          // 기존 단일 실행 로직
          const maxAttempts = Math.max(1, step.retry?.attempts ?? 1);
          const baseDelay = step.retry?.delayMs ?? 0;
          const backoff = step.retry?.backoffFactor ?? 1;
          while (attempts < maxAttempts) {
            attempts++;
            try {
              const boundBlock = this.resolveBindings(step.block, context);
              result = await this.runWithTimeout(() => this.tabManager.executeBlock(boundBlock as any, tabId), step.timeoutMs);
              success = !result?.hasError;
              message = result?.message || '';
              if (success) break;
            } catch (e: any) {
              success = false;
              message = e?.message || 'Workflow step error';
            }
            if (attempts < maxAttempts) {
              const wait = baseDelay * Math.pow(backoff, attempts - 1);
              if (wait > 0) await new Promise((r) => setTimeout(r, wait));
            }
          }
        }
      } else {
        skipped = true;
      }

      const finishedAt = new Date().toISOString();
      const record = { stepId: step.id, skipped, success, message, result, startedAt, finishedAt, attempts };
      results.push(record);
      context.steps[step.id] = { result, success, skipped };

      if (step.switch && step.switch.length > 0) {
        const matched = step.switch.find((c) => this.evaluateWhen(c.when, context));
        if (matched) {
          if (!skipped && typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
            await new Promise((r) => setTimeout(r, step.delayAfterMs));
          }
          currentId = matched.next;
          continue;
        }
      }
      if (success && step.onSuccess) {
        if (!skipped && typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
          await new Promise((r) => setTimeout(r, step.delayAfterMs));
        }
        currentId = step.onSuccess;
        continue;
      }
      if (!success && step.onFailure) {
        if (!skipped && typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
          await new Promise((r) => setTimeout(r, step.delayAfterMs));
        }
        currentId = step.onFailure;
        continue;
      }
      if (step.next) {
        if (!skipped && typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
          await new Promise((r) => setTimeout(r, step.delayAfterMs));
        }
        currentId = step.next;
        continue;
      }

      break;
    }
    return { steps: results };
  }

  private evaluateWhen(when: any, context: any): boolean {
    if (!when) return true;
    // 직입형 JSON 조건 (equals/exists/...) 지원
    const isDirectJson =
      typeof when === 'object' && when !== null && (
        'exists' in when ||
        'equals' in when ||
        'notEquals' in when ||
        'contains' in when ||
        'regex' in when ||
        'and' in when ||
        'or' in when ||
        'not' in when
      );
    if (isDirectJson) {
      return this.evaluateJsonCondition(when, context);
    }
    if (when.expr && typeof when.expr === 'string') {
      try {
        const $ = context;
        // eslint-disable-next-line no-new-func
        const fn = new Function('$', `return (${when.expr});`);
        const res = fn($);
        return !!res;
      } catch {
        return false;
      }
    }
    if (when.json) {
      return this.evaluateJsonCondition(when.json, context);
    }
    return true;
  }

  private evaluateJsonCondition(cond: any, context: any): boolean {
    if (cond.exists) return this.getByPath(context, cond.exists) !== undefined;
    if (cond.equals) return this.getByPath(context, cond.equals.left) === cond.equals.right;
    if (cond.notEquals) return this.getByPath(context, cond.notEquals.left) !== cond.notEquals.right;
    if (cond.contains) {
      const val = this.getByPath(context, cond.contains.value);
      if (Array.isArray(val)) return val.some((v) => (v + '').includes(cond.contains.search + ''));
      return (val + '').includes(cond.contains.search + '');
    }
    if (cond.regex) {
      const val = this.getByPath(context, cond.regex.value) + '';
      const re = new RegExp(cond.regex.pattern, cond.regex.flags || '');
      return re.test(val);
    }
    if (cond.and) return cond.and.every((c: any) => this.evaluateJsonCondition(c, context));
    if (cond.or) return cond.or.some((c: any) => this.evaluateJsonCondition(c, context));
    if (cond.not) return !this.evaluateJsonCondition(cond.not, context);
    return false;
  }

  private resolveBindings(obj: any, context: any): any {
    if (obj == null) return obj;
    if (typeof obj === 'string') return this.interpolate(obj, context);
    if (Array.isArray(obj)) return obj.map((v) => this.resolveBindings(v, context));
    if (typeof obj === 'object') {
      if (Object.prototype.hasOwnProperty.call(obj, 'valueFrom') || Object.prototype.hasOwnProperty.call(obj, 'template')) {
        const valueFrom = (obj as any).valueFrom;
        const template = (obj as any).template;
        const def = (obj as any).default;
        try {
          if (typeof valueFrom === 'string') {
            const v = this.getByPath(context, valueFrom);
            return v === undefined ? def : v;
          }
          if (typeof template === 'string') {
            const v = this.interpolate(template, context);
            return v == null || v === '' ? def : v;
          }
        } catch {
          return def;
        }
      }
      const out: any = Array.isArray(obj) ? [] : {};
      for (const k of Object.keys(obj)) out[k] = this.resolveBindings((obj as any)[k], context);
      return out;
    }
    return obj;
  }

  private interpolate(template: string, context: any): any {
    // 전체 문자열이 단일 바인딩 표현식인 경우 (예: "${steps.prev.result}")
    // 전체 문자열이 단일 바인딩 표현식인 경우
    // 1. "${$.path}" 형태
    const singleBindingMatch = /^\$\{([^}]+)\}$/.exec(template);
    if (singleBindingMatch) {
      const v = this.getByPath(context, singleBindingMatch[1].trim());
      return v;
    }
    
    // 2. "$.path" 형태 (템플릿 없이 경로만)
    if (/^\$\./.test(template)) {
      const v = this.getByPath(context, template);
      return v;
    }

    // 문자열 템플릿인 경우 (예: "Hello ${name}!")
    // 문자열로 변환하여 반환
    return template.replace(/\$\{([^}]+)\}/g, (_m, p1) => {
      const v = this.getByPath(context, p1.trim());
      if (v == null) return '';
      // 객체/배열은 JSON.stringify로 변환
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
  }

  private getByPath(root: any, path: string): any {
    const norm = path.startsWith('$.') ? path.slice(2) : path;
    return norm.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), root);
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) return fn();
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Step timeout')), timeoutMs);
      fn().then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
    });
  }

  private async executeWithRepeat(step: any, context: any, tabId: number): Promise<any> {
    const repeatConfig = step.repeat;
    const results: any[] = [];
    const errors: any[] = [];
    let items: any[] = [];
    let isForEach = false;

    // forEach 또는 count 중 하나 결정
    if (repeatConfig.forEach) {
      isForEach = true;
      const forEachValue = this.getByPath(context, repeatConfig.forEach);
      
      // 배열이면 그대로, 아니면 단일 값으로 처리
      if (Array.isArray(forEachValue)) {
        items = forEachValue;
      } else if (forEachValue != null) {
        items = [forEachValue];  // 단일 값은 배열로 감싸서 1번 실행
      } else {
        // null/undefined면 빈 배열 (스킵)
        items = [];
      }
    } else if (repeatConfig.count != null) {
      // count 처리
      let count: number;
      if (typeof repeatConfig.count === 'string') {
        count = this.getByPath(context, repeatConfig.count) ?? 0;
      } else {
        count = repeatConfig.count;
      }
      // count만큼 반복하기 위해 배열 생성
      items = Array.from({ length: Math.max(0, count) }, (_, i) => i);
    } else {
      // repeat 설정이 있지만 forEach도 count도 없으면 에러
      return {
        hasError: true,
        message: 'repeat requires either forEach or count',
        data: null
      };
    }

    // 반복 실행
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      
      // context에 현재 반복 정보 추가
      if (isForEach) {
        context.forEach = { item, index, total: items.length };
      } else {
        context.loop = { index, count: items.length };
      }

      try {
        // retry 로직 포함 실행
        const maxAttempts = Math.max(1, step.retry?.attempts ?? 1);
        const baseDelay = step.retry?.delayMs ?? 0;
        const backoff = step.retry?.backoffFactor ?? 1;
        let lastResult: any = null;
        let success = false;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const boundBlock = this.resolveBindings(step.block, context);
            lastResult = await this.runWithTimeout(
              () => this.tabManager.executeBlock(boundBlock as any, tabId),
              step.timeoutMs
            );
            success = !lastResult?.hasError;
            
            if (success) break;
          } catch (e: any) {
            lastResult = { hasError: true, message: e?.message || 'Block execution error' };
          }

          // 재시도 전 대기
          if (attempt < maxAttempts - 1) {
            const wait = baseDelay * Math.pow(backoff, attempt);
            if (wait > 0) await new Promise((r) => setTimeout(r, wait));
          }
        }

        if (success) {
          results.push(lastResult);
        } else {
          errors.push({ index, item, error: lastResult });
          if (!repeatConfig.continueOnError) {
            // 에러 발생 시 중단
            return {
              hasError: true,
              message: `Repeat failed at index ${index}: ${lastResult?.message || 'Unknown error'}`,
              data: { results, errors, stoppedAt: index }
            };
          } else {
            // continueOnError: true면 null로 결과 추가하고 계속
            results.push(null);
          }
        }
      } catch (e: any) {
        errors.push({ index, item, error: e.message });
        if (!repeatConfig.continueOnError) {
          return {
            hasError: true,
            message: `Repeat failed at index ${index}: ${e.message}`,
            data: { results, errors, stoppedAt: index }
          };
        } else {
          results.push(null);
        }
      }

      // 반복 사이 대기
      if (repeatConfig.delayBetween && index < items.length - 1) {
        await new Promise((r) => setTimeout(r, repeatConfig.delayBetween));
      }
    }

    // context에서 반복 정보 제거
    if (isForEach) {
      delete context.forEach;
    } else {
      delete context.loop;
    }

    // 모든 반복 완료
    return {
      hasError: errors.length > 0 && !repeatConfig.continueOnError,
      message: errors.length > 0 
        ? `Completed with ${errors.length} error(s) out of ${items.length}` 
        : `Completed ${items.length} iteration(s)`,
      data: results
    };
  }
}


