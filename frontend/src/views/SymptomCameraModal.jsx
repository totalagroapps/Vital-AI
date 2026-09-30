import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, FileImage, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SymptomCameraModal({ isOpen, onClose, apiUrl, token, onUploadSuccess }) {
  const { t } = useLanguage();
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
    formData.append('patient_id', 'me');

    try {
      // Usamos el endpoint existente que ya tiene GPT-4o-mini Vision integrado
      const res = await fetch(`${apiUrl}/api/documents/upload_v2?patient_id=me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      // data.results[0] tendra el analisis
      setResult(data.results?.[0] || data);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      alert('Error al analizar la imagen.');
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">An\u00e1lisis Visual (IA)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sube una foto de tu s\u00edntoma cut\u00e1neo</p>
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
                  Toma una foto clara y con buena iluminaci\u00f3n. La Inteligencia Artificial analizar\u00e1 la imagen y la guardar\u00e1 en tu expediente para que tu m\u00e9dico pueda evaluarla. <b>Esto no sustituye un diagn\u00f3stico m\u00e9dico profesional.</b>
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
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Tocar para tomar foto o subir archivo</span>
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
                    {loading ? "Analizando imagen con IA..." : "Analizar S\u00edntoma"}
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
                <h3 className="text-lg font-black text-slate-800 dark:text-white">An\u00e1lisis Completado</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Guardado en tu expediente m\u00e9dico.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resumen de la IA</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {result?.analysis_result?.resumen || result?.summary || result?.extracted_text || "Imagen analizada exitosamente."}
                </p>
              </div>

              {result?.analysis_result?.gravedad && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nivel de Atenci\u00f3n Sugerido</h4>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                    result.analysis_result.gravedad.toLowerCase() === 'alta' ? 'bg-red-100 text-red-700' :
                    result.analysis_result.gravedad.toLowerCase() === 'media' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {result.analysis_result.gravedad}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-sm font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
