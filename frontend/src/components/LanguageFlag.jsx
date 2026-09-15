import React from 'react';
import { Globe } from 'lucide-react';
import * as CountryFlags from 'country-flag-icons/react/3x2';

// Maps ISO 639-1 language `code` (as returned by GET /api/languages) to an
// ISO 3166-1 country code (used by `country-flag-icons`) for a reference
// flag. Not 100% accurate for languages spoken in multiple countries.
// Catalan has no flag of its own in the standard, so it maps to Spain.
const LANGUAGE_COUNTRY = {
  es: 'ES', en: 'GB', fr: 'FR', de: 'DE', it: 'IT', pt: 'PT',
  ca: 'ES', ar: 'SA', zh: 'CN', ru: 'RU', ja: 'JP', ko: 'KR',
  nl: 'NL', pl: 'PL', ro: 'RO', bg: 'BG', el: 'GR', tr: 'TR',
  uk: 'UA', hi: 'IN',
};

// Unmapped language (new catalog entry) falls back to a generic globe
// instead of breaking or leaving the chip iconless.
const LanguageFlag = ({ code, className = 'w-4 h-3 rounded-[2px] shrink-0' }) => {
  const country = LANGUAGE_COUNTRY[code];
  const Flag = country && CountryFlags[country];
  if (!Flag) return <Globe className={`${className} text-current opacity-60`} />;
  return <Flag className={className} title={country} />;
};

export default LanguageFlag;
