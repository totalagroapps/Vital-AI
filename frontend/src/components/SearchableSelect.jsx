import { useLanguage } from '../contexts/LanguageContext';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

// Searchable dropdown. `multiple`: value/onChange become an array; picking
// an item doesn't close the menu (closes on outside click instead).
const SearchableSelect = ({
  items, value, onChange, placeholder, renderLabel, renderIcon, clearLabel, className = '', multiple = false,
}) => {
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

  const selectedIds = multiple ? (value || []) : null;
  const selected = multiple ? null : items.find((i) => i.id === value);
  const isSelected = (item) => (multiple ? selectedIds.includes(item.id) : item.id === value);

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => renderLabel(i).toLowerCase().includes(q)) : items;

  const pick = (item) => {
    if (multiple) {
      onChange(isSelected(item) ? selectedIds.filter((id) => id !== item.id) : [...selectedIds, item.id]);
      return;
    }
    onChange(item.id);
    setIsOpen(false);
    setQuery('');
  };

  const clear = () => {
    if (multiple) { onChange([]); return; }
    onChange(null);
    setIsOpen(false);
    setQuery('');
  };

  const buttonLabel = multiple
    ? (selectedIds.length ? selectedIds.map((id) => renderLabel(items.find((i) => i.id === id))).filter(Boolean).join(', ') : placeholder)
    : (selected ? renderLabel(selected) : placeholder);
  const hasValue = multiple ? selectedIds.length > 0 : !!selected;

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
      >
        {!multiple && selected && renderIcon ? renderIcon(selected) : null}
        <span className={`flex-1 text-left truncate ${hasValue ? 'text-brand-dark' : 'text-gray-400'}`}>
          {buttonLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden animate-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-gray-100 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-2 text-xs text-brand-dark focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {clearLabel && (
              <button
                type="button"
                onClick={clear}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                  !hasValue ? 'text-brand-blue font-bold bg-brand-blue/5' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {clearLabel}
              </button>
            )}
            {filtered.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => pick(item)}
                className={`w-full flex items-center gap-2 text-left px-3.5 py-2 text-sm transition-colors ${
                  isSelected(item) ? 'text-brand-blue font-bold bg-brand-blue/5' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {multiple && (
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected(item) ? 'bg-brand-blue border-brand-blue' : 'border-gray-300'
                  }`}>
                    {isSelected(item) && <Check className="w-3 h-3 text-white" />}
                  </span>
                )}
                {renderIcon ? renderIcon(item) : null}
                <span className="truncate">{renderLabel(item)}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">{t('profile_no_results')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
