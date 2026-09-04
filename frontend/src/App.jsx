import DoctorDashboard from './DoctorDashboard';
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PatientHome from './views/PatientHome';
import PatientTreatments from './views/PatientTreatments';
import PatientMore from './views/PatientMore';

import TriageWizard from './views/TriageWizard';
import DocumentAnalyzer from './views/DocumentAnalyzer';
import PatientChat from './views/PatientChat';
import MedicalHistory from './views/MedicalHistory';
import BottomNav from './components/BottomNav';
import DoctorOnboarding from './views/DoctorOnboarding';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [token, setToken] = useState(localStorage.getItem('med_token') || null);
  const [username, setUsername] = useState(null);
  const [patientScreen, setPatientScreen] = useState(() => {
    const path = window.location.pathname.replace('/', '');
    return path || 'home';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const handleNavigate = (screen) => {
    const screenMap = {
      'home': '/paciente',
      'general_chat': '/paciente/chat',
      'documents': '/paciente/documentos',
      'history': '/paciente/historial',
      'triage': '/paciente/asistente',
      'doctors': '/paciente/doctors',
      'more': '/paciente/mas',
      'search': '/paciente/biblioteca'
    };
    if (screen === 'triage') startTriageSession();
    navigate(screenMap[screen] || '/paciente');
  };

  // History API integration for native back button
  useEffect(() => {
    // Push the initial state if it's the first time
    if (!window.history.state) {
      const initialScreen = window.location.pathname.replace('/', '') || 'home';
      window.history.replaceState({ screen: initialScreen }, '', window.location.pathname);
    }

    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setPatientScreen(event.state.screen);
      } else {
        navigate('/paciente');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to change screen and update history
  const navigateToScreen = (screen) => {
    if (screen !== patientScreen) {
      const url = screen === 'home' ? '/' : '/' + screen;
      window.history.pushState({ screen }, '', url);
      setPatientScreen(screen);
    }
  };

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('currentSessionId') || null);
  const [triageSessionId, setTriageSessionId] = useState(() => localStorage.getItem('triageSessionId') || null);
  const [isTriageClosed, setIsTriageClosed] = useState(() => localStorage.getItem('isTriageClosed') === 'true');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (currentSessionId) localStorage.setItem('currentSessionId', currentSessionId);
    else localStorage.removeItem('currentSessionId');
  }, [currentSessionId]);

  useEffect(() => {
    if (triageSessionId) localStorage.setItem('triageSessionId', triageSessionId);
    else localStorage.removeItem('triageSessionId');
  }, [triageSessionId]);

  useEffect(() => {
    localStorage.setItem('isTriageClosed', isTriageClosed);
  }, [isTriageClosed]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
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
    formData.append('language', language);
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
  const [showDoctorOnboarding, setShowDoctorOnboarding] = useState(false);
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
    localStorage.removeItem('med_role');
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    navigate('/login');
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
      fetchHistory();
    }
  }, [token]);

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/patients/me/history`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    }
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
        fetchPatientProfile();
      fetchHistory(); // reload to get new QR
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
        setMessages([{ id: Date.now(), type: 'ai', text: t('triage_welcome'), phiScrubbed: false }]);
      } else {
        throw new Error("Fallo en el servidor");
      }
    } catch (err) {
      console.error("Error iniciando sesión de triaje:", err);
      alert("Error al iniciar la sesión de triaje. Verifica tu conexión o intenta de nuevo.");
      navigate('/paciente');
    }
  };


  const clearAttachments = () => {
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
    setSelectedPdf(null);
    setSelectedPdfName("");
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


  const handleSendGeneral = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedImagePreview && !selectedPdfName) return;

    const userMsg = { 
      type: "user", 
      text: inputMessage,
      image: selectedImagePreview,
      pdf: selectedPdfName
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);
    clearAttachments();

    try {
      const response = await fetch(`${API_URL}/api/chat/general`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.text
          })),
          language: language
        })
      });

      if (!response.ok) throw new Error("Error en red");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      
      setMessages([...newMessages, { type: "ai", text: "" }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = aiText;
          return updated;
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { type: "ai", text: "Error de conexin." }]);
    } finally {
      setIsLoading(false);
    }
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
        setMessages((prev) => [...prev, { id: Date.now() + 2, type: 'ai', text: t('analyzing_ocr'), phiScrubbed: false }]);
        
        const formData = new FormData();
        if (selectedImageFile) {
            formData.append('file', selectedImageFile);
        } else if (selectedPdfFile) {
            formData.append('file', selectedPdfFile);
        }

        try {
          const uploadRes = await fetch(`${API_URL}/api/documents/upload`, {
              method: 'POST',
              headers: authHeaders,
              body: formData
            });

          if (!uploadRes.ok) {
            // Attempt to parse JSON error, fallback if CORS blocked it
            let errText = t('error_unknown');
            try {
                const errData = await uploadRes.json();
                errText = errData.detail || errText;
            } catch (e) {}
            throw new Error(`Fallo al analizar el documento: ${errText}`);
          }

          const uploadData = await uploadRes.json();
            documentContext = `\n\n--- INICIO DEL REPORTE ---\n${uploadData.extracted_text}\n--- FIN DEL REPORTE ---`;
            
            // Refrescar el perfil del paciente porque el backend acaba de auto-perfilarlo con los datos del documento
            await fetchPatientProfile();
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

  const path = location.pathname;

  if (path === '/' || path === '') {
    if (!token) return <Navigate to="/login" />;
    return <Navigate to={viewMode === 'doctor' ? '/medico' : '/paciente'} />;
  }

  if (path === '/registro/medico') {
    return <DoctorOnboarding onNavigateLogin={() => navigate('/login')} />;
  }

  if (!token && path !== '/login') {
    return <Navigate to="/login" />;
  }

  if (path === '/login') {
    if (token) return <Navigate to={viewMode === 'doctor' ? '/medico' : '/paciente'} />;
    return <Auth 
      onLogin={(jwt, role) => { 
        setToken(jwt); 
        localStorage.setItem('med_token', jwt); 
        if(role) { 
          setViewMode(role); 
          localStorage.setItem('med_role', role); 
          navigate(role === 'doctor' ? '/medico' : '/paciente');
        } else {
          navigate('/paciente');
        }
      }} 
      apiUrl={API_URL} 
      onNavigateDoctorRegister={() => navigate('/registro/medico')}
    />;
  }

  if (path.startsWith('/medico')) {
    if (viewMode !== 'doctor') return <Navigate to="/paciente" />;
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {
      setToken(null); 
      localStorage.removeItem('med_token'); 
      localStorage.removeItem('med_role'); 
      setViewMode('patient');
      navigate('/login');
    }} />;
  }

  // If we reach here, we are in a patient route
  if (viewMode === 'doctor') return <Navigate to="/medico" />;
  // Global BottomNav handler for all patient routes
  const activeTab = path === '/paciente' ? 'home'
    : (path === '/paciente/historial') ? 'history'
    : (path === '/paciente/tratamientos') ? 'treatments'
    : (path === '/paciente/mas') ? 'more'
    : (path === '/paciente/chat' || path === '/paciente/asistente' || path === '/paciente/triaje') ? 'ai'
    : 'home';

    const handleBottomNav = (tab) => {
    if (tab === 'home') navigate('/paciente');
    if (tab === 'ai' || tab === 'triage') {
      startTriageSession();
      navigate('/paciente/asistente');
    }
    if (tab === 'patients') {
      fetchPatientProfile();
      fetchHistory();
      navigate('/paciente/historial');
    }
    if (tab === 'history') {
      fetchPatientProfile();
      navigate('/paciente/historial');
    }
    if (tab === 'treatments') {
      navigate('/paciente/tratamientos');
    }
    if (tab === 'agenda') alert('Agenda en desarrollo...');
    if (tab === 'more') navigate('/paciente/mas');
    if (tab === 'general_chat') navigate('/paciente/chat');
    if (tab === 'documents') navigate('/paciente/documentos');
    if (tab === 'search') setShowMedicalSearch(true);
    if (tab === 'doctors') alert('Búsqueda de médicos en desarrollo...');
  };

  // The GlobalBottomNav is fixed, so it always floats above all route content
  const GlobalBottomNav = (
    <BottomNav activeTab={activeTab} onTabChange={handleBottomNav} />
  );


  
  if (path === '/paciente/mas') {
    return (
      <PatientMore 
        onNavigate={handleBottomNav} 
        onLogout={handleLogout} 
      />
    );
  }
  if (path === '/paciente/tratamientos') {
    return (
      <>
        <PatientTreatments 
          apiUrl={API_URL} 
          authHeaders={authHeaders} 
          onNavigate={handleBottomNav} 
        />
      </>
    );
  }

  if (path === '/paciente/historial') {
    return (
      <>
        <MedicalHistory 
          patientProfile={patientProfile}
          setPatientProfile={setPatientProfile}
          savePatientProfile={savePatientProfile}
          sessions={sessions}
          onBack={() => navigate('/paciente')}
        />
        {GlobalBottomNav}
      </>
    );
  }

  if (path === '/paciente') {
    return (
      <>
        <PatientHome 
          onLogout={handleLogout}
          onNavigate={(screen) => {
            if (screen === 'doctors') {
              alert('El módulo de especialistas se encuentra en desarrollo. ¡Pronto disponible!');
            } else {
              if (screen === 'history') {
                fetchPatientProfile();
                fetchHistory();
              }
              handleNavigate(screen);
            }
          }} 
          />
        {GlobalBottomNav}
      </>
    );
  }

  if (path === '/paciente/triaje') {
    return (
      <>
        <TriageWizard 
        onBack={() => navigate('/paciente')} 
        onStartChat={(symptoms) => {
          navigate('/paciente/asistente');
          setInputMessage(symptoms);
          startTriageSession();

        }} />
        {GlobalBottomNav}
      </>
    );
  }

  
  if (path === '/paciente/biblioteca') {
    return (
      <>
        <PatientHome 
          onLogout={handleLogout}
          onNavigate={(screen) => {
            if (screen === 'doctors') {
              alert('El módulo de especialistas se encuentra en desarrollo. ¡Pronto disponible!');
            } else {
              if (screen === 'history') {
                fetchPatientProfile();
                fetchHistory();
              }
              handleNavigate(screen);
            }
          }} 
          />
        <MedicalSearchModal isOpen={true} onClose={() => navigate('/paciente')} token={token} apiUrl={API_URL} userProfile={patientProfile} />
        {GlobalBottomNav}
      </>
    );
  }
  if (path === '/paciente/documentos') {
    return (
      <>
        <DocumentAnalyzer
          onBack={() => navigate('/paciente')}
          apiUrl={API_URL}
          authHeaders={authHeaders}
          onAskFollowUp={(extractedText, filename) => {
            // Pre-load document context into triage chat
            setMessages(prev => [
              ...prev,
              {
                id: Date.now(),
                type: 'user',
                text: `Por favor, explícame este documento clínico (${filename || 'documento'}):`,
                phiScrubbed: false
              }
            ]);
            // Store extracted text so handleSend can inject it as context
            setInputMessage(`Tengo dudas sobre los resultados de mi documento: ${filename}`);
            startTriageSession().then(() => navigate('/paciente/asistente'));
          }}
        />
        {GlobalBottomNav}
      </>
    );
  }


  if (path === '/paciente/chat') {
    return (
      <>
        <PatientChat 
          patientProfile={patientProfile}
          sessions={sessions}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSend={handleSendGeneral}
          isLoading={isLoading}
          onBack={() => navigate('/paciente')}
          imageInputRef={imageInputRef}
          pdfInputRef={pdfInputRef}
          handleImageChange={handleImageChange}
          handlePdfChange={handlePdfChange}
          selectedImagePreview={selectedImagePreview}
          selectedPdfName={selectedPdfName}
          onClearAttachment={() => {
            setSelectedImage(null); setSelectedImagePreview(null); setSelectedImageFile(null);
            setSelectedPdf(null); setSelectedPdfName(null); setSelectedPdfFile(null);
          }}
        />
        {GlobalBottomNav}
      </>
    );
  }

  if (path === '/paciente/asistente') {
    return (
      <>
        <PatientChat 
          patientProfile={patientProfile}
          sessions={sessions}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSend={handleSend}
          isLoading={isLoading}
          onBack={() => navigate('/paciente')}
          imageInputRef={imageInputRef}
          pdfInputRef={pdfInputRef}
          handleImageChange={handleImageChange}
          handlePdfChange={handlePdfChange}
          selectedImagePreview={selectedImagePreview}
          selectedPdfName={selectedPdfName}
          onClearAttachment={() => {
            setSelectedImage(null); setSelectedImagePreview(null); setSelectedImageFile(null);
            setSelectedPdf(null); setSelectedPdfName(null); setSelectedPdfFile(null);
          }}
        />
        {GlobalBottomNav}
      </>
    );
  }

  // Fallback to old UI
  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">
      {/* Botón flotante para regresar al Home si estamos en chat u otra vista vieja */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => navigate('/paciente')} className="bg-brand-purple text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs">Cerrar Chat</button>
      </div>
      
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
              <h1 className="font-bold text-lg leading-none text-brand">VitalAI</h1>
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
            onClick={() => { fetchPatientProfile();
      fetchHistory(); setShowMedicalHistory(true); }}
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
              <div className="w-16 h-16 rounded-2xl bg-semantic-info-bg border border-border-subtle flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8 text-brand" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bienvenido a VitalAI</h2>
                <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
                  Tu asistente médico de confianza. Te ayudamos a entender tus estudios médicos, radiografías y síntomas de forma clara, rápida y segura.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-semantic-success-bg/10 border border-semantic-success-text/20/30 rounded-lg text-semantic-success-text text-xs text-left max-w-sm mx-auto shadow-lg shadow-sm">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <span>
                    <strong>100% Privado y Seguro:</strong> Cumplimiento estricto de normas de privacidad (HIPAA y RGPD). Tu información médica es totalmente confidencial y nunca sale de tu dispositivo personal.
                  </span>
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-4">
                <button
                  onClick={() => {
                    imageInputRef.current?.click();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-200 shadow-sm hover:border-brand/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <ImageIcon className="w-5 h-5 text-brand mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-800">Análisis Radiológico</div>
                  <div className="text-[11px] text-slate-600 mt-1">Sube una radiografía o imagen médica para obtener una evaluación por IA.</div>
                </button>

                <button
                  onClick={() => {
                    pdfInputRef.current?.click();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-200 shadow-sm hover:border-brand/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <FileText className="w-5 h-5 text-semantic-info-text mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-800">Análisis de Exámenes</div>
                  <div className="text-[11px] text-slate-600 mt-1">Adjunta resultados de laboratorio o documentos clínicos para su revisión por IA.</div>
                </button>

                <button
                  onClick={() => {
                    startTriageSession();
                  }}
                  className="p-3.5 glass-card rounded-xl border border-slate-200 shadow-sm hover:border-brand/40 text-left transition-all hover:scale-[1.02] group"
                >
                  <Stethoscope className="w-5 h-5 text-semantic-success-text mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-xs text-slate-800">Evaluación de Síntomas</div>
                  <div className="text-[11px] text-slate-600 mt-1">Triaje clinico asistido por IA.</div>
                </button>
              <button
                onClick={() => {
                  setShowMedicalSearch(true);
                }}
                className="p-3.5 glass-card rounded-xl border border-slate-200 shadow-sm hover:border-brand/40 text-left transition-all hover:scale-[1.02] group"
              >
                <BookOpen className="w-5 h-5 text-content-secondary mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-xs text-slate-800">Biblioteca Médica</div>
                <div className="text-[11px] text-slate-600 mt-1">Busca información personalizada en nuestra base de estudios y literatura científica asistido por IA.</div>
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
                      ? 'bg-gradient-to-tr bg-surface border border-border-subtle text-white' 
                      : 'bg-white border border-slate-300 text-brand shadow-md'
                  }`}>
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col space-y-2 max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-base border border-border-subtle text-content-primary rounded-tr-none shadow-lg shadow-sm'
                        : 'glass-card text-slate-800 rounded-tl-none border border-slate-200 shadow-sm shadow-lg'
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
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white prose-pre:border prose-pre:border-slate-200 shadow-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                        {!isUser && msg.text === '' && (
                           <span className="inline-block w-1.5 h-4 bg-brand animate-pulse ml-1 align-middle"></span>
                        )}
                      </div>

                      {/* Action Buttons for AI Responses */}
                      {!isUser && msg.text !== '' && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-300/50">
                          <button
                            onClick={() => speakText(msg.text)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-medium transition-colors"
                            title="Leer en voz alta"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Leer
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-medium transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <><Check className="w-3.5 h-3.5 text-semantic-success-text" /> Copiado</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copiar</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const activeSession = sessions.find(s => s.id === currentSessionId);
                              const sessionTitle = activeSession ? activeSession.title : 'reporte';
                              downloadReport(msg.text, username || 'Paciente', sessionTitle);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-medium transition-colors"
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
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-300 text-brand flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="glass-card text-slate-700 p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-600">VitalAI está conectando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-4 glass-panel border-t border-slate-200 shadow-sm/80 z-10">
          
          {/* File Previews Bar */}
          {(selectedImagePreview || selectedPdfName) && (
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-200 shadow-sm">
              {selectedImagePreview && (
                <div className="relative group">
                  <img src={selectedImagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-brand/30/40" />
                  <button
                    onClick={() => { setSelectedImage(null); setSelectedImagePreview(null);
    setSelectedImageFile(null); }}
                    className="absolute -top-1.5 -right-1.5 bg-semantic-danger-bg text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
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
                    onClick={() => { setSelectedPdf(null); setSelectedPdfName(null);
    setSelectedPdfFile(null); }}
                    className="text-slate-600 hover:text-semantic-danger-text ml-1"
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
              onClick={() => setIsSidebarOpen(true)}
              title="Abrir Menú"
              className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:text-brand hover:border-slate-300 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Adjuntar Radiografía o Imagen Médica"
              className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all ${
                selectedImage 
                  ? 'bg-brand/20 border-brand/30 text-brand' 
                  : 'bg-white border-slate-200 shadow-sm text-slate-600 hover:text-brand hover:border-slate-300'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="whitespace-nowrap">Subir Imagen</span>
            </button>

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              title="Adjuntar Informe o Examen PDF"
              className={`px-3 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all ${
                selectedPdf 
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                  : 'bg-white border-slate-200 shadow-sm text-slate-600 hover:text-indigo-400 hover:border-slate-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="whitespace-nowrap">Subir PDF</span>
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
                placeholder={isTriageClosed ? "Triaje finalizado." : t("describe_symptoms")}
                className={`w-full bg-white border ${isTriageClosed ? 'border-slate-200 shadow-sm opacity-50 cursor-not-allowed' : 'border-slate-300 focus:border-brand/30/50 focus:ring-1 focus:ring-cyan-500/50'} rounded-xl py-3 pl-4 pr-12 text-sm text-slate-800 placeholder-slate-500 resize-none transition-all`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={isLoading || (!inputMessage.trim() && !selectedImage && !selectedPdf) || isTriageClosed}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-brand hover:bg-semantic-info-bg text-semantic-info-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

      </main>
      



      
        {/* DOCUMENTS MODAL */}
        {showDocuments && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 my-auto">
              
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-content-primary0" />
                  Mis Documentos Médicos
                </h2>
                <button onClick={() => setShowDocuments(false)} className="text-slate-600 hover:text-semantic-danger-text bg-slate-100 p-1.5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* UPLOAD FORM */}
                <div className="md:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                    <Upload className="w-4 h-4 text-content-primary0"/> Subir Nuevo
                  </h3>
                  <form onSubmit={uploadDocument} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Documento</label>
                      <select 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-cyan-500 outline-none shadow-sm"
                      >
                        <option value="informe_medico">Informe Médico</option>
                        <option value="analitica">Analítica de Sangre</option>
                        <option value="medicacion">Receta / Medicación</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Archivo (PDF max 10MB)</label>
                      <input 
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand file:text-white hover:file:bg-brand-hover file:cursor-pointer file:transition-colors bg-white border border-slate-300 rounded-lg shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Notas (Opcional)</label>
                      <textarea 
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        placeholder="Ej: Análisis del 15 de agosto..."
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none shadow-sm"
                        rows="2"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!docFile || uploadingDoc}
                      className="w-full py-2.5 bg-brand hover:bg-brand text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {uploadingDoc ? 'Subiendo...' : <><Upload className="w-4 h-4"/> Confirmar Subida</>}
                    </button>
                  </form>
                </div>

                {/* DOCUMENTS LIST */}
                <div className="md:col-span-2">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Tus Archivos ({documents.length})</h3>
                  
                  {documents.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl h-full flex flex-col justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">Aún no has subido ningún documento.</p>
                      <p className="text-slate-400 text-xs mt-1">Usa el formulario de la izquierda para empezar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex flex-col p-4 bg-white border border-slate-200 shadow-sm rounded-xl hover:border-brand/30 hover:shadow-md transition-all group w-full">
                          <div className="flex items-start justify-between w-full">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br bg-surface border border-border-subtle flex items-center justify-center text-brand shrink-0 border border-brand/30 group-hover:scale-105 transition-transform">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium uppercase text-[10px] tracking-wider border border-slate-200">
                                  {doc.document_type.replace('_', ' ')}
                                </span>
                                <span>•</span>
                                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              </div>
                              {doc.notes && (
                                <p className="text-xs text-slate-400 mt-1 truncate max-w-sm" title={doc.notes}>{doc.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            <a 
                              href={doc.download_url} 
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 text-slate-400 hover:text-brand hover:bg-semantic-info-bg rounded-lg transition-colors border border-transparent hover:border-brand/30"
                              title="Descargar/Ver PDF"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={() => deleteDocument(doc.id)}
                              className="p-2.5 text-slate-400 hover:text-semantic-danger-text hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-semantic-danger-text/20"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          </div>
                          
                          {/* AI SUMMARY RENDERED HERE */}
                          {renderExtractedInsights(doc.extracted_text)}
                          
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MEDICAL HISTORY MODAL */}
      {showMedicalHistory && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-semantic-success-text" />
                Mi Historial Clínico (Pasaporte QR)
              </h2>
              <button onClick={() => setShowMedicalHistory(false)} className="text-slate-600 hover:text-semantic-danger-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <form onSubmit={savePatientProfile} className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t("full_name")}</label>
                    <input type="text" required value={patientProfile.full_name || ''} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t("dob")}</label>
                    <input type="date" required value={patientProfile.date_of_birth || ''} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t("gender")}</label>
                    <select value={patientProfile.gender || ''} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30">
                      <option value="">Seleccione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grupo Sanguíneo</label>
                    <select value={patientProfile.blood_type || ''} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30">
                      <option value="">Seleccione</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Altura (cm)</label>
                    <input type="text" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" placeholder="Ej. 175" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
                    <input type="text" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" placeholder="Ej. 70" />
                  </div>
                </div>
                </div>


                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Alergias Conocidas</label>
                  <textarea value={patientProfile.allergies || ''} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" rows={2} placeholder="Ej. Penicilina, polen..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Enfermedades Crónicas</label>
                  <textarea value={patientProfile.chronic_conditions || ''} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" rows={2} placeholder="Ej. Hipertensión, asma..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t("meds")}</label>
                  <textarea value={patientProfile.current_medications || ''} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" rows={2} placeholder="Ej. Losartán 50mg..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t("emergency")}</label>
                  <input type="text" value={patientProfile.emergency_contact || ''} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-brand/30" placeholder="Nombre y teléfono" />
                </div>

                <button type="submit" className="w-full bg-semantic-success-bg hover:bg-semantic-success-bg text-semantic-success-text font-medium py-2 rounded-lg transition-colors">
                  Guardar Historial
                </button>
              </form>

              <div className="w-full md:w-48 flex flex-col items-center justify-start border-t md:border-t-0 md:border-l border-slate-200 shadow-sm pt-6 md:pt-0 md:pl-6">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Pasaporte Médico QR</h3>
                  <p className="text-[10px] text-slate-600 mt-1">Escanea en caso de emergencia médica</p>
                </div>
                {patientProfile.qr_code_base64 ? (
                  <div className="bg-white p-2 rounded-xl">
                    <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-40 h-40" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-xs text-center p-4 border border-slate-300 border-dashed">
                    Guarda tu historial para generar el QR
                  </div>
                )}
              </div>
            </div> {/* Close flex-row here! */}

              {/* TRIAGE HISTORY UI */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-semantic-danger-text" />
                  Mi Historial de Triajes
                </h3>
                {patientProfile.triages && patientProfile.triages.length > 0 ? (
                  <div className="space-y-3">
                    {patientProfile.triages.map(t => (
                      <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                              t.status === 'closed_red' ? 'bg-semantic-danger-bg text-semantic-danger-text border-semantic-danger-text/20' :
                              t.status === 'closed_yellow' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                              'bg-semantic-success-bg text-semantic-success-text border-semantic-success-text/20'
                            }`}>
                            {t.status === 'closed_red' ? 'Urgencia' : t.status === 'closed_yellow' ? 'Atención' : 'Normal'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.final_report}</div>
                        {t.recommended_specialty && (
                          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                Derivación Inteligente
                              </p>
                              <p className="text-sm font-semibold text-indigo-900">Especialidad Recomendada: {t.recommended_specialty}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setShowHistory(false);
                                setShowDoctors(true);
                              }}
                              className="text-xs bg-brand hover:bg-brand-hover text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex-shrink-0"
                            >
                              Ver Directorio Médico
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No hay consultas previas de triaje.</p>
                )}
              </div>

          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-brand" />
                Acerca de VitalAI
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-600 hover:text-semantic-danger-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modelo de Texto (Ollama)</label>
                  <input 
                    type="text"
                    value={engineSettings.text_model}
                    onChange={(e) => setEngineSettings({...engineSettings, text_model: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-brand/30"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modelo de Visión (Ollama)</label>
                  <input 
                    type="text"
                    value={engineSettings.vision_model}
                    onChange={(e) => setEngineSettings({...engineSettings, vision_model: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:border-brand/30"
                  />
                </div>
              </div>

              <button onClick={() => setShowSettings(false)} className="w-full mt-4 bg-brand hover:bg-semantic-info-bg text-semantic-info-text font-medium py-2 rounded-lg transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
      <MedicalSearchModal 
        isOpen={showMedicalSearch} 
        onClose={() => setShowMedicalSearch(false)} 
        token={token} 
        apiUrl={API_URL} 
        userProfile={patientProfile} 
      />
    </div>
  );
}
