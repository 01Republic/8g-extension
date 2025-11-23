import { WorkflowStep } from '@/sdk/types';
import type { Condition, ExecutionContext } from '../context';
import { evaluateCondition } from '../context';

/**
 * 다음 step ID를 결정하는 함수
 *
 * switch → onSuccess/onFailure → next 순서로 체크
 */
export const getNextStepId = (
  step: WorkflowStep,
  success: boolean,
  context: ExecutionContext
): string | undefined => {
  // 1. switch 체크 (조건부 라우팅)
  if (step.switch && step.switch.length > 0) {
    const matched = step.switch.find((c: { when: Condition; next: string }) =>
      evaluateCondition(c.when, context)
    );
    if (matched) {
      return matched.next;
    }
  }

  // 2. onSuccess/onFailure 체크
  if (success && step.onSuccess) {
    return step.onSuccess;
  }
  if (!success && step.onFailure) {
    return step.onFailure;
  }

  // 3. 기본 next
  if (step.next) {
    return step.next;
  }

  // 다음 step 없음 (workflow 종료)
  return undefined;
};

/**
 * delayAfterMs가 있으면 대기
 */
export const waitAfterStep = async (step: WorkflowStep): Promise<void> => {
  if (typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
    await new Promise((r) => setTimeout(r, step.delayAfterMs));
  }
};
