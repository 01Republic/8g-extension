/**
 * i18n 로더 및 번역 관리
 * locales 폴더의 JSON 파일들을 로드하고 관리합니다.
 */

import enTranslations from './en.json';
import koTranslations from './ko.json';

type Translations = Record<string, string>;

// 번역 데이터 캐시
const translationCache: Record<string, Translations> = {
  en: enTranslations,
  ko: koTranslations,
};

/**
 * 특정 locale의 번역 데이터를 가져옵니다.
 *
 * @param locale - locale 코드 ('ko', 'en' 등)
 * @returns 번역 데이터 객체
 */
export function getTranslations(locale: string): Translations {
  const normalizedLocale = normalizeLocale(locale);
  return translationCache[normalizedLocale] || translationCache['en'];
}

/**
 * 번역 키에 해당하는 번역된 값을 가져옵니다.
 *
 * @param key - 번역 키 (예: 'slack.roles.workspace_primary_owner')
 * @param locale - locale 코드 ('ko', 'en' 등)
 * @returns 번역된 값 또는 undefined
 */
export function getTranslation(key: string, locale: string): string | undefined {
  const translations = getTranslations(locale);
  return translations[key];
}

/**
 * Locale 코드를 정규화합니다.
 *
 * @param locale - 원본 locale 코드
 * @returns 정규화된 locale 코드
 */
function normalizeLocale(locale: string): string {
  if (!locale) return 'en';

  const lower = locale.toLowerCase();
  const langCode = lower.split('-')[0];

  // 지원하는 locale만 반환
  const supportedLocales = ['ko', 'en'];
  if (supportedLocales.includes(langCode)) {
    return langCode;
  }

  return 'en';
}
