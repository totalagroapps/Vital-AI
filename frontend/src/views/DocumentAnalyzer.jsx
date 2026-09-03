import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, CloudUpload, FileText, ImageIcon, Activity, Beaker, File,
  Clock, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, Pill,
  Stethoscope, Lightbulb, MessageSquare, RotateCcw, Shield, Loader2
} from 'lucide-react';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/bmp', 'image/gif'];

const SeverityBadge = ({ sev }) => {
  if (sev === 'rojo') return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2">
      <AlertCircle size={16} /> <span className="text-xs font-bold">Requiere atención urgente</span>
    </div>
  );
  if (sev === 'amarillo') return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl px-3 py-2">
      <AlertTriangle size={16} /> <span className="text-xs font-bold">Consulta a tu médico pronto</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-xl px-3 py-2">
      <CheckCircle2 size={16} /> <span className="text-xs font-bold">Documento normal / rutina</span>
    </div>
  );
};

const DocumentAnalyzer = ({ onBack, apiUrl, authHeaders, onAskFollowUp }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'results'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/me/documents`, { headers: authHeaders });
        if (res.ok) setDocuments(await res.json());
      } catch (e) { /* silent */ }
      finally { setLoadingDocs(false); }
    };
    if (apiUrl && authHeaders) fetchDocs();
    else setLoadingDocs(false);
  }, [apiUrl, authHeaders]);

  const uploadAndAnalyze = async (file) => {
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|bmp|gif)$/i)) {
      setError(`Formato no soportado: ${file.name}. Usa PDF, JPG o PNG.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) { setError('El archivo es demasiado grande. Límite: 50 MB.'); return; }

    setStep('analyzing');
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Error del servidor (${res.status})`);
      }

      const data = await res.json();

      if (!data.extracted_text || data.extracted_text.trim().length < 10) {
        throw new Error('No se pudo extraer texto del documento. Asegúrate de que sea legible.');
      }

      setAnalysisResult({ ...data, filename: file.name });
      setStep('results');

      // Refresh history list
      try {
        const docsRes = await fetch(`${apiUrl}/api/me/documents`, { headers: authHeaders });
        if (docsRes.ok) setDocuments(await docsRes.json());
      } catch (e) { /* silent */ }

    } catch (e) {
      setError(e.message || 'Ocurrió un error inesperado.');
      setStep('upload');
    }
  };

  const handleFileChange = (e) => { if (e.target.files?.[0]) uploadAndAnalyze(e.target.files[0]); };
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); uploadAndAnalyze(e.dataTransfer.files[0]); }, []);

  const handleHistoryClick = (doc) => {
    if (doc.analysis_result) {
      try {
        const parsed = JSON.parse(doc.analysis_result);
        setAnalysisResult({
          ...doc,
          summary: parsed.resumen || parsed.summary,
          hallazgos: parsed.hallazgos || [],
          medicamentos: parsed.medicamentos || [],
          diagnosticos: parsed.diagnosticos || [],
          severidad: parsed.severidad || 'verde',
          recomendacion: parsed.recomendacion || '',
          is_image: doc.document_type === 'medical_image'
        });
        setStep('results');
        return;
      } catch (e) {
        console.error("Failed to parse analysis_result", e);
      }
    }
    // Fallback if no detailed report exists for old docs
    onAskFollowUp(doc.extracted_text, doc.filename);
  };

  const docTypeIcon = (type) => type === 'medical_image'
    ? <ImageIcon size={18} className="text-blue-500" />
    : <FileText size={18} className="text-brand-green" />;

  return (
    <div className="min-h-screen bg-base font-sans relative overflow-x-hidden pb-28">

      {/* Background */}
      {step !== 'results' && (
        <div className="absolute top-0 right-0 w-full h-[400px] z-0 overflow-hidden pointer-events-none">
          <img src="/images/abstract_woman_bg.jpg" alt="" className="absolute top-0 right-0 w-[85%] md:w-[60%] h-full object-cover opacity-80"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
        </div>
      )}

      <div className="relative z-10 px-6 pt-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={step === 'results' ? () => setStep('upload') : onBack}
            className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'upload' && 'Analiza tus pruebas médicas'}
            {step === 'analyzing' && 'Analizando documento…'}
            {step === 'results' && 'Resultados del análisis'}
          </h2>
          <div className="w-10" />
        </div>

        {/* ─── STEP: UPLOAD ─── */}
        {step === 'upload' && (
          <>
            {/* Hero */}
            <div className="mb-6">
              <h2 className="text-[30px] leading-tight font-bold text-gray-900 mb-3 max-w-[80%]">
                Sube tus pruebas <br /> y obtén respuestas <br />
                <span className="text-brand-green">claras y comprensibles</span>
              </h2>
              <p className="text-sm text-gray-500 max-w-[75%]">
                VitalAI extrae, interpreta y te explica recetas, informes, analíticas y más — sin salir de esta pantalla.
              </p>
            </div>

            {/* Security */}
            <div className="glass-card rounded-2xl p-4 flex gap-3 items-center mb-6 max-w-sm">
              <div className="bg-brand-green/10 p-2 rounded-xl text-brand-green"><Shield size={18} /></div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Tu información está protegida</p>
                <p className="text-[10px] text-gray-500">Privacidad y seguridad de nivel hospitalario.</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Drop Zone */}
            <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              className={`bg-white rounded-[28px] p-6 shadow-soft border-2 border-dashed mb-6 transition-all flex flex-col items-center text-center
                ${isDragging ? 'border-brand-green bg-brand-green/5 scale-[1.01]' : 'border-gray-200'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors
                ${isDragging ? 'bg-brand-green text-white' : 'bg-brand-green/10 text-brand-green'}`}>
                <CloudUpload size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {isDragging ? '¡Suelta aquí!' : 'Sube tu documento o imagen'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">Puedes subir una foto (.jpg, .png) o un PDF</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={ACCEPTED_TYPES} />
              
              <div className="flex gap-3 w-full mb-3">
                <button onClick={() => fileInputRef.current.click()}
                  className="flex-1 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-brand-green/20">
                  <ImageIcon size={18} /> Subir Imagen
                </button>
                <button onClick={() => fileInputRef.current.click()}
                  className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-glow">
                  <FileText size={18} /> Subir PDF
                </button>
              </div>
              <p className="text-[11px] text-gray-400">PDF, JPG, PNG, WEBP, HEIC · Máx. 50 MB</p>
            </div>

            {/* Format chips */}
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar mb-8">
              {[
                { icon: <FileText size={20} className="text-brand-green" />, l: 'Informes', s: 'PDF' },
                { icon: <ImageIcon size={20} className="text-blue-500" />, l: 'Radiografías', s: 'JPG, PNG' },
                { icon: <Activity size={20} className="text-purple-500" />, l: 'Recetas', s: 'PDF, Foto' },
                { icon: <Beaker size={20} className="text-amber-500" />, l: 'Analíticas', s: 'PDF' },
                { icon: <File size={20} className="text-gray-500" />, l: 'Incapacidades', s: 'PDF, Foto' },
              ].map(item => (
                <div key={item.l} className="min-w-[96px] bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center text-center flex-shrink-0 gap-1">
                  {item.icon}
                  <span className="text-[11px] font-bold text-gray-900">{item.l}</span>
                  <span className="text-[9px] text-gray-400">{item.s}</span>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Análisis anteriores</h3>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loadingDocs ? (
                  <div className="p-5 text-center text-xs text-gray-400">Cargando historial…</div>
                ) : documents.length === 0 ? (
                  <div className="p-8 flex flex-col items-center gap-2 text-center">
                    <CloudUpload size={28} className="text-gray-200" />
                    <p className="text-sm font-semibold text-gray-400">Aún no hay análisis</p>
                    <p className="text-xs text-gray-400">Sube tu primer documento arriba.</p>
                  </div>
                ) : documents.map((doc, idx) => (
                  <div 
                    key={doc.id} 
                    onClick={() => handleHistoryClick(doc)}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${idx < documents.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {docTypeIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{doc.filename || 'Documento'}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={9} />
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">Analizado</div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── STEP: ANALYZING ─── */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center">
                <Loader2 size={40} className="text-brand-green animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-purple rounded-full flex items-center justify-center">
                <Stethoscope size={16} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">VitalAI está leyendo tu documento</h3>
              <p className="text-sm text-gray-500 max-w-xs">Extrayendo texto, identificando medicamentos y generando tu resumen médico personalizado…</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {['Extrayendo texto con OCR…', 'Identificando hallazgos clínicos…', 'Generando resumen para ti…'].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400 bg-white rounded-xl px-4 py-2 border border-gray-100">
                  <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP: RESULTS ─── */}
        {step === 'results' && analysisResult && (
          <div className="flex flex-col gap-5">

            {/* File name */}
            <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green flex-shrink-0">
                {analysisResult.is_image ? <ImageIcon size={20} /> : <FileText size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{analysisResult.filename}</p>
                <p className="text-[10px] text-gray-400">{analysisResult.is_image ? 'Imagen médica' : 'Informe / Documento PDF'}</p>
              </div>
            </div>

            {/* Severity */}
            <SeverityBadge sev={analysisResult.severidad} />

            {/* Summary */}
            {analysisResult.summary && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stethoscope size={13} /> Resumen
                </h3>
                <p className="text-sm text-gray-800 leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {/* Diagnostics */}
            {analysisResult.diagnosticos?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity size={13} /> Diagnósticos / Hallazgos
                </h3>
                <div className="flex flex-col gap-2">
                  {analysisResult.diagnosticos.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-1.5 flex-shrink-0" />{d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {analysisResult.medicamentos?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Pill size={13} /> Medicamentos recetados
                </h3>
                <div className="flex flex-col gap-2">
                  {analysisResult.medicamentos.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />{m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other findings */}
            {analysisResult.hallazgos?.filter(h => !analysisResult.medicamentos?.includes(h)).length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Otros hallazgos
                </h3>
                <div className="flex flex-col gap-2">
                  {analysisResult.hallazgos.filter(h => !analysisResult.medicamentos?.includes(h)).map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />{h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {analysisResult.recomendacion && (
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb size={13} /> Recomendación
                </h3>
                <p className="text-sm text-gray-800">{analysisResult.recomendacion}</p>
              </div>
            )}

            {/* PHI warning */}
            {analysisResult.phi_detected && (
              <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100 flex gap-2 items-center">
                <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                <p className="text-[11px] text-orange-700">Se detectaron datos personales en el documento. Han sido anonimizados antes de procesarse.</p>
              </div>
            )}

            {/* CTA Buttons */}
            <button
              onClick={() => onAskFollowUp(analysisResult.extracted_text, analysisResult.filename)}
              className="w-full bg-brand-purple text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:bg-brand-purple/90 transition-colors"
            >
              <MessageSquare size={20} /> Preguntar más sobre este documento
            </button>

            <button
              onClick={() => { setStep('upload'); setAnalysisResult(null); }}
              className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} /> Analizar otro documento
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
