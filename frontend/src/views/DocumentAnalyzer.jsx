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
import jsPDF from 'jspdf';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/bmp', 'image/gif'];

// Documentos de demostración basados exactamente en el diseño aprobado por el jefe
const DEFAULT_SAMPLE_DOCS = [
  {
    id: 'sample-1',
    filename: 'Informe_analisis_sangre.pdf',
    subtitle: 'Análisis de sangre',
    category: 'analitica',
    category_label: 'Analítica',
    created_at: '2026-09-12T10:30:00Z',
    file_size_label: '2,4 MB',
    file_bytes: 2.4 * 1024 * 1024,
    status: 'analizado',
    icon_type: 'pdf-red',
    analysis_result: JSON.stringify({
      resumen: 'Perfil hematológico y bioquímico general. Se observa ligera elevación en niveles de glucosa basal (108 mg/dL) y colesterol LDL, manteniendo parámetros de función hepática y renal en rangos normales.',
      severidad: 'amarillo',
      biomarcadores: [
        { parametro: 'Glucosa Basal', valor: '108', unidad: 'mg/dL', rango_referencia: '70 - 99', min_referencia: '70', max_referencia: '99', estado: 'elevado' },
        { parametro: 'Colesterol Total', valor: '215', unidad: 'mg/dL', rango_referencia: '125 - 200', min_referencia: '125', max_referencia: '200', estado: 'elevado' },
        { parametro: 'Hemoglobina', valor: '14.8', unidad: 'g/dL', rango_referencia: '13.5 - 17.5', min_referencia: '13.5', max_referencia: '17.5', estado: 'normal' },
        { parametro: 'Creatinina', valor: '0.9', unidad: 'mg/dL', rango_referencia: '0.7 - 1.3', min_referencia: '0.7', max_referencia: '1.3', estado: 'normal' }
      ],
      hallazgos: ['Glucemia basal levemente por encima del rango óptimo', 'Perfil lipídico con discreta hipercolesterolemia'],
      medicamentos: [],
      preguntas_medico: ['¿Es necesario realizar una prueba de glucosa posprandial o hemoglobina glicosilada (HbA1c)?', '¿Qué pauta alimenticia conviene adoptar antes de iniciar medicación?']
    })
  },
  {
    id: 'sample-2',
    filename: 'Radiografia_torax.jpg',
    subtitle: 'Radiografía de tórax',
    category: 'radiografia',
    category_label: 'Radiografía',
    created_at: '2026-09-04T15:20:00Z',
    file_size_label: '1,8 MB',
    file_bytes: 1.8 * 1024 * 1024,
    status: 'analizado',
    icon_type: 'jpg-blue',
    document_type: 'medical_image',
    analysis_result: JSON.stringify({
      resumen: 'Radiografía posteroanterior de tórax. Campos pulmonares bien ventilados sin infiltrados focales ni consolidaciones agudas. Silueta cardiomediastínica de morfología y tamaño normal. Ángulos costofrénicos libres.',
      severidad: 'verde',
      hallazgos: ['Parénquima pulmonar sin alteraciones activas', 'Silueta cardiaca dentro de límites normales'],
      medicamentos: [],
      biomarcadores: [],
      preguntas_medico: ['¿El estudio descarta procesos respiratorios agudos?']
    })
  },
  {
    id: 'sample-3',
    filename: 'Receta_medicacion.pdf',
    subtitle: 'Receta médica',
    category: 'receta',
    category_label: 'Receta',
    created_at: '2026-09-04T09:15:00Z',
    file_size_label: '320 KB',
    file_bytes: 320 * 1024,
    status: 'analizado',
    icon_type: 'pdf-purple',
    analysis_result: JSON.stringify({
      resumen: 'Prescripción médica emitida para tratamiento de hiperreactividad bronquial y síntomas alérgicos estacionales. Pauta activa por 14 días.',
      severidad: 'verde',
      medicamentos: ['Salbutamol 100mcg (1 inhalación cada 8h)', 'Loratadina 10mg (1 comprimido cada 24h por la noche)'],
      hallazgos: ['Pauta de medicación pautada para 14 días', 'Sin interacciones farmacológicas desfavorables detectadas'],
      biomarcadores: [],
      preguntas_medico: ['¿Debo suspender la medicación si los síntomas remiten antes de los 14 días?']
    })
  },
  {
    id: 'sample-4',
    filename: 'Informe_medico_completo.pdf',
    subtitle: 'Informe médico',
    category: 'informe',
    category_label: 'Informe',
    created_at: '2026-09-01T11:45:00Z',
    file_size_label: '3,1 MB',
    file_bytes: 3.1 * 1024 * 1024,
    status: 'analizado',
    icon_type: 'pdf-green',
    analysis_result: JSON.stringify({
      resumen: 'Informe de revisión clínica anual y medicina preventiva. Evaluación cardiovascular y osteomuscular favorable. Tensión arterial 118/75 mmHg.',
      severidad: 'verde',
      hallazgos: ['Auscultación cardiopulmonar normal', 'Tensión arterial en rango óptimo'],
      medicamentos: [],
      biomarcadores: [],
      preguntas_medico: ['¿Cuándo corresponde el próximo chequeo preventivo general?']
    })
  },
  {
    id: 'sample-5',
    filename: 'Analisis_orina.jpg',
    subtitle: 'Análisis de orina',
    category: 'analitica',
    category_label: 'Analítica',
    created_at: '2026-08-28T08:00:00Z',
    file_size_label: '1,2 MB',
    file_bytes: 1.2 * 1024 * 1024,
    status: 'analizado',
    icon_type: 'jpg-blue',
    document_type: 'medical_image',
    analysis_result: JSON.stringify({
      resumen: 'Sedimento y tira reactiva de orina. Densidad y pH en valores estándar. Ausencia de leucocitos, nitritos o bacterias patógenas.',
      severidad: 'verde',
      biomarcadores: [
        { parametro: 'pH Urinario', valor: '6.2', unidad: '', rango_referencia: '4.5 - 8.0', min_referencia: '4.5', max_referencia: '8.0', estado: 'normal' },
        { parametro: 'Densidad', valor: '1.020', unidad: '', rango_referencia: '1.005 - 1.030', min_referencia: '1.005', max_referencia: '1.030', estado: 'normal' }
      ],
      hallazgos: ['Sedimento urinario negativo para infección'],
      medicamentos: [],
      preguntas_medico: ['¿Los resultados descartan afecciones renales agudas?']
    })
  }
];

