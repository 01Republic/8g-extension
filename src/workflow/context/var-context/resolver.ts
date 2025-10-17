import type { VarContext } from './types';

/**
 * 주어진 경로가 var 경로인지 판단 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * isVarPath('$.vars.userId') // true
 * isVarPath('vars.user.name') // false ($. prefix 없음)
 * isVarPath('$.steps.step1') // false
 */
export const isVarPath = (path: string): boolean => {
  if (!path.startsWith('$.')) {
    return false;
  }
  const normalizedPath = path.slice(2);
  return normalizedPath.startsWith('vars.');
};

/**
 * Variable 경로로 값 가져오기 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * getByVarPath(context, '$.vars.userId')
 */
export const getByVarPath = (
  context: VarContext,
  path: string
): any => {
  // $. prefix 체크
  if (!path.startsWith('$.')) {
    return undefined;
  }

  // $. prefix 제거
  const normalizedPath = path.slice(2);

  // 'vars' 제거 후 나머지 경로로 탐색
  const [, ...rest] = normalizedPath.split('.');
  const remainingPath = rest.join('.');
  if (!remainingPath) {
    return undefined;
  }

  return remainingPath
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context.vars as any);
};
