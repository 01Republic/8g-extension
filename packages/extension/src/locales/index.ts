/**
 * i18n 로더 및 번역 관리
 * locales 폴더의 JSON 파일들을 로드하고 관리합니다.
 */

import { useEffect, useState } from 'react';
import enTranslations from './en.json';
import koTranslations from './ko.json';

export type SupportedLocale = 'en' | 'ko';
export type Translations = Record<string, string>;

// 번역 데이터 캐시
const translationCache: Record<SupportedLocale, Translations> = {
  en: enTranslations,
  ko: koTranslations,
};

// 지원하는 locale 목록
export const SUPPORTED_LOCALES: SupportedLocale[] = ['ko', 'en'];

// 현재 설정된 locale (기본값: 브라우저 언어에서 감지)
let currentLocale: SupportedLocale = detectBrowserLocale();

/**
 * 브라우저 언어를 감지하여 지원하는 locale을 반환합니다.
 */
function detectBrowserLocale(): SupportedLocale {
  try {
    // Chrome Extension API가 있는 경우
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
      const chromeLocale = chrome.i18n.getUILanguage();
      const normalized = normalizeLocale(chromeLocale);
      if (SUPPORTED_LOCALES.includes(normalized as SupportedLocale)) {
        return normalized as SupportedLocale;
      }
    }
  } catch (error) {
    console.warn('Failed to get Chrome UI language:', error);
  }

  try {
    // 브라우저 navigator 언어 사용
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const normalized = normalizeLocale(browserLang);
    return SUPPORTED_LOCALES.includes(normalized as SupportedLocale) 
      ? (normalized as SupportedLocale) 
      : 'en';
  } catch (error) {
    console.warn('Failed to get browser language:', error);
    return 'en';
  }
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
  if (SUPPORTED_LOCALES.includes(langCode as SupportedLocale)) {
    return langCode;
  }

  return 'en';
}

/**
 * 현재 locale을 가져옵니다.
 */
export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}


/**
 * 특정 locale의 번역 데이터를 가져옵니다.
 *
 * @param locale - locale 코드 ('ko', 'en' 등)
 * @returns 번역 데이터 객체
 */
export function getTranslations(locale?: string): Translations {
  const targetLocale = locale ? normalizeLocale(locale) as SupportedLocale : currentLocale;
  return translationCache[targetLocale] || translationCache['en'];
}

/**
 * 번역 키에 해당하는 번역된 값을 가져옵니다.
 *
 * @param key - 번역 키 (예: 'ui.popup.extension_active')
 * @param locale - locale 코드 ('ko', 'en' 등) - 생략시 현재 locale 사용
 * @param replacements - 템플릿 변수 치환용 객체 (선택사항)
 * @returns 번역된 값 또는 키 자체 (번역이 없는 경우)
 */
export function getTranslation(
  key: string, 
  locale?: string, 
  replacements?: Record<string, string | number>
): string {
  const translations = getTranslations(locale);
  let translated = translations[key] || key;
  
  // 템플릿 변수 치환
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      translated = translated.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
    });
  }
  
  return translated;
}

/**
 * 짧은 번역 함수 (t)
 */
export function t(
  key: string, 
  replacements?: Record<string, string | number>
): string {
  return getTranslation(key, undefined, replacements);
}

/**
 * React Hook: i18n 기능을 제공합니다.
 * 브라우저 언어를 자동으로 감지하고 실시간으로 반영합니다.
 */
export function useTranslation() {
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    // 항상 브라우저 언어를 우선 사용
    return currentLocale;
  });

  // 브라우저 언어 변경 감지
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLocale = detectBrowserLocale();
      if (newLocale !== currentLocale) {
        currentLocale = newLocale;
        setLocale(newLocale);
        console.log('Browser language changed, switched to:', newLocale);
      }
    };

    // 언어 변경 이벤트 리스너 (일부 브라우저에서 지원)
    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  // 번역 함수 (현재 locale 사용)
  const translate = (key: string, replacements?: Record<string, string | number>) => {
    return getTranslation(key, locale, replacements);
  };

  return {
    locale,
    t: translate,
    availableLocales: SUPPORTED_LOCALES,
    isAutoDetected: true, // 자동 감지 표시용
  };
}

// 브라우저 언어 변경 감지용 (content script에서 사용)
export function refreshLocaleFromBrowser(): void {
  const newLocale = detectBrowserLocale();
  if (newLocale !== currentLocale) {
    currentLocale = newLocale;
    console.log('Browser locale refreshed:', newLocale);
    
    // content script의 모든 컴포넌트에게 언어 변경 알림
    window.dispatchEvent(new CustomEvent('8g-locale-changed', { 
      detail: { locale: newLocale } 
    }));
  }
}
