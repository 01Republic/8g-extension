import z from 'zod';
import jsonata from 'jsonata';
import { Block, BlockResult } from './types';

/**
 * TransformData Block
 *
 * JSONata를 사용하여 이전 스텝의 데이터를 변환/파싱합니다.
 *
 * 사용 예:
 * {
 *   name: 'transform-data',
 *   sourceData: { valueFrom: 'steps.getItems.result.data' },
 *   expression: '$sum(items[price > 100].price)'
 * }
 */
export interface TransformDataBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'transform-data';
  sourceData?: any; // 변환할 소스 데이터 (바인딩 가능)
  expression: string; // JSONata 표현식
}

// TransformData 블록용 스키마 (검증용)
export const TransformDataBlockSchema = z.object({
  name: z.literal('transform-data'),
  sourceData: z.any().optional(),
  expression: z.string().min(1, 'JSONata expression is required'),
});

export function validateTransformDataBlock(data: unknown): TransformDataBlock {
  return TransformDataBlockSchema.parse(data) as TransformDataBlock;
}

/**
 * TransformData 블록 핸들러
 *
 * JSONata 표현식을 실행하여 데이터를 변환합니다.
 */
export async function handlerTransformData(data: TransformDataBlock): Promise<BlockResult<any>> {
  try {
    const { sourceData, expression } = data;

    // sourceData가 없으면 빈 객체로 처리
    const input = sourceData !== undefined && sourceData !== null ? sourceData : {};

    // JSONata 표현식 컴파일
    let compiledExpression: jsonata.Expression;
    try {
      compiledExpression = jsonata(expression);
    } catch (error) {
      throw new Error(
        `Invalid JSONata expression: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 표현식 실행
    let result: any;
    try {
      result = await compiledExpression.evaluate(input);
    } catch (error) {
      console.error('JSONata evaluation failed:', error);
      throw new Error(
        `JSONata evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return {
      data: result,
    };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in transform-data handler',
      data: null,
    };
  }
}