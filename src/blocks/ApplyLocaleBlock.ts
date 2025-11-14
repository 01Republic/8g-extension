import z from 'zod';
import { Block, BlockResult } from './types';
import { detectLocale } from '@/utils/locale-detector';
import { translateObject } from '@/utils/translation-resolver';

/**
 * ApplyLocale Block
 * 
 * 데이터의 특정 키 값들을 locale에 맞게 번역합니다.
 * sourceData가 배열인 경우 각 요소를 순회하며 번역합니다.
 * 
 * 사용 예 (객체):
 * {
 *   name: 'apply-locale',
 *   sourceData: { valueFrom: 'steps.fetchApi.result.data' },
 *   locale: 'ko', // 선택사항, 없으면 자동 감지
 *   mappings: {
 *     role: 'slack.roles' // 또는 { translationKey: 'slack.roles' }
 *   }
 * }
 * 
 * 사용 예 (배열):
 * {
 *   name: 'apply-locale',
 *   sourceData: [
 *     { role: 'workspace_primary_owner', name: 'John' },
 *     { role: 'workspace_admins', name: 'Jane' }
 *   ],
 *   mappings: {
 *     role: 'slack.roles'
 *   }
 * }
 * // 결과: [
 * //   { role: '워크스페이스 주 소유자', name: 'John' },
 * //   { role: '워크스페이스 관리자', name: 'Jane' }
 * // ]
 */
export interface ApplyLocaleBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'apply-locale';
  sourceData?: any; // 변환할 소스 데이터 (바인딩 가능)
  locale?: string; // 명시적 locale (없으면 자동 감지)
  mappings: Record<string, string | { translationKey: string }>; // 변환할 키와 번역 키 경로 매핑 (문자열 또는 객체)
}

// mappings는 문자열 또는 객체를 받을 수 있음
const MappingValueSchema = z.union([
  z.string(), // 간단한 형식: 'slack.roles'
  z.object({
    translationKey: z.string(), // 상세한 형식: { translationKey: 'slack.roles' }
  }),
]);

export const ApplyLocaleBlockSchema = z.object({
  name: z.literal('apply-locale'),
  sourceData: z.any().optional(),
  locale: z.string().optional(),
  mappings: z.record(z.string(), MappingValueSchema),
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

    // locale 결정 (명시적 locale이 없으면 자동 감지)
    const targetLocale = locale || detectLocale();

    // mappings를 정규화 (문자열을 객체로 변환)
    const normalizedMappings: Record<string, { translationKey: string }> = {};
    for (const [key, value] of Object.entries(mappings)) {
      if (typeof value === 'string') {
        // 간단한 형식: 'slack.roles' -> { translationKey: 'slack.roles' }
        normalizedMappings[key] = { translationKey: value };
      } else {
        // 이미 객체 형식
        normalizedMappings[key] = value;
      }
    }

    // 배열인 경우 각 요소를 순회하며 번역
    if (Array.isArray(input)) {
      const translatedArray = input.map((item) => {
        // 배열의 각 요소가 객체인 경우에만 번역
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return translateObject(item as Record<string, any>, normalizedMappings, targetLocale);
        }
        // 객체가 아니면 그대로 반환
        return item;
      });

      return {
        data: translatedArray,
      };
    }

    // 객체인 경우
    if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
      const translated = translateObject(
        input as Record<string, any>,
        normalizedMappings,
        targetLocale
      );

      return {
        data: translated,
      };
    }

    // 객체도 배열도 아니면 에러
    throw new Error('sourceData must be an object or an array of objects');
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in apply-locale handler',
      data: null,
    };
  }
}

