import type { ExecutionContext } from '../context';
import { evaluateCondition, setStepResultInContext } from '../context';
import { executeSingleStep } from './single-executor';
import { executeWithRepeat } from './repeat-executor';
import type { BlockExecutor } from './types';
import { WorkflowStep } from '@/sdk/types';

/**
 * Step 실행 결과 (확장)
 */
export interface ExecuteStepResult {
  stepId: string;
  skipped: boolean;
  success: boolean;
  message: string;
  result: any;
  startedAt: string;
  finishedAt: string;
  attempts: number;
  context: ExecutionContext;
}

/**
 * Step 실행 (condition 체크 + block 실행 + result 기록)
 */
export const executeStep = async (
  step: WorkflowStep,
  context: ExecutionContext,
  executeBlock: BlockExecutor,
  tabId: number
): Promise<ExecuteStepResult> => {
  const startedAt = new Date().toISOString();
  let skipped = false;
  let success = true;
  let message = '';
  let result: any = null;
  let attempts = 0;
  let updatedContext = context;

  const shouldRun = evaluateCondition(step.when, context);
  if (!shouldRun) {
    skipped = true;
  } else if (step.block) {
    // repeat 설정이 있으면 반복 실행
    if (step.repeat) {
      const repeatResult = await executeWithRepeat(
        step.block,
        step.repeat,
        context,
        executeBlock,
        tabId,
        {
          maxAttempts: step.retry?.attempts,
          baseDelay: step.retry?.delayMs,
          backoff: step.retry?.backoffFactor,
          timeoutMs: step.timeoutMs,
        }
      );
      result = repeatResult.result;
      success = !repeatResult.result?.hasError;
      message = repeatResult.result?.message || '';
      updatedContext = repeatResult.context;
    } else {
      // 단일 실행
      const stepResult = await executeSingleStep(step.block, context, executeBlock, tabId, {
        maxAttempts: step.retry?.attempts,
        baseDelay: step.retry?.delayMs,
        backoff: step.retry?.backoffFactor,
        timeoutMs: step.timeoutMs,
      });
      result = stepResult.result;
      success = stepResult.success;
      message = stepResult.message;
      attempts = stepResult.attempts;
    }
  } else {
    skipped = true;
  }

  const finishedAt = new Date().toISOString();

  // context에 step 결과 저장
  updatedContext = setStepResultInContext(updatedContext, step.id, {
    result,
    success,
    skipped,
  });

  return {
    stepId: step.id,
    skipped,
    success,
    message,
    result,
    startedAt,
    finishedAt,
    attempts,
    context: updatedContext,
  };
};
