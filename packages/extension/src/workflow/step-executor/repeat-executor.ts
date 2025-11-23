import type { Block } from '@/blocks';
import type { RepeatConfig } from '@/sdk/types';
import type { ExecutionContext } from '../context';
import {
  getByPath,
  enterForEachInContext,
  enterLoopInContext,
  exitLoopInContext,
} from '../context';
import { executeSingleStep } from './single-executor';
import type { BlockExecutor, RepeatExecutionResult } from './types';

/**
 * Repeat items 해석
 */
export const resolveRepeatItems = (
  repeatConfig: RepeatConfig,
  context: ExecutionContext
): { items: any[]; isForEach: boolean } => {
  // forEach 처리
  if (repeatConfig.forEach) {
    const forEachValue = getByPath(context, repeatConfig.forEach);

    // 배열이면 그대로, 아니면 단일 값으로 처리
    if (Array.isArray(forEachValue)) {
      return { items: forEachValue, isForEach: true };
    } else if (forEachValue != null) {
      return { items: [forEachValue], isForEach: true };
    } else {
      return { items: [], isForEach: true };
    }
  }

  // count 처리
  if (repeatConfig.count != null) {
    let count: number;
    if (typeof repeatConfig.count === 'string') {
      count = getByPath(context, repeatConfig.count) ?? 0;
    } else {
      count = repeatConfig.count;
    }
    const items = Array.from({ length: Math.max(0, count) }, (_, i) => i);
    return { items, isForEach: false };
  }

  throw new Error('repeat requires either forEach or count');
};

/**
 * Repeat 로직으로 block 실행
 */
export const executeWithRepeat = async (
  block: Block,
  repeatConfig: RepeatConfig,
  context: ExecutionContext,
  executeBlock: BlockExecutor,
  tabId: number,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    backoff?: number;
    timeoutMs?: number;
  } = {}
): Promise<RepeatExecutionResult> => {
  const results: any[] = [];
  const errors: any[] = [];
  let updatedContext = context;

  try {
    const { items, isForEach } = resolveRepeatItems(repeatConfig, context);

    // 반복 실행
    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      // context에 현재 반복 정보 추가
      if (isForEach) {
        updatedContext = enterForEachInContext(updatedContext, item, index, items.length);
      } else {
        updatedContext = enterLoopInContext(updatedContext, index, items.length);
      }

      try {
        // retry 로직 포함 실행
        const stepResult = await executeSingleStep(
          block,
          updatedContext,
          executeBlock,
          tabId,
          options
        );

        if (stepResult.success) {
          results.push(stepResult.result);
        } else {
          errors.push({ index, item, error: stepResult.result });
          if (!repeatConfig.continueOnError) {
            // 에러 발생 시 중단
            updatedContext = exitLoopInContext(updatedContext);
            return {
              result: {
                hasError: true,
                message: `Repeat failed at index ${index}: ${stepResult.message}`,
                data: { results, errors, stoppedAt: index },
              },
              context: updatedContext,
            };
          } else {
            // continueOnError: true면 null로 결과 추가하고 계속
            results.push(null);
          }
        }
      } catch (e: any) {
        errors.push({ index, item, error: e.message });
        if (!repeatConfig.continueOnError) {
          updatedContext = exitLoopInContext(updatedContext);
          return {
            result: {
              hasError: true,
              message: `Repeat failed at index ${index}: ${e.message}`,
              data: { results, errors, stoppedAt: index },
            },
            context: updatedContext,
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
    updatedContext = exitLoopInContext(updatedContext);

    // 모든 반복 완료
    return {
      result: {
        hasError: errors.length > 0 && !repeatConfig.continueOnError,
        message:
          errors.length > 0
            ? `Completed with ${errors.length} error(s) out of ${items.length}`
            : `Completed ${items.length} iteration(s)`,
        data: results,
      },
      context: updatedContext,
    };
  } catch (e: any) {
    return {
      result: {
        hasError: true,
        message: e.message || 'repeat requires either forEach or count',
        data: null,
      },
      context: updatedContext,
    };
  }
};
