import type { Block, BlockResult } from '../../types';
import type { ExecutionContext } from '../context';

/**
 * Block 실행 함수 타입
 */
export type BlockExecutor = (block: Block, tabId: number) => Promise<BlockResult<any>>;

/**
 * Step 실행 결과
 */
export interface StepExecutionResult {
  result: any;
  success: boolean;
  message: string;
  attempts: number;
}

/**
 * Repeat 실행 결과
 */
export interface RepeatExecutionResult {
  result: any;
  context: ExecutionContext;
}
