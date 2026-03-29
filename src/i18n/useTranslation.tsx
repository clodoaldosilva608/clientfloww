/**
 * src/i18n/useTranslation.tsx
 * Phase 8 - i18n Translation Hook
 *
 * Lightweight context-based translation engine allowing for dynamic language switching.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';
import esES from './locales/es-ES';

type LanguageConfig = {
  [key: string]: string;
};

const dictionaries: Record<string, LanguageConfig> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

type Language = keyof typeof dictionaries;

interface I18nContextProps {
  t: (key: keyof typeof ptBR, defaultText?: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Detect browser language or fallback to 'pt-BR'
  const getInitialLang = (): Language => {
    const saved = localStorage.getItem('i18n_lang') as Language;
    if (saved && dictionaries[saved]) return saved;
    
    const browserLang = navigator.language;
    if (browserLang.startsWith('en')) return 'en-US';
    if (browserLang.startsWith('es')) return 'es-ES';
    return 'pt-BR';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLang);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('i18n_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof typeof ptBR, defaultText?: string): string => {
    const dict = dictionaries[language] || dictionaries['pt-BR'];
    return dict[key] || defaultText || key;
  };

  const formatCurrency = (value: number) => {
    const formatters: Record<Language, Intl.NumberFormat> = {
      'pt-BR': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
      'en-US': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'es-ES': new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
    };
    return formatters[language].format(value);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, formatCurrency, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
