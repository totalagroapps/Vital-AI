import React, { useState, useEffect, useRef } from 'react';
import DoctorHome from './views/DoctorHome';
import DoctorMore from './views/DoctorMore';
import DoctorCalendarView from './views/DoctorCalendarView';
import DoctorProfile from './views/DoctorProfile';
import DoctorSchedule from './views/DoctorSchedule';
import DoctorProfileForm from './views/DoctorProfileForm';
import { printHtmlContent, escapeHtml } from './utils/printPdf';
import MedicalSearchModal from './MedicalSearchModal';
import ClinicalCalculatorsModal from './views/ClinicalCalculatorsModal';
import PreventiveCalendarModal from './views/PreventiveCalendarModal';
import ConsensusMeterModal from './views/ConsensusMeterModal';
import ScribeSoapModal from './views/ScribeSoapModal';
import { translateSpecialtyName } from './i18n/catalogTranslations';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Download, FolderOpen, User, Activity, FileText, Send, Bot, Clock, 
  ChevronRight, Users, LogOut, Search, Loader2, Calendar, Printer, Heart, 
  ShieldCheck, Sparkles, Mic, Pill, AlertTriangle, Stethoscope, CheckCircle2, 
  MessageSquare, ExternalLink, Paperclip, X, Image as ImageIcon, Trash2 
} from 'lucide-react';

