import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('media_hub_lang');
    if (savedLang && ['es', 'en', 'fr', 'ar'].includes(savedLang)) {
      return savedLang;
    }
    const navLangs = (navigator.languages && navigator.languages.length > 0)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ''];
    for (const l of navLangs) {
      const code = (l || '').toLowerCase();
      if (code.startsWith('en')) return 'en';
      if (code.startsWith('fr')) return 'fr';
      if (code.startsWith('ar')) return 'ar';
      if (code.startsWith('es')) return 'es';
    }
    return 'es';
  });

  useEffect(() => {
    localStorage.setItem('media_hub_lang', language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('media_hub_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const t = (key, params) => {
    let str = translations[language]?.[key] || translations['es']?.[key] || key;
    if (params && typeof str === 'string') {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), params[k]);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
