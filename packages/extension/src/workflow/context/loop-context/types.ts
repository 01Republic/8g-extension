/**
 * Loop Context Types
 *
 * 워크플로우 실행 중 반복(forEach, loop) 상태를 관리하는 도메인
 */

export interface ForEachContext {
  item: any;
  index: number;
  total: number;
}

export interface CountLoopContext {
  index: number;
  count: number;
}

export interface LoopContext {
  readonly forEach?: ForEachContext;
  readonly loop?: CountLoopContext;
}
