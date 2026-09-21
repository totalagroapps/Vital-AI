import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown, Search, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES, STATIC_LANGUAGES, languageDisplayName } from '../utils/locale';

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage, translating, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);

  // Primero los idiomas con traducción manual, después el resto por orden alfabético
  const languages = useMemo(() => {
    const all = SUPPORTED_LANGUAGES.map((code) => ({ code, label: languageDisplayName(code) }));
    const main = STATIC_LANGUAGES.map((code) => all.find((l) => l.code === code)).filter(Boolean);
    const rest = all.filter((l) => !STATIC_LANGUAGES.includes(l.code)).sort((a, b) => a.label.localeCompare(b.label));
    return [...main, ...rest];
  }, []);

  const q = query.trim().toLowerCase();
  const visible = q
    ? languages.filter((l) => l.label.toLowerCase().includes(q) || l.code.includes(q))
    : languages;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (!isOpen) setQuery(''); }, [isOpen]);

  const containerClass = variant === 'floating'
    ? "absolute top-6 right-6 z-50"
    : "relative z-40";

  const buttonClass = variant === 'pill'
    ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs text-xs sm:text-sm font-medium cursor-pointer"
    : "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium cursor-pointer";

  return (
    <div className={containerClass} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        title={t('change_language', 'Change language')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {translating ? <Loader2 className="w-4 h-4 text-brand animate-spin" /> : <Globe className="w-4 h-4 text-brand" />}
        <span className="uppercase">{language}</span>
        <ChevronDown className={"w-3 h-3 text-slate-400 transition-transform " + (isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-3.5 h-3.5 absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_language', 'Search language…')}
              className="w-full ps-8 pe-2 py-1.5 text-sm rounded-md bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand text-slate-700"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {visible.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">—</div>
            )}
            {visible.map((lang) => (
              <button
                key={lang.code}
                role="option"
                aria-selected={language === lang.code}
                onClick={() => { changeLanguage(lang.code); setIsOpen(false); }}
                className={"w-full text-start px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2 " + (language === lang.code ? 'bg-semantic-info-bg text-brand font-bold' : 'text-slate-600 hover:bg-slate-50')}
              >
                <span className="truncate">{lang.label}</span>
                <span className="text-[10px] uppercase text-slate-400 shrink-0">{lang.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
