import { useLanguage } from '../contexts/LanguageContext';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { CALLING_CODES } from '../data/callingCodes';

// Phone dial code picker, searchable by country name or code. Only the
// dial code (e.g. "+34") is stored in the form.
const PhonePrefixSelect = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 0);
  }, [isOpen]);

  const current = CALLING_CODES.find((c) => c.dial === value);
  const CurrentFlag = current ? CountryFlags[current.country] : null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? CALLING_CODES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.country.toLowerCase() === q
      )
    : CALLING_CODES;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 h-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
      >
        {CurrentFlag ? <CurrentFlag className="w-5 h-3.5 rounded-[2px] shrink-0" /> : <span className="w-5 h-3.5 shrink-0" />}
        <span className="font-medium">{value || '+__'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('phoneprefixselect_pais_o_prefijo')}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-2 text-xs text-brand-dark focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((c) => {
              const Flag = CountryFlags[c.country];
              return (
                <button
                  key={`${c.country}-${c.dial}`}
                  type="button"
                  onClick={() => { onChange(c.dial); setIsOpen(false); setQuery(''); }}
                  className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs transition-colors ${
                    c.dial === value ? 'bg-semantic-info-bg text-brand font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {Flag && <Flag className="w-5 h-3.5 rounded-[2px] shrink-0" />}
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 shrink-0">{c.dial}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">{t('profile_no_results')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhonePrefixSelect;
