import type { ExecutionContext } from './types';
import { getByPath } from './resolver';

/**
 * Condition Types
 */
export type JsonCondition =
  | { exists: string }
  | { equals: { left: string; right: any } }
  | { notEquals: { left: string; right: any } }
  | { contains: { value: string; search: any } }
  | { regex: { value: string; pattern: string; flags?: string } }
  | { and: JsonCondition[] }
  | { or: JsonCondition[] }
  | { not: JsonCondition };

export interface Condition {
  expr?: string;
  json?: JsonCondition;
}

/**
 * JSON 조건 평가 (순수 함수, 재귀)
 *
 * @example
 * evaluateJsonCondition({ exists: 'steps.step1.result' }, context)
 * evaluateJsonCondition({ equals: { left: 'vars.status', right: 'OK' } }, context)
 * evaluateJsonCondition({ and: [{ exists: 'steps.a' }, { equals: { left: 'vars.b', right: 1 } }] }, context)
 */
export const evaluateJsonCondition = (
  condition: JsonCondition,
  context: ExecutionContext
): boolean => {
  if ('exists' in condition) {
    return getByPath(context, condition.exists) !== undefined;
  }

  if ('equals' in condition) {
    return getByPath(context, condition.equals.left) === condition.equals.right;
  }

  if ('notEquals' in condition) {
    return getByPath(context, condition.notEquals.left) !== condition.notEquals.right;
  }

  if ('contains' in condition) {
    const value = getByPath(context, condition.contains.value);
    const search = String(condition.contains.search);

    if (Array.isArray(value)) {
      return value.some((v) => String(v).includes(search));
    }
    return String(value).includes(search);
  }

  if ('regex' in condition) {
    const value = String(getByPath(context, condition.regex.value));
    const regex = new RegExp(condition.regex.pattern, condition.regex.flags || '');
    return regex.test(value);
  }

  if ('and' in condition) {
    return condition.and.every((c) => evaluateJsonCondition(c, context));
  }

  if ('or' in condition) {
    return condition.or.some((c) => evaluateJsonCondition(c, context));
  }

  if ('not' in condition) {
    return !evaluateJsonCondition(condition.not, context);
  }

  return false;
};

/**
 * Expression 문자열 평가 (순수 함수)
 *
 * @example
 * evaluateExpression('steps.step1.result.data === "OK"', context)
 * evaluateExpression('vars.count > 10', context)
 */
export const evaluateExpression = (expr: string, context: ExecutionContext): boolean => {
  try {
    const vars = context.varContext.vars;
    const steps = context.stepContext.steps;
    const forEach = context.loopContext.forEach;
    const loop = context.loopContext.loop;

    // eslint-disable-next-line no-new-func
    const fn = new Function('vars', 'steps', 'forEach', 'loop', `return (${expr});`);
    return !!fn(vars, steps, forEach, loop);
  } catch {
    return false;
  }
};

/**
 * 조건 타입 감지 (타입 가드)
 */
const isDirectJsonCondition = (condition: any): condition is JsonCondition => {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    ('exists' in condition ||
      'equals' in condition ||
      'notEquals' in condition ||
      'contains' in condition ||
      'regex' in condition ||
      'and' in condition ||
      'or' in condition ||
      'not' in condition)
  );
};

/**
 * 통합 조건 평가 (순수 함수)
 *
 * JSON 조건과 Expression 조건을 모두 처리
 * undefined인 경우 true 반환 (조건 없음 = 항상 실행)
 *
 * @example
 * evaluateCondition(undefined, context) // -> true
 * evaluateCondition({ exists: 'steps.step1' }, context)
 * evaluateCondition({ expr: 'vars.count > 10' }, context)
 * evaluateCondition({ json: { equals: { left: 'vars.status', right: 'OK' } } }, context)
 */
export const evaluateCondition = (
  condition: Condition | JsonCondition | undefined,
  context: ExecutionContext
): boolean => {
  if (!condition) return true;

  // 직접 JSON 조건
  if (isDirectJsonCondition(condition)) {
    return evaluateJsonCondition(condition, context);
  }

  // Condition 객체
  const cond = condition as Condition;

  if (cond.json) {
    return evaluateJsonCondition(cond.json, context);
  }

  if (cond.expr) {
    return evaluateExpression(cond.expr, context);
  }

  return true;
};
