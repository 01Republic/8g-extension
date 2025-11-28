import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider } from '../dom';

/**
 * 스키마 필드 정의 (Union 타입)
 * OpenAI JSON Schema 표준 방식
 */
export interface StringSchemaField {
  type: 'string';
  enum?: readonly string[]; // enum 값들 (string만 허용)
  description?: string;
  optional?: boolean;
}

export interface NumberSchemaField {
  type: 'number';
  enum?: readonly number[]; // enum 값들 (number만 허용)
  description?: string;
  optional?: boolean;
}

export interface BooleanSchemaField {
  type: 'boolean';
  description?: string;
  optional?: boolean;
}

export interface ArraySchemaField {
  type: 'array';
  items: SchemaField;
  description?: string;
  optional?: boolean;
}

export interface ObjectSchemaField {
  type: 'object';
  shape: Record<string, SchemaField>;
  description?: string;
  optional?: boolean;
}

export interface CurrencySchemaField {
  type: 'currency';
  shape: any; // Remove dependency on CurrencyInfoSchema for now
  description?: string;
  optional?: boolean;
}

export type SchemaField =
  | StringSchemaField
  | NumberSchemaField
  | BooleanSchemaField
  | ArraySchemaField
  | ObjectSchemaField
  | CurrencySchemaField;

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
  model?: string; // 사용할 AI 모델
  apiKey: string; // AI API 키 (필수)
  provider: 'openai' | 'anthropic'; // AI 제공자 (필수)
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
  apiKey: z.string().min(1, 'AI API key is required'), // 필수
  provider: z.enum(['openai', 'anthropic']), // 필수
});

export function validateAiParseDataBlock(data: unknown): AiParseDataBlock {
  return AiParseDataBlockSchema.parse(data) as AiParseDataBlock;
}

/**
 * AI 파싱 블록 핸들러
 *
 * 이 블록은 DOMProvider를 통해 AI 파싱을 수행합니다.
 */
export async function handlerAiParseData(
  data: AiParseDataBlock,
  domProvider: DOMProvider
): Promise<BlockResult<any>> {
  try {
    const { sourceData, schemaDefinition, prompt, model, apiKey, provider } = data;

    // sourceData가 없으면 에러
    if (sourceData === undefined || sourceData === null) {
      throw new Error('sourceData is required for ai-parse-data block');
    }

    // API 키 확인
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('apiKey is required for ai-parse-data block');
    }

    // Check if parseWithAI method is available on the DOMProvider
    if (!domProvider.parseWithAI) {
      return {
        hasError: true,
        message: 'AI parsing is not supported in this environment',
        data: null,
      };
    }

    // Prepare the data string for AI processing
    const dataString = typeof sourceData === 'string'
      ? sourceData
      : JSON.stringify(sourceData, null, 2);

    // Create the system prompt
    const systemPrompt = `Parse the following data according to the schema definition.

Source Data:
\`\`\`
${dataString}
\`\`\`

Schema Definition: ${JSON.stringify(schemaDefinition, null, 2)}
${prompt ? `Additional Instructions: ${prompt}` : ''}

Please return only the parsed data in JSON format that matches the schema.`;

    // Use DOMProvider's parseWithAI method with full options
    const parsedData = await domProvider.parseWithAI({
      sourceData,
      schemaDefinition,
      prompt: systemPrompt,
      model,
      apiKey,
      provider,
    });

    return {
      data: parsedData,
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
 *   email: { type: 'string', description: 'User email address' },
 *   joinDate: { type: 'string' },
 *   age: { type: 'number', optional: true },
 *   plan: { type: 'string', enum: ['MONTHLY', 'YEARLY'] },
 *   status: { type: 'number', enum: [1, 2, 3] }
 * });
 *
 * // Schema 헬퍼 사용 (권장)
 * const schema2 = createSchema({
 *   name: Schema.string(),
 *   email: Schema.string({ description: 'User email address' }),
 *   plan: Schema.string({
 *     enum: ['MONTHLY', 'YEARLY'] as const,
 *     description: 'Billing cycle'
 *   }),
 *   priority: Schema.number({
 *     enum: [1, 2, 3] as const,
 *     optional: true
 *   }),
 *   price: Schema.currency({ description: 'Price with currency info' })
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
  string: (options?: {
    enum?: readonly string[];
    description?: string;
    optional?: boolean;
  }): StringSchemaField => ({
    type: 'string',
    ...options,
  }),
  number: (options?: {
    enum?: readonly number[];
    description?: string;
    optional?: boolean;
  }): NumberSchemaField => ({
    type: 'number',
    ...options,
  }),
  boolean: (options?: { description?: string; optional?: boolean }): BooleanSchemaField => ({
    type: 'boolean',
    ...options,
  }),
  array: (
    items: SchemaField,
    options?: { description?: string; optional?: boolean }
  ): ArraySchemaField => ({
    type: 'array',
    items,
    ...options,
  }),
  object: (
    shape: Record<string, SchemaField>,
    options?: { description?: string; optional?: boolean }
  ): ObjectSchemaField => ({
    type: 'object',
    shape,
    ...options,
  }),
  currency: (options?: { description?: string; optional?: boolean }): CurrencySchemaField => ({
    type: 'currency',
    shape: {}, // Simplified shape for now
    description:
      options?.description || 'Currency information with code, symbol, format, amount, and text',
    optional: options?.optional,
  }),
};