import { z } from 'zod';
import { BlockResult } from './types';

export const THROW_ERROR_MESSAGES = {
  LOGIN_FAILED: "로그인 실패",
  NETWORK_ERROR: "네트워크 오류", 
  VALIDATION_ERROR: "입력값 검증 실패",
  UNAUTHORIZED: "권한 없음",
  FORBIDDEN: "접근 금지",
  NOT_FOUND: "리소스를 찾을 수 없음",
  SERVER_ERROR: "서버 오류",
  TIMEOUT: "요청 시간 초과",
  CONNECTION_ERROR: "연결 오류",
  UNKNOWN_ERROR: "알 수 없는 오류"
} as const;

export type ThrowErrorMessage = typeof THROW_ERROR_MESSAGES[keyof typeof THROW_ERROR_MESSAGES];
export type ThrowErrorMessageKey = keyof typeof THROW_ERROR_MESSAGES;

export interface ThrowErrorBlock {
  readonly name: 'throw-error';
  message?: ThrowErrorMessageKey;
  data?: {
    message: string;
    hasError: boolean;
  };
}

export const ThrowErrorBlockSchema = z.object({
  name: z.literal('throw-error'),
  message: z.enum(Object.keys(THROW_ERROR_MESSAGES) as [string, ...string[]]).optional(),
  data: z.object({
    message: z.string(),
    hasError: z.boolean(),
  }).optional()
});

export function validateThrowErrorBlock(data: unknown): ThrowErrorBlock {
  return ThrowErrorBlockSchema.parse(data) as ThrowErrorBlock;
}

export async function handlerThrowError(
  data: ThrowErrorBlock
): Promise<BlockResult<any>> {
  const { message, data: blockData } = data;

  // 항상 에러로 처리 - step은 성공하지만 result에서는 실패로 표시
  return {
    hasError: blockData?.hasError ?? true,
    message: message || 'Error thrown by throw-error block',
    data: blockData ? { hasError: blockData.hasError, message: blockData.message } : null,
  };
}