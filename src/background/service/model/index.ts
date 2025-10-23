import { z } from 'zod';

/**
 * AI 모델의 공통 인터페이스
 */
export interface IAiModel {
  /**
   * 모델 이름
   */
  modelName: string;

  /**
   * 구조화된 데이터 파싱을 수행합니다.
   * @param prompt - AI에게 전달할 프롬프트
   * @param zodSchema - 출력 스키마 (Zod)
   * @returns 파싱된 결과
   */
  parseStructuredData(prompt: string, zodSchema: z.ZodType<any>): Promise<any>;
}

/**
 * AI 모델 설정
 */
export interface AiModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  temperature?: number;
}

/**
 * AI 모델 팩토리
 * 
 * 전략 패턴을 사용하여 AI 모델을 생성합니다.
 */
export class AiModelFactory {
  /**
   * 설정에 따라 적절한 AI 모델 인스턴스를 생성합니다.
   */
  static createModel(config: AiModelConfig): IAiModel {
    const { provider, apiKey, model, temperature = 0 } = config;

    switch (provider) {
      case 'openai': {
        // Lazy import to avoid circular dependencies
        const { OpenAIModel } = require('./OpenAIModel');
        return new OpenAIModel({
          apiKey,
          model,
          temperature,
        });
      }

      case 'anthropic': {
        const { AnthropicModel } = require('./AnthropicModel');
        return new AnthropicModel({
          apiKey,
          model,
          temperature,
        });
      }

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

