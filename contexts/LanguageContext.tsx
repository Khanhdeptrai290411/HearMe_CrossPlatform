import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

type Language = 'vi' | 'ja';

interface LanguageContextType {
  locale: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('language');
      if (saved === 'vi' || saved === 'ja') return saved as Language;
    } catch {}
  }
  return 'vi';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem('language');
        if (saved === 'vi' || saved === 'ja') {
          setLocale(saved as Language);
        }
      } catch {}
    };
    loadLang();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLocale(lang);
    try {
      await AsyncStorage.setItem('language', lang);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem('language', lang);
      }
    } catch {}
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let current: any = translations[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to Vietnamese translation if Japanese key is missing
        let fallback: any = translations['vi'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            fallback = null;
            break;
          }
        }
        if (typeof fallback === 'string') {
          current = fallback;
          break;
        }
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    let val = current;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }

    return val;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
