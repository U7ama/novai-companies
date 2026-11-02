'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  useEffect
} from 'react';
import { translations, type Locale, type TranslationDictionary } from './translations';

const STORAGE_KEY = 'novai_locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('novai-locale-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('novai-locale-change', callback);
  };
}

function getSnapshot(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'nl' ? 'nl' : 'en';
  } catch {
    return 'en';
  }
}

function getServerSnapshot(): Locale {
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {
        /* Storage blocked */
      }
      window.dispatchEvent(new Event('novai-locale-change'));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = translations[locale];

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useLanguage() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: translations.en
    };
  }
  return context;
}
