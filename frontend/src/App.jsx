import DoctorDashboard from './DoctorDashboard';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Auth from './Auth';
import MedicalSearchModal from './MedicalSearchModal';
import { 
  FolderOpen,
  Upload,
  Trash2,
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
  Server,
    BookOpen,
    Menu,
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
  

  const [showSettings, setShowSettings] = useState(false);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showMedicalSearch, setShowMedicalSearch] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('informe_medico');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState(null);

  
  const renderExtractedInsights = (extracted_text) => {
    if (!extracted_text) return null;
    
    let data = null;
    try {
      let cleanText = extracted_text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanText);
    } catch (e) {
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
            <Sparkles className="w-4 h-4 text-content-primary0" /> Resumen IA
          </div>
          <p className="whitespace-pre-wrap">{extracted_text}</p>
        </div>
      );
    }

    const severityColors = {
      'verde': 'bg-semantic-success-bg text-semantic-success-text border-semantic-success-text/20',
      'amarillo': 'bg-amber-100 text-amber-700 border-amber-200',
      'rojo': 'bg-semantic-danger-bg text-semantic-danger-text border-semantic-danger-text/20'
    };
    const badgeColor = severityColors[data.severidad?.toLowerCase()] || severityColors['amarillo'];

    return (
      <div className="mt-3 p-3 bg-semantic-info-bg/50 border border-brand/30 rounded-lg text-xs text-slate-600 space-y-2 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-brand">
            <Sparkles className="w-4 h-4 text-content-primary0" /> Resumen Clínico
          </div>
          {data.severidad && (
            <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider ${badgeColor}`}>
              {data.severidad}
            </span>
          )}
        </div>
        
        {data.resumen && <p className="text-slate-700 font-medium">{data.resumen}</p>}
        
        {data.diagnosticos && data.diagnosticos.length > 0 && (
          <div>
            <strong className="text-slate-700">Diagnósticos:</strong>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
              {data.diagnosticos.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}
        
        {data.anomalias && data.anomalias.length > 0 && (
          <div>
            <strong className="text-amber-700">Anomalías / Alertas:</strong>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
              {data.anomalias.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        
        {data.preguntas_sugeridas && data.preguntas_sugeridas.length > 0 && (
          <div className="pt-2 border-t border-brand/30 mt-2">
            <strong className="text-brand flex items-center gap-1">Preguntas sugeridas para tu médico:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600">
              {data.preguntas_sugeridas.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patients/me/documents`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents', error);
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    setUploadingDoc(true);
    
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('document_type', docType);
    if (docNotes) formData.append('notes', docNotes);

    try {
      const res = await fetch(`${API_URL}/api/patients/me/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setDocFile(null);
        setDocNotes('');
        alert('Documento subido correctamente');
        fetchDocuments();
      } else {
        const err = await res.json();
        alert('Error: ' + err.detail);
      }
    } catch (error) {
      alert('Error subiendo documento');
    }
    setUploadingDoc(false);
  };

  const deleteDocument = async (docId) => {
    if (!confirm('¿Seguro que quieres borrar este documento?')) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/me/documents/${docId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) fetchDocuments();
    } catch(error) {
      console.error('Error', error);
    }
  };

  useEffect(() => {
    if (showDocuments) {
      fetchDocuments();
    }
  }, [showDocuments]);

  const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient');
  const [patientProfile, setPatientProfile] = useState({
    full_name: '', date_of_birth: '', gender: '', blood_type: '', height: '', weight: '',
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
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null); // base64
  const [selectedPdfName, setSelectedPdfName] = useState(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  
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
      fetchPatientProfile();
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
    setSelectedImageFile(null);
    setSelectedPdf(null);
    setSelectedPdfName(null);
    setSelectedPdfFile(null);
    setPhiAlert(false);
  };

  const startTriageSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/triage/start`, { method: 'POST', headers: authHeaders });
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

    setSelectedImageFile(file);
    setSelectedImage(true); // Keeping this flag for logic checks
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedPdfFile(file);
    setSelectedPdf(true); // Keeping this flag for logic checks
    setSelectedPdfName(file.name);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && !selectedImage && !selectedPdf) || isLoading) return;

    const userText = inputMessage.trim() || ((selectedImage || selectedImageFile) ? 'Por favor, explícame los siguientes hallazgos médicos que fueron extraídos de mi radiografía:' : 'Por favor, explícame el siguiente documento clínico:');
    
    const tempUserMsg = {
      id: Date.now(),
      type: 'user',
      text: inputMessage.trim() || ((selectedImage || selectedImageFile) ? 'Por favor, explícame esta radiografía.' : 'Por favor, explícame este documento.'),
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
      patient_name: username || 'Paciente Anónimo',
      ...engineSettings
    };

    setSelectedImage(null);
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
    setSelectedPdf(null);
    setSelectedPdfName(null);
    setSelectedPdfFile(null);

    try {
      let documentContext = "";

      // Si hay archivo, subimos a /api/documents/upload
      if (selectedImage || selectedPdf) {
        setIsLoading(true);
        setMessages((prev) => [...prev, { id: Date.now() + 2, type: 'ai', text: 'Analizando documento adjunto con OCR...', phiScrubbed: false }]);
        
        const formData = new FormData();
        if (selectedImageFile) {
            formData.append('file', selectedImageFile);
        } else if (selectedPdfFile) {
            formData.append('file', selectedPdfFile);
        }

        try {
          const uploadRes = await fetch(`${API_URL}/api/documents/upload`, {
            method: 'POST',
            body: formData
          });

          if (!uploadRes.ok) {
            // Attempt to parse JSON error, fallback if CORS blocked it
            let errText = "Error desconocido procesando el documento en el servidor.";
            try {
                const errData = await uploadRes.json();
                errText = errData.detail || errText;
            } catch (e) {}
            throw new Error(`Fallo al analizar el documento: ${errText}`);
          }

          const uploadData = await uploadRes.json();
          documentContext = `\n\n--- INICIO DEL REPORTE ---\n${uploadData.extracted_text}\n--- FIN DEL REPORTE ---`;
        } catch (uploadErr) {
          throw new Error(`Error de subida: ${uploadErr.message}`);
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

      let endpoint;
      let finalSessionId = currentSessionId;
      
      if (!currentSessionId && (documentContext !== "" || selectedImage || selectedPdf)) {
          const startRes = await fetch(`${API_URL}/api/chat/start`, {
              method: 'POST',
              headers: authHeaders
          });
          if (startRes.ok) {
              const startData = await startRes.json();
              finalSessionId = startData.session_id;
              setCurrentSessionId(finalSessionId);
              fetchSessions();
          }
      }

      if (finalSessionId) {
          endpoint = `${API_URL}/api/chat/${finalSessionId}/message`;
      } else {
          endpoint = triageSessionId 
            ? `${API_URL}/api/triage/${triageSessionId}/message`
            : `${API_URL}/api/triage/chat`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatMessages, language: language })
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
          text: `⚠️ **Error:** No se pudo completar la solicitud. \nDetalle: ${err.message}`,
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
    return <Auth onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) { setViewMode(role); localStorage.setItem('med_role', role); } }} apiUrl={API_URL} />;
  }

  if (viewMode === 'doctor') {
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); localStorage.removeItem('med_role'); setViewMode('patient');}} />;
  }

  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">
      
      {/* SIDEBAR DE HISTORIAL */}
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside className={`w-80 glass-panel border-r border-slate-200 shadow-sm flex flex-col z-30 transition-transform absolute md:relative h-full bg-slate-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-sm">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-brand">VitalIA</h1>
              <span className="text-[11px] text-slate-600 font-medium">{t("medical_assistant")}</span>
            </div>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button className="md:hidden text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            onClick={startNewSession}
            className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>{t("new_consult")}</span>
          </button>
        </div>

        
          {/* Mis Documentos Button */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowDocuments(true)}
              className="w-full py-2 px-4 rounded-xl bg-semantic-info-bg border border-brand/30 hover:border-brand/30 text-brand font-medium flex items-center justify-center gap-2 transition-all hover:bg-brand shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-brand" />
              <span>Mis Documentos Médicos</span>
            </button>
          </div>
        {/* Historial Medico Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => { fetchPatientProfile(); setShowMedicalHistory(true); }}
            className="w-full py-2 px-4 rounded-xl bg-white border border-slate-300 hover:border-brand/30/50 text-slate-700 font-medium flex items-center justify-center gap-2 transition-all hover:bg-slate-100"
          >
            <ShieldCheck className="w-4 h-4 text-semantic-success-text" />
            <span>{t("my_history")}</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-600" />
            <input
              type="text"
              placeholder="Buscar paciente o fecha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 border border-slate-200 shadow-sm rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-brand/30/50"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-600 uppercase px-2 mb-1 tracking-wider">Historial de Consultas</div>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-600 text-xs">
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
                      ? 'bg-surface border-r border-border-subtle/40 border-brand/30/40 text-brand' 
                      : 'hover:bg-white/60 border-transparent text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-xs truncate text-slate-800 group-hover:text-brand">
                      {session.patient_name || 'Paciente Anónimo'}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {session.title}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-brand translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Health & User Footer */}
        <div className="p-3 border-t border-slate-200 shadow-sm/80 bg-slate-50/60 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-brand" /> Motor OpenAI (Cloud)
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              {healthStatus.ollama_running ? (
                <span className="inline-flex items-center gap-1 text-semantic-success-text bg-semantic-success-bg/10 px-2 py-0.5 rounded-full border border-semantic-success-text/20/20 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-semantic-danger-text bg-semantic-danger-bg/50 px-2 py-0.5 rounded-full border border-semantic-danger-text/20/20 text-[11px]">
                  <XCircle className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 shadow-sm/50 pt-2 mt-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <User className="w-3.5 h-3.5 text-content-primary0" /> {username || 'Médico'}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(true)} className="text-slate-600 hover:text-brand transition-colors" title="Ajustes de Motor">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleLogout} className="text-slate-600 hover:text-semantic-danger-text transition-colors" title="Cerrar sesión">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-200 shadow-sm/80 px-4 md:px-6 flex items-center justify-between glass-panel z-10 shrink-0">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              className="md:hidden p-1.5 -ml-2 text-slate-600 hover:text-brand rounded-lg hover:bg-slate-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-brand" />
            </div>
            <div>
              <div className="text-xs text-slate-600 font-medium">Nombre del Paciente</div>
              <input
                type="text"
                value={username || 'Paciente Anónimo'}
                readOnly
                placeholder="Nombre del Paciente..."
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1 -ml-1 w-32 md:w-auto hover:bg-white/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 relative shrink-0">
            <LanguageSelector />
            {/* HIPAA Badge Restored */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-semantic-success-bg/10 border border-semantic-success-text/20/20 text-semantic-success-text text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4 text-semantic-success-text" />
              <span className="font-medium">Certificado HIPAA / RGPD</span>
            </div>

            {/* Visual Engine Dropdown para la Demo */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-semantic-info-bg text-semantic-info-text font-medium text-sm transition-colors shadow-md border border-brand/20">
              <Server className="w-4 h-4 text-brand" />
              <span>Motor: GPT-4o-mini</span>
            </div>
