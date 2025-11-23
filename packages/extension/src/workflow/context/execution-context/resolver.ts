import type { ExecutionContext } from './types';
import { isStepPath, getByStepPath } from '../step-context';
import { isVarPath, getByVarPath } from '../var-context';
import { isLoopPath, getByLoopPath } from '../loop-context';

/**
 * 경로로 값 가져오기 (순수 함수)
 *
 * 각 서브 컨텍스트의 isXXXPath로 영역 판단 후 처리
 *
 * @example
 * getByPath(context, 'steps.stepId.result.data')
 * getByPath(context, 'vars.userId')
 * getByPath(context, 'forEach.item.id')
 * getByPath(context, 'loop.index')
 */
export const getByPath = (context: ExecutionContext, path: string): any => {
  // 각 context의 isXXXPath로 영역 판단
  if (isStepPath(path)) {
    return getByStepPath(context.stepContext, path);
  }

  if (isVarPath(path)) {
    return getByVarPath(context.varContext, path);
  }

  if (isLoopPath(path)) {
    return getByLoopPath(context.loopContext, path);
  }

  return undefined;
};

/**
 * 여러 경로 한번에 해석 (순수 함수)
 */
export const resolveMultiplePaths = (context: ExecutionContext, paths: string[]): any[] =>
  paths.map((path) => getByPath(context, path));
