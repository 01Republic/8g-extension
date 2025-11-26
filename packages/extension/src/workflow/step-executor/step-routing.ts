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
  console.log(`[StepRouting] Determining next step for: ${step.id}`);
  console.log(`[StepRouting] Current step success: ${success}`);
  console.log(`[StepRouting] Step config:`, {
    switch: step.switch,
    onSuccess: step.onSuccess,
    onFailure: step.onFailure,
    next: step.next
  });

  // 1. switch 체크 (조건부 라우팅)
  if (step.switch && step.switch.length > 0) {
    console.log(`[StepRouting] Checking switch conditions (${step.switch.length} conditions):`);
    
    for (let i = 0; i < step.switch.length; i++) {
      const condition = step.switch[i];
      const conditionResult = evaluateCondition(condition.when, context);
      console.log(`[StepRouting] Switch condition ${i + 1}:`, condition.when, '→', conditionResult);
      
      if (conditionResult) {
        console.log(`[StepRouting] ✅ Switch condition matched! Next step: ${condition.next}`);
        return condition.next;
      }
    }
    
    console.log(`[StepRouting] ❌ No switch conditions matched`);
  }

  // 2. onSuccess/onFailure 체크
  if (success && step.onSuccess) {
    console.log(`[StepRouting] ✅ Step succeeded, routing to onSuccess: ${step.onSuccess}`);
    return step.onSuccess;
  }
  if (!success && step.onFailure) {
    console.log(`[StepRouting] ❌ Step failed, routing to onFailure: ${step.onFailure}`);
    return step.onFailure;
  }

  // 3. 기본 next
  if (step.next) {
    console.log(`[StepRouting] → Using default next step: ${step.next}`);
    return step.next;
  }

  // 다음 step 없음 (workflow 종료)
  console.log(`[StepRouting] 🏁 Workflow ended - no next step`);
  return undefined;
};

/**
 * delayAfterMs가 있으면 대기
 */
export const waitAfterStep = async (step: WorkflowStep): Promise<void> => {
  if (typeof step.delayAfterMs === 'number' && step.delayAfterMs > 0) {
    console.log(`[StepRouting] ⏳ Waiting ${step.delayAfterMs}ms after step: ${step.id}`);
    await new Promise((r) => setTimeout(r, step.delayAfterMs));
    console.log(`[StepRouting] ✅ Wait completed for step: ${step.id}`);
  }
};
