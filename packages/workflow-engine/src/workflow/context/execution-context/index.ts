/**
 * Execution Context Package
 *
 * StepContext, VarContext, LoopContext를 조합한 전체 실행 컨텍스트
 */

// =========================
// Types
// =========================
export type { ExecutionContext } from './types';
export type { StepContext, StepResult } from '../step-context';
export type { VarContext } from '../var-context';
export type { LoopContext, ForEachContext, CountLoopContext } from '../loop-context';
export type { Binding, BindingValue } from './binding';
export type { Condition, JsonCondition } from './condition';

// =========================
// Context Management
// =========================
export {
  createExecutionContext,
  setStepResultInContext,
  setVarInContext,
  setVarsInContext,
  enterForEachInContext,
  enterLoopInContext,
  exitLoopInContext,
  toPlainObject,
} from './execution-context';

// =========================
// Path Resolution
// =========================
export { getByPath, resolveMultiplePaths } from './resolver';

// =========================
// Binding Resolution
// =========================
export { interpolate, resolveBinding, resolveBindings } from './binding';

// =========================
// Condition Evaluation
// =========================
export { evaluateJsonCondition, evaluateExpression, evaluateCondition } from './condition';
