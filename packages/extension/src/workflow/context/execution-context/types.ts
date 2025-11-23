/**
 * Execution Context Types
 *
 * StepContext, VarContext, LoopContext를 조합한 전체 실행 컨텍스트
 */

import type { StepContext } from '../step-context';
import type { VarContext } from '../var-context';
import type { LoopContext } from '../loop-context';

export interface ExecutionContext {
  readonly stepContext: StepContext;
  readonly varContext: VarContext;
  readonly loopContext: LoopContext;
}
