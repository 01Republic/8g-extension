import type { LoopContext } from './types';

/**
 * 주어진 경로가 loop 경로인지 판단 (순수 함수)
 *
 * @example
 * isLoopPath('forEach.item') // true
 * isLoopPath('forEach.index') // true
 * isLoopPath('loop.count') // true
 * isLoopPath('vars.userId') // false
 */
export const isLoopPath = (path: string): boolean => {
  return path.startsWith('forEach.') || path.startsWith('loop.');
};

/**
 * Loop 경로로 값 가져오기 (순수 함수)
 *
 * @example
 * getByLoopPath(context, 'forEach.item.id')
 * getByLoopPath(context, 'loop.count')
 */
export const getByLoopPath = (
  context: LoopContext,
  path: string
): any => {
  // forEach 또는 loop로 시작하는지 체크
  if (!path.startsWith('forEach.') && !path.startsWith('loop.')) {
    return undefined;
  }

  // 전체 경로로 탐색 (forEach/loop 포함)
  return path
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context as any);
};
