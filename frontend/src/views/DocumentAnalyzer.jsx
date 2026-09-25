import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft, CloudUpload, FileText, Image as ImageIcon, Activity, Beaker, File,
  Clock, ChevronRight, AlertCircle, CheckCircle2, AlertTriangle, Pill,
  Stethoscope, Lightbulb, MessageSquare, RotateCcw, Shield, ShieldCheck, Loader2,
  FileDown, Download, TrendingUp, TrendingDown, Minus, HelpCircle, Copy, Check, Share2, BarChart3,
  Sparkles, UserCheck, MapPin, Calendar, Search, ArrowDownUp, HardDrive, Info,
  MoreVertical, MoreHorizontal, Home, Heart, User, Bell, ChevronDown, Eye, X,
  Database, SlidersHorizontal
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
import { translateSpecialtyName } from '../i18n/catalogTranslations';
import { printHtmlContent, escapeHtml } from '../utils/printPdf';
import { useLanguage } from '../contexts/LanguageContext';
import PatientTopNav from '../components/PatientTopNav';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/bmp', 'image/gif'];

const BiomarkerRangeMeter = ({ bm }) => {
  const { t } = useLanguage();
  const val = parseFloat(bm.valor);
  const isNum = !isNaN(val);
  const status = (bm.estado || 'normal').toLowerCase();

  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} /> {t('normal')}
    </span>
  );
  if (status === 'elevado' || status === 'alto') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <TrendingUp size={11} /> {t('documentanalyzer_elevado')}
      </span>
    );
  } else if (status === 'bajo') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <TrendingDown size={11} /> {t('documentanalyzer_bajo')}
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
  } else if (status === 'elevado' || status === 'alto') {
    percent = 84;
  } else if (status === 'bajo') {
    percent = 16;
  }

  return (
    <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">{bm.parametro}</h4>
          <p className="text-[10px] text-slate-500">{t('documentanalyzer_ref')} {bm.rango_referencia || t('not_specified')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-black text-slate-900">{bm.valor} <span className="text-[10px] font-normal text-slate-500">{bm.unidad}</span></span>
          {statusBadge}
        </div>
      </div>

      <div className="relative pt-2 pb-1">
        <div className="h-2 w-full rounded-full bg-slate-200 flex overflow-hidden">
          <div className="w-1/4 bg-blue-300" title={t('documentanalyzer_bajo')} />
          <div className="w-1/2 bg-emerald-400" title={t('normal')} />
          <div className="w-1/4 bg-rose-400" title={t('documentanalyzer_elevado')} />
        </div>
        <div
          className="absolute top-0.5 -ml-2 flex flex-col items-center pointer-events-none transition-all duration-300"
          style={{ left: `${percent}%` }}
        >
          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
            status === 'elevado' || status === 'alto' ? 'bg-red-600' : status === 'bajo' ? 'bg-blue-600' : 'bg-emerald-600'
          }`} />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-medium px-0.5 mt-1">
          <span>{t('documentanalyzer_bajo')}</span>
          <span className="text-emerald-700 font-semibold">{t('documentanalyzer_rango_optimo')}</span>
          <span>{t('documentanalyzer_elevado')}</span>
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

const DocumentAnalyzer = ({
  onBack,
  apiUrl,
  authHeaders,
  onAskFollowUp,
  onOpenDoctorDirectory,
  onNavigate,
  userProfile,
  username,
  onLogout
}) => {
  const { t, language, locale: uiLocale } = useLanguage();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'results'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [openDocMenuId, setOpenDocMenuId] = useState(null);
  const [analyzingCount, setAnalyzingCount] = useState(1);

  const safeNavigate = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else if (screen === 'home') {
      onBack?.();
    }
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/me/documents`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data || []);
        }
      } catch (e) {
        /* silent */
      } finally {
        setLoadingDocs(false);
      }
    };
    if (apiUrl && authHeaders) fetchDocs();
    else setLoadingDocs(false);
  }, [apiUrl, authHeaders]);

  // Documentos reales del usuario (sin documentos de muestra)
  const allDocuments = useMemo(() => {
    // Si el backend ya tiene documentos, los adaptamos
    const formattedRealDocs = documents.map(doc => {
      const ext = (doc.filename || '').split('.').pop().toLowerCase();
      let iconType = 'pdf-red';
      let category = 'informe';
      let categoryLabel = t('docanalyzer_cat_report');
      let sub = t('docanalyzer_sub_medical_document');

      if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || doc.document_type === 'medical_image') {
        iconType = 'jpg-blue';
        category = 'radiografia';
        categoryLabel = t('docanalyzer_cat_xray');
        sub = t('docanalyzer_sub_medical_image');
      } else if (doc.filename?.toLowerCase().includes('receta')) {
        iconType = 'pdf-purple';
        category = 'receta';
        categoryLabel = t('docanalyzer_cat_prescription');
        sub = t('docanalyzer_sub_prescription');
      } else if (doc.filename?.toLowerCase().includes('analisis') || doc.filename?.toLowerCase().includes('sangre') || doc.filename?.toLowerCase().includes('orina')) {
        iconType = 'pdf-red';
        category = 'analitica';
        categoryLabel = t('docanalyzer_cat_lab');
        sub = t('docanalyzer_sub_lab_test');
      }

      return {
        ...doc,
        subtitle: sub,
        category,
        category_label: categoryLabel,
        icon_type: iconType,
        status: 'analizado'
      };
    });

    return formattedRealDocs;
  }, [documents]);

  // Filtrado por buscador y categoría
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category_label?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;

      return matchesSearch && matchesCat;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [allDocuments, searchTerm, selectedCategory, sortOrder]);

  const uploadAndAnalyze = async (filesInput) => {
    if (!filesInput) return;
    const files = Array.isArray(filesInput) 
      ? filesInput 
      : (filesInput instanceof FileList ? Array.from(filesInput) : [filesInput]);
    if (files.length === 0) return;

    for (const file of files) {
      if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|bmp|gif)$/i)) {
        setError(t("unsupported_format", { fileName: file.name }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) { 
        setError(t('documentanalyzer_el_archivo_excede_el_tamano', { name: file.name })); 
        return; 
      }
    }

    setAnalyzingCount(files.length);
    setStep('analyzing');
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      if (files.length === 1) {
        formData.append('file', files[0]);
      }
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

      const combinedFilename = files.map(f => f.name).join(', ');
      setAnalysisResult({ ...data, filename: data.filename || combinedFilename });
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

  const handleFileChange = (e) => { 
    if (e.target.files && e.target.files.length > 0) {
      uploadAndAnalyze(Array.from(e.target.files)); 
      e.target.value = '';
    }
  };
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadAndAnalyze(Array.from(e.dataTransfer.files)); 
    }
  }, []);

  const handleAnalyzerPaste = useCallback((e) => {
    if (step !== 'upload') return;
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const f = items[i].getAsFile();
        if (f) pastedFiles.push(f);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      uploadAndAnalyze(pastedFiles);
    }
  }, [step]);

  useEffect(() => {
    window.addEventListener('paste', handleAnalyzerPaste);
    return () => window.removeEventListener('paste', handleAnalyzerPaste);
  }, [handleAnalyzerPaste]);

  const handleHistoryClick = (doc) => {
    if (doc.analysis_result) {
      try {
        const parsed = typeof doc.analysis_result === 'string' ? JSON.parse(doc.analysis_result) : doc.analysis_result;
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
    if (onAskFollowUp) {
      onAskFollowUp(doc.extracted_text || doc.filename, doc.filename);
    }
  };

  // Informe imprimible (Guardar como PDF). Se imprime con las fuentes del sistema, así que funciona con
  // cualquier alfabeto (árabe, chino, cirílico…) y respeta la dirección de escritura del idioma.
  const printAnalysisReport = async (data) => {
    const esc = escapeHtml;
    const biomarkers = (data.biomarcadores || []).map((bm) => `
      <tr>
        <td><strong>${esc(bm.parametro)}</strong></td>
        <td>${esc(bm.valor)} ${esc(bm.unidad || '')}</td>
        <td>${esc(bm.rango_referencia || '-')}</td>
        <td>${esc((bm.estado || 'normal').toUpperCase())}</td>
      </tr>`).join('');
    const medications = (data.medicamentos || []).map((m) => `<span class="badge med-badge">${esc(m)}</span>`).join('');
    const body = `
      <div class="header">
        <h1>${esc(t('docanalyzer_pdf_title'))}</h1>
        <p>${esc(t('docanalyzer_pdf_meta', { date: new Date().toLocaleDateString(uiLocale), document: data.filename || t('documentanalyzer_estudio_clinico') }))}</p>
      </div>
      <h2>${esc(t('docanalyzer_pdf_section_summary'))}</h2>
      <p style="white-space: pre-wrap;">${esc(data.summary || t('documentanalyzer_estudio_procesado_correctamente'))}</p>
      ${biomarkers ? `
        <h2>${esc(t('docanalyzer_pdf_section_biomarkers'))}</h2>
        <table>
          <thead><tr>
            <th>${esc(t('docanalyzer_pdf_col_parameter'))}</th>
            <th>${esc(t('docanalyzer_pdf_col_value'))}</th>
            <th>${esc(t('docanalyzer_pdf_col_reference'))}</th>
            <th>${esc(t('docanalyzer_pdf_col_status'))}</th>
          </tr></thead>
          <tbody>${biomarkers}</tbody>
        </table>` : ''}
      ${medications ? `<h2>${esc(t('docanalyzer_pdf_section_medications'))}</h2><div>${medications}</div>` : ''}
    `;
    await printHtmlContent(t('docanalyzer_pdf_title'), body);
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    setIsGeneratingPdf(true);
    try {
      await printAnalysisReport(analysisResult);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper para renderizar el icono adecuado de la fila
  const renderDocumentFileIcon = (iconType) => {
    if (iconType === 'jpg-blue') {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0055ff] border border-blue-200/60 flex items-center justify-center shrink-0">
          <ImageIcon size={20} className="stroke-[2.2]" />
        </div>
      );
    }
    if (iconType === 'pdf-purple') {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
          <FileText size={20} className="stroke-[2.2]" />
        </div>
      );
    }
    if (iconType === 'pdf-green') {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <FileText size={20} className="stroke-[2.2]" />
        </div>
      );
    }
    // Default red PDF
    return (
      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
        <FileText size={20} className="stroke-[2.2]" />
      </div>
    );
  };

  // Helper para renderizar la etiqueta de tipo
  const renderCategoryPill = (cat) => {
    switch (cat) {
      case 'analitica':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70">{t('documentanalyzer_analitica')}</span>;
      case 'radiografia':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0055ff] border border-blue-200/70">{t('documentanalyzer_radiografia')}</span>;
      case 'receta':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200/70">{t('documentanalyzer_receta')}</span>;
      case 'informe':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">{t('documentanalyzer_informe')}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">{t('document')}</span>;
    }
  };

  const patientInitials = useMemo(() => {
    const name = userProfile?.full_name || username || t('default_patient_name');
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [userProfile, username]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 lg:pb-12 select-none">

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR SUPERIOR UNIFICADO (DESKTOP)                                */}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        <PatientTopNav
          activeTab="documents"
          onNavigate={safeNavigate}
          userProfile={userProfile}
          username={username}
          onLogout={onLogout}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. HEADER MÓVIL SUPERIOR (EXCLUSIVA MÓVIL - RÉPLICA EXACTA IMAGEN 3)      */}
      {/* ========================================================================= */}
      <header className="block lg:hidden w-full px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          
          <div onClick={() => safeNavigate('home')} className="flex items-center cursor-pointer">
            <img 
              src="/images/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-7 w-auto object-contain" 
              onError={(e) => { e.target.src = '/assets/mivor-logo.png'; }}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 relative hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <Bell size={18} className="stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div 
              onClick={() => safeNavigate('more')}
              className="w-9 h-9 rounded-full bg-[#8b5cf6] text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden border border-white cursor-pointer"
            >
              {userProfile?.photo_url ? (
                <img src={userProfile.photo_url} alt={t('doctor_section_profile')} className="w-full h-full object-cover" />
              ) : (
                <span>{patientInitials}</span>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. CONTENIDO PRINCIPAL                                                    */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">

        {/* ─── VISTA 1: SUBIDA Y LISTADO DE DOCUMENTOS (PANTALLA PRINCIPAL) ─── */}
        {step === 'upload' && (
          <div className="space-y-6">

            {/* Cabecera Principal con Título y Tarjeta de Seguridad */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  {t('patienttopnav_mis_documentos_medicos')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  {t('documentanalyzer_sube_y_gestiona_tus_informes')}
                </p>
              </div>

              {/* Tarjeta de Seguridad Superior Derecha */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs max-w-md shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055ff] flex items-center justify-center shrink-0 border border-blue-100">
                  <ShieldCheck size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black leading-tight">
                    {t('documentanalyzer_tu_informacion_esta_segura')}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    {t('documentanalyzer_tus_documentos_estan_protegidos_con')}
                  </p>
                </div>
              </div>
            </div>

            {/* Error si ocurre */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-700 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Layout en 2 Columnas para Desktop (70% / 30%) y 1 Columna Móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ── COLUMNA IZQUIERDA: DROPZONE + TABLA DOCUMENTOS (lg:col-span-8) ── */}
              <div className="lg:col-span-8 space-y-6">

                {/* Zona de Carga Drag & Drop */}
                <div 
                  onDragOver={onDragOver} 
                  onDragLeave={onDragLeave} 
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-3xl p-8 sm:p-10 border-2 border-dashed transition-all cursor-pointer text-center relative overflow-hidden flex flex-col items-center justify-center ${
                    isDragging 
                      ? 'border-[#0055ff] bg-blue-50/70 scale-[1.005]' 
                      : 'border-[#bcdcfe] bg-[#f4f9ff] hover:bg-[#ebf4ff]'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept={ACCEPTED_TYPES} 
                    multiple
                  />

                  {/* Icono de Nube Azul en Círculo */}
                  <div className="w-14 h-14 rounded-full bg-[#0055ff] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 group-hover:scale-105 transition-transform">
                    <CloudUpload size={28} className="stroke-[2.4]" />
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-black">
                    {t('documentanalyzer_arrastra_tus_archivos_aqui')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 mb-2">
                    {t('documentanalyzer_o_haz_clic_para_seleccionarlos')}
                  </p>
                  
                  <p className="text-[11px] text-slate-400 font-medium max-w-sm mb-5">
                    {t('documentanalyzer_puedes_subir_uno_o_varios')}
                  </p>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText size={16} className="stroke-[2.4]" />
                    <span>{t('documentanalyzer_seleccionar_archivos')}</span>
                  </button>
                </div>

                {/* Encabezado de la Sección de Documentos con Buscador y Filtro */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-black text-black">
                      {t('patienttopnav_mis_documentos')}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff] text-xs font-bold border border-blue-200/80">
                      {filteredDocuments.length} {t('documentanalyzer_archivos')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Buscador de Documentos */}
                    <div className="relative flex-1 sm:w-64">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.2]" />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('documentanalyzer_buscar_documento_fecha_o_tipo')}
                        className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0055ff] shadow-2xs"
                      />
                    </div>

                    {/* Botón de Ordenación */}
                    <button 
                      type="button"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      title={sortOrder === 'desc' ? t('documentanalyzer_mas_recientes_primero') : t('documentanalyzer_mas_antiguos_primero')}
                    >
                      <ArrowDownUp size={16} className="stroke-[2.2]" />
                    </button>
                  </div>

                </div>

                {/* ── TABLA DESKTOP (EXCLUSIVA LG+) ── */}
                <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">{t('documentanalyzer_nombre_del_archivo')}</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">{t('documentanalyzer_tipo')}</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">{t('col_date')}</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">{t('documentanalyzer_tamano')}</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">{t('col_status')}</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600 text-center">{t('documentanalyzer_acciones')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                            {documents.length === 0 ? t('documentanalyzer_no_documents_yet') : t('documentanalyzer_no_se_encontraron_documentos_con')}
                          </td>
                        </tr>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr 
                            key={doc.id}
                            onClick={() => handleHistoryClick(doc)}
                            className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                            {/* Nombre e Icono */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {renderDocumentFileIcon(doc.icon_type)}
                                <div className="min-w-0">
                                  <p className="font-extrabold text-black text-xs truncate group-hover:text-[#0055ff] transition-colors">
                                    {doc.filename}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    {doc.subtitle || t('documentanalyzer_documento_clinico')}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Tipo */}
                            <td className="py-3 px-4">
                              {renderCategoryPill(doc.category)}
                            </td>

                            {/* Fecha */}
                            <td className="py-3 px-4 text-slate-600 font-semibold text-[11.5px]">
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString(uiLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>

                            {/* Tamaño */}
                            <td className="py-3 px-4 text-slate-500 font-medium text-[11.5px]">
                              {doc.file_size_label || '—'}
                            </td>

                            {/* Estado Analizado */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ebfaf3] text-[#028a4c] border border-[#c6f3db]">
                                <CheckCircle2 size={13} className="stroke-[2.5]" />
                                <span>{t('analyzed')}</span>
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleHistoryClick(doc)}
                                  className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-[#0055ff] flex items-center justify-center transition-colors cursor-pointer"
                                  title={t('documentanalyzer_ver_analisis_clinico')}
                                >
                                  <Eye size={16} className="stroke-[2.2]" />
                                </button>
                                
                                <button 
                                  type="button"
                                  onClick={() => {
                                    handleHistoryClick(doc);
                                  }}
                                  className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-[#0055ff] flex items-center justify-center transition-colors cursor-pointer"
                                  title={t('documentanalyzer_descargar_informe')}
                                >
                                  <Download size={16} className="stroke-[2.2]" />
                                </button>

                                <div className="relative">
                                  <button 
                                    type="button"
                                    onClick={() => setOpenDocMenuId(openDocMenuId === doc.id ? null : doc.id)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                                  >
                                    <MoreVertical size={16} className="stroke-[2.2]" />
                                  </button>

                                  {openDocMenuId === doc.id && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95">
                                      <button 
                                        onClick={() => { setOpenDocMenuId(null); handleHistoryClick(doc); }}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0055ff] flex items-center gap-2"
                                      >
                                        <Eye size={14} /> {t('documentanalyzer_ver_analisis')}
                                      </button>
                                      <button 
                                        onClick={() => { setOpenDocMenuId(null); handleHistoryClick(doc); }}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0055ff] flex items-center gap-2"
                                      >
                                        <Download size={14} /> {t('documentanalyzer_descargar_pdf')}
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setOpenDocMenuId(null);
                                          onAskFollowUp?.(doc.filename, doc.filename);
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0055ff] flex items-center gap-2"
                                      >
                                        <MessageSquare size={14} /> {t('documentanalyzer_preguntar_a_mivor')}
                                      </button>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── LISTADO MÓVIL VERTICAL (EXCLUSIVA LG:HIDDEN - RÉPLICA EXACTA IMAGEN 3) ── */}
                <div className="block lg:hidden space-y-2.5">
                  {filteredDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      onClick={() => handleHistoryClick(doc)}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {renderDocumentFileIcon(doc.icon_type)}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-black text-[13px] truncate">
                            {doc.filename}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString(uiLocale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}{doc.file_size_label ? ` · ${doc.file_size_label}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ebfaf3] text-[#028a4c] border border-[#c6f3db]">
                          <CheckCircle2 size={12} className="stroke-[2.5]" />
                          <span>{t('analyzed')}</span>
                        </span>

                        <button 
                          type="button"
                          onClick={() => handleHistoryClick(doc)}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 active:scale-95"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* ── COLUMNA DERECHA: CATEGORÍAS + ESPACIO + CONSEJO (lg:col-span-4) ── */}
              <div className="lg:col-span-4 space-y-5">

                {/* Card 1: Tipos de Documentos (Cuadrícula 3x2) */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-black">
                      {t('documentanalyzer_tipos_de_documentos')}
                    </h3>
                    {selectedCategory !== 'all' && (
                      <button 
                        onClick={() => setSelectedCategory('all')} 
                        className="text-[11px] text-[#0055ff] font-bold hover:underline"
                      >
                        {t('documentanalyzer_ver_todos')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* 1. Informes */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'informe' ? 'all' : 'informe')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'informe'
                          ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                        <FileText size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('reports')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF</span>
                    </button>

                    {/* 2. Radiografías */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'radiografia' ? 'all' : 'radiografia')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'radiografia'
                          ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center mb-1.5">
                        <ImageIcon size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('x_rays')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">JPG, PNG</span>
                    </button>

                    {/* 3. Recetas */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'receta' ? 'all' : 'receta')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'receta'
                          ? 'bg-orange-50/90 border-orange-300 ring-2 ring-orange-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5">
                        <Pill size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('prescriptions')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{t('documentanalyzer_pdf_foto')}</span>
                    </button>

                    {/* 4. Analíticas */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'analitica' ? 'all' : 'analitica')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'analitica'
                          ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                        <Activity size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('analytics')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF</span>
                    </button>

                    {/* 5. Incapacidades */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'incapacidad' ? 'all' : 'incapacidad')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'incapacidad'
                          ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5">
                        <FileText size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('disabilities')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{t('documentanalyzer_pdf_foto')}</span>
                    </button>

                    {/* 6. Otros */}
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory === 'otro' ? 'all' : 'otro')}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                        selectedCategory === 'otro'
                          ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5">
                        <MoreHorizontal size={18} className="stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-bold text-black leading-tight">{t('documentanalyzer_otros')}</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF, JPG, PNG</span>
                    </button>

                  </div>
                </div>

                {/* Card 3: Consejo MIVOR */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Info size={18} className="stroke-[2.4]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-black">{t('documentanalyzer_consejo')}</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {t('documentanalyzer_manten_tus_documentos_organizados_y')}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ─── VISTA 2: PROCESANDO DOCUMENTO (ANALYZING STEP) ─── */}
        {step === 'analyzing' && (
          <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
                <Loader2 size={44} className="text-[#0055ff] animate-spin stroke-[2.2]" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0055ff] text-white flex items-center justify-center shadow-md">
                <Sparkles size={16} />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-black">
                {analyzingCount > 1 
                  ? t('docanalyzer_analyzing_files', { count: analyzingCount })
                  : t('vitalai_reading_document')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {analyzingCount > 1
                  ? t('documentanalyzer_correlacionando_hallazgos_visuales_bioma')
                  : t('documentanalyzer_extrayendo_biomarcadores_diagnosticos_y_')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {[
                t('docanalyzer_step_ocr'),
                t('docanalyzer_step_biomarkers'),
                t('docanalyzer_step_summary')
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 text-left shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-[#0055ff] animate-pulse shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── VISTA 3: RESULTADOS DEL ANÁLISIS CLÍNICO (RESULTS STEP) ─── */}
        {step === 'results' && analysisResult && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Barra Superior con botón Volver y Descargar PDF */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setStep('upload'); setAnalysisResult(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-black font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{t('documentanalyzer_volver_a_mis_documentos')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                <span>{t('documentanalyzer_descargar_informe_pdf')}</span>
              </button>
            </div>

            {/* Tarjeta de Encabezado del Archivo */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0055ff] flex items-center justify-center border border-blue-200 shrink-0">
                  {analysisResult.is_image ? <ImageIcon size={24} /> : <FileText size={24} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-black truncate">
                    {analysisResult.filename}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {analysisResult.is_image ? t('documentanalyzer_estudio_de_imagen_radiografia') : t('documentanalyzer_informe_medico_digitalizado')}
                  </p>
                </div>
              </div>

              <SeverityBadge sev={analysisResult.severidad} />
            </div>

            {/* Resumen Clínico Inteligente */}
            {analysisResult.summary && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <Stethoscope size={15} className="text-[#0055ff]" />
                  <span>{t('app_resumen_clinico')}</span>
                </div>
                <p className="text-sm text-black font-medium leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>
            )}

            {/* Biomarcadores Analíticos con Medidor de Rango */}
            {analysisResult.biomarcadores?.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#0055ff]" />
                    <h3 className="text-sm font-black text-black uppercase tracking-wider">
                      {t('documentanalyzer_biomarcadores_y_parametros_analitico')}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff] border border-blue-200">
                    {analysisResult.biomarcadores.length} {t('documentanalyzer_parametros')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.biomarcadores.map((bm, i) => (
                    <BiomarkerRangeMeter key={i} bm={bm} />
                  ))}
                </div>
              </div>
            )}

            {/* Comparativa Histórica con Gráficos Chart.js */}
            {analysisResult.comparativa_historica?.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#0055ff]" />
                    <h3 className="text-sm font-black text-black uppercase tracking-wider">
                      {t('documentanalyzer_evolucion_y_comparativa_historica')}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff]">
                    {analysisResult.comparativa_historica.length} {t('documentanalyzer_vinculados')}
                  </span>
                </div>

                <div className="h-60 w-full pt-2">
                  <Bar
                    data={{
                      labels: analysisResult.comparativa_historica.map(item => item.parametro),
                      datasets: [
                        {
                          label: t('documentanalyzer_estudio_anterior'),
                          data: analysisResult.comparativa_historica.map(item => item.valor_anterior),
                          backgroundColor: 'rgba(148, 163, 184, 0.85)',
                          borderRadius: 6,
                        },
                        {
                          label: t('documentanalyzer_estudio_actual'),
                          data: analysisResult.comparativa_historica.map(item => item.valor_actual),
                          backgroundColor: 'rgba(0, 85, 255, 0.9)',
                          borderRadius: 6,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top', labels: { font: { weight: 'bold', size: 11 } } }
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(241, 245, 249, 1)' } }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Medicamentos Detectados */}
            {analysisResult.medicamentos?.length > 0 && (
              <div className="bg-amber-50/80 rounded-3xl p-6 border border-amber-200/90 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider">
                  <Pill size={16} />
                  <span>{t('documentanalyzer_medicamentos_y_pautas_detectadas')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult.medicamentos.map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-amber-200 text-xs font-bold text-black shadow-2xs">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Derivación Inteligente MIVOR */}
            {(() => {
              const referral = analysisResult.smart_referral;
              const corpus = `${analysisResult.summary || ''} ${(analysisResult.diagnosticos || []).join(' ')} ${(analysisResult.hallazgos || []).join(' ')}`.toLowerCase();
              let fallbackSpec = 'Medicina General';
              if (corpus.includes('fractur') || corpus.includes('rotura') || corpus.includes('óseo') || corpus.includes('esguince')) fallbackSpec = 'Traumatología';
              else if (corpus.includes('troponin') || corpus.includes('cardio') || corpus.includes('colesterol')) fallbackSpec = 'Cardiología';
              else if (corpus.includes('glucosa') || corpus.includes('diabetes') || corpus.includes('tiroides')) fallbackSpec = 'Endocrinología';
              else if (corpus.includes('creatinina') || corpus.includes('renal')) fallbackSpec = 'Nefrología';
              else if (corpus.includes('pulmonar') || corpus.includes('asma') || corpus.includes('tórax')) fallbackSpec = 'Neumología';

              const specialtyRaw = referral?.specialty || fallbackSpec;
              const specialty = translateSpecialtyName(specialtyRaw, language, t);

              return (
                <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white rounded-3xl p-6 border border-blue-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#0055ff] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Stethoscope size={22} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0055ff]">
                          {t('documentanalyzer_recomendacion_especialista')}
                        </span>
                        <h4 className="text-base font-extrabold text-black mt-0.5">
                          {t('documentanalyzer_derivacion_sugerida')} <span className="text-[#0055ff]">{specialty}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-blue-100 text-xs font-bold text-slate-700 shadow-2xs">
                      <Sparkles size={14} className="text-[#0055ff]" />
                      <span>{t('documentanalyzer_matching_mivor_ai')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenDoctorDirectory?.(specialtyRaw)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0055ff] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Calendar size={16} />
                      <span>{t('documentanalyzer_agendar_cita_con')} {specialty}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(t('docanalyzer_wa_referral', { specialty }));
                        window.open(`https://wa.me/?text=${msg}`, '_blank');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>{t('documentanalyzer_consultar_whatsapp_especialista')}</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Preguntas Sugeridas para el Médico */}
            {analysisResult.preguntas_medico?.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                  <HelpCircle size={16} className="text-[#0055ff]" />
                  <span>{t('documentanalyzer_preguntas_recomendadas_para_tu_medic')}</span>
                </div>

                <div className="space-y-2">
                  {analysisResult.preguntas_medico.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs font-bold text-black">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055ff] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="flex-1 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = analysisResult.preguntas_medico.map((q, i) => `${i + 1}. ${q}`).join('\n');
                      navigator.clipboard.writeText(t('docanalyzer_questions_clipboard', { filename: analysisResult.filename, questions: text }));
                      setCopiedQuestions(true);
                      setTimeout(() => setCopiedQuestions(false), 2500);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedQuestions ? (
                      <>
                        <Check size={15} className="text-emerald-600" />
                        <span className="text-emerald-700">{t('documentanalyzer_copiadas_al_portapapeles')}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>{t('documentanalyzer_copiar_preguntas')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = analysisResult.preguntas_medico.map((q, i) => `${i + 1}. ${q}`).join('\n');
                      const msg = encodeURIComponent(t('docanalyzer_questions_wa', { filename: analysisResult.filename, questions: text }));
                      window.open(`https://wa.me/?text=${msg}`, '_blank');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 size={15} />
                    <span>{t('documentanalyzer_compartir_por_whatsapp')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Aviso Informativo Regulatorio (EU MDR Non-Device) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                🛡️ <strong>{t('documentanalyzer_aviso_informativo')}</strong> {t('documentanalyzer_mivor_ai_es_una_herramienta')}
              </p>
            </div>

            {/* Botones Finales */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => onAskFollowUp?.(analysisResult.summary || analysisResult.filename, analysisResult.filename)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <MessageSquare size={18} />
                <span>{t('documentanalyzer_preguntar_dudas_a_la_ia')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setStep('upload'); setAnalysisResult(null); }}
                className="w-full py-3 px-6 rounded-2xl bg-white border border-slate-200 text-black font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>{t('analyze_another_document')}</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 4. MODAL DE AYUDA Y ASISTENCIA RÁPIDA                                      */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div 
          onClick={() => setShowHelpModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center">
                  <HelpCircle size={20} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-base text-black">{t('documentanalyzer_centro_de_ayuda_mivor_ai')}</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {t('documentanalyzer_tienes_dudas_subiendo_o_comprendiend')}
            </p>

            <div className="space-y-2.5">
              <a 
                href="https://wa.me/34600000000" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-black font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare size={18} className="text-emerald-700 stroke-[2.4]" />
                <div>
                  <p className="font-black text-black text-xs">{t('documentanalyzer_whatsapp_de_soporte_24_7')}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{t('documentanalyzer_respuesta_inmediata')}</p>
                </div>
              </a>

              <button 
                onClick={() => { setShowHelpModal(false); safeNavigate('chat'); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-blue-200 bg-blue-50/70 text-black font-bold text-xs hover:bg-blue-100 transition-colors text-left cursor-pointer"
              >
                <Sparkles size={18} className="text-[#0055ff] stroke-[2.4]" />
                <div>
                  <p className="font-black text-black text-xs">{t('documentanalyzer_consultar_con_la_ia_medica')}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{t('documentanalyzer_resuelve_dudas_sobre_tus_sintomas')}</p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer"
              >
                {t('patient_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BARRA DE NAVEGACIÓN INFERIOR MÓVIL (RÉPLICA EXACTA IMAGEN 3)           */}
      {/* ========================================================================= */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 pb-3 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center text-center">
          
          {/* 1. Inicio */}
          <button 
            type="button" 
            onClick={() => safeNavigate('home')}
            className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            <Home size={20} className="text-black stroke-[2.2]" />
            <span className="text-[10.5px] font-bold text-black">
              {t('home')}
            </span>
          </button>

          {/* 2. Mis consultas */}
          <button 
            type="button" 
            onClick={() => safeNavigate('citas')}
            className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            <Calendar size={20} className="text-black stroke-[2.2]" />
            <span className="text-[10.5px] font-bold text-black">
              {t('patienttopnav_mis_consultas')}
            </span>
          </button>

          {/* 3. Mis documentos (ACTIVO CON ICONO Y TEXTO AZUL OFICIAL) */}
          <button 
            type="button" 
            onClick={() => setStep('upload')}
            className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            <FileText size={21} className="text-[#0055ff] stroke-[2.5]" />
            <span className="text-[10.5px] font-black text-[#0055ff]">
              {t('patienttopnav_mis_documentos')}
            </span>
            <span className="w-6 h-[2px] rounded-full bg-[#0055ff]" />
          </button>

          {/* 4. Mi salud */}
          <button 
            type="button" 
            onClick={() => safeNavigate('history')}
            className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            <Heart size={20} className="text-black stroke-[2.2]" />
            <span className="text-[10.5px] font-bold text-black">
              {t('patienttopnav_mi_salud')}
            </span>
          </button>

          {/* 5. Mi perfil */}
          <button 
            type="button" 
            onClick={() => safeNavigate('more')}
            className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 cursor-pointer"
          >
            <User size={20} className="text-black stroke-[2.2]" />
            <span className="text-[10.5px] font-bold text-black">
              {t('patienttopnav_mi_perfil')}
            </span>
          </button>

        </div>
      </div>

    </div>
  );
};

export default DocumentAnalyzer;