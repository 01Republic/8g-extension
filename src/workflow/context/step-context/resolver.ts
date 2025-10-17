import type { StepContext } from './types';

/**
 * 주어진 경로가 step 경로인지 판단 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * isStepPath('$.steps.step1.result') // true
 * isStepPath('steps.step1.success') // false ($. prefix 없음)
 * isStepPath('$.vars.userId') // false
 */
export const isStepPath = (path: string): boolean => {
  if (!path.startsWith('$.')) {
    return false;
  }
  const normalizedPath = path.slice(2);
  return normalizedPath.startsWith('steps.');
};

/**
 * Step 경로로 값 가져오기 (순수 함수)
 *
 * $. prefix 필수!
 *
 * @example
 * getByStepPath(context, '$.steps.step1.result.data')
 */
export const getByStepPath = (
  context: StepContext,
  path: string
): any => {
  // $. prefix 체크
  if (!path.startsWith('$.')) {
    return undefined;
  }

  // $. prefix 제거
  const normalizedPath = path.slice(2);

  // 'steps' 제거 후 나머지 경로로 탐색
  const [, ...rest] = normalizedPath.split('.');
  const remainingPath = rest.join('.');
  if (!remainingPath) {
    return undefined;
  }

  return remainingPath
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), context.steps as any);
};
