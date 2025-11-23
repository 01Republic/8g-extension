/**
 * Loop Context Package
 *
 * 워크플로우 실행 중 반복 상태 관리 (forEach, count loop)
 */

export type { LoopContext, ForEachContext, CountLoopContext } from './types';

export {
  createLoopContext,
  enterForEach,
  enterLoop,
  exitLoop,
  isInForEach,
  isInLoop,
} from './loop-context';
export { isLoopPath, getByLoopPath } from './resolver';
