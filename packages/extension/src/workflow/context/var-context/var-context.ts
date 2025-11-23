import type { VarContext } from './types';

/**
 * 빈 VarContext 생성
 */
export const createVarContext = (): VarContext => ({
  vars: {},
});

/**
 * 단일 변수 설정 (불변)
 */
export const setVar = (context: VarContext, key: string, value: any): VarContext => ({
  vars: {
    ...context.vars,
    [key]: value,
  },
});

/**
 * 여러 변수 설정 (불변)
 */
export const setVars = (context: VarContext, vars: Record<string, any>): VarContext => ({
  vars: {
    ...context.vars,
    ...vars,
  },
});

/**
 * 변수 조회
 */
export const getVar = (context: VarContext, key: string): any => {
  return context.vars[key];
};

/**
 * 변수 존재 여부 확인
 */
export const hasVar = (context: VarContext, key: string): boolean => {
  return key in context.vars;
};
