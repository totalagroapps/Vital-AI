import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerClass = variant === 'floating' 
    ? "absolute top-6 right-6 z-50" 
    : "relative z-40";

  return (
    <div className={containerClass} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
        title="Cambiar idioma"
      >
        <Globe className="w-4 h-4 text-brand" />
        <span className="uppercase">{language}</span>
        <ChevronDown className={"w-3 h-3 text-slate-400 transition-transform " + (isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden py-1 animate-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setIsOpen(false); }}
              className={"w-full text-left px-4 py-2 text-sm transition-colors " + (language === lang.code ? 'bg-semantic-info-bg text-brand font-bold' : 'text-slate-600 hover:bg-slate-50')}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
