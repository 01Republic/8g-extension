import koTranslations from './ko.json';
import enTranslations from './en.json';

export type SupportedLocale = 'en' | 'ko';
export type Translations = Record<string, string>;

const translations: Record<SupportedLocale, Translations> = {
  ko: koTranslations,
  en: enTranslations,
};

export function getTranslation(key: string, locale: string = 'en'): string | undefined {
  const lang = locale.startsWith('ko') ? 'ko' : 'en';
  return translations[lang]?.[key];
}

export function getTranslations(locale: string = 'en'): Translations {
  const lang = locale.startsWith('ko') ? 'ko' : 'en';
  return translations[lang] || translations['en'];
}
