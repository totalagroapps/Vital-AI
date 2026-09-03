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
    : (path === '/paciente/historial') ? 'patients'
    : (path === '/paciente/asistente' || path === '/paciente/triaje') ? 'ai'
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

  return <Navigate to="/paciente" />;
}
