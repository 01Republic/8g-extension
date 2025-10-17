/**
 * Step Context Types
 *
 * 워크플로우 실행 중 각 스텝의 결과를 관리하는 도메인
 */

export interface StepResult {
  result: any;
  success: boolean;
  skipped: boolean;
}

export interface StepContext {
  readonly steps: Record<string, StepResult>;
}
