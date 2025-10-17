/**
 * Variable Context Types
 *
 * 워크플로우 실행 중 사용자 정의 변수를 관리하는 도메인
 */

export interface VarContext {
  readonly vars: Record<string, any>;
}
