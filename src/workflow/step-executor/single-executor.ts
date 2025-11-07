import type { Block } from '@/blocks';
import type { ExecutionContext } from '../context';
import { resolveBindings } from '../context';
import type { BlockExecutor, StepExecutionResult } from './types';

/**
 * Timeout과 함께 함수 실행
 */
const runWithTimeout = async <T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0) return fn();
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Step timeout')), timeoutMs);
    fn()
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
};

/**
 * Retry 로직과 함께 단일 block 실행
 */
export const executeSingleStep = async (
  block: Block,
  context: ExecutionContext,
  executeBlock: BlockExecutor,
  tabId: number,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    backoff?: number;
    timeoutMs?: number;
  } = {}
): Promise<StepExecutionResult> => {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 1);
  const baseDelay = options.baseDelay ?? 0;
  const backoff = options.backoff ?? 1;

  let attempts = 0;
  let result: any = null;
  let success = false;
  let message = '';

  while (attempts < maxAttempts) {
    attempts++;
    try {
      let boundBlock = resolveBindings(block, context);

      if (boundBlock.name === 'transform-data' && boundBlock.sourceData === undefined) {
        boundBlock = {
          ...boundBlock,
          sourceData: context.stepContext.steps,
        };
      }

      result = await runWithTimeout(
        () => executeBlock(boundBlock as any, tabId),
        options.timeoutMs
      );
      success = !result?.hasError;
      message = result?.message || '';
      if (success) break;
    } catch (e: any) {
      success = false;
      message = e?.message || 'Workflow step error';
      result = { hasError: true, message };
    }

    // 재시도 전 대기
    if (attempts < maxAttempts) {
      const wait = baseDelay * Math.pow(backoff, attempts - 1);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  }

  return { result, success, message, attempts };
};
