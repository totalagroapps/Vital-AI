import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useAppLogic() {
  const [token, setToken] = useState(localStorage.getItem('med_token') || null);
  const [username, setUsername] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [triageSessionId, setTriageSessionId] = useState(null);
  const [isTriageClosed, setIsTriageClosed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [patientName, setPatientName] = useState('Paciente Anónimo');

  const [showSettings, setShowSettings] = useState(false);
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
    const file = new Blob([`Informe Médico - ${patient}\n\n${text}`], {type: 'text/plain'});
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
          documentContext = `\n\n[Contexto del Documento Adjunto: ${uploadData.extracted_text}]`;
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


  return {
    token, setToken, username, setUsername, sessions, setSessions, currentSessionId, setCurrentSessionId, triageSessionId, setTriageSessionId, isTriageClosed, setIsTriageClosed, messages, setMessages, inputMessage, setInputMessage, patientName, setPatientName, showSettings, setShowSettings, engineSettings, setEngineSettings, selectedImage, setSelectedImage, selectedImagePreview, setSelectedImagePreview, selectedPdf, setSelectedPdf, selectedPdfName, setSelectedPdfName, selectedEngine, setSelectedEngine, showEngineDropdown, setShowEngineDropdown, isLoading, setIsLoading, healthStatus, setHealthStatus, searchQuery, setSearchQuery, phiAlert, setPhiAlert, copiedMsgId, setCopiedMsgId, messagesEndRef, imageInputRef, pdfInputRef, scrollToBottom, copyToClipboard, downloadReport, handleLogout, detectLanguage, speakText, fetchUser, checkHealth, fetchSessions, loadSession, startNewSession, startTriageSession, handleImageChange, handlePdfChange, handleSend, filteredSessions
  };
}
