import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider } from '../dom';

export interface ExecuteJavaScriptBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'execute-javascript';
  // 실행할 JavaScript 코드
  code: string;
  // 코드 실행 결과를 반환할지 여부 (기본값: true)
  returnResult?: boolean;
  // 실행 타임아웃 (ms) (기본값: 5000)
  timeout?: number;
  // 실행 컨텍스트 (추가 변수들)
  context?: Record<string, any>;
}

export const ExecuteJavaScriptBlockSchema = z.object({
  name: z.literal('execute-javascript'),
  code: z.string().min(1, 'JavaScript code is required'),
  returnResult: z.boolean().optional().default(true),
  timeout: z.number().positive().optional().default(5000),
  context: z.record(z.string(), z.any()).optional(),
});

export function validateExecuteJavaScriptBlock(data: unknown): ExecuteJavaScriptBlock {
  return ExecuteJavaScriptBlockSchema.parse(data);
}

export async function handlerExecuteJavaScript(
  data: ExecuteJavaScriptBlock,
  domProvider: DOMProvider
): Promise<BlockResult<any>> {
  try {
    const { code, returnResult = true, timeout = 5000, context } = data;

    if (!code || code.trim() === '') {
      throw new Error('JavaScript code is required');
    }

    // Check if executeScript method is available on the DOMProvider
    if (domProvider.executeScript) {
      // Use DOMProvider's executeScript method for advanced script execution
      const result = await domProvider.executeScript(code, context);
      
      return {
        data: returnResult ? result : null,
      };
    } else {
      // Fallback to direct JavaScript execution in current context
      console.warn('[ExecuteJavaScriptBlock] Advanced script execution not supported in this environment, using fallback evaluation');
      
      const result = await executeJavaScriptFallback(code, returnResult, timeout, context);
      
      return {
        data: result,
      };
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

// Fallback function to execute JavaScript directly in current context
async function executeJavaScriptFallback(
  code: string,
  returnResult: boolean = true,
  timeout: number = 5000,
  context?: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`JavaScript execution timed out after ${timeout}ms`));
    }, timeout);

    try {
      // Create a function scope with context variables
      let wrappedCode = code;
      
      if (context) {
        // Inject context variables into the execution scope
        const contextEntries = Object.entries(context);
        const contextVars = contextEntries.map(([key, value]) => {
          return `const ${key} = ${JSON.stringify(value)};`;
        }).join('\n');
        
        wrappedCode = `${contextVars}\n${code}`;
      }

      // Execute the code
      let result: any;
      
      if (returnResult) {
        // Wrap code to return the result
        const asyncCode = `(async () => { ${wrappedCode} })()`;
        result = eval(asyncCode);
        
        // Handle promises
        if (result instanceof Promise) {
          result.then((value) => {
            clearTimeout(timeoutId);
            resolve(value);
          }).catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        } else {
          clearTimeout(timeoutId);
          resolve(result);
        }
      } else {
        // Just execute without returning
        const asyncCode = `(async () => { ${wrappedCode} })()`;
        const promise = eval(asyncCode);
        
        if (promise instanceof Promise) {
          promise.then(() => {
            clearTimeout(timeoutId);
            resolve(null);
          }).catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        } else {
          clearTimeout(timeoutId);
          resolve(null);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}