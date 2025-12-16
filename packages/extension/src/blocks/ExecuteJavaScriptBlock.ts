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

/**
 * 사용자 코드에 주입할 글로벌 헬퍼 함수들
 * - wait(ms): 지정된 밀리초 동안 대기
 * - waitForElement(selector, options): 요소가 나타날 때까지 대기
 */
const HELPER_FUNCTIONS = `
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForElement = (selector, options = {}) => {
  const { timeout = 10000, interval = 100, visible = false } = options;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        if (visible) {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          const isVisible = rect.width > 0 && rect.height > 0 &&
                           style.visibility !== 'hidden' &&
                           style.display !== 'none' &&
                           style.opacity !== '0';
          if (isVisible) {
            resolve(element);
            return;
          }
        } else {
          resolve(element);
          return;
        }
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error(\`Element "\${selector}" not found within \${timeout}ms\`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
};
`;

/**
 * 사용자 코드를 헬퍼 함수와 함께 래핑합니다.
 * 코드에서 헬퍼 함수 사용 여부를 확인하고, 사용하는 경우에만 주입합니다.
 */
function wrapCodeWithHelpers(code: string): string {
  // 코드에서 wait 또는 waitForElement를 사용하는지 확인
  const usesWait = /\bwait\s*\(/.test(code);
  const usesWaitForElement = /\bwaitForElement\s*\(/.test(code);

  // 헬퍼 함수를 사용하지 않으면 코드 그대로 반환
  if (!usesWait && !usesWaitForElement) {
    return code;
  }

  // 헬퍼 함수를 사용하면 앞에 추가
  return `${HELPER_FUNCTIONS}
${code}`;
}

export async function handlerExecuteJavaScript(
  data: ExecuteJavaScriptBlock
): Promise<BlockResult<any>> {
  try {
    const { code, returnResult = true, timeout = 30000 } = data;

    if (!code || code.trim() === '') {
      throw new Error('JavaScript code is required');
    }

    // 헬퍼 함수를 포함한 코드로 래핑
    const wrappedCode = wrapCodeWithHelpers(code);

    // Background로 CDP 명령 전송
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_EXECUTE_JAVASCRIPT',
      data: {
        code: wrappedCode,
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
