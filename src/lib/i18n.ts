import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import pl from '../locales/pl.json';
import ro from '../locales/ro.json';

/**
 * i18n setup — supports English, Polish, Romanian.
 * Detects browser language automatically.
 * Falls back to English if language not supported.
 * Persists user choice to localStorage.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pl: { translation: pl },
      ro: { translation: ro },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl', 'ro'],

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'rentshield_lang',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: true, // React already escapes — but belt and braces
    },

    // Don't load translations lazily — bundle is small enough
    partialBundledLanguages: false,
  });

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];
