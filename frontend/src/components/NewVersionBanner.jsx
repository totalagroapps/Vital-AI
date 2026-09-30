import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';

// Una pestaña web abierta antes de un despliegue sigue ejecutando el bundle viejo (SPA en memoria).
// Comparamos el bundle cargado con el que sirve ahora el servidor y, si cambió, ofrecemos recargar.
// En la app Android los assets van dentro del APK: de eso se encarga UpdateModal.
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const BUNDLE_RE = /\/assets\/index-[\w-]+\.js/;

const loadedBundle = () => {
  const script = [...document.querySelectorAll('script[src]')].find(s => BUNDLE_RE.test(s.src));
  return script ? script.src.match(BUNDLE_RE)[0] : null;
};

export default function NewVersionBanner() {
  const { t } = useLanguage();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const current = loadedBundle();
    if (!current || Capacitor.isNativePlatform()) return undefined; // dev server o app nativa

    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/', { cache: 'no-store' });
        if (!res.ok) return;
        const live = (await res.text()).match(BUNDLE_RE)?.[0];
        if (live && live !== current) {
          setAvailable(true);
          stopped = true;
        }
      } catch { /* sin conexión: se reintenta en la siguiente comprobación */ }
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', check);
    // Un chunk del despliegue anterior ya no existe en el servidor: la única salida es recargar
    const onPreloadError = () => setAvailable(true);
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('vite:preloadError', onPreloadError);
    };
  }, []);

  if (!available) return null;

  return (
    <div role="status" className="fixed inset-x-0 bottom-20 md:bottom-6 z-[9999] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-3 max-w-md w-full">
        <RefreshCw size={18} className="shrink-0 text-sky-300" />
        <span className="text-xs font-semibold flex-1">{t('newversion_disponible')}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 bg-[#005dff] hover:bg-[#0052e0] text-white text-xs font-bold px-3 py-1.5 rounded-xl"
        >
          {t('newversion_actualizar')}
        </button>
      </div>
    </div>
  );
}
