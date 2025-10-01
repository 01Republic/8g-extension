import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';

export interface ExecuteScriptBlock extends Block {
  readonly name: 'execute-script';
  script: string;           // 실행할 JavaScript 코드
  context?: any;            // 스크립트에 전달할 데이터 (이전 블록 결과 등)
  returnVariable?: string;  // 반환할 변수명 (기본값: 'result')
}

export const ExecuteScriptBlockSchema = BaseBlockSchema.extend({
  name: z.literal('execute-script'),
  script: z.string(),
  context: z.any().optional(),
  returnVariable: z.string().optional(),
});

export function validateExecuteScriptBlock(data: unknown): ExecuteScriptBlock {
  return ExecuteScriptBlockSchema.parse(data);
}

export async function handlerExecuteScript(data: ExecuteScriptBlock): Promise<BlockResult<any>> {
  try {
    const {
      script,
      context = {},
      returnVariable = 'result',
    } = data;

    if (!script || script.trim() === '') {
      throw new Error('Script is required for execute-script block');
    }

    // 스크립트 실행 환경 준비
    // context 객체의 모든 키를 변수로 만들어줍니다
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // Function 생성자를 사용하여 안전하게 스크립트 실행
    // 마지막 인자가 함수 본문이 되고, 그 앞의 인자들이 파라미터가 됩니다
    const scriptFunction = new Function(
      ...contextKeys,
      `
      ${script}
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

