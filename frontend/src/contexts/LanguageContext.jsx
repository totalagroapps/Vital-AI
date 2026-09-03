import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('media_hub_lang');
    if (savedLang && ['es', 'en', 'fr', 'ar'].includes(savedLang)) {
      return savedLang;
    }
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('en')) {
      return 'en';
    }
    return 'es';
  });

  useEffect(() => {
    localStorage.setItem('media_hub_lang', language);
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('media_hub_lang', lang);
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
