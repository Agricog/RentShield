import i18n from 'i18next';
import { api } from './api';
import en from '../locales/en.json';

/**
 * Languages with static translation files — these never hit the API.
 */
const STATIC_LANGUAGES = new Set(['en', 'pl', 'ro']);

/**
 * Cache key prefix for dynamically translated UI strings.
 * Stored in localStorage with a version hash to bust stale translations.
 */
const CACHE_PREFIX = 'rs_i18n_';
const CACHE_VERSION = '1'; // Bump when en.json keys change

/**
 * Full list of supported languages.
 * Static languages have bundled JSON. All others use dynamic Claude translation.
 */
export const ALL_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', static: true },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', static: true },
  { code: 'ro', label: 'Română', flag: '🇷🇴', static: true },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩', static: false },
  { code: 'ur', label: 'اردو', flag: '🇵🇰', static: false },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', static: false },
  { code: 'so', label: 'Soomaali', flag: '🇸🇴', static: false },
  { code: 'pt', label: 'Português', flag: '🇵🇹', static: false },
  { code: 'es', label: 'Español', flag: '🇪🇸', static: false },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', static: false },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', static: false },
  { code: 'ps', label: 'پښتو', flag: '🇦🇫', static: false },
  { code: 'ta', label: 'தமிழ்', flag: '🇱🇰', static: false },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳', static: false },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳', static: false },
  { code: 'zh', label: '中文', flag: '🇨🇳', static: false },
  { code: 'fr', label: 'Français', flag: '🇫🇷', static: false },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', static: false },
  { code: 'lt', label: 'Lietuvių', flag: '🇱🇹', static: false },
  { code: 'lv', label: 'Latviešu', flag: '🇱🇻', static: false },
  { code: 'bg', label: 'Български', flag: '🇧🇬', static: false },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺', static: false },
  { code: 'ti', label: 'ትግርኛ', flag: '🇪🇷', static: false },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹', static: false },
  { code: 'ku', label: 'Kurdî', flag: '🇮🇶', static: false },
] as const;

export type LanguageCode = (typeof ALL_LANGUAGES)[number]['code'];

/**
 * Switch the app to a new language.
 * - Static languages (en/pl/ro): instant switch, no API call.
 * - Dynamic languages: checks localStorage cache first, then fetches
 *   from API (Claude translates en.json), caches result, applies.
 */
export async function switchLanguage(langCode: string): Promise<boolean> {
  // Static language — already bundled
  if (STATIC_LANGUAGES.has(langCode)) {
    await i18n.changeLanguage(langCode);
    localStorage.setItem('rentshield_lang', langCode);
    return true;
  }

  // Check localStorage cache
  const cacheKey = `${CACHE_PREFIX}${langCode}_v${CACHE_VERSION}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const translations = JSON.parse(cached);
      i18n.addResourceBundle(langCode, 'translation', translations, true, true);
      await i18n.changeLanguage(langCode);
      localStorage.setItem('rentshield_lang', langCode);
      return true;
    } catch {
      // Corrupted cache — fall through to fetch
      localStorage.removeItem(cacheKey);
    }
  }

  // Fetch dynamic translation from API
  try {
    const res = await api.post<{ translations: Record<string, unknown> }>(
      '/api/translate-ui',
      {
        targetLanguage: langCode,
        sourceTranslations: en,
      }
    );

    if (res.success && res.data?.translations) {
      // Cache in localStorage
      localStorage.setItem(cacheKey, JSON.stringify(res.data.translations));

      // Add to i18next and switch
      i18n.addResourceBundle(langCode, 'translation', res.data.translations, true, true);
      await i18n.changeLanguage(langCode);
      localStorage.setItem('rentshield_lang', langCode);
      return true;
    }
  } catch (err) {
    console.error(`Failed to load translations for ${langCode}:`, err);
  }

  // Fallback — stay on current language
  return false;
}

/**
 * Load cached dynamic language on app startup.
 * Called once from main.tsx after i18n.init().
 */
export function loadCachedLanguage(): void {
  const saved = localStorage.getItem('rentshield_lang');
  if (!saved || STATIC_LANGUAGES.has(saved)) return;

  const cacheKey = `${CACHE_PREFIX}${saved}_v${CACHE_VERSION}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const translations = JSON.parse(cached);
      i18n.addResourceBundle(saved, 'translation', translations, true, true);
      i18n.changeLanguage(saved);
    } catch {
      // Reset to English if cache is corrupted
      localStorage.removeItem(cacheKey);
      localStorage.setItem('rentshield_lang', 'en');
    }
  }
}
