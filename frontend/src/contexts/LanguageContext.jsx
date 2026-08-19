import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('media_hub_lang');
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith('en')) {
        setLanguage('en');
        localStorage.setItem('media_hub_lang', 'en');
      } else {
        setLanguage('es');
        localStorage.setItem('media_hub_lang', 'es');
      }
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('media_hub_lang', lang);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['es']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
