import type { StepContext } from './types';

/**
 * 주어진 경로가 step 경로인지 판단 (순수 함수)
 *
 * @example
 * isStepPath('steps.step1.result') // true
 * isStepPath('steps.step1.success') // true
 * isStepPath('vars.userId') // false
 */
export const isStepPath = (path: string): boolean => {
  return path.startsWith('steps.');
};

/**
 * Step 경로로 값 가져오기 (순수 함수)
 *
 * @example
 * getByStepPath(context, 'steps.step1.result.data')
 */
export const getByStepPath = (context: StepContext, path: string): any => {
  // steps로 시작하는지 체크
  if (!path.startsWith('steps.')) {
    return undefined;
  }

  // 'steps.' 제거 후 나머지 경로로 탐색
  const remainingPath = path.slice('steps.'.length);
  if (!remainingPath) {
    return undefined;
  }

  return remainingPath
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context.steps as any);
};
