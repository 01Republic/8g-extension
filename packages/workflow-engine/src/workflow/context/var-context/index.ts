/**
 * Variable Context Package
 *
 * 워크플로우 실행 중 사용자 정의 변수 관리
 */

export type { VarContext } from './types';
export { createVarContext, setVar, setVars, getVar, hasVar } from './var-context';
export { isVarPath, getByVarPath } from './resolver';
