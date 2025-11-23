import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { IAiModel } from './index';

/**
 * OpenAI 모델 설정
 */
export interface OpenAIModelConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

/**
 * OpenAI 기반 AI 모델 구현
 *
 * LangChain의 ChatOpenAI를 사용하여 구조화된 데이터 파싱을 수행합니다.
 */
export class OpenAIModel implements IAiModel {
  private llm: ChatOpenAI;
  public readonly modelName: string;

  private static readonly DEFAULT_MODEL = 'gpt-4o-mini';

  constructor(config: OpenAIModelConfig) {
    const { apiKey, model = OpenAIModel.DEFAULT_MODEL, temperature = 0 } = config;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is required');
    }

    this.modelName = model;
    this.llm = new ChatOpenAI({
      apiKey: apiKey,
      model: model,
      temperature: temperature,
    });
  }

  /**
   * 구조화된 데이터 파싱을 수행합니다.
   *
   * @param prompt - AI에게 전달할 프롬프트
   * @param zodSchema - 출력 스키마 (Zod)
   * @returns 파싱된 결과
   */
  async parseStructuredData(prompt: string, zodSchema: z.ZodType<any>): Promise<any> {
    try {
      // Structured Output 사용
      const structuredLlm = this.llm.withStructuredOutput(zodSchema);

      // AI 호출
      const result = await structuredLlm.invoke(prompt);

      return result;
    } catch (error) {
      console.error('[OpenAIModel] Parsing failed:', error);
      throw error;
    }
  }
}
