/**
 * Locale 감지 유틸리티
 * 웹페이지에서 locale을 감지하여 반환합니다.
 */

/**
 * 웹페이지에서 locale을 감지합니다.
 * 
 * 감지 순서:
 * 1. document.documentElement.lang 속성
 * 2. <html lang=""> 속성
 * 3. navigator.language
 * 4. 기본값: 'en'
 * 
 * @returns locale 코드 ('ko', 'en' 등)
 */
export function detectLocale(): string {
  // 1. document.documentElement.lang 확인
  if (typeof document !== 'undefined' && document.documentElement) {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) {
      return normalizeLocale(htmlLang);
    }
  }

  // 2. navigator.language 확인
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocale(navigator.language);
  }

  // 3. 기본값
  return 'en';
}

/**
 * Locale 코드를 정규화합니다.
 * 'ko-KR' -> 'ko', 'en-US' -> 'en' 등
 * 
 * @param locale - 원본 locale 코드
 * @returns 정규화된 locale 코드
 */
function normalizeLocale(locale: string): string {
  if (!locale) return 'en';

  // 소문자로 변환
  const lower = locale.toLowerCase();

  // 언어 코드만 추출 (예: 'ko-KR' -> 'ko', 'en-US' -> 'en')
  const langCode = lower.split('-')[0];

  // 지원하는 locale만 반환 (현재: ko, en)
  const supportedLocales = ['ko', 'en'];
  if (supportedLocales.includes(langCode)) {
    return langCode;
  }

  // 지원하지 않는 locale은 기본값 반환
  return 'en';
}

