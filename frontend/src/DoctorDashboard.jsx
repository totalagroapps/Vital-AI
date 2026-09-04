import React, { useState, useEffect, useRef } from 'react';
import DoctorHome from './views/DoctorHome';
import DoctorMore from './views/DoctorMore';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, Download, FolderOpen, User, Activity, FileText, Send, Bot, Clock, 
  ChevronRight, Users, LogOut, Search, Loader2, Calendar, Printer, Heart, 
  ShieldCheck, Sparkles, Mic, Pill, AlertTriangle, Stethoscope, CheckCircle2, 
  MessageSquare, ExternalLink 
} from 'lucide-react';

export default function DoctorDashboard({ apiUrl, authHeaders, onLogout }) {
  const { t, language } = useLanguage();
  const [doctorScreen, setDoctorScreen] = useState('home');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDocuments, setPatientDocuments] = useState([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Copilot Chat States
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [isCopilotListening, setIsCopilotListening] = useState(false);
  const copilotEndRef = useRef(null);
  const copilotSpeechRef = useRef(null);

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
    const langCodeMap = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', ar: 'ar-SA' };
    recognition.lang = langCodeMap[language] || 'es-ES';
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
      setCopilotMessages([{ role: 'assistant', content: `Hola Doctor. Soy su Copiloto Clínico IA (Fila 23). He indexado el expediente completo de ${selectedPatient.full_name} (triajes, analíticas, valores alterados y medicación activa). ¿Qué desea consultar sobre este caso?` }]);
    }
  }, [selectedPatient]);

  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages, isCopilotThinking]);

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
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let triagesHtml = (patientDetail.triages || []).map(triageItem => `
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 12px;">
        <strong>Fecha:</strong> ${triageItem.created_at ? new Date(triageItem.created_at).toLocaleString() : '--'}<br/>
        <strong>Categoría:</strong> ${triageItem.category || 'N/A'} | <strong>Estado:</strong> ${triageItem.status || '--'}<br/>
        ${triageItem.recommended_specialty ? `<strong>Especialidad sugerida:</strong> ${triageItem.recommended_specialty}<br/>` : ''}
        <strong>Informe Clínico:</strong><br/>
        <div style="white-space: pre-wrap; font-size: 0.9em; color: #334155; margin-top: 4px;">${triageItem.final_report || t('no_complete_report')}</div>
      </div>
    `).join('');

    let medicationsHtml = (patientDetail.medications || []).map(m => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>${m.medication_name}</strong></td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${m.dosage || '--'}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${m.frequency || '--'}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">${m.time_of_day || '--'}</td>
      </tr>
    `).join('');

    let referralHtml = '';
    if (patientDetail.smart_referral?.matched) {
      referralHtml = `
        <div style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #0f766e;">Derivación Inteligente Recomendada</h3>
          <p style="margin: 0 0 5px 0;"><strong>Especialidad sugerida:</strong> ${patientDetail.smart_referral.recommended_specialty} (${patientDetail.smart_referral.urgency.toUpperCase()})</p>
          <p style="margin: 0; font-size: 0.9em; color: #475569;"><strong>Motivo clínico:</strong> ${patientDetail.smart_referral.reason}</p>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>Historia Clínica - ${patientDetail?.profile?.full_name || selectedPatient?.full_name || 'Paciente'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; max-width: 850px; margin: 0 auto; padding: 30px; }
            h1 { color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 8px; font-size: 24px; }
            h2 { color: #0f172a; margin-top: 25px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .label { color: #64748b; font-size: 0.8em; text-transform: uppercase; font-weight: bold; }
            .value { font-weight: 600; font-size: 0.95em; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
          </style>
        </head>
        <body>
          <h1>VitalAI - Expediente Clínico Oficial</h1>
          
          <h2>Ficha del Paciente</h2>
          <div class="grid">
            <div><div class="label">${t('name')}</div><div class="value">${patientDetail?.profile?.full_name || selectedPatient?.full_name || 'Paciente'}</div></div>
            <div><div class="label">${t('date_of_birth')}</div><div class="value">${patientDetail?.profile?.date_of_birth || '--'}</div></div>
            <div><div class="label">${t('gender')}</div><div class="value">${patientDetail?.profile?.gender || '--'}</div></div>
            <div><div class="label">${t('blood_type_label')}</div><div class="value">${patientDetail?.profile?.blood_type || 'N/A'}</div></div>
            <div><div class="label">${t('allergies')}</div><div class="value">${patientDetail?.profile?.allergies || 'Ninguna alergia registrada'}</div></div>
            <div><div class="label">${t('chronic_conditions_label')}</div><div class="value">${patientDetail?.profile?.chronic_conditions || 'Sin condiciones crónicas registradas'}</div></div>
            <div><div class="label">Altura / Peso</div><div class="value">${patientDetail?.profile?.height ? `${patientDetail.profile.height} cm` : '--'} / ${patientDetail?.profile?.weight ? `${patientDetail.profile.weight} kg` : '--'}</div></div>
            <div><div class="label">Contacto de Emergencia</div><div class="value">${patientDetail?.profile?.emergency_contact || '--'}</div></div>
          </div>

          ${referralHtml}

          <h2>Tratamiento Farmacológico Activo</h2>
          ${medicationsHtml ? `
            <table>
              <thead>
                <tr>
                  <th>Fármaco</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Horario</th>
                </tr>
              </thead>
              <tbody>${medicationsHtml}</tbody>
            </table>
          ` : '<p style="color: #64748b; font-size: 0.9em;">No hay medicamentos activos pautados.</p>'}
          
          <h2>Historial de Triajes y Evaluaciones</h2>
          ${triagesHtml || '<p style="color: #64748b; font-size: 0.9em;">No hay triajes registrados.</p>'}
          
          <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Documento emitido por VitalAI Medical System · Fecha de impresión: ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleReferPatient = (specialist, referral) => {
    const patientName = patientDetail?.profile?.full_name || selectedPatient?.full_name || 'Paciente';
    const reason = referral?.reason || 'Valoración especializada';
    const text = `Hola Dr(a). ${specialist.full_name}, le comparto la derivación clínica desde VitalAI del paciente *${patientName}*.\n\n*Motivo de Derivación:* ${reason}\n*Especialidad requerida:* ${specialist.specialty}.\n\nQuedamos a su disposición para coordinar la consulta.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
    if (!copilotInput.trim() || isCopilotThinking || !selectedPatient) return;

    const userText = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { role: 'user', content: userText }]);
    setCopilotInput('');
    setIsCopilotThinking(true);

    try {
      const res = await fetch(`${apiUrl}/api/doctor/ask`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText, patient_id: selectedPatient.user_id, text_model: 'llama3.1', language: language })
      });

      if (!res.ok) throw new Error("Error fetching copilot");

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
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Error conectando con el Copiloto IA." }]);
    }
    setIsCopilotThinking(false);
  };



  if (doctorScreen === 'more') {
    return <DoctorMore onNavigate={setDoctorScreen} onLogout={onLogout} doctorProfile={doctorProfile} />;
  }
  if (doctorScreen === 'home') {
    return <DoctorHome onNavigate={setDoctorScreen} onLogout={onLogout} doctorProfile={doctorProfile} />;
  }

  return (
    <div className="flex w-full h-[100dvh] bg-base text-content-primary overflow-hidden font-sans relative">
      {/* Fondo decorativo opcional */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-teal/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-brand-purple/20 rounded-full blur-[120px]"></div>
      </div>

      {/* HEADER / SIDEBAR NAV (Leftmost) */}
      <div className="w-20 bg-white/80 backdrop-blur-md border-r border-gray-100 shadow-sm flex flex-col items-center py-6 z-10 shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-blue rounded-xl flex items-center justify-center shadow-soft mb-8">
          <Activity className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full flex flex-col items-center gap-4">
          <button className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-xl flex items-center justify-center transition-all">
            <Users className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl flex items-center justify-center transition-all">
            <FolderOpen className="w-6 h-6" />
          </button>
        </div>


        <div className="mt-auto mb-3 flex flex-col items-center gap-2">
          <LanguageSelector />
        </div>
        <button onClick={() => setDoctorScreen('home')} className="w-12 h-12 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl flex items-center justify-center transition-all mb-2" title={t('back_to_home')}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={onLogout}
 className="w-12 h-12 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl flex items-center justify-center transition-all mt-auto" title="Cerrar Sesión">
          <LogOut className="w-6 h-6" />
        </button>
      </div>
      
      {/* COLUMN 1: Patients List */}
      <div className="w-80 bg-white/60 backdrop-blur-xl border-r border-gray-100 flex flex-col z-10 shrink-0">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("patients_base")}</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar paciente..." 
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
          ) : patients.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">{t("no_patients")}</div>
          ) : (
            patients.map(p => (
              <button
                key={p.user_id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ` + 
                  (selectedPatient?.user_id === p.user_id 
                    ? 'bg-brand-teal shadow-md text-white' 
                    : 'bg-white border border-gray-100 hover:border-brand-teal/30 hover:shadow-sm text-gray-700')}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ` + 
                  (selectedPatient?.user_id === p.user_id ? 'bg-white/20 text-white' : 'bg-brand-teal/10 text-brand-teal')}>
                  {(p.full_name || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="font-semibold text-sm truncate">{p.full_name || 'Paciente'}</div>
                  <div className={`text-[11px] truncate ` + (selectedPatient?.user_id === p.user_id ? 'text-teal-100' : 'text-gray-400')}>
                    ID: {(p.user_id || '').split('-')[0]}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: Patient Details Center */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {isLoadingDetail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-teal">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium">{t('loading_record') || 'Cargando expediente...'}</p>
          </div>
        ) : selectedPatient ? (
          patientDetail ? (
            <div className="flex-1 overflow-y-auto hide-scrollbar p-8">
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{patientDetail?.profile?.full_name || selectedPatient?.full_name || 'Paciente'}</h1>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4"/> {patientDetail?.profile?.date_of_birth || t('no_birth_date')}</span>
                    &bull;
                    <span>{patientDetail?.profile?.gender || t('not_specified')}</span>
                  </p>
                </div>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow">
                  <Printer className="w-4 h-4 text-brand-teal" />
                  Imprimir / PDF
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Vitales Card */}
                <div className="glass-card rounded-[24px] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Heart className="w-24 h-24 text-brand-teal" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                    <Heart className="w-5 h-5 text-brand-teal" />
                    Signos Vitales y Biometría
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Grupo Sanguíneo</p>
                      <p className="font-bold text-gray-800 text-lg">{patientDetail?.profile?.blood_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Altura / Peso</p>
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
                    Antecedentes Clínicos
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
                            Derivación Inteligente a Especialista
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                            <Sparkles className="w-3 h-3" /> Fila 24 IA
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Sugerencia clínica algorítmica basada en los hallazgos y biomarcadores del paciente.
                        </p>
                      </div>
                    </div>

                    <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      patientDetail.smart_referral.urgency === 'alta'
                        ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                        : patientDetail.smart_referral.urgency === 'media'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-teal-100 text-teal-700 border-teal-200'
                    }`}>
                      Prioridad {patientDetail.smart_referral.urgency}
                    </span>
                  </div>

                  {/* Recommendation Details */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-teal-100 shadow-xs mb-4">
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                      Especialidad Sugerida:
                    </div>
                    <div className="text-lg font-extrabold text-brand-dark mb-2">
                      {patientDetail.smart_referral.recommended_specialty}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {patientDetail.smart_referral.reason}
                    </p>

                    {patientDetail.smart_referral.matched_keywords?.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-400">Marcadores detectados:</span>
                        {patientDetail.smart_referral.matched_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold border border-teal-200/50">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Specialists in Clinic */}
                  {patientDetail.smart_referral.available_specialists?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-teal" />
                        Especialistas Disponibles en Cuadro Médico:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {patientDetail.smart_referral.available_specialists.map(spec => (
                          <div key={spec.id} className="bg-white rounded-2xl p-3.5 border border-teal-100 shadow-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                <img 
                                  src={spec.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(spec.full_name)}&background=0D8ABC&color=fff`} 
                                  alt={spec.full_name}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="text-xs font-bold text-gray-900 truncate">{spec.full_name}</h5>
                                <p className="text-[11px] text-brand-teal font-medium truncate">{spec.specialty}</p>
                                {spec.city && <p className="text-[10px] text-gray-400 truncate">{spec.city}</p>}
                              </div>
                            </div>

                            <button
                              onClick={() => handleReferPatient(spec, patientDetail.smart_referral)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                              title="Derivar paciente por WhatsApp con informe prellenado"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Derivar</span>
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
                    Tratamiento Farmacológico Activo
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-brand-teal border border-teal-100">
                    {(patientDetail?.medications || []).length} pautados
                  </span>
                </div>

                {(patientDetail?.medications || []).length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-sm text-gray-500 shadow-xs">
                    El paciente no tiene recordatorios o tratamientos farmacológicos activos registrados en la plataforma.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {patientDetail.medications.map(med => (
                      <div key={med.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {med.is_active ? 'Activo' : 'Pausado'}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm mb-1">{med.medication_name}</h4>
                          <p className="text-xs text-gray-600">
                            <strong>Dosis:</strong> {med.dosage || 'No especificada'}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            <strong>Frecuencia:</strong> {med.frequency || 'Según prescripción'}
                          </p>
                        </div>
                        {med.time_of_day && (
                          <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                            <Clock className="w-3 h-3 text-brand-teal" />
                            <span>Horarios: {med.time_of_day}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Triage and Docs Tabs Area */}
              <div className="space-y-8">
                
                {/* Triages */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-orange" />
                    Historial de Triajes Asistidos
                  </h3>
                  <div className="space-y-4">
                    {(patientDetail.triages || []).length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                        No hay triajes registrados para este paciente.
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
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{triageItem.final_report || t('incomplete_triage')}</ReactMarkdown>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Documents with AI Insights (Fila 23) */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-brand-teal" />
                    Estudios, Analíticas y Documentos Clínicos con IA
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(patientDocuments || []).length === 0 ? (
                      <div className="col-span-full bg-gray-50 border border-gray-100 border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">
                        No hay documentos ni estudios adjuntos.
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
                                    <a href={doc.download_url} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-brand-teal hover:text-white text-gray-400 rounded-lg transition-colors shrink-0" title="Descargar documento">
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
                                    <span>Valores Alterados / Hallazgos Patológicos:</span>
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
                                  <span className="text-[11px] font-semibold text-gray-400">Diagnósticos:</span>
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
              Error al cargar expediente.
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
      <div className="w-96 bg-white border-l border-gray-100 shadow-xl flex flex-col z-20 shrink-0 relative">
        <div className="p-4 border-b border-gray-100 bg-brand-dark relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none"></div>
          <h2 className="font-bold text-white flex items-center gap-2 relative z-10 text-sm">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            Copiloto Clínico IA
          </h2>
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
                  <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
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

        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleCopilotSend} className="relative flex items-end">
            <textarea
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              disabled={!selectedPatient || isCopilotThinking}
              placeholder={t('ask_about_history')}
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-4 pr-20 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50 resize-none min-h-[48px] max-h-[120px]"
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
              title="Dictado por voz"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={!copilotInput.trim() || !selectedPatient || isCopilotThinking}
              className="absolute right-2 bottom-2 w-8 h-8 bg-brand-teal flex items-center justify-center rounded-xl text-white disabled:opacity-50 transition-transform active:scale-95 shadow-md hover:bg-teal-600"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}