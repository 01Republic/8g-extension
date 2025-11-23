import type { StepContext, StepResult } from './types';

/**
 * 빈 StepContext 생성
 */
export const createStepContext = (): StepContext => ({
  steps: {},
});

/**
 * Step 결과 추가 (불변)
 */
export const setStepResult = (
  context: StepContext,
  stepId: string,
  result: StepResult
): StepContext => ({
  steps: {
    ...context.steps,
    [stepId]: result,
  },
});

/**
 * Step 결과 조회
 */
export const getStepResult = (context: StepContext, stepId: string): StepResult | undefined => {
  return context.steps[stepId];
};

/**
 * Step 존재 여부 확인
 */
export const hasStep = (context: StepContext, stepId: string): boolean => {
  return stepId in context.steps;
};
