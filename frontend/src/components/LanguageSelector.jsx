import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'es' ? 'bg-indigo-500/20 border border-indigo-400' : 'opacity-50 hover:opacity-100'
        }`}
        title="Español"
      >
        <span className="text-xl">🇪🇸</span>
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === 'en' ? 'bg-indigo-500/20 border border-indigo-400' : 'opacity-50 hover:opacity-100'
        }`}
        title="English"
      >
        <span className="text-xl">🇺🇸</span>
      </button>
    </div>
  );
}
