import z from 'zod';
import { Block, BlockResult } from './types';

export interface DataExtractBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'data-extract';
  code: string; // JavaScript 코드
  inputData?: any; // 입력 데이터 (이전 블록 결과 등)
}

export const DataExtractBlockSchema = z.object({
  name: z.literal('data-extract'),
  code: z.string(),
  inputData: z.any().optional(),
});

export function validateDataExtractBlock(data: unknown): DataExtractBlock {
  return DataExtractBlockSchema.parse(data) as DataExtractBlock;
}

export async function handlerDataExtract(data: DataExtractBlock): Promise<BlockResult<any>> {
  try {
    console.log('[DataExtractBlock] Executing data extraction in content script');

    // Content Script에서 직접 실행 (CSP 제약 없음)
    const extractFunction = new Function('data', data.code);
    const result = extractFunction(data.inputData);

    console.log('[DataExtractBlock] Data extraction successful');
    return {
      data: result,
    };
  } catch (error) {
    console.error('[DataExtractBlock] Data extraction error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in data extraction',
      data: undefined,
    };
  }
}