export default function DoctorDashboard({ apiUrl, authHeaders, onLogout }) {
  const { t, language, country, locale } = useLanguage();
  const [doctorScreen, setDoctorScreen] = useState('home');
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  // En pantallas pequeñas solo se muestra un panel a la vez: 'list' | 'detail' | 'copilot'
  const [mobilePane, setMobilePane] = useState('list');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDocuments, setPatientDocuments] = useState([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [showCalculatorsModal, setShowCalculatorsModal] = useState(false);
  const [showCaPtyVaModal, setShowCaPtyVaModal] = useState(false);
  const [showConsensusModal, setShowConsensusModal] = useState(false);
  const [showScribeModal, setShowScribeModal] = useState(false);

  // Copilot Chat States
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [isCopilotListening, setIsCopilotListening] = useState(false);
  const copilotEndRef = useRef(null);
  const copilotSpeechRef = useRef(null);

  // Copilot Attachments State (Unified Clip System)
  const [copilotAttachments, setCopilotAttachments] = useState([]);
  const copilotFileInputRef = useRef(null);
  const doctorStudiesInputRef = useRef(null);
  const [isUploadingStudies, setIsUploadingStudies] = useState(false);

  const addCopilotAttachments = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    const validFiles = Array.from(newFiles).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setCopilotAttachments(prev => [...prev, ...validFiles]);
  };

  const removeCopilotAttachment = (id) => {
    setCopilotAttachments(prev => {
      const item = prev.find(a => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  const clearCopilotAttachments = () => {
    copilotAttachments.forEach(a => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setCopilotAttachments([]);
  };

  const handleCopilotFilesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addCopilotAttachments(e.target.files);
      e.target.value = '';
    }
  };

  const handleCopilotPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      addCopilotAttachments(pastedFiles);
    }
  };

  const handleDoctorDirectUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedPatient) return;
    setIsUploadingStudies(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      formData.append('patient_id', selectedPatient.user_id);
      formData.append('language', language);
      const res = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        headers: { Authorization: authHeaders.Authorization },
        body: formData
      });
      if (!res.ok) {
        throw new Error(t('doctordashboard_error_al_subir_los_estudios'));
      }
      await fetchPatientDetail(selectedPatient.user_id);
    } catch (err) {
      console.error(err);
      alert(t('doctordashboard_upload_error', { message: err.message || t('doctordashboard_error_desconocido') }));
    } finally {
      setIsUploadingStudies(false);
      e.target.value = '';
    }
  };

  const toggleCopilotListening = () => {
    if (isCopilotListening) {
      if (copilotSpeechRef.current) copilotSpeechRef.current.stop();
      setIsCopilotListening(false);
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

    recognition.onstart = () => setIsCopilotListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCopilotInput((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = (e) => {
      setIsCopilotListening(false);
      if (e.error === 'not-allowed') {
        alert(t('microphone_permission_denied') || 'Permiso de micrófono denegado.');
      }
    };
    recognition.onend = () => setIsCopilotListening(false);

    copilotSpeechRef.current = recognition;
    try { recognition.start(); } catch (e) { setIsCopilotListening(false); }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/doctor/me`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
      }
    } catch (e) {
      console.error("Error fetching doctor profile:", e);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetail(selectedPatient.user_id);
      setCopilotMessages([{ role: 'assistant', content: t('doctordashboard_hola_doctor_soy_su_copiloto', { full_name: selectedPatient.full_name }) }]);
    }
  }, [selectedPatient]);

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, isCopilotThinking]);

  useEffect(() => {
    if (doctorScreen === 'copilot') setMobilePane('copilot');
    else if (doctorScreen === 'patients') setMobilePane(selectedPatient ? 'detail' : 'list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorScreen]);

  useEffect(() => {
    if (doctorScreen === 'copilot' && !selectedPatient && patients.length > 0) {
      setSelectedPatient(patients[0]);
    }
  }, [doctorScreen, selectedPatient, patients]);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const res = await fetch(`${apiUrl}/api/doctor/patients`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingPatients(false);
  };

  const handleExportPDF = () => {
    if (!patientDetail) return;

    let triagesHtml = (patientDetail.triages || []).map(triageItem => `
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
        <strong>${escapeHtml(t('doctordashboard_fecha'))}</strong> ${triageItem.created_at ? escapeHtml(new Date(triageItem.created_at).toLocaleString(locale)) : '--'}<br/>
        <strong>${escapeHtml(t('doctordashboard_categoria'))}</strong> ${escapeHtml(triageItem.category || 'N/A')} | <strong>${escapeHtml(t('doctordashboard_estado'))}</strong> ${escapeHtml(triageItem.status || '--')}<br/>
        ${triageItem.recommended_specialty ? `<strong>${escapeHtml(t('doctordashboard_especialidad_sugerida_2'))}</strong> ${escapeHtml(translateSpecialtyName(triageItem.recommended_specialty, language, t))}<br/>` : ''}
        <strong>${escapeHtml(t('doctordashboard_informe_clinico'))}</strong><br/>
        <div style="white-space: pre-wrap; font-size: 0.9em; color: #334155; margin-top: 4px;">${escapeHtml(triageItem.final_report || t('no_complete_report'))}</div>
      </div>
    `).join('');

    let medicationsHtml = (patientDetail.medications || []).map(m => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${escapeHtml(m.medication_name)}</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${escapeHtml(m.dosage || '--')}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${escapeHtml(m.frequency || '--')}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${escapeHtml(m.time_of_day || '--')}</td>
      </tr>
    `).join('');

    let referralHtml = '';
    if (patientDetail.smart_referral?.matched) {
      referralHtml = `
        <div class="referral-box">
          <h3 style="margin: 0 0 8px 0; color: #047857; font-size: 15px;">${escapeHtml(t('doctordashboard_derivacion_inteligente_recomendada'))}</h3>
          <p style="margin: 0 0 5px 0;"><strong>${escapeHtml(t('doctordashboard_especialidad_sugerida_2'))}</strong> ${escapeHtml(translateSpecialtyName(patientDetail.smart_referral.recommended_specialty, language, t))} (${escapeHtml(patientDetail.smart_referral.urgency?.toUpperCase() || '')})</p>
          <p style="margin: 0; font-size: 0.9em; color: #475569;"><strong>${escapeHtml(t('doctordashboard_motivo_clinico'))}</strong> ${escapeHtml(patientDetail.smart_referral.reason)}</p>
        </div>
      `;
    }

    const patientName = patientDetail?.profile?.full_name || selectedPatient?.full_name || t('default_patient_name');
    const title = t('doctordashboard_expediente_clinico', { patientName });
    const bodyHtml = `
      <div class="header">
        <h1><span class="brand">MIVOR.ai</span> ${escapeHtml(t('doctordashboard_expediente_clinico_oficial'))}</h1>
        <p>${escapeHtml(t('doctordashboard_historial_medico_integral_del_pacien'))} ${escapeHtml(t('app_slogan'))}</p>
      </div>

      <h2>${escapeHtml(t('patient_record'))}</h2>
      <div class="grid">
        <div><div class="label">${escapeHtml(t('name'))}</div><div class="value">${escapeHtml(patientName)}</div></div>
        <div><div class="label">${escapeHtml(t('date_of_birth'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.date_of_birth || '--')}</div></div>
        <div><div class="label">${escapeHtml(t('gender'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.gender || '--')}</div></div>
        <div><div class="label">${escapeHtml(t('blood_type_label'))}</div><div class="value" style="color: #e11d48;">${escapeHtml(patientDetail?.profile?.blood_type || 'N/A')}</div></div>
        <div><div class="label">${escapeHtml(t('allergies'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.allergies || t('doctordashboard_ninguna_alergia_registrada'))}</div></div>
        <div><div class="label">${escapeHtml(t('chronic_conditions_label'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.chronic_conditions || t('doctordashboard_sin_condiciones_cronicas_registradas'))}</div></div>
        <div><div class="label">${escapeHtml(t('doctordashboard_altura_peso'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.height ? `${patientDetail.profile.height} cm` : '--')} / ${escapeHtml(patientDetail?.profile?.weight ? `${patientDetail.profile.weight} kg` : '--')}</div></div>
        <div><div class="label">${escapeHtml(t('emergency_contact'))}</div><div class="value">${escapeHtml(patientDetail?.profile?.emergency_contact || '--')}</div></div>
      </div>

      ${referralHtml}

      <h2>${escapeHtml(t('doctordashboard_tratamiento_farmacologico_activo'))}</h2>
      ${medicationsHtml ? `
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(t('doctordashboard_farmaco'))}</th>
              <th>${escapeHtml(t('dosage'))}</th>
              <th>${escapeHtml(t('frequency'))}</th>
              <th>${escapeHtml(t('schedule'))}</th>
            </tr>
          </thead>
          <tbody>${medicationsHtml}</tbody>
        </table>
      ` : `<p style="color: #64748b; font-size: 0.9em;">${escapeHtml(t('doctordashboard_no_active_medications'))}</p>`}

      <h2>${escapeHtml(t('clinical_history'))}</h2>
      ${triagesHtml || `<p style="color: #64748b; font-size: 0.9em;">${escapeHtml(t('doctordashboard_no_health_guidance'))}</p>`}

      <div class="footer">
        ${escapeHtml(t('doctordashboard_documento_emitido_por_mivor_ai'))} ${escapeHtml(new Date().toLocaleString(locale))}
      </div>
    `;

    printHtmlContent(title, bodyHtml);
  };

  const handleReferPatient = (specialist, referral) => {
    const patientName = patientDetail?.profile?.full_name || selectedPatient?.full_name || t('default_patient_name');
    const reason = referral?.reason || t('doctordashboard_valoracion_especializada');
    const text = t('doctordashboard_hola_dr_a_le_comparto', { full_name: specialist.full_name, patientName, reason, specialty: specialist.specialty });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const fetchPatientDetail = async (userId) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${apiUrl}/api/doctor/patients/${userId}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPatientDetail(data);
        if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
          setPatientDocuments(data.documents);
        } else {
          const docRes = await fetch(`${apiUrl}/api/patients/${userId}/documents`, { headers: authHeaders });
          if (docRes.ok) {
            const docData = await docRes.json();
            setPatientDocuments(docData);
          } else {
            setPatientDocuments([]);
          }
        }
      } else {
        setPatientDetail({
          profile: {
            full_name: selectedPatient?.full_name || userId,
            date_of_birth: selectedPatient?.date_of_birth || '',
            gender: selectedPatient?.gender || '',
            blood_type: 'N/A',
            allergies: '',
            chronic_conditions: '',
            current_medications: '',
            height: '',
            weight: ''
          },
          triages: [],
          medications: [],
          documents: [],
          smart_referral: null
        });
        setPatientDocuments([]);
      }
    } catch (e) {
      console.error("Error fetching patient detail:", e);
      setPatientDetail({
        profile: {
          full_name: selectedPatient?.full_name || userId,
          date_of_birth: selectedPatient?.date_of_birth || '',
          gender: selectedPatient?.gender || '',
          blood_type: 'N/A',
          allergies: '',
          chronic_conditions: '',
          current_medications: '',
          height: '',
          weight: ''
        },
        triages: [],
        medications: [],
        documents: [],
        smart_referral: null
      });
      setPatientDocuments([]);
    }
    setIsLoadingDetail(false);
  };

  const handleCopilotSend = async (e) => {
    e.preventDefault();
    if ((!copilotInput.trim() && copilotAttachments.length === 0) || isCopilotThinking || !selectedPatient) return;

    const userText = copilotInput.trim() || (copilotAttachments.length > 0 ? t('doctordashboard_por_favor_analiza_los_documentos') : "");
    const currentAttachmentsSnapshot = [...copilotAttachments];

    setCopilotMessages(prev => [...prev, { 
      role: 'user', 
      content: userText, 
      attachments: currentAttachmentsSnapshot 
    }]);
    setCopilotInput('');
    clearCopilotAttachments();
    setIsCopilotThinking(true);

    let enrichedQuery = userText;

    // If there were attachments, upload them to /api/documents/upload for joint OCR and clinical insights
    if (currentAttachmentsSnapshot.length > 0) {
      try {
        const formData = new FormData();
        currentAttachmentsSnapshot.forEach(att => formData.append('files', att.file));
        formData.append('patient_id', selectedPatient.user_id);
        formData.append('language', language);

        const uploadRes = await fetch(`${apiUrl}/api/documents/upload`, {
          method: 'POST',
          headers: { Authorization: authHeaders.Authorization },
          body: formData
        });

        if (uploadRes.ok) {
          const docData = await uploadRes.json();
          let ocrContext = `\n\n[${t('doctordashboard_ctx_attached_docs')}: ${docData.filename || t('doctordashboard_estudio_clinico')}]`;
          if (docData.summary) ocrContext += `\n${t('doctordashboard_ctx_summary')}: ${docData.summary}`;
          if (docData.hallazgos && docData.hallazgos.length > 0) ocrContext += `\n${t('doctordashboard_ctx_findings')}: ${docData.hallazgos.join('; ')}`;
          if (docData.diagnosticos && docData.diagnosticos.length > 0) ocrContext += `\n${t('doctordashboard_ctx_diagnoses')}: ${docData.diagnosticos.join('; ')}`;
          if (docData.biomarcadores && docData.biomarcadores.length > 0) {
            ocrContext += `\n${t('doctordashboard_ctx_biomarkers')}: ${docData.biomarcadores.map(b => `${b.parametro}: ${b.valor} ${b.unidad || ''} (${b.estado || ''})`).join(', ')}`;
          }
          if (docData.extracted_text) {
            ocrContext += `\n${t('doctordashboard_ctx_ocr_text')}:\n${docData.extracted_text.slice(0, 1500)}`;
          }
          enrichedQuery += ocrContext;

          // Refresh patient details so the new document appears in the middle panel
          fetchPatientDetail(selectedPatient.user_id);
        }
      } catch (uploadErr) {
        console.error("Error al subir adjuntos del copiloto:", uploadErr);
      }
    }

    try {
      const res = await fetch(`${apiUrl}/api/doctor/ask`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: enrichedQuery, patient_id: selectedPatient.user_id, text_model: 'llama3.1', language: language, country: country || undefined })
      });

      if (!res.ok) throw new Error(t('doctordashboard_error_fetching_copilot'));

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";
      
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let done = false;
      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          aiResponse += decoder.decode(value, { stream: true });
          setCopilotMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = aiResponse;
            return newMsgs;
          });
        }
      }
    } catch (err) {
      console.error(err);
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: t('doctordashboard_error_conectando_con_el_copiloto') }]);
    }
    setIsCopilotThinking(false);
  };



  if (doctorScreen === 'search') {
    return (
      <MedicalSearchModal 
        isOpen={true} 
        onClose={() => setDoctorScreen('home')} 
        token={authHeaders?.Authorization?.replace('Bearer ', '')} 
        apiUrl={apiUrl} 
        userProfile={doctorProfile} 
      />
    );
  }
  if (doctorScreen === 'more') {
    return <DoctorMore onNavigate={setDoctorScreen} onLogout={onLogout} doctorProfile={doctorProfile} />;
  }
  if (doctorScreen === 'agenda') {
    return (
      <DoctorCalendarView 
        onNavigate={setDoctorScreen} 
        onSelectPatient={(p) => {
          setSelectedPatient(p);
          setDoctorScreen('patients');
        }}
        apiUrl={apiUrl} 
        authHeaders={authHeaders} 
        doctorProfile={doctorProfile} 
      />
    );
  }
  if (doctorScreen === 'profile') {
    return (
      <DoctorProfile 
        onBack={() => setDoctorScreen('home')} 
        apiUrl={apiUrl} 
        authHeaders={authHeaders} 
        doctorProfile={doctorProfile} 
      />
    );
  }
  if (doctorScreen === 'schedule' || doctorScreen === 'disponibilidad') {
    return (
      <DoctorSchedule 
        apiUrl={apiUrl} 
        authHeaders={authHeaders} 
        doctorProfile={doctorProfile} 
        onProfileUpdated={setDoctorProfile}
        onBack={() => setDoctorScreen('home')} 
      />
    );
  }
  if (doctorScreen === 'public-profile') {
    return (
      <DoctorProfileForm 
        apiUrl={apiUrl} 
        authHeaders={authHeaders} 
        existingProfile={doctorProfile} 
        onBack={() => setDoctorScreen('home')} 
        onSaved={(p) => { setDoctorProfile(p); setDoctorScreen('home'); }}
      />
    );
  }
  const filteredPatients = patients.filter(p =>
    !patientSearch.trim() || String(p.full_name || '').toLowerCase().includes(patientSearch.trim().toLowerCase())
  );

  if (doctorScreen === 'home') {
    return <DoctorHome onNavigate={setDoctorScreen} onLogout={onLogout} doctorProfile={doctorProfile} />;
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-[100dvh] bg-base text-content-primary overflow-hidden font-sans relative">
      {/* Fondo decorativo opcional */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand/20 rounded-full blur-[120px]"></div>
      </div>

      {/* HEADER / SIDEBAR NAV (Leftmost) */}
      <div className="w-full lg:w-20 h-14 lg:h-auto bg-white/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-gray-100 shadow-sm flex flex-row lg:flex-col items-center gap-1 px-3 lg:px-0 py-0 lg:py-6 z-10 shrink-0">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-brand-teal to-brand-blue rounded-xl flex items-center justify-center shadow-soft mb-0 lg:mb-8 shrink-0">
          <Activity className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full flex flex-row lg:flex-col items-center justify-center lg:justify-start gap-2 lg:gap-4">
          <button onClick={() => setDoctorScreen('patients')} className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all ${doctorScreen === 'patients' ? 'bg-brand-teal/10 text-brand-teal' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`} title={t('patients')}>
            <Users className="w-6 h-6" />
          </button>
          <button onClick={() => setDoctorScreen('agenda')} className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all ${doctorScreen === 'agenda' ? 'bg-brand-teal/10 text-brand-teal' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`} title={t('doctordashboard_mi_agenda')}>
            <Calendar className="w-6 h-6" />
          </button>
          <button onClick={() => setDoctorScreen('profile')} className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all ${doctorScreen === 'profile' ? 'bg-brand-teal/10 text-brand-teal' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`} title={t('my_profile') || 'Mi Perfil'}>
            <User className="w-6 h-6" />
          </button>
        </div>


        <div className="mt-0 lg:mt-auto mb-0 lg:mb-3 flex flex-col items-center gap-2">
          <LanguageSelector />
        </div>
        <button onClick={() => setDoctorScreen('home')} className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl flex items-center justify-center transition-all mb-0 lg:mb-2 shrink-0" title={t('back_to_home')}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={onLogout}
 className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl flex items-center justify-center transition-all mt-0 lg:mt-auto shrink-0" title={t('logout')}>
          <LogOut className="w-6 h-6" />
        </button>
      </div>
      
      {/* COLUMN 1: Patients List */}
      <div className={`${mobilePane === 'list' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-h-0 lg:flex-none w-full lg:w-72 xl:w-80 bg-white/60 backdrop-blur-xl border-r border-gray-100 z-10 shrink-0`}>
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("patients_base")}</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder={t('search_patient', 'Buscar paciente...')} 
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 hide-scrollbar">
          {isLoadingPatients ? (
            <div className="flex flex-col gap-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
               ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("no_patients")}</div>
          ) : (
            filteredPatients.map(p => (
              <button
                key={p.user_id}
                onClick={() => { setSelectedPatient(p); setMobilePane('detail'); }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ` + 
                  (selectedPatient?.user_id === p.user_id 
                    ? 'bg-brand-teal shadow-md text-white' 
                    : 'bg-white border border-gray-100 hover:border-brand-teal/30 hover:shadow-sm text-gray-700')}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ` + 
                  (selectedPatient?.user_id === p.user_id ? 'bg-white/20 text-white' : 'bg-brand-teal/10 text-brand-teal')}>
                  {String(p.full_name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="font-semibold text-sm truncate">{p.full_name || t('default_patient_name')}</div>
                  <div className={`text-[11px] truncate ` + (selectedPatient?.user_id === p.user_id ? 'text-teal-100' : 'text-gray-400')}>
                    {p.triage_category && p.triage_category !== 'Ninguno' ? p.triage_category : (p.gender || '')}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: Patient Details Center */}
      <div className={`${mobilePane === 'detail' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 min-w-0 min-h-0 z-10 relative`}>
        {isLoadingDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-teal">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium">{t('loading_record') || 'Cargando expediente...'}</p>
          </div>
        ) : selectedPatient ? (
          patientDetail ? (
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between gap-2 mb-4 xl:hidden">
                <button onClick={() => setMobilePane('list')} className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm">
                  <ArrowLeft className="w-4 h-4" /> {t('patients_base')}
                </button>
                <button onClick={() => setMobilePane('copilot')} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-brand-dark text-white rounded-xl text-sm font-semibold shadow-sm">
                  <Sparkles className="w-4 h-4 text-brand-teal" /> {t('doctordashboard_copiloto_ia')}
                </button>
              </div>

              <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight break-words">{patientDetail?.profile?.full_name || selectedPatient?.full_name || t('default_patient_name')}</h1>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4"/> {patientDetail?.profile?.date_of_birth || t('no_birth_date')}</span>
                    &bull;
                    <span>{patientDetail?.profile?.gender || t('not_specified')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setShowCalculatorsModal(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl text-xs sm:text-sm font-bold text-teal-800 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title={t('doctordashboard_calculadoras_clinicas_mdcalc_lipidwise_s')}
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600 stroke-[2.4]" />
                    <span>{t('doctordashboard_calculadoras_mdcalc')}</span>
                  </button>

                  <button 
                    onClick={() => setShowCaPtyVaModal(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl text-xs sm:text-sm font-bold text-sky-800 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title={t('doctordashboard_vigilancia_oncologica_digestiva_captyva_')}
                  >
                    <Calendar className="w-4 h-4 text-sky-600 stroke-[2.4]" />
                    <span>{t('doctordashboard_captyva')}</span>
                  </button>

                  <button 
                    onClick={() => setShowConsensusModal(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title={t('doctordashboard_mivor_evidencia_medidor_de_evidencia_cie')}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
                    <span>{t('brand_mivor_evidence')}</span>
                  </button>

                  <button 
                    onClick={() => setShowScribeModal(true)} 
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-indigo-800 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title={t('doctordashboard_mivor_scribe_copiloto_scribe_soap_y')}
                  >
                    <FileText className="w-4 h-4 text-indigo-600 stroke-[2.4]" />
                    <span>MIVOR Scribe</span>
                  </button>

                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow">
                    <Printer className="w-4 h-4 text-brand-teal" />
                   {t('print_pdf')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Vitales Card */}
                <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Heart className="w-24 h-24 text-brand-teal" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <Heart className="w-5 h-5 text-brand-teal" />
                   {t('vital_signs_biometry')}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('doctordashboard_grupo_sanguineo')}</p>
                      <p className="font-bold text-gray-800 text-lg">{patientDetail?.profile?.blood_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('doctordashboard_altura_peso')}</p>
                      <p className="font-bold text-gray-800 text-lg">
                        {patientDetail?.profile?.height ? `${patientDetail.profile.height} cm` : '--'} / {patientDetail?.profile?.weight ? `${patientDetail.profile.weight} kg` : '--'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historial Card */}
                <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <ShieldCheck className="w-5 h-5 text-brand-teal" />
                   {t('doctordashboard_antecedentes_clinicos')}
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('allergies')}</p>
                      <p className="text-sm text-gray-800 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg inline-block font-medium">
                        {patientDetail?.profile?.allergies || t('none_registered_female')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t("chronic_conditions_label")}</p>
                      <p className="text-sm text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100">
                        {patientDetail?.profile?.chronic_conditions || t('none_registered_female')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t("medications")}</p>
                      <p className="text-sm text-gray-800 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg inline-block font-medium">
                        {patientDetail?.profile?.current_medications || t('none_registered_female')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMART REFERRAL CARD (Fila 24) */}
              {patientDetail?.smart_referral?.matched && (
                <div className="mb-8 rounded-[24px] p-6 bg-gradient-to-br from-teal-50/90 via-sky-50/80 to-emerald-50/60 border border-teal-200/80 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-teal text-white flex items-center justify-center shadow-sm">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-gray-900 text-base">
                           {t('doctordashboard_derivacion_inteligente_a_especialist')}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                            <Sparkles className="w-3 h-3" /> {t('doctordashboard_fila_24_ia')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                         {t('doctordashboard_sugerencia_clinica_algoritmica_basad')}
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      patientDetail.smart_referral?.urgency === 'alta'
                        ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                        : patientDetail.smart_referral?.urgency === 'media'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-teal-100 text-teal-700 border-teal-200'
                    }`}>
                     {t('doctordashboard_prioridad')} {patientDetail.smart_referral?.urgency || t('normal')}
                    </span>
                  </div>

                  {/* Recommendation Details */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-teal-100 shadow-xs mb-4">
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                     {t('doctordashboard_especialidad_sugerida')}
                    </div>
                    <div className="text-lg font-extrabold text-brand-dark mb-2">
                      {patientDetail.smart_referral?.recommended_specialty || t('doctordashboard_especialidad')}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {patientDetail.smart_referral?.reason || ''}
                    </p>

                    {patientDetail.smart_referral?.matched_keywords?.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-400">{t('doctordashboard_marcadores_detectados')}</span>
                        {patientDetail.smart_referral.matched_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-200/50">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Specialists in Clinic */}
                  {patientDetail.smart_referral?.available_specialists?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-teal" />
                       {t('doctordashboard_especialistas_disponibles_en_cuadro_')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {patientDetail.smart_referral.available_specialists.map((spec, idx) => (
                          <div key={spec.id || idx} className="bg-white rounded-2xl p-3.5 border border-teal-100 shadow-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                <img 
                                  src={spec.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.full_name || t('doctordashboard_especialista'))}&background=0D8ABC&color=fff`} 
                                  alt={spec.full_name || t('doctordashboard_especialista')}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="text-xs font-bold text-gray-900 truncate">{spec.full_name || t('doctordashboard_especialista')}</h5>
                                <p className="text-[11px] text-brand-teal font-medium truncate">{spec.specialty || t('doctordashboard_especialidad')}</p>
                                {spec.city && <p className="text-[10px] text-gray-400 truncate">{spec.city}</p>}
                              </div>
                            </div>

                            <button
                              onClick={() => handleReferPatient(spec, patientDetail.smart_referral)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                              title={t('doctordashboard_derivar_paciente_por_whatsapp_con')}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{t('doctordashboard_derivar')}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVE MEDICATIONS SECTION (Fila 23) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Pill className="w-4 h-4 text-brand-teal" />
                   {t('doctordashboard_tratamiento_farmacologico_activo')}
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-brand-teal border border-teal-100">
                    {(Array.isArray(patientDetail?.medications) ? patientDetail.medications : []).length} {t('doctordashboard_pautados')}
                  </span>
                </div>

                {(!Array.isArray(patientDetail?.medications) || patientDetail.medications.length === 0) ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-sm text-gray-500 shadow-xs">
                   {t('doctordashboard_el_paciente_no_tiene_recordatorios')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patientDetail.medications.map((med, idx) => (
                      <div key={med.id || idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {med.is_active ? t('emergencypassportm_activo') : t('doctordashboard_pausado')}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm mb-1">{med.medication_name || t('doctordashboard_medicamento')}</h4>
                          <p className="text-xs text-gray-600">
                            <strong>{t('doctordashboard_dosis')}</strong> {med.dosage || t('doctordashboard_no_especificada')}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            <strong>{t('doctordashboard_frecuencia')}</strong> {med.frequency || t('doctordashboard_segun_prescripcion')}
                          </p>
                        </div>
                        {med.time_of_day && (
                          <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                            <Clock className="w-3 h-3 text-brand-teal" />
                            <span>{t('doctordashboard_horarios')} {med.time_of_day}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Triage and Docs Tabs Area */}
              <div className="space-y-8">
                
                {/* Orientaciones de Salud */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-orange" />
                   {t('clinical_history')}
                  </h3>
                  <div className="space-y-4">
                    {(patientDetail.triages || []).length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                       {t('no_triages_registered')}
                      </div>
                    ) : (
                      (patientDetail.triages || []).map(triageItem => (
                        <div key={triageItem.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5">
                          <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                            <span className="text-xs font-semibold text-gray-500">{triageItem.created_at ? new Date(triageItem.created_at).toLocaleString() : '--'}</span>
                            <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wide ${
                              triageItem.status === 'closed_red' ? 'bg-red-100 text-red-700' :
                              triageItem.status === 'closed_yellow' ? 'bg-orange-100 text-orange-700' :
                              triageItem.status === 'closed_green' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {(triageItem.status || '').replace('closed_', '') || t('in_progress')}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none prose-p:leading-relaxed text-gray-700 prose-strong:text-gray-900">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(triageItem.final_report || t('incomplete_triage') || '')}</ReactMarkdown>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Documents with AI Insights (Fila 23) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-brand-teal" />
                     {t('doctordashboard_estudios_analiticas_y_documentos_cli')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={doctorStudiesInputRef}
                        onChange={handleDoctorDirectUpload}
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif,image/*,application/pdf"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => doctorStudiesInputRef.current?.click()}
                        disabled={isUploadingStudies || !selectedPatient}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-50 text-brand-teal hover:bg-brand-teal hover:text-white border border-teal-200/80 active:scale-95 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                        title={t('doctordashboard_adjuntar_cualquier_archivo_clinico_i')}
                      >
                        {isUploadingStudies ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5 -rotate-45" />}
                        <span>{isUploadingStudies ? t('doctordashboard_procesando_con_ia') : t('doctordashboard_adjuntar_estudios')}</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(patientDocuments || []).length === 0 ? (
                      <div className="col-span-full bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                       {t('no_documents_attached')}
                      </div>
                    ) : (
                      (patientDocuments || []).map(doc => {
                        const parsed = doc.parsed_insights || {};
                        const anoms = parsed.anomalias || parsed.hallazgos || [];
                        const diags = parsed.diagnosticos || [];
                        const severity = parsed.severidad || 'verde';

                        return (
                          <div key={doc.id} className="flex flex-col justify-between bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-teal/30 rounded-2xl p-5 transition-all">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div className="min-w-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <h4 className="text-sm font-bold text-gray-900 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                      <span className="uppercase tracking-wider font-semibold text-brand-teal">{(doc.document_type || '').replace('_', ' ')}</span>
                                      <span>&bull;</span>
                                      <span>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '--'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    severity === 'rojo'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : severity === 'amarillo'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {severity}
                                  </span>
                                  {doc.download_url && (
                                    <a href={doc.download_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-brand-teal hover:text-white text-gray-400 rounded-lg transition-colors shrink-0" title={t('doctordashboard_descargar_documento')}>
                                      <Download className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Anomalies / Altered Values (Chips) */}
                              {anoms.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-gray-100">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 mb-1.5">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    <span>{t('doctordashboard_valores_alterados_hallazgos_patologi')}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {anoms.map((a, idx) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/60 text-[11px] font-semibold">
                                        {a}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Identified Diagnostics */}
                              {diags.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-gray-400">{t('app_diagnosticos')}</span>
                                  {diags.map((d, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 text-[11px] font-medium">
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Summary */}
                              {parsed.resumen && (
                                <p className="mt-2.5 text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
                                  {parsed.resumen}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-red-500 font-medium">
             {t('error_loading_record')}
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white/40">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <User className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">{t("select_patient")}</p>
            <p className="text-sm mt-2">{t('select_patient_desc')}</p>
          </div>
        )}
      </div>

      {/* COLUMN 3: Copilot AI Right Panel */}
      <div className={`${mobilePane === 'copilot' ? 'flex fixed inset-0 z-40 xl:relative xl:inset-auto xl:z-20' : 'hidden'} xl:flex flex-col w-full xl:w-96 bg-white border-l border-gray-100 shadow-xl shrink-0`}>
        <div className="p-4 border-b border-gray-100 bg-brand-dark relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none"></div>
          <h2 className="font-bold text-white flex items-center gap-2 relative z-10 text-sm">
            <Sparkles className="w-4 h-4 text-brand-teal" />
           {t('clinical_copilot_ai')}
          </h2>
          <button onClick={() => setMobilePane(selectedPatient ? 'detail' : 'list')} className="xl:hidden absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" aria-label={t('doctordashboard_cerrar_copiloto')}>
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] text-gray-400 mt-1 relative z-10">{t('copilot_support_desc')}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {!selectedPatient ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Bot className="w-12 h-12 text-gray-400 mb-4" />
              <div className="text-center text-sm font-medium text-gray-600">{t('waiting_for_record')}</div>
            </div>
          ) : (
            copilotMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-brand-teal text-white rounded-br-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}>
                  {/* Attachments preview inside user message bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {msg.attachments.map((att, attIdx) => (
                        <div key={att.id || attIdx} className="rounded-xl overflow-hidden border border-white/25 bg-black/15 p-1 flex items-center gap-1.5 text-xs text-white max-w-[200px]">
                          {att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className="w-8 h-8 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <span className="truncate text-[10px] font-medium pr-1">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(msg.content || '')}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isCopilotThinking && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2 text-brand-teal">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">{t('analyzing_history')}</span>
              </div>
            </div>
          )}
          <div ref={copilotEndRef} />
        </div>

        {/* Attachment preview strip */}
        {copilotAttachments.length > 0 && (
          <div className="px-4 pt-3 pb-1 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {copilotAttachments.map((att) => (
                <div key={att.id} className="relative group shrink-0 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1 pr-2">
                  {att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className="w-8 h-8 object-cover rounded-lg" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-gray-700 max-w-[100px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeCopilotAttachment(att.id)}
                    className="w-4 h-4 rounded-full bg-gray-300 hover:bg-red-500 text-white flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                    title={t('doctordashboard_descartar_adjunto')}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
            {copilotAttachments.length > 1 && (
              <button
                type="button"
                onClick={clearCopilotAttachments}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 whitespace-nowrap pl-1 cursor-pointer"
              >
               {t('doctordashboard_eliminar_todos')}
              </button>
            )}
          </div>
        )}

        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleCopilotSend} onPaste={handleCopilotPaste} className="relative flex items-end">
            <input
              type="file"
              ref={copilotFileInputRef}
              onChange={handleCopilotFilesChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif,image/*,application/pdf"
              className="hidden"
            />
            {/* Paperclip Button - Direct native file selector for ANY clinical file */}
            <button
              type="button"
              onClick={() => copilotFileInputRef.current?.click()}
              disabled={!selectedPatient || isCopilotThinking}
              className="absolute left-2.5 bottom-2.5 w-[30px] h-[30px] flex items-center justify-center rounded-xl bg-gray-200 text-gray-700 hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              title={t('doctordashboard_adjuntar_cualquier_archivo_clinico_p')}
            >
              <Paperclip className="w-4 h-4 -rotate-45 stroke-[2.2]" />
            </button>

            <textarea
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onPaste={handleCopilotPaste}
              disabled={!selectedPatient || isCopilotThinking}
              placeholder={t('ask_about_history')}
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-20 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 resize-none min-h-[48px] max-h-[120px]"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCopilotSend(e);
                }
              }}
            />
            <button
              type="button"
              onClick={toggleCopilotListening}
              className={`absolute right-11 bottom-2 w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isCopilotListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              title={t('doctordashboard_dictado_por_voz')}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={(!copilotInput.trim() && copilotAttachments.length === 0) || !selectedPatient || isCopilotThinking}
              className="absolute right-2 bottom-2 w-8 h-8 bg-brand-teal flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-transform active:scale-95 shadow-md hover:bg-teal-600 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Calculadoras Clínicas MDCalc + Lipidwise */}
      <ClinicalCalculatorsModal
        isOpen={showCalculatorsModal}
        onClose={() => setShowCalculatorsModal(false)}
        apiUrl={apiUrl}
        authHeaders={authHeaders}
        patientId={selectedPatient?.user_id}
      />

      <PreventiveCalendarModal
        isOpen={showCaPtyVaModal}
        onClose={() => setShowCaPtyVaModal(false)}
        apiUrl={apiUrl}
        authHeaders={authHeaders}
        patientId={selectedPatient?.user_id}
      />

      <ConsensusMeterModal
        isOpen={showConsensusModal}
        onClose={() => setShowConsensusModal(false)}
        apiUrl={apiUrl}
        authHeaders={authHeaders}
      />

      <ScribeSoapModal
        isOpen={showScribeModal}
        onClose={() => setShowScribeModal(false)}
        initialMode="doctor"
        patientData={selectedPatient}
      />
    </div>
  );
}