const BiomarkerRangeMeter = ({ bm }) => {
  const val = parseFloat(bm.valor);
  const isNum = !isNaN(val);
  const status = (bm.estado || 'normal').toLowerCase();

  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={11} /> Normal
    </span>
  );
  if (status === 'elevado' || status === 'alto') {
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
            status === 'elevado' || status === 'alto' ? 'bg-red-600' : status === 'bajo' ? 'bg-blue-600' : 'bg-emerald-600'
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

const DocumentAnalyzer = ({
  onBack,
  apiUrl,
  authHeaders,
  onAskFollowUp,
  onOpenDoctorDirectory,
  onNavigate,
  userProfile,
  username
}) => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [openDocMenuId, setOpenDocMenuId] = useState(null);

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

  // Lista unificada: documentos reales subidos + muestras predeterminadas de la maqueta
  const allDocuments = useMemo(() => {
    // Si el backend ya tiene documentos, los adaptamos
    const formattedRealDocs = documents.map(doc => {
      const ext = (doc.filename || '').split('.').pop().toLowerCase();
      let iconType = 'pdf-red';
      let category = 'informe';
      let categoryLabel = 'Informe';
      let sub = 'Documento médico';

      if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || doc.document_type === 'medical_image') {
        iconType = 'jpg-blue';
        category = 'radiografia';
        categoryLabel = 'Radiografía';
        sub = 'Imagen médica';
      } else if (doc.filename?.toLowerCase().includes('receta')) {
        iconType = 'pdf-purple';
        category = 'receta';
        categoryLabel = 'Receta';
        sub = 'Receta médica';
      } else if (doc.filename?.toLowerCase().includes('analisis') || doc.filename?.toLowerCase().includes('sangre') || doc.filename?.toLowerCase().includes('orina')) {
        iconType = 'pdf-red';
        category = 'analitica';
        categoryLabel = 'Analítica';
        sub = 'Prueba de laboratorio';
      }

      return {
        ...doc,
        subtitle: sub,
        category,
        category_label: categoryLabel,
        icon_type: iconType,
        file_size_label: '2,0 MB',
        file_bytes: 2 * 1024 * 1024,
        status: 'analizado'
      };
    });

    // Si el usuario no tiene documentos en backend, usamos los 5 documentos exactos del diseño del jefe
    if (formattedRealDocs.length === 0) {
      return DEFAULT_SAMPLE_DOCS;
    }

    // Si el usuario tiene documentos reales, los mostramos primero y agregamos los de muestra que no se repitan
    return [...formattedRealDocs, ...DEFAULT_SAMPLE_DOCS.filter(s => !formattedRealDocs.some(r => r.filename === s.filename))];
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

  // Espacio utilizado calculado
  const totalBytesUsed = useMemo(() => {
    return allDocuments.reduce((acc, doc) => acc + (doc.file_bytes || 1.5 * 1024 * 1024), 0);
  }, [allDocuments]);

  const usedMb = (totalBytesUsed / (1024 * 1024)).toFixed(0);
  const totalMb = 500;
  const usedPercentage = Math.min(Math.round((usedMb / totalMb) * 100), 100);

  const uploadAndAnalyze = async (file) => {
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|bmp|gif)$/i)) {
      setError(t("unsupported_format", { fileName: file.name }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) { setError(t("file_too_large")); return; }

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

  const generateClientSidePdf = (data) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = 50;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 85, 255);
      doc.text('MIVOR.ai - INFORME CLÍNICO INTELIGENTE', margin, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} | Documento: ${data.filename || 'Estudio Clínico'}`, margin, y);
      y += 20;

      doc.setDrawColor(0, 85, 255);
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

      if (data.medicamentos?.length > 0) {
        if (y > 730) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('3. MEDICAMENTOS DETECTADOS', margin, y);
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        data.medicamentos.forEach((m) => {
          doc.text(`• ${m}`, margin + 10, y);
          y += 14;
        });
        y += 10;
      }

      const safeName = (data.filename || 'informe_mivor').replace(/[^a-zA-Z0-9_\.-]/g, '_');
      doc.save(`informe_mivor_${safeName}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult) return;
    setIsGeneratingPdf(true);
    try {
      generateClientSidePdf(analysisResult);
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70">Analítica</span>;
      case 'radiografia':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0055ff] border border-blue-200/70">Radiografía</span>;
      case 'receta':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200/70">Receta</span>;
      case 'informe':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">Informe</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/70">Documento</span>;
    }
  };

  const patientInitials = useMemo(() => {
    const name = userProfile?.full_name || username || 'María Pérez';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [userProfile, username]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 lg:pb-12 select-none">

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR SUPERIOR (EXCLUSIVA DESKTOP - RÉPLICA EXACTA IMAGEN 2)      */}
      {/* ========================================================================= */}
      <nav className="hidden lg:block w-full bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Logo Marca */}
          <div 
            onClick={() => safeNavigate('home')} 
            className="flex items-center cursor-pointer select-none"
          >
            <img 
              src="/assets/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-8 w-auto object-contain" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </div>

          {/* Enlaces Centrales con Iconos Oficiales */}
          <div className="flex items-center gap-1 xl:gap-2">
            
            {/* Inicio */}
            <button
              type="button"
              onClick={() => safeNavigate('home')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Home size={18} className="stroke-[2.2]" />
              <span>Inicio</span>
            </button>

            {/* Mis consultas */}
            <button
              type="button"
              onClick={() => safeNavigate('citas')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Calendar size={18} className="stroke-[2.2]" />
              <span>Mis consultas</span>
            </button>

            {/* Mis documentos (Activo con pestaña azul oficial) */}
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold text-[#0055ff] bg-blue-50/80 border border-blue-100 shadow-2xs transition-all cursor-pointer"
            >
              <FileText size={18} className="stroke-[2.4]" />
              <span>Mis documentos</span>
            </button>

            {/* Mi salud */}
            <button
              type="button"
              onClick={() => safeNavigate('history')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Heart size={18} className="stroke-[2.2]" />
              <span>Mi salud</span>
            </button>

            {/* Mi perfil */}
            <button
              type="button"
              onClick={() => safeNavigate('more')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <User size={18} className="stroke-[2.2]" />
              <span>Mi perfil</span>
            </button>

          </div>

          {/* Controles Derecha: Ayuda + Notificaciones + Perfil Usuario */}
          <div className="flex items-center gap-4">
            
            {/* Botón ¿Necesitas ayuda? */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0055ff] transition-colors cursor-pointer"
            >
              <HelpCircle size={17} className="stroke-[2.2]" />
              <span>¿Necesitas ayuda?</span>
            </button>

            {/* Campana de Notificaciones con punto rojo */}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all relative cursor-pointer shadow-2xs"
            >
              <Bell size={18} className="stroke-[2.2]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Avatar Paciente con Iniciales Púrpura (MP María Pérez) */}
            <div 
              onClick={() => safeNavigate('more')}
              className="flex items-center gap-2.5 pl-2 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#8b5cf6] text-white font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden border-2 border-white ring-1 ring-purple-200">
                {userProfile?.photo_url ? (
                  <img src={userProfile.photo_url} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span>{patientInitials}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-800 group-hover:text-[#0055ff] transition-colors">
                <span>{userProfile?.full_name || username || 'María Pérez'}</span>
                <ChevronDown size={14} className="stroke-[2.5]" />
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. HEADER MÓVIL SUPERIOR (EXCLUSIVA MÓVIL - RÉPLICA EXACTA IMAGEN 3)      */}
      {/* ========================================================================= */}
      <header className="block lg:hidden w-full px-4 py-3 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          
          <div onClick={() => safeNavigate('home')} className="flex items-center cursor-pointer">
            <img 
              src="/assets/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-7 w-auto object-contain" 
              onError={(e) => { e.target.src = '/logo.png'; }}
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
                <img src={userProfile.photo_url} alt="Perfil" className="w-full h-full object-cover" />
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
                  Mis documentos médicos
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Sube y gestiona tus informes, pruebas y documentos para que estén disponibles en tus consultas.
                </p>
              </div>

              {/* Tarjeta de Seguridad Superior Derecha */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs max-w-md shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055ff] flex items-center justify-center shrink-0 border border-blue-100">
                  <ShieldCheck size={22} className="stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-black leading-tight">
                    Tu información está segura
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    Tus documentos están protegidos con los más altos estándares de seguridad y privacidad.
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
                  />

                  {/* Icono de Nube Azul en Círculo */}
                  <div className="w-14 h-14 rounded-full bg-[#0055ff] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 group-hover:scale-105 transition-transform">
                    <CloudUpload size={28} className="stroke-[2.4]" />
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-black">
                    Arrastra tus archivos aquí
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 mb-2">
                    o haz clic para seleccionarlos
                  </p>
                  
                  <p className="text-[11px] text-slate-400 font-medium max-w-sm mb-5">
                    Puedes subir archivos en formato PDF, JPG, PNG, DICOM. Tamaño máximo 10 MB por archivo.
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
                    <span>Seleccionar archivos</span>
                  </button>
                </div>

                {/* Encabezado de la Sección de Documentos con Buscador y Filtro */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-black text-black">
                      Mis documentos
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff] text-xs font-bold border border-blue-200/80">
                      {filteredDocuments.length} archivos
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
                        placeholder="Buscar documento, fecha o tipo..."
                        className="w-full pl-9 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0055ff] shadow-2xs"
                      />
                    </div>

                    {/* Botón de Ordenación */}
                    <button 
                      type="button"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                      title={sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
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
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">Nombre del archivo</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">Tipo</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">Fecha</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">Tamaño</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600">Estado</th>
                        <th className="py-3.5 px-4 font-extrabold text-slate-600 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredDocuments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                            No se encontraron documentos con los filtros aplicados.
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
                                    {doc.subtitle || 'Documento clínico'}
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
                              {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 sept 2026'}
                            </td>

                            {/* Tamaño */}
                            <td className="py-3 px-4 text-slate-500 font-medium text-[11.5px]">
                              {doc.file_size_label || '2,4 MB'}
                            </td>

                            {/* Estado Analizado */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ebfaf3] text-[#028a4c] border border-[#c6f3db]">
                                <CheckCircle2 size={13} className="stroke-[2.5]" />
                                <span>Analizado</span>
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => handleHistoryClick(doc)}
                                  className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-[#0055ff] flex items-center justify-center transition-colors cursor-pointer"
                                  title="Ver Análisis Clínico"
                                >
                                  <Eye size={16} className="stroke-[2.2]" />
                                </button>
                                
                                <button 
                                  type="button"
                                  onClick={() => {
                                    handleHistoryClick(doc);
                                  }}
                                  className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-[#0055ff] flex items-center justify-center transition-colors cursor-pointer"
                                  title="Descargar Informe"
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
                                        <Eye size={14} /> Ver análisis
                                      </button>
                                      <button 
                                        onClick={() => { setOpenDocMenuId(null); handleHistoryClick(doc); }}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0055ff] flex items-center gap-2"
                                      >
                                        <Download size={14} /> Descargar PDF
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setOpenDocMenuId(null);
                                          onAskFollowUp?.(doc.filename, doc.filename);
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0055ff] flex items-center gap-2"
                                      >
                                        <MessageSquare size={14} /> Preguntar a MIVOR
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
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 sept 2026'} · {doc.file_size_label || '2,4 MB'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ebfaf3] text-[#028a4c] border border-[#c6f3db]">
                          <CheckCircle2 size={12} className="stroke-[2.5]" />
                          <span>Analizado</span>
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
                      Tipos de documentos
                    </h3>
                    {selectedCategory !== 'all' && (
                      <button 
                        onClick={() => setSelectedCategory('all')} 
                        className="text-[11px] text-[#0055ff] font-bold hover:underline"
                      >
                        Ver todos
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
                      <span className="text-xs font-bold text-black leading-tight">Informes</span>
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
                      <span className="text-xs font-bold text-black leading-tight">Radiografías</span>
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
                      <span className="text-xs font-bold text-black leading-tight">Recetas</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF, Foto</span>
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
                      <span className="text-xs font-bold text-black leading-tight">Analíticas</span>
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
                      <span className="text-xs font-bold text-black leading-tight">Incapacidades</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF, Foto</span>
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
                      <span className="text-xs font-bold text-black leading-tight">Otros</span>
                      <span className="text-[10px] text-slate-400 font-medium">PDF, JPG, PNG</span>
                    </button>

                  </div>
                </div>

                {/* Card 2: Espacio Utilizado */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0055ff] flex items-center justify-center border border-blue-100">
                        <Database size={20} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-black">Espacio utilizado</h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {usedMb} MB de {totalMb} MB
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {usedPercentage}%
                    </span>
                  </div>

                  {/* Barra de Progreso Azul */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#0055ff] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(usedPercentage, 5)}%` }}
                    />
                  </div>
                </div>

                {/* Card 3: Consejo MIVOR */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                    <Info size={18} className="stroke-[2.4]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-black">Consejo</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Mantén tus documentos organizados y actualizados para que tu médico pueda ofrecerte una mejor atención.
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
                MIVOR.ai está leyendo tu documento
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Extrayendo biomarcadores, diagnósticos y generando un informe médico claro.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {[
                "Extrayendo texto con OCR de alta resolución",
                "Analizando biomarcadores y rangos de referencia",
                "Redactando resumen explicativo para el paciente"
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
                <span>Volver a Mis documentos</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                <span>Descargar Informe PDF</span>
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
                    {analysisResult.is_image ? 'Estudio de Imagen / Radiografía' : 'Informe Médico Digitalizado'}
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
                  <span>Resumen Clínico</span>
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
                      Biomarcadores y Parámetros Analíticos
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff] border border-blue-200">
                    {analysisResult.biomarcadores.length} parámetros
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
                      Evolución y Comparativa Histórica
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0055ff]">
                    {analysisResult.comparativa_historica.length} vinculados
                  </span>
                </div>

                <div className="h-60 w-full pt-2">
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
                  <span>Medicamentos y Pautas Detectadas</span>
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

              const specialty = referral?.specialty || fallbackSpec;

              return (
                <div className="bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white rounded-3xl p-6 border border-blue-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#0055ff] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Stethoscope size={22} className="stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0055ff]">
                          Recomendación Especialista
                        </span>
                        <h4 className="text-base font-extrabold text-black mt-0.5">
                          Derivación Sugerida: <span className="text-[#0055ff]">{specialty}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-blue-100 text-xs font-bold text-slate-700 shadow-2xs">
                      <Sparkles size={14} className="text-[#0055ff]" />
                      <span>Matching MIVOR.ai</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenDoctorDirectory?.(specialty)}
                      className="w-full py-3 px-4 rounded-xl bg-[#0055ff] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Calendar size={16} />
                      <span>Agendar Cita con {specialty}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(`Hola, acabo de analizar un estudio en MIVOR.ai con recomendación para ${specialty}. Me gustaría consultar disponibilidad.`);
                        window.open(`https://wa.me/?text=${msg}`, '_blank');
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>Consultar WhatsApp Especialista</span>
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
                  <span>Preguntas recomendadas para tu médico</span>
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
                      navigator.clipboard.writeText(`Preguntas sobre mi estudio médico (${analysisResult.filename}):\n\n${text}`);
                      setCopiedQuestions(true);
                      setTimeout(() => setCopiedQuestions(false), 2500);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedQuestions ? (
                      <>
                        <Check size={15} className="text-emerald-600" />
                        <span className="text-emerald-700">¡Copiadas al portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copiar preguntas</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = analysisResult.preguntas_medico.map((q, i) => `${i + 1}. ${q}`).join('\n');
                      const msg = encodeURIComponent(`Hola doctor(a), tengo estas consultas sobre mi informe médico (${analysisResult.filename}):\n\n${text}`);
                      window.open(`https://wa.me/?text=${msg}`, '_blank');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 size={15} />
                    <span>Compartir por WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* Botones Finales */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => onAskFollowUp?.(analysisResult.summary || analysisResult.filename, analysisResult.filename)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <MessageSquare size={18} />
                <span>Preguntar dudas a la IA sobre este documento</span>
              </button>

              <button
                type="button"
                onClick={() => { setStep('upload'); setAnalysisResult(null); }}
                className="w-full py-3 px-6 rounded-2xl bg-white border border-slate-200 text-black font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Analizar otro documento</span>
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
                <h3 className="font-black text-base text-black">Centro de Ayuda MIVOR.ai</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              ¿Tienes dudas subiendo o interpretando tus análisis? Nuestro equipo clínico y de soporte técnico está disponible 24/7.
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
                  <p className="font-black text-black text-xs">WhatsApp de Soporte 24/7</p>
                  <p className="text-[11px] text-slate-500 font-medium">Respuesta inmediata</p>
                </div>
              </a>

              <button 
                onClick={() => { setShowHelpModal(false); safeNavigate('chat'); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-blue-200 bg-blue-50/70 text-black font-bold text-xs hover:bg-blue-100 transition-colors text-left cursor-pointer"
              >
                <Sparkles size={18} className="text-[#0055ff] stroke-[2.4]" />
                <div>
                  <p className="font-black text-black text-xs">Consultar con la IA Médica</p>
                  <p className="text-[11px] text-slate-500 font-medium">Resuelve dudas sobre tus síntomas o estudios</p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer"
              >
                Cerrar
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
              Inicio
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
              Mis consultas
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
              Mis documentos
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
              Mi salud
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
              Mi perfil
            </span>
          </button>

        </div>
      </div>

    </div>
  );
};

export default DocumentAnalyzer;