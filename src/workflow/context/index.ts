/**
 * Context Domain
 *
 * 워크플로우 실행 컨텍스트를 관리하는 함수형 도메인
 * 각 책임별로 분리된 패키지로 구성:
 * - step-context: Step 실행 결과 관리
 * - var-context: 변수 관리
 * - loop-context: 반복 상태 관리
 * - execution-context: 전체 컨텍스트 조합 + resolver/binding/condition
 */

// Re-export everything from execution-context (main entry point)
export * from './execution-context';

// Also export sub-contexts if needed separately
export * from './step-context';
export * from './var-context';
export * from './loop-context';
