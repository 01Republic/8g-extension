import z from 'zod';
import { Block, BlockResult } from './types';

/**
 * 스키마 필드 정의
 */
export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  items?: SchemaField; // array인 경우
  shape?: Record<string, SchemaField>; // object인 경우
  optional?: boolean;
}

/**
 * 스키마 정의 (JSON 형식)
 */
export interface ObjectSchemaDefinition {
  type: 'object';
  shape: Record<string, SchemaField>;
}

export interface ArraySchemaDefinition {
  type: 'array';
  items: SchemaField;
}

export type SchemaDefinition = ObjectSchemaDefinition | ArraySchemaDefinition;

export interface AiParseDataBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'ai-parse-data';
  sourceData?: any; // 직접 전달할 데이터 또는 이전 스텝 결과
  schemaDefinition: SchemaDefinition; // JSON 스키마 정의
  prompt?: string; // AI에게 추가 지시사항
  model?: string; // 사용할 OpenAI 모델 (기본: gpt-4o-mini)
  apiKey: string; // OpenAI API 키 (필수)
}

// Schema Definition Zod 스키마
const ObjectSchemaDefinitionSchema = z.object({
  type: z.literal('object'),
  shape: z.record(z.string(), z.any()),
});

const ArraySchemaDefinitionSchema = z.object({
  type: z.literal('array'),
  items: z.any(),
});

const SchemaDefinitionSchema = z.discriminatedUnion('type', [
  ObjectSchemaDefinitionSchema,
  ArraySchemaDefinitionSchema,
]);

// AI 파싱 블록용 스키마 (검증용)
export const AiParseDataBlockSchema = z.object({
  name: z.literal('ai-parse-data'),
  sourceData: z.any().optional(),
  schemaDefinition: SchemaDefinitionSchema,
  prompt: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().min(1, 'OpenAI API key is required'), // 필수
});

export function validateAiParseDataBlock(data: unknown): AiParseDataBlock {
  return AiParseDataBlockSchema.parse(data) as AiParseDataBlock;
}

/**
 * AI 파싱 블록 핸들러
 * 
 * 이 블록은 Content Script에서 실행되지만,
 * 실제 AI 처리는 Background Script로 위임합니다.
 */
export async function handlerAiParseData(data: AiParseDataBlock): Promise<BlockResult<any>> {
  try {
    const {
      sourceData,
      schemaDefinition,
      prompt,
      model = 'gpt-4o-mini',
      apiKey,
    } = data;

    // sourceData가 없으면 에러
    if (sourceData === undefined || sourceData === null) {
      throw new Error('sourceData is required for ai-parse-data block');
    }

    // API 키 확인
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('apiKey is required for ai-parse-data block');
    }

    // Background로 AI 파싱 요청 메시지 전송
    const response = await chrome.runtime.sendMessage({
      type: 'AI_PARSE_DATA',
      data: {
        sourceData,
        schemaDefinition,
        prompt,
        model,
        apiKey, // API 키 포함
      },
    });

    if (response.$isError) {
      throw new Error(response.message || 'AI parsing failed');
    }

    return {
      data: response.data,
    };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in ai-parse-data handler',
      data: null,
    };
  }
}

/**
 * 스키마 정의 헬퍼 함수
 * 
 * 사용 예:
 * // 단일 객체
 * const schema = createSchema({
 *   memberName: { type: 'string' },
 *   email: { type: 'string' },
 *   joinDate: { type: 'string' },
 *   age: { type: 'number', optional: true }
 * });
 * 
 * // 객체 배열
 * const arraySchema = createArraySchema({
 *   type: 'object',
 *   shape: {
 *     name: { type: 'string' },
 *     email: { type: 'string' }
 *   }
 * });
 */
export function createSchema(shape: Record<string, SchemaField>): ObjectSchemaDefinition {
  return {
    type: 'object',
    shape,
  };
}

export function createArraySchema(items: SchemaField): ArraySchemaDefinition {
  return {
    type: 'array',
    items,
  };
}

/**
 * 스키마 필드 헬퍼 함수들
 */
export const Schema = {
  string: (optional = false): SchemaField => ({ type: 'string', optional }),
  number: (optional = false): SchemaField => ({ type: 'number', optional }),
  boolean: (optional = false): SchemaField => ({ type: 'boolean', optional }),
  array: (items: SchemaField, optional = false): SchemaField => ({ type: 'array', items, optional }),
  object: (shape: Record<string, SchemaField>, optional = false): SchemaField => ({ type: 'object', shape, optional }),
};

