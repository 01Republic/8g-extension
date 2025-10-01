import z from 'zod';
import { BlockResult } from './types';

/**
 * ExecuteScriptBlock - Background에서 실행되는 JavaScript 스크립트 블록
 * 
 * 특징:
 * - Content Script가 아닌 Background에서 실행되므로 CSP 제약 없음
 * - DOM 접근 불가 (이전 블록 결과 파싱 용도로만 사용)
 * - selector, findBy, option 같은 DOM 관련 필드 불필요
 */
export interface ExecuteScriptBlock {
  readonly name: 'execute-script';
  script: string | string[];  // 실행할 JavaScript 코드 (배열이면 join('\n'))
  context?: Record<string, any>;  // 스크립트에 전달할 데이터
  returnVariable?: string;    // 반환할 변수명 (기본값: 'result')
}

export const ExecuteScriptBlockSchema = z.object({
  name: z.literal('execute-script'),
  script: z.union([z.string(), z.array(z.string())]),
  context: z.record(z.string(), z.any()).optional(),
  returnVariable: z.string().optional(),
});

export function validateExecuteScriptBlock(data: unknown): ExecuteScriptBlock {
  return ExecuteScriptBlockSchema.parse(data);
}

/**
 * Background에서 JavaScript 스크립트 실행
 * 
 * @param data ExecuteScriptBlock 데이터
 * @returns 스크립트 실행 결과
 */
export async function handlerExecuteScript(data: ExecuteScriptBlock): Promise<BlockResult<any>> {
  try {
    const {
      script,
      context = {},
      returnVariable = 'result',
    } = data;

    // script가 배열이면 join으로 합치기
    const scriptCode = Array.isArray(script) ? script.join('\n') : script;

    if (!scriptCode || scriptCode.trim() === '') {
      throw new Error('Script is required for execute-script block');
    }

    // 스크립트 실행 환경 준비
    // context 객체의 모든 키를 변수로 만들어줍니다
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // Function 생성자를 사용하여 스크립트 실행
    // Background에서 실행되므로 CSP 제약 없음!
    const scriptFunction = new Function(
      ...contextKeys,
      `
      ${scriptCode}
      return typeof ${returnVariable} !== 'undefined' ? ${returnVariable} : undefined;
      `
    );

    // 스크립트 실행
    const result = scriptFunction(...contextValues);

    return {
      data: result,
    };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in execute-script handler',
      data: null,
    };
  }
}

