import React, { useRef, useEffect, useState } from "react";
import { 
  ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, FileText, Loader2, Sparkles, X, 
  ShieldCheck, AlertCircle, Activity, Stethoscope, Plus, History, MessageSquare, 
  MessageCircle, Search, HelpCircle, Bell, ChevronDown, Brain, Pill, Clock, 
  User, LogOut, ArrowRight, CheckCircle2, Menu, UploadCloud, Lock,
  ThumbsUp, ThumbsDown, CheckCheck
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const DEFAULT_CONVERSATIONS = [
  { id: 'c1', title: 'Dolor abdominal', time: '10:24', preview: 'He tenido dolor en la parte..' },
  { id: 'c2', title: 'Resultados analítica', time: '09/09', preview: '¿Puedes explicarme estos...' },
  { id: 'c3', title: 'Dudas medicación', time: '08/09', preview: '¿Es seguro tomar...' },
  { id: 'c4', title: 'Informe TAC', time: '06/09', preview: 'Te adjunto el informe...' },
  { id: 'c5', title: 'Control de tensión', time: '04/09', preview: 'Mis últimas mediciones son...' },
  { id: 'c6', title: 'Vacunas para viajar', time: '02/09', preview: '¿Qué vacunas necesito...' },
  { id: 'c7', title: 'Chequeo general', time: '01/09', preview: '¿Qué pruebas me recomiendas...' },
  { id: 'c8', title: 'Colesterol', time: '28/08', preview: '¿Cómo puedo mejorarlo...' }
];

const DEMO_CONVERSATIONS_MESSAGES = {
  'c1': [
    {
      id: 'm1',
      type: 'user',
      text: 'Hola, llevo unos días con dolor en la parte baja del abdomen.\n¿A qué puede deberse?',
      time: '10:24'
    },
    {
      id: 'm2',
      type: 'assistant',
      text: 'Hola Antonio,\n\nEl dolor en la parte baja del abdomen puede tener varias causas, y para orientarte mejor necesito conocer algunos detalles. Puede estar relacionado con problemas digestivos, urinarios, musculares o, en algunos casos, con otras condiciones médicas.\n\nPara ayudarte de forma más precisa, ¿podrías indicarme:\n\n* Desde cuándo tienes el dolor?\n* Cómo describirías el dolor (punzante, continuo, intermitente, leve o intenso)?\n* ¿Se acompaña de otros síntomas como fiebre, náuseas, cambios en el hábito intestinal o al orinar?\n* ¿Hay alguna situación que lo empeore o lo alivie?\n\nCon esta información podré darte una orientación más completa.',
      time: '10:25'
    },
    {
      id: 'm3',
      type: 'user',
      text: 'El dolor comenzó hace 3 días, es intermitente y se siente más al final del día. También tengo algo de hinchazón. No tengo fiebre.',
      time: '10:26'
    }
  ],
  'c2': [
    {
      id: 'm2_1',
      type: 'user',
      text: 'Hola MIVOR, me acaban de entregar los resultados de mi análisis de sangre. ¿Podrías ayudarme a interpretarlos?',
      time: '09:15'
    },
    {
      id: 'm2_2',
      type: 'assistant',
      text: '¡Hola Antonio! Con gusto te ayudo a interpretar tu analítica sanguínea.\n\nPuedes indicarme o adjuntar los valores principales que llamen tu atención (como glucosa, colesterol, hemoglobina, leucocitos o transaminasas) junto con sus rangos de referencia para darte una explicación clara y orientativa paso a paso.',
      time: '09:16'
    }
  ],
  'c3': [
    {
      id: 'm3_1',
      type: 'user',
      text: 'Tengo dudas sobre cómo tomar el omeprazol. ¿Debe ser antes o después del desayuno?',
      time: '08:47'
    },
    {
      id: 'm3_2',
      type: 'assistant',
      text: 'Hola Antonio.\n\nPor regla general, el **omeprazol** se recomienda tomar en ayunas, aproximadamente **30 a 60 minutos antes del desayuno** con un vaso de agua.\n\n* De esta manera, el fármaco se absorbe adecuadamente antes de que las células del estómago comiencen a producir ácido con la comida.\n* Evita masticar o triturar las cápsulas.\n* Si tienes otra pauta prescrita por tu médico de cabecera, siempre sigue prioritariamente su indicación.',
      time: '08:48'
    }
  ],
  'c4': [
    {
      id: 'm4_1',
      type: 'user',
      text: 'Te adjunto el informe de mi TAC abdominal. En la conclusión indica: "Sin hallazgos de significación patológica aguda". ¿Qué significa?',
      time: '18:32'
    },
    {
      id: 'm4_2',
      type: 'assistant',
      text: 'Hola Antonio.\n\nEsa conclusión es **muy tranquilizadora**:\n\n* Significa que en las imágenes no se observan inflamaciones agudas, hemorragias, perforaciones ni lesiones de urgencia en los órganos examinados.\n* Es el equivalente a que el examen no detectó problemas médicos urgentes.\n* Tu médico tratante correlacionará este resultado con tus síntomas para darte el alta o el seguimiento adecuado.',
      time: '18:34'
    }
  ],
  'c5': [
    {
      id: 'm5_1',
      type: 'user',
      text: 'Mis últimas mediciones de tensión han sido 138/88 mmHg. ¿Se considera hipertensión?',
      time: '16:20'
    },
    {
      id: 'm5_2',
      type: 'assistant',
      text: 'Hola Antonio.\n\nValores de 138/88 mmHg se clasifican como **presión arterial normal-alta** (o prehipertensión):\n\n* Una sola toma no confirma diagnóstico; la tensión varía con estrés, café o cansancio.\n* Se aconseja registrar mediciones durante 5 a 7 días, por la mañana y por la tarde en reposo.\n* Moderar la sal, mantenerte activo y comentar el registro con tu médico te ayudará a prevenir elevaciones futuras.',
      time: '16:22'
    }
  ],
  'c6': [
    {
      id: 'm6_1',
      type: 'user',
      text: 'Voy a viajar a Tailandia el próximo mes. ¿Qué vacunas o precauciones sanitarias son recomendables?',
      time: '12:14'
    },
    {
      id: 'm6_2',
      type: 'assistant',
      text: '¡Hola Antonio! Excelente destino. Para viajar a Tailandia se suele recomendar:\n\n* Actualizar vacunas del calendario general (tétanos/difteria, triple vírica).\n* Vacunas específicas para viajes: **Hepatitis A** y en ocasiones **Fiebre Tifoidea**.\n* Protección estricta contra mosquitos (repelente con DEET) para prevenir dengue.\n* Beber siempre agua embotellada y consultar a un Centro de Vacunación Internacional 4 semanas antes.',
      time: '12:16'
    }
  ],
  'c7': [
    {
      id: 'm7_1',
      type: 'user',
      text: '¿Qué pruebas médicas son las más recomendadas para un chequeo de rutina preventivo?',
      time: '09:09'
    },
    {
      id: 'm7_2',
      type: 'assistant',
      text: 'Hola Antonio.\n\nPara un chequeo médico preventivo anual en adultos se suele pautar:\n\n* **Analítica general de sangre:** hemograma, glucosa, perfil lipídico (colesterol total, HDL, LDL, triglicéridos), función renal y hepática.\n* **Análisis de orina:** descartar infecciones o proteinuria.\n* **Examen físico:** control de tensión arterial, peso e índice de masa corporal.\n* Pruebas complementarias según edad y antecedentes (ej. electrocardiograma o cribado colorrectal).',
      time: '09:11'
    }
  ],
  'c8': [
    {
      id: 'm8_1',
      type: 'user',
      text: 'Tengo el colesterol LDL algo alto (145 mg/dL). ¿Cómo puedo mejorarlo de forma natural?',
      time: '07/09'
    },
    {
      id: 'm8_2',
      type: 'assistant',
      text: 'Hola Antonio.\n\nUn valor de LDL en 145 mg/dL puede responder muy favorablemente a cambios en el estilo de vida:\n\n* **Aumenta fibra soluble:** avena, lentejas, manzanas y semillas de chía ayudan a atrapar el colesterol en el intestino.\n* **Prioriza grasas saludables:** aceite de oliva virgen extra, frutos secos y pescado azul (rico en omega-3).\n* **Reduce ultraprocesados:** bollería, fritos y embutidos.\n* **Ejercicio aeróbico:** al menos 150 minutos semanales de caminata rápida o bicicleta.',
      time: '07/09'
    }
  ]
};

const PatientChat = ({
  messages = [],
  inputMessage,
  setInputMessage,
  handleSend,
  isLoading,
  onBack,
  imageInputRef,
  pdfInputRef,
  handleImageChange,
  handlePdfChange,
  selectedImagePreview,
  selectedPdfName,
  onClearAttachment,
  patientProfile,
  sessions,
  loadSession,
  startNewSession,
  currentSessionId,
  onOpenDoctorDirectory,
  onNavigate,
  onLogout,
  username
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConsultation, setIsNewConsultation] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState(currentSessionId || null);
  const [feedbacks, setFeedbacks] = useState({});
  const [localMessages, setLocalMessages] = useState([]);

  const { t, language } = useLanguage();
  const internalImageRef = useRef(null);
  const internalPdfRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const actualImageRef = imageInputRef || internalImageRef;
  const actualPdfRef = pdfInputRef || internalPdfRef;

  const displayName = patientProfile?.full_name || username || "Antonio Villena";
  const firstName = displayName.split(' ')[0] || "Antonio";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localMessages, isLoading]);

  const handleFeedback = (idx, type) => {
    setFeedbacks(prev => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  const formatMsgTime = (msg) => {
    if (msg.time) return msg.time;
    if (msg.created_at) {
      try {
        const d = new Date(msg.created_at);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '10:24';
      }
    }
    return '10:24';
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('browser_not_support_voice_recognition') || 'Tu navegador no soporta reconocimiento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    const langCodeMap = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', ar: 'ar-SA' };
    recognition.lang = langCodeMap[language] || 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert(t('microphone_permission_denied') || 'Permiso de micrófono denegado en tu navegador.');
      }
    };
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { setIsListening(false); }
  };

  const extractSpecialty = (raw) => {
    if (!raw) return 'Medicina General';
    const text = String(raw);
    const match = text.match(/(?:Especialidad|Especialista|Derivaci[óo]n)(?:\s+a\s+la\s+que\s+deber[íi]a\s+acudir)?(?:\s+sugerida|\s+recomendada)?\s*[:*]\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:\.|\n|\*|$)/i);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/^\*+|\*+$/g, '');
      if (candidate.length > 2 && candidate.length < 35) {
        return candidate;
      }
    }
    const keywords = ['Cardiología', 'Traumatología', 'Dermatología', 'Neurología', 'Pediatría', 'Ginecología', 'Oftalmología', 'Psiquiatría', 'Medicina General'];
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
        return kw;
      }
    }
    return 'Medicina General';
  };

  const formatSessionTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  // Sync selectedConversationId with currentSessionId from App
  useEffect(() => {
    if (currentSessionId) {
      setSelectedConversationId(currentSessionId);
      setIsNewConsultation(false);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setIsNewConsultation(false);
    }
  }, [messages]);

  // Determine conversation items to display in sidebar: real sessions if available, or demo items
  const hasRealSessions = Array.isArray(sessions) && sessions.length > 0;
  const conversationList = hasRealSessions
    ? sessions.map(s => ({
        id: s.id,
        title: s.title || 'Consulta Médica',
        time: formatSessionTime(s.created_at),
        preview: s.preview || 'Consulta con MIVOR.ai',
        isReal: true
      }))
    : DEFAULT_CONVERSATIONS.map(d => ({ ...d, isReal: false }));

  const handleSelectConversation = (item) => {
    setSelectedConversationId(item.id);
    setIsNewConsultation(false);

    if (item.isReal) {
      setLocalMessages([]);
      if (loadSession) {
        loadSession(item.id);
      }
    } else {
      // Demo item: reset global messages so demo localMessages takes over
      if (startNewSession) startNewSession();
      setTimeout(() => {
        setSelectedConversationId(item.id);
        setIsNewConsultation(false);
        if (DEMO_CONVERSATIONS_MESSAGES[item.id]) {
          setLocalMessages(DEMO_CONVERSATIONS_MESSAGES[item.id]);
        } else {
          setLocalMessages([]);
        }
      }, 30);
    }
    setMobileSidebarOpen(false);
  };

  const handleStartNew = () => {
    setSelectedConversationId(null);
    setIsNewConsultation(true);
    setLocalMessages([]);
    if (startNewSession) startNewSession();
  };

  // Filtered conversations
  const filteredConversations = conversationList.filter(it => 
    !searchQuery.trim() || 
    it.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    it.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMessages = (messages && messages.length > 0)
    ? messages
    : localMessages;

  return (
    <div className="h-screen w-full bg-white text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full shrink-0 border-b border-slate-100/90 bg-white/95 backdrop-blur-xs z-40">
        <div className="w-full px-3 sm:px-5 lg:px-7 py-2 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Mobile menu hamburger toggle */}
            <button 
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Abrir conversaciones"
            >
              <Menu size={18} />
            </button>

            <div 
              className="flex items-center cursor-pointer group shrink-0" 
              onClick={() => onBack ? onBack() : onNavigate?.('home')}
            >
              <img 
                src="/images/mivor_nav_logo.png" 
                alt="MIVOR.ai - Better Health. Brighter Lives." 
                className="h-6 sm:h-7 lg:h-7.5 w-auto object-contain transition-transform" 
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
          </div>

          {/* Center Navigation Tabs (EXCLUDING VIDEOCONFERENCIA PER USER REQUEST) */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-6 2xl:gap-8">
            {/* Tab 1: Nueva consulta (Activo) */}
            <button 
              type="button"
              onClick={handleStartNew}
              className="relative flex items-center gap-1.5 py-1 text-xs xl:text-[13px] font-semibold text-[#005dff] transition-colors cursor-pointer group whitespace-nowrap shrink-0"
            >
              <MessageSquare size={15} className="stroke-[2.2]" />
              <span>Nueva consulta</span>
              <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-[#005dff] rounded-full" />
            </button>

            {/* Tab 2: Subir análisis */}
            <button 
              type="button"
              onClick={() => onNavigate ? onNavigate('documents') : actualPdfRef.current?.click()}
              className="flex items-center gap-1.5 py-1 text-xs xl:text-[13px] font-medium text-slate-700 hover:text-[#005dff] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileText size={15} className="stroke-[2]" />
              <span>Subir análisis</span>
            </button>

            {/* Tab 3: Encontrar médico */}
            <button 
              type="button"
              onClick={() => onOpenDoctorDirectory ? onOpenDoctorDirectory() : onNavigate?.('doctors')}
              className="flex items-center gap-1.5 py-1 text-xs xl:text-[13px] font-medium text-slate-700 hover:text-[#005dff] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <User size={15} className="stroke-[2]" />
              <span>Encontrar médico</span>
            </button>

            {/* Tab 4: Mi historial */}
            <button 
              type="button"
              onClick={() => onNavigate ? onNavigate('history') : onNavigate?.('patients')}
              className="flex items-center gap-1.5 py-1 text-xs xl:text-[13px] font-medium text-slate-700 hover:text-[#005dff] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Clock size={15} className="stroke-[2]" />
              <span>Mi historial</span>
            </button>
          </nav>

          {/* Right Controls: Idioma, Help, Bell, User profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageSelector variant="pill" />

            {/* Help Button */}
            <button 
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Ayuda y soporte"
            >
              <HelpCircle size={14} className="text-slate-700" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => onNavigate ? onNavigate('search') : null} 
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Notificaciones"
              >
                <Bell size={14} className="text-slate-700" />
              </button>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </div>

            {/* User Profile Capsule Badge */}
            <div className="relative">
              <div 
                onClick={() => setShowUserMenu(prev => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1 pr-2 py-0.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all select-none"
              >
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                  <img 
                    src={patientProfile?.photo_url || "/images/mivor_avatar_default.png"} 
                    alt="Perfil" 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.src = '/logo.png'; }}
                  />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[95px] xl:max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[9.5px] text-emerald-600 font-semibold flex items-center gap-1 leading-none mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Identidad verificada
                  </span>
                </div>
                <ChevronDown size={13} className="text-slate-400" />
              </div>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setShowUserMenu(false)} 
                  />

                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100/60 mb-1.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{patientProfile?.email || "Paciente verificado"}</p>
                    </div>

                    <button 
                      type="button"
                      onClick={() => { setShowUserMenu(false); onNavigate ? onNavigate('history') : null; }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left cursor-pointer"
                    >
                      <User size={15} className="text-[#005dff]" />
                      <span>{t('patient_menu_history_title') || 'Mi historial de salud'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setShowUserMenu(false); onNavigate ? onNavigate('documents') : null; }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left cursor-pointer"
                    >
                      <FileText size={15} className="text-teal-600" />
                      <span>{t('patient_menu_docs_title') || 'Mis analíticas e informes'}</span>
                    </button>

                    <div className="pt-1.5 mt-1 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => { setShowUserMenu(false); if (onLogout) onLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={15} className="text-rose-600" />
                        <span>{t('patient_menu_logout_title') || 'Cerrar sesión'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CHAT CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs" 
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR ("Últimas conversaciones") */}
        <aside className={`
          fixed lg:static top-[52px] bottom-0 left-0 z-30
          w-64 lg:w-72 xl:w-80 bg-white border-r border-slate-200/80 flex flex-col shrink-0
          transition-transform duration-200 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Nueva consulta button */}
          <div className="p-3.5 sm:p-4 pb-2">
            <button 
              type="button"
              onClick={handleStartNew}
              className="w-full bg-[#005dff] hover:bg-[#0052e0] active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Nueva consulta</span>
            </button>
          </div>

          {/* Sidebar Header */}
          <div className="px-4 sm:px-5 pt-1.5 pb-2">
            <h3 className="text-xs sm:text-sm xl:text-[14.5px] font-bold text-slate-900 tracking-tight">
              Últimas conversaciones
            </h3>
          </div>

          {/* Search Box */}
          <div className="px-3.5 sm:px-4 pb-3">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversaciones..."
                className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 sm:px-4 py-2.5 pr-9 text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#005dff] focus:ring-1 focus:ring-[#005dff] transition-all"
              />
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Conversations Flat List */}
          <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 pb-4 space-y-1 sm:space-y-1.5">
            {filteredConversations.length === 0 ? (
              <p className="text-xs sm:text-sm text-center text-slate-400 py-6">No se encontraron conversaciones.</p>
            ) : (
              filteredConversations.map((item) => {
                const isActive = selectedConversationId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectConversation(item)}
                    className={`
                      p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all flex items-start gap-3
                      ${isActive 
                        ? 'bg-[#edf5fe] border border-blue-100/90 shadow-2xs' 
                        : 'hover:bg-slate-50 border border-transparent'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                      ${isActive ? 'text-[#005dff]' : 'text-slate-400'}
                    `}>
                      <MessageSquare size={18} className={isActive ? "stroke-[2.2]" : "stroke-[1.8]"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className={`text-xs sm:text-sm truncate ${isActive ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10.5px] sm:text-xs text-slate-400 shrink-0 font-medium">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11.5px] sm:text-xs text-slate-500 truncate leading-snug mt-0.5">
                        {item.preview}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN CHAT CANVAS */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
          
          {/* Fluid ethereal background waves (1:1 with reference) */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <svg 
              className="w-full h-full object-cover opacity-80" 
              viewBox="0 0 1440 900" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path 
                d="M-100 420 C 320 220, 640 520, 1050 260 C 1260 140, 1420 210, 1600 230 L 1600 0 L -100 0 Z" 
                fill="url(#wave-grad-soft)" 
              />
              <path 
                d="M-50 320 C 380 470, 780 200, 1180 370 C 1380 460, 1530 410, 1650 380" 
                stroke="url(#wave-accent-1)" 
                strokeWidth="70" 
                strokeLinecap="round" 
                filter="blur(45px)" 
                opacity="0.35" 
              />
              <path 
                d="M-100 500 C 350 360, 750 540, 1200 310 C 1380 210, 1520 270, 1600 290" 
                stroke="url(#wave-accent-2)" 
                strokeWidth="50" 
                strokeLinecap="round" 
                filter="blur(35px)" 
                opacity="0.3" 
              />
              <defs>
                <linearGradient id="wave-grad-soft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="wave-accent-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="50%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="wave-accent-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Messages Area OR Welcome Cards */}
          <div className="flex-1 overflow-y-auto min-h-0 relative z-10 flex flex-col justify-between w-full">
            
            {(isNewConsultation || activeMessages.length === 0) ? (
              /* WELCOME STATE: EXACT 1:1 REPLICA OF media_1789226126171.png (FULL 100% WIDTH) */
              <div className="flex-1 min-h-0 flex flex-col justify-between w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 py-2 sm:py-3 lg:py-4 max-w-[1650px] mx-auto overflow-y-auto">
                
                {/* Central Emblem & Brand + Greeting */}
                <div className="flex flex-col items-center select-none pointer-events-none text-center pt-1 shrink-0">
                  <img 
                    src="/images/mivor_hero_feathered.png" 
                    alt="MIVOR.ai" 
                    className="w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36 h-auto object-contain drop-shadow-md transition-all" 
                  />
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-black text-[#0f172a] tracking-tight flex items-center justify-center gap-1 mt-1 sm:mt-1.5">
                    MIVOR<span className="text-[#005dff]">.ai</span>
                  </h2>
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] font-extrabold tracking-[0.25em] sm:tracking-[0.28em] text-slate-400 uppercase mt-0.5 sm:mt-1">
                    BETTER HEALTH. BRIGHTER LIVES.
                  </p>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-[#0f172a] tracking-tight mt-1 sm:mt-2">
                    Hola, <span className="text-[#005dff]">{firstName}</span>
                  </h1>
                  <p className="text-[17px] sm:text-[19px] md:text-[21px] lg:text-[23px] font-bold text-[#0f172a] mt-0.5">
                    ¿En qué puedo ayudarte hoy?
                  </p>
                  <p className="text-xs sm:text-[13px] md:text-sm lg:text-[15px] text-slate-500 font-medium mt-0.5">
                    Tu asistente de salud con inteligencia artificial avanzada.
                  </p>
                </div>

                {/* 4 Quick Action Cards (FULL 100% WIDTH OF CANVAS) */}
                <div className="w-full my-auto py-2 shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full">
                    
                    {/* Card 1: ¿Qué puede significar este resultado? */}
                    <div 
                      onClick={() => setInputMessage('¿Qué puede significar este resultado en mis análisis médicos?')}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-purple-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#f5efff] text-[#8e44ad] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Brain className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                          ¿Qué puede significar este resultado?
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                          Te ayudo a interpretar tus análisis, pruebas e informes médicos.
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#8e44ad] group-hover:text-white group-hover:border-[#8e44ad] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Card 2: ¿Cuáles pueden ser las causas de este síntoma? */}
                    <div 
                      onClick={() => {
                        setIsNewConsultation(false);
                        const prompt = inputMessage.trim() 
                          ? `Hola MIVOR, quiero evaluar estos síntomas para triaje clínico: ${inputMessage.trim()}`
                          : 'Hola MIVOR, quiero evaluar unos síntomas que tengo para saber las posibles causas y qué debo hacer (iniciar triaje clínico).';
                        handleSend(null, prompt);
                      }}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-blue-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#eaf4fe] text-[#005dff] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                          ¿Cuáles pueden ser las causas de este síntoma?
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                          Analizo tus síntomas y te explico las posibles causas y próximos pasos.
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#005dff] group-hover:text-white group-hover:border-[#005dff] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Card 3: Explícame este informe médico */}
                    <div 
                      onClick={() => {
                        setInputMessage('Por favor, explícame este informe médico en un lenguaje claro y comprensible:');
                        actualPdfRef.current?.click();
                      }}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-teal-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#e6fbf5] text-[#00b074] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                          Explícame este informe médico
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                          Te ayudo a entender tus informes médicos de forma clara y sencilla.
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#00b074] group-hover:text-white group-hover:border-[#00b074] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Card 4: ¿Qué tratamientos existen para esta enfermedad? */}
                    <div 
                      onClick={() => setInputMessage('¿Qué tratamientos y opciones terapéuticas basadas en evidencia científica existen para ')}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-orange-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#fff2e8] text-[#f76a1a] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Pill className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                          ¿Qué tratamientos existen para esta enfermedad?
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                          Te informo sobre las opciones de tratamiento más actuales, basadas en evidencia científica.
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#f76a1a] group-hover:text-white group-hover:border-[#f76a1a] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              /* CONVERSATION THREAD: 1:1 REPLICA OF media_1789234006984.png */
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 space-y-4 sm:space-y-5 w-full max-w-[1700px] mx-auto">
                {activeMessages.map((msg, idx) => {
                  const isUser = msg.type === "user";
                  return (
                    <div key={msg.id || idx} className="animate-in fade-in duration-150">
                      {isUser ? (
                        /* USER MESSAGE: Light ice-blue bubble aligned right + Patient Avatar */
                        <div className="flex justify-end items-start gap-2.5 sm:gap-3 my-2 sm:my-3 group">
                          <div className="bg-[#edf5fe] text-slate-900 rounded-2xl rounded-tr-xs px-4 sm:px-5 lg:px-6 py-3 sm:py-4 max-w-[85%] sm:max-w-[70%] lg:max-w-[62%] xl:max-w-[55%] shadow-2xs border border-blue-100/50">
                            {/* Attached Image if any */}
                            {msg.image && (
                              <img src={msg.image} alt={t('attachment')} className="w-full max-w-[240px] h-auto rounded-xl mb-2 object-cover border border-slate-200" />
                            )}
                            {/* Attached PDF if any */}
                            {msg.pdf && (
                              <div className="flex items-center gap-2 bg-blue-100/60 p-2.5 rounded-xl mb-2 text-blue-900 text-xs font-medium">
                                <FileText size={16} />
                                <span className="truncate">{t('attached_document')}</span>
                              </div>
                            )}
                            <p className="text-xs sm:text-sm lg:text-[15px] leading-relaxed whitespace-pre-wrap font-normal text-slate-800">
                              {msg.text || msg.content}
                            </p>
                            <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[11px] sm:text-xs text-slate-400 select-none">
                              <span>{formatMsgTime(msg)}</span>
                              <CheckCheck size={14} className="text-[#005dff] stroke-[2.2]" />
                            </div>
                          </div>
                          {/* User Avatar */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-2xs mt-0.5">
                            <img 
                              src={patientProfile?.photo_url || "/images/mivor_avatar_default.png"} 
                              alt={displayName} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.src = '/images/mivor_avatar_default.png'; }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* ASSISTANT (MIVOR.ai) MESSAGE: Circular 3D Avatar + White Card + Blue Bullets + Feedback */
                        <div className="flex justify-start items-start gap-2.5 sm:gap-3.5 my-2 sm:my-3 group">
                          {/* MIVOR Avatar */}
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-blue-100/90 bg-white shadow-2xs shrink-0 mt-0.5">
                            <img 
                              src="/images/mivor_hero_circle_clean.png" 
                              alt="MIVOR.ai" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.src = '/logo.png'; }}
                            />
                          </div>
                          {/* White Card */}
                          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 max-w-[92%] sm:max-w-[82%] lg:max-w-[75%] xl:max-w-[68%] shadow-xs">
                            <h4 className="font-bold text-[15px] sm:text-[16px] text-slate-900 mb-2">
                              MIVOR<span className="text-[#005dff]">.ai</span>
                            </h4>
                            
                            <div className="text-xs sm:text-sm lg:text-[15px] text-slate-700 leading-relaxed font-normal">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 leading-relaxed text-slate-700" {...props} />,
                                  ul: ({node, ...props}) => <ul className="space-y-1.5 my-2.5 pl-0" {...props} />,
                                  li: ({node, ...props}) => (
                                    <li className="flex items-start gap-2 text-slate-700 leading-relaxed font-normal">
                                      <span className="text-[#005dff] text-[18px] leading-none select-none font-bold mt-0.5 shrink-0">•</span>
                                      <span className="flex-1">{props.children}</span>
                                    </li>
                                  ),
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-700" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />
                                }}
                              >
                                {msg.text || msg.content}
                              </ReactMarkdown>
                            </div>

                            {/* Alerta de derivación médica si aplica */}
                            {Boolean(
                              (msg.text || msg.content) && (
                                (msg.text || msg.content).includes("Informe de Prediagnóstico") ||
                                (msg.text || msg.content).includes("Prediagnóstico y Triaje") ||
                                (msg.text || msg.content).includes("Especialidad a la que debería acudir") ||
                                (msg.text || msg.content).includes("Nivel de urgencia")
                              )
                            ) && (
                              <div className="mt-4 pt-3 border-t border-purple-100 bg-gradient-to-br from-purple-50/90 via-indigo-50/80 to-blue-50/80 rounded-2xl p-4 border border-purple-200/80 shadow-xs">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-7 h-7 rounded-xl bg-[#005dff] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Sparkles size={14} />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block">
                                      Orientación de Triaje Finalizada
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-[#005dff]">
                                      Especialidad sugerida: {extractSpecialty(msg.text || msg.content)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                  Puedes conectar de inmediato con especialistas certificados para recibir diagnóstico formal o agendar una consulta médica.
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onOpenDoctorDirectory ? onOpenDoctorDirectory(extractSpecialty(msg.text || msg.content)) : onNavigate?.('doctors')}
                                    className="px-3.5 py-2 rounded-xl bg-[#005dff] hover:bg-[#0052e0] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Stethoscope size={14} />
                                    <span>Ver Especialistas ({extractSpecialty(msg.text || msg.content)})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const spec = extractSpecialty(msg.text || msg.content);
                                      const whatsappText = encodeURIComponent(`Hola, acabo de realizar una evaluación clínica en MIVOR.ai con recomendación hacia la especialidad de ${spec}. Deseo consultar disponibilidad para una consulta médica. Muchas gracias.`);
                                      window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <MessageCircle size={14} />
                                    <span>WhatsApp Inmediato</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Card Footer: Timestamp + ThumbsUp / ThumbsDown buttons */}
                            <div className="flex items-center justify-end gap-2 sm:gap-2.5 mt-3 pt-1 text-[10px] sm:text-[11px] text-slate-400 select-none">
                              <span>{formatMsgTime(msg)}</span>
                              <button 
                                type="button" 
                                onClick={() => handleFeedback(idx, 'up')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${feedbacks[idx] === 'up' ? 'text-[#005dff] bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                title="Respuesta útil"
                              >
                                <ThumbsUp size={13.5} className="stroke-[1.8]" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleFeedback(idx, 'down')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${feedbacks[idx] === 'down' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                title="Respuesta no útil"
                              >
                                <ThumbsDown size={13.5} className="stroke-[1.8]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start items-start gap-2.5 sm:gap-3.5 my-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-blue-100 bg-white p-1 shrink-0 shadow-2xs mt-0.5">
                      <img src="/images/mivor_hero_feathered.png" alt="MIVOR.ai" className="w-full h-full object-contain" />
                    </div>
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-2.5 text-slate-500">
                      <Loader2 size={16} className="animate-spin text-[#005dff]" />
                      <span className="text-xs font-semibold text-slate-600">MIVOR.ai está analizando tu consulta...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

          </div>

          {/* 3. BOTTOM CHAT INPUT CAPSULE (MATCHING FULL 100% WIDTH) */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pb-2 pt-0.5 relative z-20 shrink-0 max-w-[1700px] mx-auto">
            
            {/* Attachment preview if exists */}
            {(selectedImagePreview || selectedPdfName) && (
              <div className="mb-1.5 p-2 px-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs text-xs text-blue-900 animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  {selectedImagePreview && <ImageIcon size={15} className="text-[#005dff]" />}
                  {selectedPdfName && <FileText size={15} className="text-[#005dff]" />}
                  <span className="truncate font-semibold">{selectedPdfName || 'Imagen adjunta'}</span>
                </div>
                <button 
                  type="button" 
                  onClick={onClearAttachment} 
                  className="p-1 hover:bg-blue-100 rounded-full text-blue-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Capsule */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLoading && (inputMessage.trim() || selectedImagePreview || selectedPdfName)) {
                  setIsNewConsultation(false);
                  handleSend();
                }
              }}
              className="w-full bg-white rounded-full border border-slate-200/90 shadow-sm py-1.5 sm:py-2 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 hover:border-slate-300 focus-within:border-[#005dff] focus-within:ring-2 focus-within:ring-[#005dff]/20 transition-all"
            >
              {/* Paperclip button */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setShowAttachMenu(prev => !prev)} 
                  className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Adjuntar archivo o imagen médica"
                >
                  <Paperclip size={18} className="stroke-[2.2] -rotate-45" />
                </button>

                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                    <div className="absolute left-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <button 
                        type="button" 
                        onClick={() => { setShowAttachMenu(false); actualImageRef.current?.click(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left cursor-pointer"
                      >
                        <ImageIcon size={16} className="text-[#005dff]" />
                        <span>Adjuntar imagen</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowAttachMenu(false); actualPdfRef.current?.click(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left cursor-pointer"
                      >
                        <FileText size={16} className="text-teal-600" />
                        <span>Adjuntar PDF / Informe</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Text Input */}
              <input 
                type="text" 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                placeholder="Escribe tu mensaje aquí..." 
                disabled={isLoading}
                className="w-full bg-transparent text-xs sm:text-sm xl:text-[14.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none px-1"
              />

              {/* Voice Mic Button (Light-blue circle matching reference) */}
              <button 
                type="button" 
                onClick={toggleListening}
                className={`w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-xs' 
                    : 'text-[#005dff] hover:bg-blue-50'
                }`}
                title={isListening ? "Detener dictado" : "Dictar por voz"}
              >
                <Mic size={18} className="stroke-[2.2] xl:w-5 xl:h-5" />
              </button>

              {/* Send Button (Vibrant blue circle with arrow) */}
              <button 
                type="submit" 
                disabled={isLoading || (!inputMessage.trim() && !selectedImagePreview && !selectedPdfName)}
                className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full bg-[#005dff] hover:bg-[#0052e0] active:scale-95 text-white flex items-center justify-center transition-all shadow-xs disabled:pointer-events-none cursor-pointer shrink-0"
                title="Enviar mensaje"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={15} className="stroke-[2.4] ml-0.5 xl:w-4 xl:h-4" />
                )}
              </button>

              <input type="file" ref={actualImageRef} onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
              <input type="file" ref={actualPdfRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
            </form>

            {/* Bottom Security Note */}
            <div className="py-1 text-center text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1.5 select-none font-medium">
              <Lock size={12} className="text-slate-500 shrink-0" />
              <span>Tus datos están protegidos. Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR).</span>
            </div>
          </div>

        </main>
      </div>

      {showHelpModal && (
        <div 
          onClick={() => setShowHelpModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005dff] flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <h3 className="font-bold text-base text-slate-900">¿Cómo funciona MIVOR.ai?</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>MIVOR.ai</strong> es tu asistente médico impulsado por inteligencia artificial clínica avanzada.
              </p>
              <ul className="space-y-2 list-disc list-inside text-slate-600">
                <li>Puedes consultar dudas sobre síntomas, analíticas, informes o tratamientos.</li>
                <li>Adjunta imágenes o informes en PDF usando el icono de clip.</li>
                <li>Dicta por voz con el botón de micrófono en cualquier momento.</li>
                <li>Tus consultas están protegidas con cifrado de grado médico y privacidad estricta.</li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
                <strong>Aviso clínico:</strong> MIVOR.ai ofrece orientación clínica informativa. En caso de emergencia médica real, contacta inmediatamente al 112 o al centro de urgencias más cercano.
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#005dff] hover:bg-[#0052e0] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientChat;
