import type { VarContext } from './types';

/**
 * 주어진 경로가 var 경로인지 판단 (순수 함수)
 *
 * @example
 * isVarPath('vars.userId') // true
 * isVarPath('vars.user.name') // true
 * isVarPath('steps.step1') // false
 */
export const isVarPath = (path: string): boolean => {
  return path.startsWith('vars.');
};

/**
 * Variable 경로로 값 가져오기 (순수 함수)
 *
 * @example
 * getByVarPath(context, 'vars.userId')
 */
export const getByVarPath = (context: VarContext, path: string): any => {
  // vars로 시작하는지 체크
  if (!path.startsWith('vars.')) {
    return undefined;
  }

  // 'vars.' 제거 후 나머지 경로로 탐색
  const remainingPath = path.slice('vars.'.length);
  if (!remainingPath) {
    return undefined;
  }

  return remainingPath
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context.vars as any);
};
