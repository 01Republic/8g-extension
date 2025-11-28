import type { ExecutionContext } from './types';
import { createStepContext, setStepResult, type StepResult } from '../step-context';
import { createVarContext, setVar, setVars } from '../var-context';
import { createLoopContext, enterForEach, enterLoop, exitLoop } from '../loop-context';

/**
 * 빈 ExecutionContext 생성
 */
export const createExecutionContext = (): ExecutionContext => ({
  stepContext: createStepContext(),
  varContext: createVarContext(),
  loopContext: createLoopContext(),
});

/**
 * Step 결과 추가 (불변)
 */
export const setStepResultInContext = (
  context: ExecutionContext,
  stepId: string,
  result: StepResult
): ExecutionContext => ({
  ...context,
  stepContext: setStepResult(context.stepContext, stepId, result),
});

/**
 * 단일 변수 설정 (불변)
 */
export const setVarInContext = (
  context: ExecutionContext,
  key: string,
  value: any
): ExecutionContext => ({
  ...context,
  varContext: setVar(context.varContext, key, value),
});

/**
 * 여러 변수 설정 (불변)
 */
export const setVarsInContext = (
  context: ExecutionContext,
  vars: Record<string, any>
): ExecutionContext => ({
  ...context,
  varContext: setVars(context.varContext, vars),
});

/**
 * forEach context 진입 (불변)
 */
export const enterForEachInContext = (
  context: ExecutionContext,
  item: any,
  index: number,
  total: number
): ExecutionContext => ({
  ...context,
  loopContext: enterForEach(context.loopContext, item, index, total),
});

/**
 * count loop context 진입 (불변)
 */
export const enterLoopInContext = (
  context: ExecutionContext,
  index: number,
  count: number
): ExecutionContext => ({
  ...context,
  loopContext: enterLoop(context.loopContext, index, count),
});

/**
 * loop context 종료 (불변)
 */
export const exitLoopInContext = (context: ExecutionContext): ExecutionContext => ({
  ...context,
  loopContext: exitLoop(context.loopContext),
});

/**
 * ExecutionContext를 플레인 객체로 변환
 * (resolver, binding, condition에서 사용하기 위함)
 */
export const toPlainObject = (context: ExecutionContext): any => ({
  steps: context.stepContext.steps,
  vars: context.varContext.vars,
  forEach: context.loopContext.forEach,
  loop: context.loopContext.loop,
});
