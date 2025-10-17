import type { LoopContext } from './types';

/**
 * 빈 LoopContext 생성
 */
export const createLoopContext = (): LoopContext => ({});

/**
 * forEach context 진입 (불변)
 */
export const enterForEach = (
  context: LoopContext,
  item: any,
  index: number,
  total: number
): LoopContext => ({
  ...context,
  forEach: { item, index, total },
});

/**
 * count loop context 진입 (불변)
 */
export const enterLoop = (
  context: LoopContext,
  index: number,
  count: number
): LoopContext => ({
  ...context,
  loop: { index, count },
});

/**
 * loop/forEach context 종료 (불변)
 */
export const exitLoop = (context: LoopContext): LoopContext => {
  const { forEach, loop, ...rest } = context;
  return rest;
};

/**
 * forEach 실행 중인지 확인
 */
export const isInForEach = (context: LoopContext): boolean => {
  return context.forEach !== undefined;
};

/**
 * count loop 실행 중인지 확인
 */
export const isInLoop = (context: LoopContext): boolean => {
  return context.loop !== undefined;
};
