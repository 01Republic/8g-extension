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
    console.log('[DataExtractBlock] Sending data extract request to background');

    // Background로 데이터 추출 요청 전송
    const response = await chrome.runtime.sendMessage({
      type: 'DATA_EXTRACT',
      data: {
        code: data.code,
        inputData: data.inputData,
      },
    });

    if (response.$isError) {
      return {
        hasError: true,
        message: response.message || 'Data extraction failed',
        data: undefined,
      };
    }

    console.log('[DataExtractBlock] Data extraction successful');
    return {
      data: response.data,
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

