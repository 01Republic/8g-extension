import type { LoopContext } from './types';

/**
 * 주어진 경로가 loop 경로인지 판단 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * isLoopPath('$.forEach.item') // true
 * isLoopPath('forEach.index') // false ($. prefix 없음)
 * isLoopPath('$.loop.count') // true
 * isLoopPath('$.vars.userId') // false
 */
export const isLoopPath = (path: string): boolean => {
  if (!path.startsWith('$.')) {
    return false;
  }
  const normalizedPath = path.slice(2);
  const [prefix] = normalizedPath.split('.');
  return prefix === 'forEach' || prefix === 'loop';
};

/**
 * Loop 경로로 값 가져오기 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * getByLoopPath(context, '$.forEach.item.id')
 * getByLoopPath(context, '$.loop.count')
 */
export const getByLoopPath = (
  context: LoopContext,
  path: string
): any => {
  // $. prefix 체크
  if (!path.startsWith('$.')) {
    return undefined;
  }

  // $. prefix 제거
  const normalizedPath = path.slice(2);

  // 전체 경로로 탐색 (forEach/loop 포함)
  return normalizedPath
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context as any);
};
