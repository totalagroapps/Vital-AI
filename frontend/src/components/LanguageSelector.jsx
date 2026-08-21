import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 z-50">
      <button
        onClick={() => changeLanguage('es')}
        className={"px-2 py-1 rounded-md transition-colors font-bold text-sm " + (language === 'es' ? 'bg-cyan-100 shadow-sm border border-cyan-300 text-cyan-700' : 'bg-slate-100 opacity-50 hover:opacity-100 text-slate-600')}
        title="Español"
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={"px-2 py-1 rounded-md transition-colors font-bold text-sm " + (language === 'en' ? 'bg-cyan-100 shadow-sm border border-cyan-300 text-cyan-700' : 'bg-slate-100 opacity-50 hover:opacity-100 text-slate-600')}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        className={"px-2 py-1 rounded-md transition-colors font-bold text-sm " + (language === 'fr' ? 'bg-cyan-100 shadow-sm border border-cyan-300 text-cyan-700' : 'bg-slate-100 opacity-50 hover:opacity-100 text-slate-600')}
        title="Français"
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={"px-2 py-1 rounded-md transition-colors font-bold text-sm " + (language === 'ar' ? 'bg-cyan-100 shadow-sm border border-cyan-300 text-cyan-700' : 'bg-slate-100 opacity-50 hover:opacity-100 text-slate-600')}
        title="العربية"
      >
        AR
      </button>
    </div>
  );
}
