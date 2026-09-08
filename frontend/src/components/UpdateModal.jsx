import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

export const CURRENT_APP_VERSION = '1.0.1';
// Servidor de Railway o respaldo en version.json
export const VERSION_CHECK_URL = 'https://vitalai.up.railway.app/api/version';
export const FALLBACK_APK_URL = 'https://vitalai.up.railway.app/download/mivor-latest.apk';

export function UpdateModal({ t, apiUrl }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Estados para descarga directa in-app
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'downloading' | 'completed' | 'error'
  const [progressPercent, setProgressPercent] = useState(0);
  const [bytesInfo, setBytesInfo] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Configurar listeners globales para el bridge nativo de Android
    window.onApkDownloadProgress = (percent, currentBytes, totalBytes) => {
      setDownloadState('downloading');
      setProgressPercent(percent >= 0 ? percent : 0);
      setBytesInfo({ current: currentBytes, total: totalBytes });
    };

    window.onApkDownloadSuccess = () => {
      setDownloadState('completed');
      setProgressPercent(100);
    };

    window.onApkDownloadError = (err) => {
      setDownloadState('error');
      setErrorMessage(err || 'Error al descargar la actualización.');
    };

    return () => {
      delete window.onApkDownloadProgress;
      delete window.onApkDownloadSuccess;
      delete window.onApkDownloadError;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkVersion() {
      // Obtener versión instalada desde Capacitor (Android) o constante de respaldo (Web)
      let installedVersion = CURRENT_APP_VERSION;
      try {
        const info = await CapApp.getInfo();
        if (info && info.version) {
          installedVersion = info.version;
        }
      } catch (e) {
        // En entorno web se usa CURRENT_APP_VERSION
      }

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
          if (data && data.version && isNewerVersion(data.version, installedVersion)) {
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
    if (!latest || !current) return false;
    const cleanLatest = String(latest).replace(/^v/i, '').trim();
    const cleanCurrent = String(current).replace(/^v/i, '').trim();

    if (cleanLatest === cleanCurrent) return false;

    const latestParts = cleanLatest.split('.').map(Number);
    const currentParts = cleanCurrent.split('.').map(Number);
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = isNaN(latestParts[i]) ? 0 : latestParts[i];
      const c = isNaN(currentParts[i]) ? 0 : currentParts[i];
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }

  const handleUpdate = () => {
    const downloadUrl = updateInfo?.apkUrl || FALLBACK_APK_URL;

    // Si el bridge nativo de Android está activo, descargar e instalar DIRECTAMENTE in-app
    if (window.AndroidUpdater && typeof window.AndroidUpdater.downloadAndInstall === 'function') {
      setDownloadState('downloading');
      setProgressPercent(0);
      setErrorMessage('');
      window.AndroidUpdater.downloadAndInstall(downloadUrl);
      return;
    }

    // Respaldo web: descarga directa de archivo
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'mivor-latest.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.location.href = downloadUrl;
    }
  };

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {!updateInfo.forceUpdate && downloadState !== 'downloading' && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
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

        <div className="flex items-center gap-2 text-xs text-teal-400 mb-5 bg-teal-950/40 p-3 rounded-xl border border-teal-800/40">
          <ShieldCheck size={16} className="shrink-0" />
          <span>Actualización oficial in-app de MIVOR.ai</span>
        </div>

        {/* UI de Descarga In-App con Barra de Progreso */}
        {downloadState === 'downloading' && (
          <div className="mb-4 bg-slate-800/80 border border-teal-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-teal-400" />
                Descargando en la app...
              </span>
              <span className="font-bold text-teal-300">{progressPercent}%</span>
            </div>
            
            {/* Barra de progreso animada */}
            <div className="w-full bg-slate-700/80 rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all duration-200 shadow-sm shadow-teal-400/50"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span>
                {bytesInfo.total > 0 
                  ? `${(bytesInfo.current / (1024 * 1024)).toFixed(1)} MB / ${(bytesInfo.total / (1024 * 1024)).toFixed(1)} MB` 
                  : 'Preparando descarga...'}
              </span>
              <span className="text-[10px] text-teal-300/80">Sin salir de la app</span>
            </div>
          </div>
        )}

        {/* Estado Completado */}
        {downloadState === 'completed' && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
            <div className="flex-1">
              <p className="font-bold">¡Descarga completa!</p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                Abriendo el instalador de Android... Confirma la instalación.
              </p>
            </div>
          </div>
        )}

        {/* Estado Error */}
        {downloadState === 'error' && (
          <div className="mb-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">No se pudo completar la descarga</p>
              <p className="text-[11px] text-rose-200/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col gap-2">
          {downloadState !== 'downloading' && (
            <button
              onClick={handleUpdate}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 transition"
            >
              <Download size={18} />
              {downloadState === 'completed' 
                ? 'REABRIR INSTALADOR' 
                : downloadState === 'error' 
                ? 'REINTENTAR DESCARGA' 
                : (t('update_now') || 'ACTUALIZAR AHORA')}
            </button>
          )}

          {!updateInfo.forceUpdate && downloadState !== 'downloading' && (
            <button
              onClick={() => setIsVisible(false)}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white text-center transition"
            >
              {t('remind_me_later') || 'Recordar más tarde'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
