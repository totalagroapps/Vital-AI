import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { translations } from '../i18n/translations';
import { API_URL } from '../utils/apiUrl';
import {
  SUPPORTED_LANGUAGES, detectCountry, detectLanguage, isRtlLanguage, primaryLanguage,
  refineCountryFromGeolocation,
} from '../utils/locale';

export const LanguageContext = createContext();

const LANG_KEY = 'media_hub_lang';
const CACHE_PREFIX = 'media_hub_ui_';
const CACHE_MAX_AGE_MS = 24 * 3600 * 1000;
const POLL_MS = 4000;
const POLL_MAX = 45;

const readSaved = () => {
  try {
    const saved = primaryLanguage(localStorage.getItem(LANG_KEY));
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
};

const readCache = (lang) => {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_PREFIX + lang) || 'null');
    return raw && raw.strings ? raw : null;
  } catch {
    return null;
  }
};

export const LanguageProvider = ({ children }) => {
  // Idioma elegido a mano > idioma del sistema > idioma del país
  const [initial] = useState(() => {
    const country = detectCountry();
    const saved = readSaved();
    if (saved) return { language: saved, tag: saved, country };
    return { ...detectLanguage(country), country };
  });
  const [language, setLanguage] = useState(initial.language);
  const [tag, setTag] = useState(initial.tag);
  const [country, setCountry] = useState(initial.country);
  // Traducción generada con IA para idiomas sin diccionario manual
  const [dynamic, setDynamic] = useState(() => (readCache(initial.language)?.strings) || null);
  const [translating, setTranslating] = useState(false);
  const pollRef = useRef(null);

  // es/en tienen todas las cadenas; el resto (incluidos fr/ar, que tienen huecos) se completa con IA
  const isStatic = language === 'es' || language === 'en';

  // País real por geolocalización cuando el permiso ya fue concedido
  useEffect(() => {
    refineCountryFromGeolocation().then((c) => { if (c) setCountry(c); });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = tag || language;
      document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
    }
  }, [language, tag]);

  // Carga (y consulta periódica) de la traducción automática de la interfaz
  useEffect(() => {
    clearTimeout(pollRef.current);
    if (isStatic) { setDynamic(null); setTranslating(false); return undefined; }

    const cached = readCache(language);
    setDynamic(cached?.strings || null);
    if (cached && cached.complete && Date.now() - cached.ts < CACHE_MAX_AGE_MS) { setTranslating(false); return undefined; }

    let cancelled = false;
    let tries = 0;
    const load = async () => {
      if (cancelled) return;
      tries += 1;
      try {
        const res = await fetch(`${API_URL}/api/i18n/${language}`, { cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 202 && tries < POLL_MAX) {
          setTranslating(true);
          pollRef.current = setTimeout(load, POLL_MS);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.strings) {
            setDynamic(data.strings);
            try {
              localStorage.setItem(CACHE_PREFIX + language, JSON.stringify({ strings: data.strings, complete: !!data.complete, ts: Date.now() }));
            } catch { /* almacenamiento lleno */ }
          }
          if (data.pending && tries < POLL_MAX) {
            setTranslating(true);
            pollRef.current = setTimeout(load, POLL_MS);
            return;
          }
        }
      } catch { /* sin red: se muestra en inglés */ }
      if (!cancelled) setTranslating(false);
    };
    load();
    return () => { cancelled = true; clearTimeout(pollRef.current); };
  }, [language, isStatic]);

  const changeLanguage = useCallback((lang) => {
    const code = primaryLanguage(lang);
    if (!SUPPORTED_LANGUAGES.includes(code)) return;
    setLanguage(code);
    setTag(code);
    try { localStorage.setItem(LANG_KEY, code); } catch { /* sin almacenamiento */ }
  }, []);

  const t = useCallback((key, paramsOrDefault) => {
    const isDefaultString = typeof paramsOrDefault === 'string';
    const fallback = isDefaultString ? paramsOrDefault : key;
    // idioma elegido -> traducción automática -> inglés -> español (idioma de origen)
    let str = translations[language]?.[key] ?? dynamic?.[key] ?? translations.en?.[key] ?? translations.es?.[key] ?? fallback;

    if (!isDefaultString && paramsOrDefault && typeof paramsOrDefault === 'object' && typeof str === 'string') {
      if (Array.isArray(paramsOrDefault)) {
        paramsOrDefault.forEach((val, idx) => {
          str = str.split(`{${idx}}`).join(val !== undefined && val !== null ? String(val) : '');
        });
      } else {
        Object.keys(paramsOrDefault).forEach(k => {
          str = str.split(`{${k}}`).join(paramsOrDefault[k] !== undefined && paramsOrDefault[k] !== null ? String(paramsOrDefault[k]) : '');
        });
      }
    }
    return str;
  }, [language, dynamic]);

  // Etiqueta BCP-47 para Intl (fechas, números): idioma + país, p. ej. "pt-BR"
  const locale = useMemo(() => {
    const region = /-[A-Za-z]{2}\b/.test(tag || '') ? '' : (country ? `-${country}` : '');
    try {
      return Intl.getCanonicalLocales(`${tag || language}${region}`)[0];
    } catch {
      return language;
    }
  }, [tag, language, country]);

  const value = useMemo(
    () => ({ language, locale, country, changeLanguage, t, isRtl: isRtlLanguage(language), translating }),
    [language, locale, country, changeLanguage, t, translating],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
