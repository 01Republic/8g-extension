import type { ExecutionContext } from './types';
import { getByPath } from './resolver';

/**
 * Binding Types
 */
export type BindingValue = string | number | boolean | null | Record<string, any> | any[];

export interface Binding {
  template?: string;
  valueFrom?: string;
  default?: BindingValue;
}

/**
 * 템플릿 문자열 보간 (순수 함수)
 *
 * @example
 * interpolate('${vars.userId}', context) // -> 값 그대로 (타입 유지)
 * interpolate('${steps.step1.result.data}', context) // -> 값 그대로 (타입 유지)
 * interpolate('Hello ${vars.name}!', context)        // -> 'Hello World!' (문자열 보간)
 */
export const interpolate = (template: string, context: ExecutionContext): any => {
  // 1. "${path}" 형태 - 값 그대로 반환 (타입 유지)
  const singleMatch = /^\$\{([^}]+)\}$/.exec(template);
  if (singleMatch) {
    return getByPath(context, singleMatch[1].trim());
  }

  // 2. "Hello ${name}!" 형태 - 문자열 보간
  return template.replace(/\$\{([^}]+)\}/g, (_match, path) => {
    const value = getByPath(context, path.trim());
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
};

/**
 * Binding 객체 해석 (순수 함수)
 *
 * @example
 * resolveBinding({ valueFrom: 'steps.step1.result.data' }, context)
 * resolveBinding({ template: 'User ${vars.userId}' }, context)
 * resolveBinding({ valueFrom: 'vars.missing', default: 'fallback' }, context)
 */
export const resolveBinding = (binding: Binding, context: ExecutionContext): any => {
  console.log('resolveBinding', binding, context);
  const { valueFrom, template, default: defaultValue } = binding;
  console.log('resolveBinding', valueFrom, template, defaultValue);

  try {
    if (valueFrom != null) {
      const value = getByPath(context, valueFrom);
      return value === undefined ? defaultValue : value;
    }

    if (template != null) {
      const value = interpolate(template, context);
      return value == null || value === '' ? defaultValue : value;
    }
  } catch {
    return defaultValue;
  }

  return defaultValue;
};

/**
 * 객체 전체 재귀 바인딩 (순수 함수)
 *
 * @example
 * resolveBindings({
 *   url: { template: 'https://api.example.com/users/${vars.userId}' },
 *   items: ['${steps.step1.result.data}'],
 *   nested: { value: { valueFrom: 'steps.step2.result' } }
 * }, context)
 */
export const resolveBindings = (obj: any, context: ExecutionContext): any => {
  if (obj == null) return obj;

  // 문자열은 interpolate
  if (typeof obj === 'string') {
    return interpolate(obj, context);
  }

  // 배열은 map
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveBindings(item, context));
  }

  // 객체는 재귀
  if (typeof obj === 'object') {
    // Binding 객체인지 체크
    if ('valueFrom' in obj || 'template' in obj) {
      return resolveBinding(obj as Binding, context);
    }

    // 일반 객체 - 각 값 재귀 처리
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = resolveBindings(obj[key], context);
    }
    return result;
  }

  return obj;
};
