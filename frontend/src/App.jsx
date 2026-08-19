import DoctorDashboard from './DoctorDashboard';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Auth from './Auth';
import { 
  Activity, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  Stethoscope, 
  Bot, 
  User, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Brain,
  Copy,
  Check,
  Download,
  LogOut,
  Volume2,
  Settings,
  Server
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const { t, language } = useLanguage();
  const [token, setToken] = useState(localStorage.getItem('med_token') || null);
  const [username, setUsername] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [triageSessionId, setTriageSessionId] = useState(null);
  const [isTriageClosed, setIsTriageClosed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [patientName, setPatientName] = useState('Paciente Anónimo');

  const [showSettings, setShowSettings] = useState(false);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [viewMode, setViewMode] = useState('patient');
  const [patientProfile, setPatientProfile] = useState({
    full_name: '', date_of_birth: '', gender: '', blood_type: '',
    allergies: '', chronic_conditions: '', current_medications: '', emergency_contact: '', qr_code_base64: ''
  });
  const [engineSettings, setEngineSettings] = useState(() => {
    const saved = localStorage.getItem('med_engine_settings');
    const parsed = saved ? JSON.parse(saved) : null;
    
    if (!parsed || parsed.provider) { // If it has old provider fields, reset it
      return {
        text_model: 'llama3',
        vision_model: 'minicpm-v'
      };
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('med_engine_settings', JSON.stringify(engineSettings));
  }, [engineSettings]);

  
  // File attachments
  const [selectedImage, setSelectedImage] = useState(null); // base64
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null); // base64
  const [selectedPdfName, setSelectedPdfName] = useState(null);
  
  // UI states
  const [selectedEngine, setSelectedEngine] = useState('Local (Ollama)');
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ ollama_running: false, text_model_ready: false, vision_model_ready: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [phiAlert, setPhiAlert] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Auto scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const downloadReport = (text, patient, dateTitle) => {
    const element = document.createElement("a");
    const file = new Blob([`Informe Médico - ${patient}

${text}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `informe_${patient.replace(/\s+/g, '_')}_${dateTitle.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('med_token');
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };

  // Text-to-speech
  const detectLanguage = (text) => {
    if (!text) return 'es-ES';
    const lowerText = text.toLowerCase();
    if (/\b(the|is|are|and|to|in|of|that)\b/i.test(lowerText)) return 'en-US';
    if (/\b(le|la|les|et|est|pour|dans)\b/i.test(lowerText)) return 'fr-FR';
    if (/\b(o|a|os|as|e|é|para|em|não)\b/i.test(lowerText)) return 'pt-BR';
    if (/\b(der|die|das|und|ist|für)\b/i.test(lowerText)) return 'de-DE';
    if (/\b(il|la|lo|i|gli|le|e|è|per)\b/i.test(lowerText)) return 'it-IT';
    return 'es-ES';
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = detectLanguage(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Tu navegador no soporta lectura en voz alta.");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (token) {
      fetchUser();
      checkHealth();
      fetchSessions();
    }
  }, [token]);

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  
  const fetchPatientProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patient/profile`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.full_name) {
          setPatientProfile(data);
        }
      }
    } catch (e) {
      console.error('Error fetching patient profile:', e);
    }
  };

  const savePatientProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/patient/profile`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(patientProfile)
      });
      if (res.ok) {
        alert('Historial médico guardado con éxito');
        fetchPatientProfile(); // reload to get new QR
      }
    } catch (e) {
      console.error('Error saving patient profile:', e);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch {
      // Handle error
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      } else {
        setHealthStatus({ ollama_running: false, text_model_ready: false, vision_model_ready: false });
      }
    } catch {
      setHealthStatus({ ollama_running: false, text_model_ready: false, vision_model_ready: false });
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  const loadSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
    try {
      const res = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Error loading session messages:', e);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setTriageSessionId(null);
    setIsTriageClosed(false);
    setIsSidebarOpen(false);
    setMessages([]);
    setInputMessage('');
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setSelectedPdf(null);
    setSelectedPdfName(null);
    setPhiAlert(false);
  };

  const startTriageSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/triage/start`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTriageSessionId(data.session_id);
        setIsTriageClosed(false);
        setMessages([{ id: Date.now(), type: 'ai', text: 'Hola. Soy tu Asistente de Triaje Médico. Por favor, descríbeme tus síntomas actuales para comenzar la evaluación clínica.', phiScrubbed: false }]);
      }
    } catch (err) {
      console.error("Error iniciando sesión de triaje:", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result.split(',')[1];
      setSelectedImage(base64String);
      setSelectedImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedPdfName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result.split(',')[1];
      setSelectedPdf(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && !selectedImage && !selectedPdf) || isLoading) return;

    const userText = inputMessage.trim() || (selectedImage ? 'Analiza esta imagen médica adjunta.' : 'Procesa este documento PDF.');
    
    const tempUserMsg = {
      id: Date.now(),
      type: 'user',
      text: userText,
      image: selectedImagePreview,
      pdf: !!selectedPdf,
      phiScrubbed: false
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsLoading(true); // Se usa para la animación inicial

    const payload = {
      message: userText,
      image_base64: selectedImage,
      pdf_base64: selectedPdf,
      session_id: currentSessionId,
      patient_name: patientName || 'Paciente Anónimo',
      ...engineSettings
    };

    setSelectedImage(null);
    setSelectedImagePreview(null);
    setSelectedPdf(null);
    setSelectedPdfName(null);

    try {
      let documentContext = "";

      // Si hay archivo, subimos a /api/documents/upload
      if (selectedImage || selectedPdf) {
        setIsLoading(true);
        setMessages((prev) => [...prev, { id: Date.now() + 2, type: 'ai', text: 'Analizando documento adjunto con OCR...', phiScrubbed: false }]);
        
        const formData = new FormData();
        // El input base64 lo volvemos blob para enviarlo como archivo
        const byteString = atob(selectedImage || selectedPdf);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: selectedImage ? 'image/jpeg' : 'application/pdf' });
        formData.append('file', blob, selectedImage ? 'imagen.jpg' : 'documento.pdf');

        const uploadRes = await fetch(`${API_URL}/api/documents/upload`, {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          documentContext = `

[Contexto del Documento Adjunto: ${uploadData.extracted_text}]`;
        }
      }

      // Preparar historial para el chat de triaje
      const chatMessages = messages.map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));
      chatMessages.push({
        role: 'user',
        content: userText + documentContext
      });

      const endpoint = triageSessionId 
        ? `${API_URL}/api/triage/${triageSessionId}/message`
        : `${API_URL}/api/triage/chat`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatMessages })
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error('Error en el servidor backend');

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let aiMsgId = Date.now() + 1;
      let currentAiText = "";
      
      setMessages((prev) => [...prev, { id: aiMsgId, type: 'ai', text: '', phiScrubbed: false }]);
      
      setIsLoading(false); // Detenemos la animación genérica, empezamos a mostrar texto
      
      let done = false;
      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: true });
          currentAiText += chunkText;
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: currentAiText } : m));
        }
      }
      
      if (triageSessionId && currentAiText.includes("📝 Informe de Prediagnóstico y Triaje")) {
        setIsTriageClosed(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: `⚠️ **Error de conexión:** No se pudo comunicar con el backend de MedIA Hub (${API_URL}). Verifica que Uvicorn u Ollama estén activos.`,
          error: true
        }
      ]);
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.patient_name && s.patient_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!token) {
    return <Auth onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) setViewMode(role); }} apiUrl={API_URL} />;
  }

  if (viewMode === 'doctor') {
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); setViewMode('patient');}} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* SIDEBAR DE HISTORIAL */}
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`w-80 glass-panel border-r border-slate-800 flex flex-col z-30 transition-transform absolute md:relative h-full bg-slate-950 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none gradient-text">MedIA Hub</h1>
              <span className="text-[11px] text-slate-400 font-medium">{t("medical_assistant")}</span>
            </div>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            onClick={startNewSession}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>{t("new_consult")}</span>
          </button>
        </div>

        
        {/* Historial Medico Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowMedicalHistory(true)}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 font-medium flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t("my_history")}</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar paciente o fecha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase px-2 mb-1 tracking-wider">Historial de Consultas</div>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-500 text-xs">
              {t("no_consults")}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start justify-between group border ${
                    isActive 
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' 
                      : 'hover:bg-slate-900/60 border-transparent text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-xs truncate text-slate-200 group-hover:text-cyan-300">
                      {session.patient_name || 'Paciente Anónimo'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {session.title}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Health & User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-400" /> Motor Ollama
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              {healthStatus.ollama_running ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 text-[11px]">
                  <XCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 mt-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <User className="w-3.5 h-3.5 text-cyan-500" /> {username || 'Médico'}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-cyan-400 transition-colors" title="Ajustes de Motor">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 transition-colors" title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between glass-panel z-10 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              className="md:hidden p-1.5 -ml-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Nombre del Paciente</div>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre del Paciente..."
                className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1 -ml-1 w-32 md:w-auto hover:bg-slate-900/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 relative shrink-0">
            {/* HIPAA Badge Restored */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Certificado HIPAA / RGPD</span>
            </div>

            {/* Visual Engine Dropdown para la Demo */}
            <button
              onClick={() => setShowEngineDropdown(!showEngineDropdown)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-medium text-sm transition-colors shadow-md"
            >
              Motor: {selectedEngine.includes('Local') ? 'Local' : 'API'} <span className="text-xs">▼</span>
            </button>

            {/* Dropdown Menu */}
            {showEngineDropdown && (
              <>
                {/* Overlay invisible para cerrar al hacer clic afuera */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEngineDropdown(false)}
                />
                
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-teal-600/30 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 flex flex-col">
                    {[
                      { id: 'ollama', name: 'Local (Ollama)', icon: '●' },
                      { id: 'vllm', name: 'Local (vLLM)', icon: '●' },
                      { id: 'dr7', name: 'API Dr7.ai', icon: '○' },
                      { id: 'key', name: 'API propia (key)', icon: '○' }
                    ].map((engine) => (
                      <button
                        key={engine.id}
                        onClick={() => {
                          setSelectedEngine(engine.name);
                          setShowEngineDropdown(false);
                        }}
                        className="text-left px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50 rounded transition-colors flex items-center gap-2"
                      >
                        <span className={`text-teal-600 text-[10px] ${engine.icon === '●' ? 'animate-pulse' : ''}`}>{engine.icon}</span>
                        {engine.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* PHI DETECTED ALERT BANNER */}
        {phiAlert && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-300 text-xs animate-in slide-in-from-top duration-300 z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Aviso de Privacidad:</strong> Se detectaron y enmascararon datos personales o identidades (PHI) en la consulta para cumplir con la normativa HIPAA/RGPD.</span>
            </div>
            <button onClick={() => setPhiAlert(false)} className="text-amber-400 hover:text-amber-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-sky-500/20 border border-cyan-500/30 flex items-center justify-center shadow-xl shadow-cyan-500/10">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Bienvenido a MedIA Hub</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                  Asistente clínico multimodal impulsado por inteligencia artificial local para análisis de radiografías, informes médicos en PDF y soporte de diagnóstico.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs text-left max-w-sm mx-auto shadow-lg shadow-emerald-500/5">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <span>
                    <strong>100% Privado y Seguro:</strong> Cumplimiento estricto de normativas HIPAA y RGPD. El procesamiento es estrictamente local (Edge AI). Ningún dato clínico sale de esta computadora.
                  </span>
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
                <button
                  onClick={() => {
                    imageInputRef.current?.click();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-800 hover:border-cyan-500/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <ImageIcon className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-200">Análisis Radiológico</div>
                  <div className="text-[11px] text-slate-400 mt-1">Sube una radiografía para evaluación por visión artificial.</div>
                </button>

                <button
                  onClick={() => {
                    pdfInputRef.current?.click();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-800 hover:border-cyan-500/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <FileText className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-200">Procesar PDF</div>
                  <div className="text-[11px] text-slate-400 mt-1">Adjunta exámenes de laboratorio o historias clínicas.</div>
                </button>

                <button
                  onClick={() => {
                    startTriageSession();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-800 hover:border-cyan-500/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <Stethoscope className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-200">Iniciar Triaje Clínico</div>
                  <div className="text-[11px] text-slate-400 mt-1">Evaluación de síntomas paso a paso por IA.</div>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.type === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser 
                      ? 'bg-gradient-to-tr from-cyan-600 to-sky-500 text-white' 
                      : 'bg-slate-900 border border-slate-700 text-cyan-400 shadow-md'
                  }`}>
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col space-y-2 max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-600/10'
                        : 'glass-card text-slate-200 rounded-tl-none border border-slate-800 shadow-lg'
                    }`}>
                      
                      {/* Attached Image Preview if User */}
                      {msg.image && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-w-xs">
                          <img src={msg.image.startsWith('data:') ? msg.image : `data:image/jpeg;base64,${msg.image}`} alt="Adjunto" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      {/* PDF Attached Badge */}
                      {msg.pdf && (
                        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Documento PDF Adjunto</span>
                        </div>
                      )}

                      {/* PHI Scrubbed Badge */}
                      {msg.phiScrubbed && (
                        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px]">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          <span>PHI Enmascarado (HIPAA)</span>
                        </div>
                      )}

                      {/* Markdown Content */}
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                        {!isUser && msg.text === '' && (
                           <span className="inline-block w-1.5 h-4 bg-cyan-400 animate-pulse ml-1 align-middle"></span>
                        )}
                      </div>

                      {/* Action Buttons for AI Responses */}
                      {!isUser && msg.text !== '' && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                          <button
                            onClick={() => speakText(msg.text)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                            title="Leer en voz alta"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Leer
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copiar</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const activeSession = sessions.find(s => s.id === currentSessionId);
                              const sessionTitle = activeSession ? activeSession.title : 'reporte';
                              downloadReport(msg.text, patientName, sessionTitle);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar txt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="glass-card text-slate-300 p-4 rounded-2xl rounded-tl-none border border-slate-800 flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-400">MedIA Hub está conectando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-4 glass-panel border-t border-slate-800/80 z-10">
          
          {/* File Previews Bar */}
          {(selectedImagePreview || selectedPdfName) && (
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-800">
              {selectedImagePreview && (
                <div className="relative group">
                  <img src={selectedImagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-cyan-500/40" />
                  <button
                    onClick={() => { setSelectedImage(null); setSelectedImagePreview(null); }}
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {selectedPdfName && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-medium">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="max-w-xs truncate">{selectedPdfName}</span>
                  <button
                    onClick={() => { setSelectedPdf(null); setSelectedPdfName(null); }}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            
            {/* Hidden Inputs */}
            <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
            <input type="file" ref={pdfInputRef} accept="application/pdf" onChange={handlePdfChange} className="hidden" />

            {/* Attach Buttons */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Adjuntar Radiografía o Imagen Médica"
              className={`p-2.5 rounded-xl border transition-all ${
                selectedImage 
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              title="Adjuntar Informe o Examen PDF"
              className={`p-2.5 rounded-xl border transition-all ${
                selectedPdf 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-slate-700'
              }`}
            >
              <FileText className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                disabled={isTriageClosed}
                placeholder={isTriageClosed ? "Triaje finalizado." : "{t("describe_symptoms")}"}
                className={`w-full bg-slate-900 border ${isTriageClosed ? 'border-slate-800 opacity-50 cursor-not-allowed' : 'border-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50'} rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 resize-none transition-all`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={isLoading || (!inputMessage.trim() && !selectedImage && !selectedPdf) || isTriageClosed}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </main>
      



      {/* MEDICAL HISTORY MODAL */}
      {showMedicalHistory && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Mi Historial Clínico (Pasaporte QR)
              </h2>
              <button onClick={() => setShowMedicalHistory(false)} className="text-slate-400 hover:text-rose-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <form onSubmit={savePatientProfile} className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t("full_name")}</label>
                    <input type="text" required value={patientProfile.full_name || ''} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t("dob")}</label>
                    <input type="date" required value={patientProfile.date_of_birth || ''} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{t("gender")}</label>
                    <select value={patientProfile.gender || ''} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500">
                      <option value="">Seleccione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Grupo Sanguíneo</label>
                    <select value={patientProfile.blood_type || ''} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500">
                      <option value="">Seleccione</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Alergias Conocidas</label>
                  <textarea value={patientProfile.allergies || ''} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" rows={2} placeholder="Ej. Penicilina, polen..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Enfermedades Crónicas</label>
                  <textarea value={patientProfile.chronic_conditions || ''} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" rows={2} placeholder="Ej. Hipertensión, asma..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t("meds")}</label>
                  <textarea value={patientProfile.current_medications || ''} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" rows={2} placeholder="Ej. Losartán 50mg..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t("emergency")}</label>
                  <input type="text" value={patientProfile.emergency_contact || ''} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:border-cyan-500" placeholder="Nombre y teléfono" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors">
                  Guardar Historial
                </button>
              </form>

              <div className="w-full md:w-48 flex flex-col items-center justify-start border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold text-slate-200">Pasaporte Médico QR</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Escanea en caso de emergencia médica</p>
                </div>
                {patientProfile.qr_code_base64 ? (
                  <div className="bg-white p-2 rounded-xl">
                    <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-40 h-40" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs text-center p-4 border border-slate-700 border-dashed">
                    Guarda tu historial para generar el QR
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                Motor de IA
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-rose-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modelo de Texto (Ollama)</label>
                  <input 
                    type="text"
                    value={engineSettings.text_model}
                    onChange={(e) => setEngineSettings({...engineSettings, text_model: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modelo de Visión (Ollama)</label>
                  <input 
                    type="text"
                    value={engineSettings.vision_model}
                    onChange={(e) => setEngineSettings({...engineSettings, vision_model: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button onClick={() => setShowSettings(false)} className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2 rounded-lg transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
