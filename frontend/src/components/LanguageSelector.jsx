import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'es' ? 'bg-blue-100 shadow-sm border border-blue-300' : 'opacity-50 hover:opacity-100'
        }`}
        title="Español"
      >
        <span className="text-xl">🇪🇸</span>
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'en' ? 'bg-blue-100 shadow-sm border border-blue-300' : 'opacity-50 hover:opacity-100'
        }`}
        title="English"
      >
        <span className="text-xl">🇺🇸</span>
      </button>
    </div>
  );
}
