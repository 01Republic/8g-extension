import { z } from 'zod';
import { ErrorResponse } from '@/types/internal-messages';
import { CurrencyInfoSchema } from '@/sdk/types';
import { AiModelFactory } from './model';

export interface AiParsingRequest {
  sourceData: any;
  schemaDefinition: any;
  prompt?: string;
  model?: string;
  apiKey: string; // AI API 키 (OpenAI 또는 Anthropic)
  provider: 'openai' | 'anthropic'; // AI 제공자
}

export interface AiParsingResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Background Script에서 실행되는 AI 파싱 서비스
 *
 * LangChain과 OpenAI를 사용하여 데이터를 구조화된 형식으로 파싱합니다.
 */
export class AiParsingService {
  constructor() {
    // API 키는 블록에서 직접 전달받음
  }

  /**
   * AI 파싱 요청을 처리하고 응답을 전송합니다.
   *
   * @param requestData - AI 파싱 요청 데이터
   * @param sendResponse - 응답 전송 함수
   */
  async handleParseData(
    requestData: AiParsingRequest,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[AiParsingService] Handle parse data request');

      const result = await this.parseData(requestData);

      if (result.success) {
        sendResponse({
          success: true,
          data: result.data,
        });
      } else {
        sendResponse({
          $isError: true,
          message: result.error || 'AI parsing failed',
          data: null,
        } as ErrorResponse);
      }
    } catch (error) {
      console.error('[AiParsingService] Parse data error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Unknown error in AI parsing',
        data: null,
      } as ErrorResponse);
    }
  }

  /**
   * 데이터를 AI로 파싱
   */
  async parseData(request: AiParsingRequest): Promise<AiParsingResult> {
    try {
      const { schemaDefinition, prompt, model, apiKey, provider } = request;

      // API 키 확인
      if (!apiKey || apiKey.trim() === '') {
        return {
          success: false,
          error: 'AI API key is required. Please provide it in the ai-parse-data block.',
        };
      }

      // 배열 스키마인지 확인
      const isArraySchema = schemaDefinition.type === 'array';

      // Zod 스키마 재구성
      const zodSchema = this.reconstructZodSchema(schemaDefinition);

      // AI 모델 생성 (전략 패턴)
      const aiModel = AiModelFactory.createModel({
        provider: provider,
        apiKey: apiKey,
        model: model,
        temperature: 0, // 일관된 출력을 위해 0으로 설정
      });

      // AI 호출 (prompt는 workflow-engine에서 이미 구성됨)
      const result = await aiModel.parseStructuredData(prompt || '', zodSchema);

      // 배열 스키마인 경우 wrapper 제거
      const finalResult =
        isArraySchema && result && typeof result === 'object' && 'items' in result
          ? result.items
          : result;

      return {
        success: true,
        data: finalResult,
      };
    } catch (error) {
      console.error('[AI Parsing Service] Parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during AI parsing',
      };
    }
  }

  /**
   * JSON 스키마 정의를 Zod 스키마로 재구성
   */
  private reconstructZodSchema(schemaDefinition: any): z.ZodType<any> {
    if (schemaDefinition.type === 'array' && schemaDefinition.items) {
      // OpenAI Structured Output은 최상위 레벨에서 array를 지원하지 않으므로
      // 배열을 객체로 감싸서 처리
      const itemsType = this.buildZodType(schemaDefinition.items);
      return z.object({
        items: z.array(itemsType),
      });
    }

    if (schemaDefinition.type === 'object' && schemaDefinition.shape) {
      // 객체 스키마
      const shape: Record<string, z.ZodType<any>> = {};

      for (const [key, fieldDef] of Object.entries(schemaDefinition.shape)) {
        shape[key] = this.buildZodType(fieldDef as any);
      }

      return z.object(shape);
    }

    return z.any();
  }

  /**
   * 필드 정의를 Zod 타입으로 변환
   */
  private buildZodType(fieldDef: any): z.ZodType<any> {
    let zodType: z.ZodType<any>;

    switch (fieldDef.type) {
      case 'string':
        // enum이 있으면 z.enum 사용
        if (fieldDef.enum && Array.isArray(fieldDef.enum) && fieldDef.enum.length > 0) {
          zodType = z.enum(fieldDef.enum as [string, ...string[]]);
        } else {
          zodType = z.string();
        }
        break;
      case 'number':
        // enum이 있으면 z.union + z.literal 사용
        if (fieldDef.enum && Array.isArray(fieldDef.enum) && fieldDef.enum.length > 0) {
          const literals = fieldDef.enum.map((v: any) => z.literal(v));
          zodType = z.union(
            literals as [z.ZodLiteral<any>, z.ZodLiteral<any>, ...z.ZodLiteral<any>[]]
          );
        } else {
          zodType = z.number();
        }
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(fieldDef.items ? this.buildZodType(fieldDef.items) : z.any());
        break;
      case 'object':
        if (fieldDef.shape) {
          const shape: Record<string, z.ZodType<any>> = {};
          for (const [key, subFieldDef] of Object.entries(fieldDef.shape)) {
            shape[key] = this.buildZodType(subFieldDef as any);
          }
          zodType = z.object(shape);
        } else {
          zodType = z.any();
        }
        break;
      case 'currency':
        // CurrencyInfoSchema를 Zod 객체로 변환
        zodType = z.object({
          code: z.enum(CurrencyInfoSchema.code.enum as unknown as [string, ...string[]]),
          symbol: z.enum(CurrencyInfoSchema.symbol.enum as unknown as [string, ...string[]]),
          format: z.enum(CurrencyInfoSchema.format.enum as unknown as [string, ...string[]]),
          amount: z.number(),
          text: z.string(),
        });
        break;
      default:
        zodType = z.any();
    }

    // optional 처리 - OpenAI API는 .optional() 대신 .nullable() 사용
    if (fieldDef.optional) {
      zodType = zodType.nullable();
    }

    return zodType;
  }

}
