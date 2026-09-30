import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, FileImage, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// /api/documents/upload devuelve 'severidad' como verde / amarillo / rojo
const SEVERITY_STYLES = {
  rojo: { className: 'bg-red-100 text-red-700', labelKey: 'symptomcamera_nivel_rojo' },
  amarillo: { className: 'bg-amber-100 text-amber-700', labelKey: 'symptomcamera_nivel_amarillo' },
  verde: { className: 'bg-emerald-100 text-emerald-700', labelKey: 'symptomcamera_nivel_verde' },
};

export default function SymptomCameraModal({ isOpen, onClose, apiUrl, authHeaders, onUploadSuccess }) {
  const { t, language } = useLanguage();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('files', file);
    if (language) formData.append('language', language);

    try {
      // Mismo endpoint de análisis que Mis documentos (GPT-4o-mini Vision). authHeaders lleva la
      // sesión y, en Modo Cuidador, el perfil del familiar (X-Target-Patient-Id).
      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // data.results[0] tendra el analisis
      setResult(data.results?.[0] || data);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      alert(t('symptomcamera_error_analisis'));
    } finally {
      setLoading(false);
    }
  };

  const severity = SEVERITY_STYLES[(result?.severidad || '').toLowerCase()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Camera size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">{t('symptomcamera_titulo')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('symptomcamera_subtitulo')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {!result ? (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
                <ShieldCheck className="shrink-0 w-5 h-5" />
                <p className="text-xs font-medium leading-relaxed">
                  {t('symptomcamera_instrucciones')} <b>{t('symptomcamera_no_sustituye')}</b>
                </p>
              </div>

              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-indigo-50/30 dark:bg-slate-800/50 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileImage size={28} className="text-indigo-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">{t('symptomcamera_tocar_para_foto')}</span>
                  <span className="text-xs text-slate-500 font-medium">JPG, PNG o WEBP</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black flex items-center justify-center">
                    <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {loading ? t('symptomcamera_analizando') : t('symptomcamera_analizar')}
                  </button>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">{t('symptomcamera_completado')}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{t('symptomcamera_guardado')}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('symptomcamera_resumen')}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {result?.summary || result?.extracted_text || t('symptomcamera_analizada_ok')}
                </p>
              </div>

              {severity && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('symptomcamera_nivel_atencion')}</h4>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${severity.className}`}>
                    {t(severity.labelKey)}
                  </div>
                </div>
              )}

              {result?.recomendacion && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{result.recomendacion}</p>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">ℹ️ {t('symptomcamera_disclaimer')}</p>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-sm font-bold transition-all"
              >
                {t('symptomcamera_cerrar')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
