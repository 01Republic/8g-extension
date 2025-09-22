import { TabManager } from './TabManager';
import type { Workflow } from '@/sdk/types';

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
      } else {
        skipped = true;
      }

      const finishedAt = new Date().toISOString();
      const record = { stepId: step.id, skipped, success, message, result, startedAt, finishedAt, attempts };
      results.push(record);
      context.steps[step.id] = { result, success, skipped };

      if (step.switch && step.switch.length > 0) {
        const matched = step.switch.find((c) => this.evaluateWhen(c.when, context));
        if (matched) { currentId = matched.next; continue; }
      }
      if (success && step.onSuccess) { currentId = step.onSuccess; continue; }
      if (!success && step.onFailure) { currentId = step.onFailure; continue; }
      if (step.next) { currentId = step.next; continue; }

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

  private interpolate(template: string, context: any): string {
    return template.replace(/\$\{([^}]+)\}/g, (_m, p1) => {
      const v = this.getByPath(context, p1.trim());
      return v == null ? '' : String(v);
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
}


