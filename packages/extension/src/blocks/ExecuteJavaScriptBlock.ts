import z from 'zod';
import { Block, BlockResult } from './types';

export interface ExecuteJavaScriptBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'execute-javascript';
  // 실행할 JavaScript 코드
  code: string;
  // 코드 실행 결과를 반환할지 여부 (기본값: true)
  returnResult?: boolean;
  // 실행 타임아웃 (ms) (기본값: 5000)
  timeout?: number;
}

export const ExecuteJavaScriptBlockSchema = z.object({
  name: z.literal('execute-javascript'),
  code: z.string().min(1, 'JavaScript code is required'),
  returnResult: z.boolean().optional(),
  timeout: z.number().positive().optional(),
});

export function validateExecuteJavaScriptBlock(data: unknown): ExecuteJavaScriptBlock {
  return ExecuteJavaScriptBlockSchema.parse(data);
}

export async function handlerExecuteJavaScript(
  data: ExecuteJavaScriptBlock
): Promise<BlockResult<any>> {
  try {
    const { code, returnResult = true, timeout = 5000 } = data;

    if (!code || code.trim() === '') {
      throw new Error('JavaScript code is required');
    }

    // Background로 CDP 명령 전송
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_EXECUTE_JAVASCRIPT',
      data: {
        code,
        returnResult,
        timeout,
      },
    });

    if (response && !response.$isError) {
      console.log('[ExecuteJavaScript] CDP execution successful:', response);
      return {
        data: response.data !== undefined ? response.data : null,
      };
    } else {
      throw new Error(response?.message || 'CDP JavaScript execution failed');
    }
  } catch (error) {
    console.error('[ExecuteJavaScript] Execution error:', error);
    return {
      hasError: true,
      message:
        error instanceof Error ? error.message : 'Unknown error in execute-javascript handler',
      data: null,
    };
  }
}
