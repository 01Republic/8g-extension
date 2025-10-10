import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

export interface AiParsingRequest {
  sourceData: any;
  schemaDefinition: any;
  prompt?: string;
  model?: string;
  apiKey: string; // OpenAI API 키
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
   * 데이터를 AI로 파싱
   */
  async parseData(request: AiParsingRequest): Promise<AiParsingResult> {
    try {
      const { sourceData, schemaDefinition, prompt, model = 'gpt-4o-mini', apiKey } = request;

      // API 키 확인
      if (!apiKey || apiKey.trim() === '') {
        return {
          success: false,
          error: 'OpenAI API key is required. Please provide it in the ai-parse-data block.',
        };
      }

      // Zod 스키마 재구성
      const zodSchema = this.reconstructZodSchema(schemaDefinition);

      // OpenAI 모델 초기화
      const llm = new ChatOpenAI({
        modelName: model,
        temperature: 0, // 일관된 출력을 위해 0으로 설정
        openAIApiKey: apiKey,
      });

      // Structured Output 사용
      const structuredLlm = llm.withStructuredOutput(zodSchema);

      // 프롬프트 구성
      const systemPrompt = this.buildPrompt(sourceData, schemaDefinition, prompt);

      // AI 호출
      const result = await structuredLlm.invoke(systemPrompt);

      return {
        success: true,
        data: result,
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
    if (schemaDefinition.type === 'object' && schemaDefinition.shape) {
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
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
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
      default:
        zodType = z.any();
    }

    // optional 처리
    if (fieldDef.optional) {
      zodType = zodType.optional();
    }

    return zodType;
  }

  /**
   * AI에게 전달할 프롬프트 구성
   */
  private buildPrompt(sourceData: any, schemaDefinition: any, customPrompt?: string): string {
    const dataString = typeof sourceData === 'string' 
      ? sourceData 
      : JSON.stringify(sourceData, null, 2);

    const schemaDescription = this.describeSchema(schemaDefinition);

    let prompt = `You are a data parsing assistant. Your task is to extract and structure data according to the provided schema.

Source Data:
\`\`\`
${dataString}
\`\`\`

Expected Output Schema:
${schemaDescription}

${customPrompt ? `\nAdditional Instructions:\n${customPrompt}\n` : ''}

Please parse the source data and return it in the exact format specified by the schema. Extract all relevant information and ensure the data types match the schema.`;

    return prompt;
  }

  /**
   * 스키마를 사람이 읽을 수 있는 형식으로 설명
   */
  private describeSchema(schemaDefinition: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (schemaDefinition.type === 'object' && schemaDefinition.shape) {
      let description = `${spaces}{\n`;
      for (const [key, fieldDef] of Object.entries(schemaDefinition.shape)) {
        const optional = (fieldDef as any).optional ? ' (optional)' : '';
        description += `${spaces}  ${key}: ${this.describeSchema(fieldDef, indent + 1)}${optional}\n`;
      }
      description += `${spaces}}`;
      return description;
    }
    
    if (schemaDefinition.type === 'array' && schemaDefinition.items) {
      return `Array<${this.describeSchema(schemaDefinition.items, 0)}>`;
    }
    
    return schemaDefinition.type || 'any';
  }
}

