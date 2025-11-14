/**
 * 번역 키 리졸버
 * 값과 번역 키 경로를 조합하여 번역된 값을 가져옵니다.
 */

import { getTranslation } from '@/locales';

/**
 * 값과 번역 키 경로를 조합하여 번역된 값을 반환합니다.
 * 
 * 값이 이미 전체 번역 키 경로인 경우와 부분 값인 경우를 모두 처리합니다.
 * 
 * 예시:
 * - value: "workspace_primary_owner", translationKeyPrefix: "slack.roles"
 *   → 결과 키: "slack.roles.workspace_primary_owner"
 * - value: "slack.roles.single_channel_guests", translationKeyPrefix: "slack.roles"
 *   → 결과 키: "slack.roles.single_channel_guests" (이미 전체 경로이므로 그대로 사용)
 * 
 * @param value - 변환할 원본 값
 * @param translationKeyPrefix - 번역 키 경로 접두사 (예: 'slack.roles')
 * @param locale - locale 코드 ('ko', 'en' 등)
 * @returns 번역된 값 또는 원본 값 (번역이 없을 경우)
 */
export function resolveTranslation(
  value: string,
  translationKeyPrefix: string,
  locale: string
): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // 값이 이미 translationKeyPrefix로 시작하는지 확인
  // 예: "slack.roles.single_channel_guests"는 이미 전체 경로
  const prefixWithDot = `${translationKeyPrefix}.`;
  let translationKey: string;

  if (value.startsWith(prefixWithDot)) {
    // 이미 전체 경로인 경우 그대로 사용
    translationKey = value;
  } else {
    // 부분 값인 경우 접두사를 붙여서 전체 경로 생성
    translationKey = `${translationKeyPrefix}.${value}`;
  }

  // 번역된 값 가져오기
  const translated = getTranslation(translationKey, locale);

  // 번역이 있으면 번역된 값 반환, 없으면 원본 값 반환
  return translated !== undefined ? translated : value;
}

/**
 * 객체의 특정 키 값들을 번역합니다.
 * 
 * @param data - 변환할 데이터 객체
 * @param mappings - 키와 번역 키 경로 매핑
 * @param locale - locale 코드
 * @returns 번역된 데이터 객체
 */
export function translateObject(
  data: Record<string, any>,
  mappings: Record<string, { translationKey: string }>,
  locale: string
): Record<string, any> {
  const result = { ...data };

  for (const [key, mapping] of Object.entries(mappings)) {
    if (key in result && result[key] !== null && result[key] !== undefined) {
      const value = result[key];

      // 문자열인 경우에만 번역
      if (typeof value === 'string') {
        result[key] = resolveTranslation(value, mapping.translationKey, locale);
      }
      // 배열인 경우 각 요소를 번역
      else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'string'
            ? resolveTranslation(item, mapping.translationKey, locale)
            : item
        );
      }
    }
  }

  return result;
}

