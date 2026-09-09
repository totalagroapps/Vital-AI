import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, CloudUpload, FileText, ImageIcon, Activity, Beaker, File,
  Clock, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, Pill,
  Stethoscope, Lightbulb, MessageSquare, RotateCcw, Shield, Loader2,
  FileDown, Download, TrendingUp, TrendingDown, Minus, HelpCircle, Copy, Check, Share2, BarChart3,
  Sparkles, UserCheck, MapPin, Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/bmp', 'image/gif'];

const BiomarkerRangeMeter = ({ bm }) => {
  const val = parseFloat(bm.valor);
  const isNum = !isNaN(val);
  const status = (bm.estado || 'normal').toLowerCase();

  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} /> Normal
    </span>
  );
  if (status === 'elevado') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <TrendingUp size={11} /> Elevado
      </span>
    );
  } else if (status === 'bajo') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <TrendingDown size={11} /> Bajo
      </span>
    );
  }

  let minRef = parseFloat(bm.min_referencia);
  let maxRef = parseFloat(bm.max_referencia);
  if (isNaN(minRef) || isNaN(maxRef)) {
    const rangeStr = bm.rango_referencia || '';
    const match = rangeStr.match(/([\d\.,]+)\s*[-–]\s*([\d\.,]+)/);
    if (match) {
      minRef = parseFloat(match[1].replace(',', '.'));
      maxRef = parseFloat(match[2].replace(',', '.'));
    } else {
      const lessMatch = rangeStr.match(/[<\u2264]\s*([\d\.,]+)/);
      if (lessMatch) {
        maxRef = parseFloat(lessMatch[1].replace(',', '.'));
        minRef = 0;
      }
    }
  }

  let percent = 50;
  if (isNum && !isNaN(minRef) && !isNaN(maxRef) && maxRef > minRef) {
    const span = maxRef - minRef;
    const lower = minRef - span * 0.35;
    const upper = maxRef + span * 0.35;
    percent = Math.min(Math.max(((val - lower) / (upper - lower)) * 100, 6), 94);
  } else if (status === 'elevado') {
    percent = 84;
  } else if (status === 'bajo') {
    percent = 16;
  }

  return (
    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">{bm.parametro}</h4>
          <p className="text-[10px] text-slate-500">Ref: {bm.rango_referencia || 'No especificado'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-black text-slate-900">{bm.valor} <span className="text-[10px] font-normal text-slate-500">{bm.unidad}</span></span>
          {statusBadge}
        </div>
      </div>

      <div className="relative pt-2 pb-1">
        <div className="h-2 w-full rounded-full bg-slate-200 flex overflow-hidden">
          <div className="w-1/4 bg-blue-300" title="Bajo" />
          <div className="w-1/2 bg-emerald-400" title="Normal" />
          <div className="w-1/4 bg-rose-400" title="Elevado" />
        </div>
        <div
          className="absolute top-0.5 -ml-2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${percent}%` }}
        >
          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
            status === 'elevado' ? 'bg-red-600' : status === 'bajo' ? 'bg-blue-600' : 'bg-emerald-600'
          }`} />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-medium px-0.5 mt-1">
          <span>Bajo</span>
          <span className="text-emerald-700 font-semibold">Rango Óptimo</span>
          <span>Elevado</span>
        </div>
      </div>
    </div>
  );
};

const SeverityBadge = ({ sev }) => {
  const { t } = useLanguage();
  if (sev === 'rojo') return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2">
      <AlertCircle size={16} /> <span className="text-xs font-bold">{t("requires_urgent_attention")}</span>
    </div>
  );
  if (sev === 'amarillo') return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl px-3 py-2">
      <AlertTriangle size={16} /> <span className="text-xs font-bold">{t("consult_your_doctor_soon")}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 rounded-xl px-3 py-2">
      <CheckCircle2 size={16} /> <span className="text-xs font-bold">{t("normal_document_routine")}</span>
    </div>
  );
};

const DocumentAnalyzer = ({ onBack, apiUrl, authHeaders, onAskFollowUp, onOpenDoctorDirectory }) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'results'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

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
      setError(t("unsupported_format", { fileName: file.name }));
      return;
    }
    if (file.size > 50 * 1024 * 1024) { setError(t("file_too_large")); return; }

    setStep('analyzing');
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (language) formData.append('language', language);

      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || t("server_error", { status: res.status }));
      }

      const data = await res.json();

      if (!data.extracted_text || data.extracted_text.trim().length < 10) {
        throw new Error(t("text_extraction_failed"));
      }

      setAnalysisResult({ ...data, filename: file.name });
      setStep('results');

      // Refresh history list
      try {
        const docsRes = await fetch(`${apiUrl}/api/me/documents`, { headers: authHeaders });
        if (docsRes.ok) setDocuments(await docsRes.json());
      } catch (e) { /* silent */ }

    } catch (e) {
      setError(e.message || t("unexpected_error"));
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
          id: doc.id,
          filename: doc.filename,
          summary: parsed.resumen || parsed.summary || '',
          hallazgos: parsed.hallazgos || [],
          medicamentos: parsed.medicamentos || [],
          diagnosticos: parsed.diagnosticos || [],
          biomarcadores: parsed.biomarcadores || [],
          comparativa_historica: parsed.comparativa_historica || [],
          preguntas_medico: parsed.preguntas_medico || [],
          smart_referral: parsed.smart_referral || null,
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

  const generateClientSidePdf = (data) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = 50;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 118, 110);
      doc.text('MIVOR.ai - INFORME CLÍNICO INTELIGENTE', margin, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} | Documento: ${data.filename || 'Estudio Clínico'}`, margin, y);
      y += 20;

      doc.setDrawColor(15, 118, 110);
      doc.setLineWidth(1.5);
      doc.line(margin, y, 555, y);
      y += 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. RESUMEN CLÍNICO', margin, y);
      y += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const summaryText = data.summary || 'Estudio procesado correctamente.';
      const splitSummary = doc.splitTextToSize(summaryText, 515);
      doc.text(splitSummary, margin, y);
      y += splitSummary.length * 13 + 15;

      if (data.biomarcadores?.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('2. BIOMARCADORES Y PARÁMETROS DE LABORATORIO', margin, y);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        data.biomarcadores.forEach((bm) => {
          if (y > 750) { doc.addPage(); y = 50; }
          doc.text(`• ${bm.parametro}: ${bm.valor} ${bm.unidad || ''} (Ref: ${bm.rango_referencia || '-'}) [${(bm.estado || 'normal').toUpperCase()}]`, margin + 10, y);
          y += 14;
        });
        y += 10;
      }

      if (data.comparativa_historica?.length > 0) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('3. COMPARATIVA HISTÓRICA Y EVOLUCIÓN', margin, y);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        data.comparativa_historica.forEach((c) => {
          if (y > 750) { doc.addPage(); y = 50; }
          const diffStr = `${c.diferencia > 0 ? '+' : ''}${c.diferencia} (${c.cambio_porcentual > 0 ? '+' : ''}${c.cambio_porcentual}%)`;
          doc.text(`• ${c.parametro}: Previo ${c.valor_anterior} ${c.unidad || ''} -> Actual ${c.valor_actual} ${c.unidad || ''} [${diffStr}]`, margin + 10, y);
          y += 14;
        });
        y += 10;
      }

      if (data.preguntas_medico?.length > 0) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('4. PREGUNTAS SUGERIDAS PARA SU MÉDICO', margin, y);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        data.preguntas_medico.forEach((p, idx) => {
          if (y > 750) { doc.addPage(); y = 50; }
          const splitP = doc.splitTextToSize(`${idx + 1}. ${p}`, 505);
          doc.text(splitP, margin + 10, y);
          y += splitP.length * 12 + 4;
        });
        y += 10;
      }

      if (data.recomendacion) {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('5. RECOMENDACIONES Y PLAN DE ACCIÓN', margin, y);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        const splitRec = doc.splitTextToSize(data.recomendacion, 515);
        doc.text(splitRec, margin, y);
        y += splitRec.length * 13 + 15;
      }

      if (y > 760) { doc.addPage(); y = 50; }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Aviso Legal: Informe generado con asistencia de IA clínica para pre-triaje. No sustituye la consulta médica presencial.', margin, 800);

      const safeName = (data.filename || 'mivor').replace(/[^a-zA-Z0-9_\.-]/g, '_');
      doc.save(`informe_clinico_${safeName}.pdf`);
    } catch (e) {
      console.error('Error in jsPDF generation:', e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    setIsGeneratingPdf(true);
    try {
      let res = null;
      if (analysisResult.id) {
        res = await fetch(`${apiUrl}/api/documents/${analysisResult.id}/pdf`, {
          headers: authHeaders
        });
      }
      if (!res || !res.ok) {
        res = await fetch(`${apiUrl}/api/documents/export-pdf`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: analysisResult.filename || 'informe_clinico.pdf',
            resumen: analysisResult.summary || '',
            diagnosticos: analysisResult.diagnosticos || [],
            hallazgos: analysisResult.hallazgos || [],
            medicamentos: analysisResult.medicamentos || [],
            biomarcadores: analysisResult.biomarcadores || [],
            comparativa_historica: analysisResult.comparativa_historica || [],
            preguntas_medico: analysisResult.preguntas_medico || [],
            severidad: analysisResult.severidad || 'verde',
            recomendacion: analysisResult.recomendacion || ''
          })
        });
      }

      if (res && res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = (analysisResult.filename || 'estudio').replace(/[^a-zA-Z0-9_\.-]/g, '_');
        a.download = `informe_mivor_${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
      throw new Error('Backend PDF endpoint unavailable');
    } catch (err) {
      console.warn('Fallback a generación PDF en cliente:', err);
      generateClientSidePdf(analysisResult);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const docTypeIcon = (type) => type === 'medical_image'
    ? <ImageIcon size={18} className="text-blue-500" />
    : <FileText size={18} className="text-brand-green" />;

  return (
    <div className="min-h-screen bg-base font-sans relative overflow-x-hidden pb-28">

      {/* Background */}
      {step !== 'results' && (
        <div className="absolute top-0 right-0 w-[55%] md:w-[45%] lg:w-[40%] h-[380px] md:h-[500px] z-0 overflow-hidden pointer-events-none">
          <img src="/images/abstract_woman_bg.jpg" alt="" className="absolute top-0 right-0 w-full h-full object-cover object-top opacity-60 mix-blend-multiply"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)' }} />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base to-transparent" />
          <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-base via-base/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10 px-6 pt-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={step === 'results' ? () => setStep('upload') : onBack}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="text-slate-800" size={20} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs">
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              {step === 'upload' && t("analyze_your_medical_tests")}
              {step === 'analyzing' && t("analyzing_document")}
              {step === 'results' && t("analysis_results")}
            </h2>
          </div>
          {step === 'results' ? (
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Descargar Informe Clínico (PDF)"
              className="w-10 h-10 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-xs flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* ─── STEP: UPLOAD ─── */}
        {step === 'upload' && (
          <>
            {/* Hero */}
            <div className="mb-6 relative max-w-full md:max-w-[75%]">
              <div className="absolute -inset-4 bg-gradient-to-r from-white via-white/95 to-transparent blur-md z-[-1] pointer-events-none"></div>
              <h2 className="relative z-10 text-[26px] md:text-[30px] leading-tight font-extrabold text-slate-900 mb-1.5 drop-shadow-xs">
                {t("upload_your_tests")}
                <br /> {t("get_clear_answers")}
                <br />
                <span className="text-teal-700 font-black tracking-tight">{t("clear_and_understandable")}</span>
              </h2>
              <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-700 max-w-[90%]">
                {t("vitalai_extracts_interprets")}
              </p>
            </div>

            {/* Security */}
            <div className="bg-white/90 backdrop-blur-xs border border-teal-200/60 rounded-2xl p-4 flex gap-3 items-center mb-6 max-w-sm shadow-xs">
              <div className="bg-teal-100 p-2 rounded-xl text-teal-800 shrink-0"><Shield size={18} /></div>
              <div>
                <p className="text-xs font-bold text-slate-900">{t("your_information_is_protected")}</p>
                <p className="text-[10px] text-slate-600 font-medium">{t("hospital_level_privacy")}</p>
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
                ${isDragging ? 'border-teal-500 bg-teal-50/20 scale-[1.01]' : 'border-gray-200'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors
                ${isDragging ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-800'}`}>
                <CloudUpload size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {isDragging ? t("drop_here") : t("upload_your_document_or_image")}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{t("you_can_upload_photo_or_pdf")}</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={ACCEPTED_TYPES} />
              
              <div className="flex gap-3 w-full mb-3">
                <button onClick={() => fileInputRef.current.click()}
                  className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-teal-200/80">
                  <ImageIcon size={18} /> {t("upload_image")}
                </button>
                <button onClick={() => fileInputRef.current.click()}
                  className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md">
                  <FileText size={18} /> {t("upload_pdf")}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">{t("file_formats_and_size_limit")}</p>
            </div>

            {/* Format chips */}
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar mb-8">
              {[
                { icon: <FileText size={20} className="text-brand-green" />, l: t("reports"), s: 'PDF' },
                { icon: <ImageIcon size={20} className="text-blue-500" />, l: t("x_rays"), s: 'JPG, PNG' },
                { icon: <Activity size={20} className="text-purple-500" />, l: t("prescriptions"), s: 'PDF, Foto' },
                { icon: <Beaker size={20} className="text-amber-500" />, l: t("analytics"), s: 'PDF' },
                { icon: <File size={20} className="text-gray-500" />, l: t("disabilities"), s: 'PDF, Foto' },
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
              <h3 className="text-sm font-bold text-gray-900 mb-3">{t("previous_analyses")}</h3>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loadingDocs ? (
                  <div className="p-5 text-center text-xs text-gray-400">{t("loading_history")}</div>
                ) : documents.length === 0 ? (
                  <div className="p-8 flex flex-col items-center gap-2 text-center">
                    <CloudUpload size={28} className="text-gray-200" />
                    <p className="text-sm font-semibold text-gray-400">{t("no_analyses_yet")}</p>
                    <p className="text-xs text-gray-400">{t("upload_first_document_above")}</p>
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
                      <p className="text-xs font-bold text-gray-900 truncate">{doc.filename || t("document")}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={9} />
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">{t("analyzed")}</div>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t("vitalai_reading_document")}</h3>
              <p className="text-sm text-gray-500 max-w-xs">{t("extracting_text_identifying_meds")}</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {[t("extracting_text_with_ocr"), t("identifying_clinical_findings"), t("generating_summary_for_you")].map((t, i) => (
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
                <p className="text-[10px] text-gray-400">{analysisResult.is_image ? t("medical_image") : t("report_document_pdf")}</p>
              </div>
            </div>

            {/* Severity */}
            <SeverityBadge sev={analysisResult.severidad} />

            {/* Summary */}
            {analysisResult.summary && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stethoscope size={13} /> {t("summary")}
                </h3>
                <p className="text-sm text-gray-800 leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}

            {/* Biomarcadores Analíticos y Medidores de Rango (Fila 2) */}
            {analysisResult.biomarcadores?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-teal-700" /> Parámetros y Biomarcadores Extraídos
                  </h3>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {analysisResult.biomarcadores.length} analitos
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 mt-1">
                  {analysisResult.biomarcadores.map((bm, i) => (
                    <BiomarkerRangeMeter key={i} bm={bm} />
                  ))}
                </div>
              </div>
            )}

            {/* Evolución y Comparativa Histórica con Chart.js (Fila 2) */}
            {analysisResult.comparativa_historica?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evolución y Comparativa Histórica</h3>
                      <p className="text-[10px] text-slate-500">Contraste directo contra estudios previos del paciente</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                    {analysisResult.comparativa_historica.length} vinculados
                  </span>
                </div>

                {/* Side-by-side comparative Bar Chart */}
                <div className="h-60 w-full pt-1">
                  <Bar
                    data={{
                      labels: analysisResult.comparativa_historica.map(item => item.parametro),
                      datasets: [
                        {
                          label: 'Estudio Anterior',
                          data: analysisResult.comparativa_historica.map(item => item.valor_anterior),
                          backgroundColor: 'rgba(148, 163, 184, 0.85)',
                          borderRadius: 6,
                        },
                        {
                          label: 'Estudio Actual',
                          data: analysisResult.comparativa_historica.map(item => item.valor_actual),
                          backgroundColor: 'rgba(15, 118, 110, 0.9)',
                          borderRadius: 6,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}`
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 10, weight: 'bold' }, maxRotation: 20 }
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(241, 245, 249, 1)' },
                          ticks: { font: { size: 10 } }
                        }
                      }
                    }}
                  />
                </div>

                {/* Detailed variations list */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  {analysisResult.comparativa_historica.map((item, idx) => {
                    const isUp = item.tendencia === 'sube';
                    const isDown = item.tendencia === 'baja';
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.parametro}</p>
                          <p className="text-[10px] text-slate-500">
                            Previo: {item.valor_anterior} {item.unidad} ({item.fecha_anterior || 'Previo'}) &rarr; Actual: {item.valor_actual} {item.unidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isUp && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 border border-red-200">
                              <TrendingUp size={12} /> +{item.cambio_porcentual}%
                            </span>
                          )}
                          {isDown && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200">
                              <TrendingDown size={12} /> {item.cambio_porcentual}%
                            </span>
                          )}
                          {!isUp && !isDown && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                              <Minus size={12} /> 0%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diagnostics */}
            {analysisResult.diagnosticos?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity size={13} /> {t("diagnostics_findings")}
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
                  <Pill size={13} /> {t("prescribed_medications")}
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
                  <CheckCircle2 size={13} /> {t("other_findings")}
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
                  <Lightbulb size={13} /> {t("recommendation")}
                </h3>
                <p className="text-sm text-gray-800">{analysisResult.recomendacion}</p>
              </div>
            )}

            {/* PHI warning */}
            {analysisResult.phi_detected && (
              <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100 flex gap-2 items-center">
                <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
                <p className="text-[11px] text-orange-700">{t("phi_detected_warning")}</p>
              </div>
            )}

            {/* Derivación Inteligente de Paciente a Especialista (Fila 14) */}
            {(() => {
              const referral = analysisResult.smart_referral;
              // Client fallback if referral is not present (legacy docs)
              const corpus = `${analysisResult.summary || ''} ${(analysisResult.diagnosticos || []).join(' ')} ${(analysisResult.hallazgos || []).join(' ')}`.toLowerCase();
              let fallbackSpec = 'Medicina General';
              if (corpus.includes('fractur') || corpus.includes('rotura') || corpus.includes('luxaci') || corpus.includes('óseo') || corpus.includes('oseo') || corpus.includes('esguince') || corpus.includes('menisco')) {
                fallbackSpec = 'Traumatología';
              } else if (corpus.includes('troponin') || corpus.includes('infarto') || corpus.includes('cardio') || corpus.includes('arritmia') || corpus.includes('electrocardiograma') || corpus.includes('ecg') || corpus.includes('colesterol')) {
                fallbackSpec = 'Cardiología';
              } else if (corpus.includes('glucosa') || corpus.includes('hba1c') || corpus.includes('diabetes') || corpus.includes('tiroides') || corpus.includes('tsh') || corpus.includes('metabólic')) {
                fallbackSpec = 'Endocrinología';
              } else if (corpus.includes('creatinina') || corpus.includes('renal') || corpus.includes('urea') || corpus.includes('tfg')) {
                fallbackSpec = 'Nefrología';
              } else if (corpus.includes('transaminas') || corpus.includes('hepátic') || corpus.includes('hígado') || corpus.includes('bilirrubina') || corpus.includes('digestiv')) {
                fallbackSpec = 'Gastroenterología';
              } else if (corpus.includes('hemoglobina') || corpus.includes('anemia') || corpus.includes('plaqueta') || corpus.includes('leucocit')) {
                fallbackSpec = 'Hematología';
              } else if (corpus.includes('pulmonar') || corpus.includes('neumo') || corpus.includes('espirometr') || corpus.includes('asma') || corpus.includes('tórax')) {
                fallbackSpec = 'Neumología';
              } else if (corpus.includes('piel') || corpus.includes('cutáne') || corpus.includes('dermat') || corpus.includes('melanoma') || corpus.includes('lunar')) {
                fallbackSpec = 'Dermatología';
              }

              const specialty = referral?.specialty || referral?.short_specialty || fallbackSpec;
              const urgency = referral?.urgency || (analysisResult.severidad === 'rojo' ? 'alta' : (analysisResult.severidad === 'amarillo' ? 'media' : 'baja'));
              const reason = referral?.reason || (urgency === 'alta' 
                ? `Los hallazgos requieren valoración prioritaria por un especialista en ${specialty}.` 
                : `Según los valores analizados, se sugiere consulta médica en ${specialty}.`);
              const alteredBms = referral?.altered_biomarkers || (analysisResult.biomarcadores || []).filter(bm => ['elevado', 'bajo', 'alterado', 'alto'].includes((bm.estado || '').toLowerCase()));
              const specialists = referral?.recommended_specialists || [];

              const isUrgent = urgency === 'alta';
              const isMedium = urgency === 'media';

              return (
                <div className={`rounded-3xl p-5 md:p-6 border shadow-soft flex flex-col gap-4 transition-all ${
                  isUrgent 
                    ? 'bg-gradient-to-br from-red-50/90 via-rose-50/70 to-orange-50/80 border-red-200/90' 
                    : isMedium
                    ? 'bg-gradient-to-br from-amber-50/90 via-yellow-50/60 to-orange-50/70 border-amber-200/80'
                    : 'bg-gradient-to-br from-teal-50/90 via-sky-50/60 to-emerald-50/70 border-teal-200/80'
                }`}>
                  {/* Top Badge & Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isUrgent ? 'bg-red-600' : isMedium ? 'bg-amber-600' : 'bg-teal-700'
                      }`}>
                        {isUrgent ? <AlertCircle size={22} /> : isMedium ? <AlertTriangle size={22} /> : <Stethoscope size={22} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isUrgent ? 'bg-red-100 text-red-700 border border-red-200' : isMedium ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {isUrgent ? 'Prioridad Alta • Atención Urgente' : isMedium ? 'Prioridad Media • Consulta Recomendada' : 'Seguimiento Preventivo'}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                          Derivación Inteligente: <span className={isUrgent ? 'text-red-700' : isMedium ? 'text-amber-800' : 'text-teal-800'}>{specialty}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-center bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60 text-[11px] font-bold text-slate-700 shadow-2xs">
                      <Sparkles size={13} className="text-teal-600" />
                      <span>Matching Algorítmico MIVOR</span>
                    </div>
                  </div>

                  {/* Justificación Clínica */}
                  <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-slate-200/60 shadow-2xs">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900">Criterio Clínico: </span>
                      {reason}
                    </p>
                  </div>

                  {/* Biomarcadores Detonantes */}
                  {alteredBms.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <Activity size={12} className={isUrgent ? 'text-red-600' : 'text-teal-700'} />
                        Biomarcadores detonantes de la derivación:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {alteredBms.map((bm, idx) => {
                          const isHigh = (bm.estado || '').toLowerCase().includes('elevado') || (bm.estado || '').toLowerCase().includes('alto');
                          return (
                            <span 
                              key={idx}
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl shadow-2xs border ${
                                isHigh 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isHigh ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              <span>{bm.parametro}: {bm.valor} {bm.unidad || ''}</span>
                              <span className="text-[10px] font-medium opacity-80">({bm.estado})</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Especialistas Recomendados (Mini-cards) */}
                  {specialists.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <UserCheck size={13} className="text-teal-700" />
                          Especialistas recomendados en MIVOR.ai:
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                          Verificados
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {specialists.slice(0, 4).map((docItem) => (
                          <div 
                            key={docItem.id || docItem.user_id}
                            className="bg-white/90 rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center gap-3 hover:border-teal-400 hover:shadow-xs transition-all group"
                          >
                            <div className="relative flex-shrink-0">
                              <img 
                                src={docItem.photo_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80"} 
                                alt={docItem.full_name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                              />
                              {docItem.is_verified && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-600 rounded-full flex items-center justify-center text-white ring-2 ring-white">
                                  <Check size={9} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-800 transition-colors">
                                {docItem.full_name}
                              </h5>
                              <p className="text-[11px] font-semibold text-teal-700 truncate">
                                {docItem.specialty} {docItem.experience_years ? `• ${docItem.experience_years}a exp.` : ''}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-0.5 mt-0.5">
                                <MapPin size={10} className="flex-shrink-0" />
                                <span>{docItem.location || docItem.city || 'Consulta Online'}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onOpenDoctorDirectory?.(docItem.specialty || specialty)}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200/70 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                            >
                              Agendar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenDoctorDirectory?.(specialty)}
                      className={`w-full py-3 px-4 rounded-xl active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                        isUrgent ? 'bg-red-600 hover:bg-red-700' : isMedium ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-700 hover:bg-teal-800'
                      }`}
                    >
                      <Calendar size={16} />
                      <span>Agendar Cita en {specialty}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const diagText = (analysisResult.diagnosticos || []).join(', ') || analysisResult.summary || 'evaluación de estudio médico';
                        const alteredStr = alteredBms.map(b => `${b.parametro} (${b.estado})`).join(', ');
                        const msg = encodeURIComponent(`Hola, acabo de analizar un estudio en MIVOR.ai con derivación recomendada para ${specialty}.\nMotivo: ${reason}\n${alteredStr ? `Valores alterados: ${alteredStr}\n` : ''}Me gustaría consultar disponibilidad para una valoración.`);
                        window.open(`https://wa.me/?text=${msg}`, '_blank');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>Consultar WhatsApp Especialista</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Preguntas Sugeridas para el Médico (Fila 2) */}
            {analysisResult.preguntas_medico?.length > 0 && (
              <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Preguntas Sugeridas para su Médico</h3>
                      <p className="text-[10px] text-indigo-700 font-medium">Recomendaciones para consultar en su próxima cita médica</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  {analysisResult.preguntas_medico.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-indigo-100 shadow-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">{p}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const text = analysisResult.preguntas_medico.map((q, i) => `${i + 1}. ${q}`).join('\n');
                      navigator.clipboard.writeText(`Preguntas sobre mi estudio médico (${analysisResult.filename}):\n\n${text}`);
                      setCopiedQuestions(true);
                      setTimeout(() => setCopiedQuestions(false), 2500);
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200 active:scale-95 text-indigo-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    {copiedQuestions ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">¡Copiadas al portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar Preguntas</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = analysisResult.preguntas_medico.map((q, i) => `${i + 1}. ${q}`).join('\n');
                      const msg = encodeURIComponent(`Hola doctor(a), tengo estas consultas sobre mi estudio (${analysisResult.filename}):\n\n${text}`);
                      window.open(`https://wa.me/?text=${msg}`, '_blank');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>WhatsApp Médico</span>
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generando Informe Clínico (PDF)...</span>
                </>
              ) : (
                <>
                  <FileDown size={20} />
                  <span>Descargar Informe Clínico (PDF)</span>
                </>
              )}
            </button>

            <button
              onClick={() => onAskFollowUp(analysisResult.extracted_text, analysisResult.filename)}
              className="w-full bg-brand-purple text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:bg-brand-purple/90 transition-colors"
            >
              <MessageSquare size={20} /> {t("ask_more_about_document")}
            </button>

            <button
              onClick={() => { setStep('upload'); setAnalysisResult(null); }}
              className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} /> {t("analyze_another_document")}
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;