import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, ShieldCheck } from 'lucide-react';

export const CURRENT_APP_VERSION = '1.0.0';
// Servidor de Railway o respaldo en version.json
export const VERSION_CHECK_URL = 'https://vitalai.up.railway.app/api/version';
export const FALLBACK_APK_URL = 'https://vitalai.up.railway.app/download/mivor-latest.apk';

export function UpdateModal({ t, apiUrl }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      const candidates = [
        apiUrl ? `${apiUrl}/api/version` : null,
        VERSION_CHECK_URL,
        '/api/version',
        '/version.json'
      ].filter(Boolean);

      for (const url of candidates) {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) continue;
          const data = await response.json();
          if (data && data.version && isNewerVersion(data.version, CURRENT_APP_VERSION)) {
            if (isMounted) {
              setUpdateInfo(data);
              setIsVisible(true);
            }
            return;
          }
        } catch (err) {
          // ignore and continue
        }
      }
    }

    checkVersion();

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  function isNewerVersion(latest, current) {
    const latestParts = String(latest).split('.').map(Number);
    const currentParts = String(current).split('.').map(Number);
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }

  const handleUpdate = () => {
    const downloadUrl = updateInfo?.apkUrl || FALLBACK_APK_URL;
    try {
      window.open(downloadUrl, '_system') || (window.location.href = downloadUrl);
    } catch (e) {
      window.location.href = downloadUrl;
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {!updateInfo.forceUpdate && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {t('new_version_available') || '¡Nueva versión disponible!'}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 inline-block mt-0.5">
              v{updateInfo.version}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {updateInfo.notes || t('new_version_desc') || 'Hay una actualización de MIVOR.ai lista para instalar con nuevas mejoras.'}
        </p>

        <div className="flex items-center gap-2 text-xs text-teal-400 mb-6 bg-teal-950/40 p-3 rounded-xl border border-teal-800/40">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Actualización oficial y segura de MIVOR.ai</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleUpdate}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 transition"
          >
            <Download size={18} />
            {t('update_now') || 'ACTUALIZAR AHORA'}
          </button>

          {!updateInfo.forceUpdate && (
            <button
              onClick={() => setIsVisible(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white text-center transition"
            >
              {t('remind_me_later') || 'Recordar más tarde'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
