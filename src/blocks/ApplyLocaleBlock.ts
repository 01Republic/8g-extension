import z from 'zod';
import { Block, BlockResult } from './types';
import { detectLocale } from '@/utils/locale-detector';
import { translateObject } from '@/utils/translation-resolver';

/**
 * ApplyLocale Block
 * 
 * 데이터의 특정 키 값들을 locale에 맞게 번역합니다.
 * 
 * 사용 예:
 * {
 *   name: 'apply-locale',
 *   sourceData: { valueFrom: 'steps.fetchApi.result.data' },
 *   locale: 'ko', // 선택사항, 없으면 자동 감지
 *   mappings: {
 *     role: { translationKey: 'slack.roles' }
 *   }
 * }
 */
export interface ApplyLocaleBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'apply-locale';
  sourceData?: any; // 변환할 소스 데이터 (바인딩 가능)
  locale?: string; // 명시적 locale (없으면 자동 감지)
  mappings: Record<string, { translationKey: string }>; // 변환할 키와 번역 키 경로 매핑
}

export const ApplyLocaleBlockSchema = z.object({
  name: z.literal('apply-locale'),
  sourceData: z.any().optional(),
  locale: z.string().optional(),
  mappings: z.record(
    z.string(),
    z.object({
      translationKey: z.string(),
    })
  ),
});

export function validateApplyLocaleBlock(data: unknown): ApplyLocaleBlock {
  return ApplyLocaleBlockSchema.parse(data) as ApplyLocaleBlock;
}

/**
 * ApplyLocale 블록 핸들러
 * 
 * sourceData의 특정 키 값들을 locale에 맞게 번역합니다.
 */
export async function handlerApplyLocale(
  data: ApplyLocaleBlock
): Promise<BlockResult<any>> {
  try {
    const { sourceData, locale, mappings } = data;

    // sourceData가 없으면 빈 객체로 처리
    const input = sourceData !== undefined && sourceData !== null ? sourceData : {};

    // 입력이 객체가 아니면 에러
    if (typeof input !== 'object' || Array.isArray(input) || input === null) {
      throw new Error('sourceData must be an object');
    }

    // locale 결정 (명시적 locale이 없으면 자동 감지)
    const targetLocale = locale || detectLocale();

    // 번역 수행
    const translated = translateObject(input as Record<string, any>, mappings, targetLocale);

    return {
      data: translated,
    };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in apply-locale handler',
      data: null,
    };
  }
}

