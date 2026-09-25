import React, { useRef, useEffect, useState } from "react";
import { 
  ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, FileText, Loader2, Sparkles, X, 
  ShieldCheck, AlertCircle, Activity, Stethoscope, Plus, History, MessageSquare, 
  MessageCircle, Search, HelpCircle, Bell, ChevronDown, Brain, Pill, Clock, 
  User, LogOut, ArrowRight, CheckCircle2, Menu, UploadCloud, Lock,
  ThumbsUp, ThumbsDown, CheckCheck, Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { translateSpecialtyName } from '../i18n/catalogTranslations';
import { useLanguage } from '../contexts/LanguageContext';
import { emergencyNumber } from '../utils/locale';
import PatientTopNav from '../components/PatientTopNav';

const PatientChat = ({
  messages = [],
  inputMessage,
  setInputMessage,
  handleSend,
  isLoading,
  onBack,
  attachments = [],
  onAddAttachments,
  onRemoveAttachment,
  onClearAttachments,
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
  deleteSession,
  startNewSession,
  currentSessionId,
  onOpenDoctorDirectory,
  onNavigate,
  onLogout,
  username
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewConsultation, setIsNewConsultation] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState(currentSessionId || null);
  const [feedbacks, setFeedbacks] = useState({});
  const [localMessages, setLocalMessages] = useState([]);

  const { t, language, country, locale } = useLanguage();
  const fileInputRef = useRef(null);
  const internalImageRef = useRef(null);
  const internalPdfRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const actualImageRef = imageInputRef || internalImageRef;
  const actualPdfRef = pdfInputRef || internalPdfRef;

  const handleFilesSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onAddAttachments) {
        onAddAttachments(Array.from(e.target.files));
      } else if (handleImageChange || handlePdfChange) {
        const first = e.target.files[0];
        if (first.type.startsWith('image/')) handleImageChange?.(e);
        else handlePdfChange?.(e);
      }
      e.target.value = '';
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    const filesToAttach = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const customName = file.name && file.name !== 'image.png'
            ? file.name
            : `captura_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;
          const renamedFile = new File([file], customName, { type: file.type || 'image/png' });
          filesToAttach.push(renamedFile);
        }
      }
    }

    if (filesToAttach.length > 0) {
      e.preventDefault();
      if (onAddAttachments) {
        onAddAttachments(filesToAttach);
      }
    }
  };

  const displayName = patientProfile?.full_name || username || t('default_patient_name');
  const firstName = displayName.split(' ')[0] || displayName;

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
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return '';
      }
    }
    return '';
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
    recognition.lang = locale || language;
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

  // Especialidad sugerida en la respuesta de la IA. Devuelve el nombre en español (el que usa el
  // directorio para filtrar); para mostrarlo se pasa por translateSpecialtyName.
  const SPECIALTY_KEYWORDS = [
    ['Cardiología', /\b(cardiolog\w*)/i], ['Traumatología', /\b(traumatolog\w*|orthop(a)?edic\w*)/i],
    ['Dermatología', /\b(dermatolog\w*)/i], ['Neurología', /\b(neurolog\w*)/i],
    ['Pediatría', /\b(pediatr\w*|paediatr\w*|pédiatr\w*)/i], ['Ginecología', /\b(ginecolog\w*|gyn(a)?ecolog\w*|gynécolog\w*)/i],
    ['Oftalmología', /\b(oftalmolog\w*|ophthalmolog\w*|ophtalmolog\w*)/i], ['Psiquiatría', /\b(psiquiatr\w*|psychiatr\w*)/i],
  ];
  const extractSpecialty = (raw) => {
    if (!raw) return 'Medicina General';
    const text = String(raw);
    const match = text.match(/(?:Especialidad|Especialista|Derivaci[óo]n|Specialty|Specialist|Referral|Spécialité|Spécialiste)(?:\s+a\s+la\s+que\s+deber[íi]a\s+acudir)?(?:\s+sugerida|\s+recomendada|\s+suggested|\s+recommended)?\s*[:*]\s*([^.\n*]+?)(?:\.|\n|\*|$)/i);
    if (match && match[1]) {
      const candidate = match[1].trim().replace(/^\*+|\*+$/g, '');
      if (candidate.length > 2 && candidate.length < 35) {
        return candidate;
      }
    }
    for (const [name, re] of SPECIALTY_KEYWORDS) {
      if (re.test(text)) return name;
    }
    return 'Medicina General';
  };
  const suggestedSpecialtyLabel = (raw) => translateSpecialtyName(extractSpecialty(raw), language, t);

  const formatSessionTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
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

  // Conversaciones reales del usuario (sin datos de ejemplo)
  const hasRealSessions = Array.isArray(sessions) && sessions.length > 0;
  const conversationList = hasRealSessions
    ? sessions.map(s => ({
        id: s.id,
        title: s.title || t('patientchat_consulta_medica'),
        time: formatSessionTime(s.created_at),
        preview: s.preview || t('patientchat_consulta_con_mivor_ai'),
        isReal: true
      }))
    : [];

  const handleSelectConversation = (item) => {
    setSelectedConversationId(item.id);
    setIsNewConsultation(false);
    setLocalMessages([]);
    if (loadSession) {
      loadSession(item.id);
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
      
      {/* 1. BARRA SUPERIOR COMÚN DEL PACIENTE */}
      <PatientTopNav
        activeTab="chat"
        onNavigate={onNavigate}
        userProfile={patientProfile}
        username={username}
        onLogout={onLogout}
        className="shrink-0"
      />

      {/* Subbarra del chat: conversaciones (móvil), nueva consulta y ayuda del asistente */}
      <div className="shrink-0 border-b border-slate-100 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-7 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(prev => !prev)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              title={t('patientchat_abrir_conversaciones')}
            >
              <Menu size={16} />
              <span>{t('chat_toolbar_conversations')}</span>
            </button>
            <h1 className="hidden lg:flex items-center gap-2 text-sm font-extrabold text-mivor-navy truncate">
              <MessageSquare size={16} className="text-brand" />
              {t('chat_toolbar_title')}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleStartNew}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-colors"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>{t('patientchat_nueva_consulta')}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-brand hover:bg-slate-50 transition-colors"
              title={t('patientchat_ayuda_y_soporte')}
            >
              <HelpCircle size={15} />
              <span className="hidden sm:inline">{t('chat_toolbar_how_it_works')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN CHAT CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs" 
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR ("Últimas conversaciones") */}
        <aside className={`
          fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-auto
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
              <span>{t('patientchat_nueva_consulta')}</span>
            </button>
          </div>

          {/* Sidebar Header */}
          <div className="px-4 sm:px-5 pt-1.5 pb-2">
            <h3 className="text-xs sm:text-sm xl:text-[14.5px] font-bold text-slate-900 tracking-tight">
             {t('patientchat_ultimas_conversaciones')}
            </h3>
          </div>

          {/* Search Box */}
          <div className="px-3.5 sm:px-4 pb-3">
            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('patientchat_buscar_conversaciones')}
                className="w-full bg-white border border-slate-200/90 rounded-xl px-3.5 sm:px-4 py-2.5 pr-9 text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#005dff] focus:ring-1 focus:ring-[#005dff] transition-all"
              />
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Conversations Flat List */}
          <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 pb-4 space-y-1 sm:space-y-1.5">
            {filteredConversations.length === 0 ? (
              <p className="text-xs sm:text-sm text-center text-slate-400 py-6 px-3">{hasRealSessions ? t('patientchat_no_se_encontraron_conversaciones') : t('patientchat_no_conversations_yet')}</p>
            ) : (
              filteredConversations.map((item) => {
                const isActive = selectedConversationId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectConversation(item)}
                    className={`
                      p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all flex items-start gap-3 group/item relative
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
                        <div className="flex items-center gap-1 shrink-0">
                          {item.isReal && deleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(t('patientchat_deseas_eliminar_esta_consulta_del'))) {
                                  deleteSession(item.id);
                                }
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-md transition-all cursor-pointer"
                              title={t('patientchat_eliminar_conversacion')}
                            >
                              <Trash2 size={13.5} />
                            </button>
                          )}
                          <span className="text-[10.5px] sm:text-xs text-slate-400 font-medium">
                            {item.time}
                          </span>
                        </div>
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
                   {t('patientchat_better_health_brighter_lives')}
                  </p>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-[#0f172a] tracking-tight mt-1 sm:mt-2">
                   {t('patientchat_hola')} <span className="text-[#005dff]">{firstName}</span>
                  </h1>
                  <p className="text-[17px] sm:text-[19px] md:text-[21px] lg:text-[23px] font-bold text-[#0f172a] mt-0.5">
                   {t('patientchat_en_que_puedo_ayudarte_hoy')}
                  </p>
                  <p className="text-xs sm:text-[13px] md:text-sm lg:text-[15px] text-slate-500 font-medium mt-0.5">
                   {t('patientchat_tu_asistente_de_salud_con')}
                  </p>
                </div>

                {/* 4 Quick Action Cards (FULL 100% WIDTH OF CANVAS) */}
                <div className="w-full my-auto py-2 shrink-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 w-full">
                    
                    {/* Card 1: ¿Qué puede significar este resultado? */}
                    <div 
                      onClick={() => setInputMessage(t('patientchat_que_puede_significar_este_resultado'))}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-purple-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#f5efff] text-[#8e44ad] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Brain className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                         {t('patientchat_que_puede_significar_este_resultado_2')}
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                         {t('patientchat_te_explico_con_claridad_tus')}
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
                          ? t('patientchat_hola_mivor_quiero_consultar_estos', { value: inputMessage.trim() })
                          : t('patientchat_hola_mivor_quiero_consultar_unos');
                        handleSend(null, prompt);
                      }}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-blue-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#eaf4fe] text-[#005dff] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                         {t('patientchat_cuales_pueden_ser_las_causas')}
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                         {t('patientchat_te_oriento_sobre_tus_sintomas')}
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#005dff] group-hover:text-white group-hover:border-[#005dff] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Card 3: Explícame este informe médico */}
                    <div 
                      onClick={() => {
                        setInputMessage(t('patientchat_por_favor_explicame_este_informe'));
                        actualPdfRef.current?.click();
                      }}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-teal-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#e6fbf5] text-[#00b074] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                         {t('patientchat_explicame_este_informe_medico')}
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                         {t('patientchat_te_ayudo_a_entender_tus')}
                        </p>
                      </div>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 text-slate-400 group-hover:bg-[#00b074] group-hover:text-white group-hover:border-[#00b074] flex items-center justify-center shadow-2xs self-end mt-2 transition-all shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Card 4: ¿Qué tratamientos existen para esta enfermedad? */}
                    <div 
                      onClick={() => setInputMessage(t('patientchat_que_tratamientos_y_opciones_terapeut'))}
                      className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/90 hover:border-orange-300 p-4 sm:p-5 flex flex-col justify-between min-h-[145px] sm:min-h-[160px] lg:min-h-[175px] xl:min-h-[185px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group w-full"
                    >
                      <div>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#fff2e8] text-[#f76a1a] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shrink-0">
                          <Pill className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                        </div>
                        <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                         {t('patientchat_que_tratamientos_existen_para_esta')}
                        </h3>
                        <p className="text-[11px] sm:text-xs lg:text-[13px] xl:text-[13.5px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                         {t('patientchat_te_informo_sobre_las_opciones')}
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
                            {/* Multi-attachments rendering if msg.attachments exists */}
                            {msg.attachments && msg.attachments.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {msg.attachments.map((att, attIdx) => (
                                  att.previewUrl ? (
                                    <img key={attIdx} src={att.previewUrl} alt={att.name || t('attachment')} className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 shadow-2xs" />
                                  ) : (
                                    <div key={attIdx} className="flex items-center gap-1.5 bg-blue-100/70 px-2.5 py-1.5 rounded-xl text-blue-900 text-xs font-medium border border-blue-200/50">
                                      <FileText size={15} className="text-[#005dff] shrink-0" />
                                      <span className="truncate max-w-[140px] font-semibold">{att.name || t('attached_document')}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            ) : (
                              <>
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
                              </>
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
                                (msg.text || msg.content).includes("Resumen Explicativo") ||
                                (msg.text || msg.content).includes(t('patientchat_informe_de_prediagnostico')) ||
                                (msg.text || msg.content).includes(t('patientchat_prediagnostico_y_triaje')) ||
                                (msg.text || msg.content).includes("Especialidad sugerida") ||
                                (msg.text || msg.content).includes(t('patientchat_especialidad_a_la_que_deberia')) ||
                                (msg.text || msg.content).includes(t('patientchat_nivel_de_atencion')) ||
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
                                     {t('patientchat_orientacion_de_salud_finalizada')}
                                    </span>
                                    <span className="text-[10.5px] font-semibold text-[#005dff]">
                                     {t('patientchat_especialidad_sugerida_para_tu_consul')} {suggestedSpecialtyLabel(msg.text || msg.content)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                 {t('patientchat_puedes_conectar_con_profesionales_sa')}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onOpenDoctorDirectory ? onOpenDoctorDirectory(extractSpecialty(msg.text || msg.content)) : onNavigate?.('doctors')}
                                    className="px-3.5 py-2 rounded-xl bg-[#005dff] hover:bg-[#0052e0] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Stethoscope size={14} />
                                    <span>{t('patientchat_ver_especialistas')}{suggestedSpecialtyLabel(msg.text || msg.content)})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const spec = suggestedSpecialtyLabel(msg.text || msg.content);
                                      const whatsappText = encodeURIComponent(t('patientchat_hola_acabo_de_recibir_una', { spec }));
                                      window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                                  >
                                    <MessageCircle size={14} />
                                    <span>{t('patientchat_whatsapp_inmediato')}</span>
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
                                title={t('patientchat_respuesta_util')}
                              >
                                <ThumbsUp size={13.5} className="stroke-[1.8]" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleFeedback(idx, 'down')}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${feedbacks[idx] === 'down' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                title={t('patientchat_respuesta_no_util')}
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
                      <span className="text-xs font-semibold text-slate-600">{t('patientchat_mivor_ai_esta_analizando_tu')}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

          </div>

          {/* 3. BOTTOM CHAT INPUT CAPSULE (MATCHING FULL 100% WIDTH) */}
          <div 
            onPaste={handlePaste}
            className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pb-2 pt-0.5 relative z-20 shrink-0 max-w-[1700px] mx-auto"
          >
            
            {/* Attachment preview if exists */}
            {attachments && attachments.length > 0 ? (
              <div className="mb-1.5 p-2 px-3 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-wrap items-center gap-2 shadow-2xs text-xs text-blue-900 animate-in fade-in max-h-24 overflow-y-auto">
                {attachments.map((att) => (
                  <div 
                    key={att.id} 
                    className="flex items-center gap-1.5 bg-white border border-blue-200/90 rounded-xl px-2.5 py-1 shadow-2xs text-xs text-slate-800"
                  >
                    {att.type === 'image' && att.previewUrl ? (
                      <img src={att.previewUrl} alt={att.name} className="w-5 h-5 object-cover rounded-md border border-slate-200 shrink-0" />
                    ) : att.type === 'image' ? (
                      <ImageIcon size={14} className="text-[#005dff] shrink-0" />
                    ) : (
                      <FileText size={14} className="text-teal-600 shrink-0" />
                    )}
                    <span className="truncate max-w-[130px] sm:max-w-[180px] font-semibold">{att.name}</span>
                    <button 
                      type="button" 
                      onClick={() => onRemoveAttachment ? onRemoveAttachment(att.id) : onClearAttachment?.()} 
                      className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={t('patientchat_quitar_archivo')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {attachments.length > 1 && (
                  <button 
                    type="button" 
                    onClick={onClearAttachments || onClearAttachment} 
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 px-1.5 py-0.5 transition-colors cursor-pointer ml-auto"
                  >
                   {t('doctordashboard_eliminar_todos')}
                  </button>
                )}
              </div>
            ) : (selectedImagePreview || selectedPdfName) ? (
              <div className="mb-1.5 p-2 px-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs text-xs text-blue-900 animate-in fade-in">
                <div className="flex items-center gap-2 truncate">
                  {selectedImagePreview && <ImageIcon size={15} className="text-[#005dff]" />}
                  {selectedPdfName && <FileText size={15} className="text-[#005dff]" />}
                  <span className="truncate font-semibold">{selectedPdfName || t('patientchat_imagen_adjunta')}</span>
                </div>
                <button 
                  type="button" 
                  onClick={onClearAttachment} 
                  className="p-1 hover:bg-blue-100 rounded-full text-blue-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            {/* Input Capsule */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const hasAttached = (attachments && attachments.length > 0) || selectedImagePreview || selectedPdfName;
                if (!isLoading && (inputMessage.trim() || hasAttached)) {
                  setIsNewConsultation(false);
                  handleSend();
                }
              }}
              onPaste={handlePaste}
              className="w-full bg-white rounded-full border border-slate-200/90 shadow-sm py-1.5 sm:py-2 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 hover:border-slate-300 focus-within:border-[#005dff] focus-within:ring-2 focus-within:ring-[#005dff]/20 transition-all"
            >
              {/* Paperclip button - Direct Native File Selector for ANY file */}
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-8 h-8 rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title={t('patientchat_adjuntar_imagenes_o_documentos_clini')}
                >
                  <Paperclip size={18} className="stroke-[2.2] -rotate-45" />
                </button>
              </div>

              {/* Text Input */}
              <input 
                type="text" 
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                onPaste={handlePaste}
                placeholder={t('patientchat_escribe_tu_mensaje_o_pega')} 
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
                title={isListening ? t('patientchat_detener_dictado') : t('patientchat_dictar_por_voz')}
              >
                <Mic size={18} className="stroke-[2.2] xl:w-5 xl:h-5" />
              </button>

              {/* Send Button (Vibrant blue circle with arrow) */}
              <button 
                type="submit" 
                disabled={isLoading || (!inputMessage.trim() && !(attachments?.length > 0) && !selectedImagePreview && !selectedPdfName)}
                className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full bg-[#005dff] hover:bg-[#0052e0] active:scale-95 text-white flex items-center justify-center transition-all shadow-xs disabled:pointer-events-none cursor-pointer shrink-0"
                title={t('patientchat_enviar_mensaje')}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={15} className="stroke-[2.4] ml-0.5 xl:w-4 xl:h-4" />
                )}
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFilesSelected} 
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif,image/*,application/pdf" 
                multiple 
                className="hidden" 
              />
              <input type="file" ref={actualImageRef} onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
              <input type="file" ref={actualPdfRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
            </form>

            {/* Bottom Security Note */}
            <div className="py-1 text-center text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1.5 select-none font-medium">
              <Lock size={12} className="text-slate-500 shrink-0" />
              <span>{t('patientchat_tus_datos_estan_protegidos_cifrado')}</span>
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
                <h3 className="font-bold text-base text-slate-900">{t('patientchat_como_funciona_mivor_ai')}</h3>
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
                <strong>MIVOR.ai</strong> {t('patientchat_es_tu_asistente_medico_impulsado')}
              </p>
              <ul className="space-y-2 list-disc list-inside text-slate-600">
                <li>{t('patientchat_puedes_consultar_dudas_sobre_sintoma')}</li>
                <li>{t('patientchat_adjunta_imagenes_o_informes_en')}</li>
                <li>{t('patientchat_dicta_por_voz_con_el')}</li>
                <li>{t('patientchat_tus_consultas_estan_protegidas_con')}</li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
                <strong>{t('patientchat_aviso_clinico')}</strong> {t('patientchat_mivor_ai_ofrece_orientacion_clinica', { number: emergencyNumber(country) })}
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#005dff] hover:bg-[#0052e0] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
            >
             {t('patient_understood')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientChat;
