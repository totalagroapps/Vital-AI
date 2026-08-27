import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import { Download, FolderOpen, User, Activity, FileText, Send, Bot, Clock, ChevronRight } from 'lucide-react';

export default function DoctorDashboard({ apiUrl, authHeaders, onLogout }) {
  const { t, language } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [patientDocuments, setPatientDocuments] = useState([]);

  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Copilot Chat States
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const copilotEndRef = useRef(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetail(selectedPatient.user_id);
      setCopilotMessages([{ role: 'assistant', content: `Hola Doctor. Soy su Copiloto IA. Estoy analizando el expediente de ${selectedPatient.full_name}. ¿Qué desea saber?` }]);
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

  const fetchPatientDetail = async (userId) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${apiUrl}/api/doctor/patients/${userId}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPatientDetail(data);
        const docRes = await fetch(`${apiUrl}/api/patients/${userId}/documents`, { headers: authHeaders });
        if (docRes.ok) {
          const docData = await docRes.json();
          setPatientDocuments(docData);
        } else {
          setPatientDocuments([]);
        }

      }
    } catch (e) {
      console.error(e);
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
        body: JSON.stringify({ query: userText, patient_id: selectedPatient.user_id, text_model: 'llama3.1' })
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

  return (
    <div className="flex w-full h-full bg-slate-100 text-slate-800">
      
      {/* LEFT: Patients List */}
      <div className="w-80 border-r border-slate-200 shadow-sm flex flex-col bg-white/50 shrink-0">
        <div className="p-4 border-b border-slate-200 shadow-sm flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            {t("patients_base")}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingPatients ? (
            <div className="p-4 text-center text-sm text-slate-600 animate-pulse">{t("loading_patients")}</div>
          ) : patients.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-600">{t("no_patients")}</div>
          ) : (
            patients.map(p => (
              <button
                key={p.user_id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                  selectedPatient?.user_id === p.user_id 
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' 
                  : 'border-transparent hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      p.triage_category === 'Rojo' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                      p.triage_category === 'Amarillo' ? 'bg-yellow-500' :
                      p.triage_category === 'Verde' ? 'bg-green-500' :
                      'bg-slate-300'
                    }`} title={`Triaje: ${p.triage_category || 'Ninguno'}`}></span>
                    <span className="truncate">{p.full_name}</span>
                  </div>
                  <div className="text-xs text-slate-600">{p.gender} • {p.date_of_birth}</div>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedPatient?.user_id === p.user_id ? 'text-indigo-400' : 'text-slate-600'}`} />
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 shadow-sm">
          <button onClick={onLogout} className="w-full py-2 bg-slate-100 hover:bg-semantic-danger-bg/50 text-slate-700 hover:text-semantic-danger-text rounded-lg text-sm transition-colors border border-slate-300 hover:border-semantic-danger-text/20">
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MIDDLE: Patient Detail */}
      <div className="flex-1 flex flex-col border-r border-slate-200 shadow-sm bg-slate-100 overflow-hidden relative">
        {selectedPatient ? (
          isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 animate-pulse">{t("loading_record")}</div>
          ) : patientDetail ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <User className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Ficha Clínica
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                  <div><span className="text-slate-600 block text-xs">Nombre</span><span className="font-medium">{patientDetail.profile.full_name}</span></div>
                  <div><span className="text-slate-600 block text-xs">Nacimiento</span><span className="font-medium">{patientDetail.profile.date_of_birth}</span></div>
                  <div><span className="text-slate-600 block text-xs">Género</span><span className="font-medium">{patientDetail.profile.gender}</span></div>
                  <div><span className="text-slate-600 block text-xs">Sangre</span><span className="font-medium text-semantic-danger-text">{patientDetail.profile.blood_type}</span></div>
                  <div className="col-span-2"><span className="text-slate-600 block text-xs">Alergias</span><span className="font-medium">{patientDetail.profile.allergies || 'Ninguna'}</span></div>
                  <div className="col-span-2"><span className="text-slate-600 block text-xs">Crónicas</span><span className="font-medium">{patientDetail.profile.chronic_conditions || 'Ninguna'}</span></div>
                  <div className="col-span-2"><span className="text-slate-600 block text-xs">Medicación</span><span className="font-medium">{patientDetail.profile.current_medications || 'Ninguna'}</span></div>
                </div>
              </div>

              
                {/* Documents Attached */}
                <div className="mt-6 mb-6">
                  <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-content-primary0" />
                    Documentos Adjuntos
                  </h3>
                  <div className="space-y-3">
                    {patientDocuments.length === 0 ? (
                      <div className="text-sm text-slate-600 italic">No hay documentos adjuntos.</div>
                    ) : (
                      patientDocuments.map(doc => (
                        <div key={doc.id} className="flex justify-between items-center bg-white/50 border border-slate-200 shadow-sm rounded-lg p-3 hover:border-brand/30 transition-colors">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize font-medium">{doc.document_type.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                            </div>
                            {doc.notes && <p className="text-xs text-slate-400 mt-1 truncate max-w-sm" title={doc.notes}>{doc.notes}</p>}
                          </div>
                          <a href={doc.download_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand hover:bg-semantic-info-bg rounded-lg transition-colors ml-2 shrink-0">
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Triage History */}
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Histórico de Triajes</h3>
                <div className="space-y-3">
                  {patientDetail.triages.length === 0 ? (
                    <div className="text-sm text-slate-600 italic">No hay triajes registrados.</div>
                  ) : (
                    patientDetail.triages.map(t => (
                      <div key={t.id} className="bg-white/50 border border-slate-200 shadow-sm rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-600">{new Date(t.created_at).toLocaleString()}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                            t.status === 'closed_red' ? 'bg-semantic-danger-bg/50 text-semantic-danger-text border-semantic-danger-text/20/20' :
                            t.status === 'closed_yellow' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            t.status === 'closed_green' ? 'bg-semantic-success-bg/10 text-semantic-success-text border-semantic-success-text/20/20' :
                            'bg-slate-1000/10 text-slate-600 border-slate-500/20'
                          }`}>
                            {t.status.replace('closed_', '') || 'En curso'}
                          </span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-snug">
                          <ReactMarkdown>{t.final_report || 'Triaje incompleto.'}</ReactMarkdown>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-semantic-danger-text">Error al cargar expediente.</div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <User className="w-16 h-16 opacity-20 mb-4" />
            <p>{t("select_patient")}</p>
          </div>
        )}
      </div>

      {/* RIGHT: Copilot AI */}
      <div className="w-96 flex flex-col bg-white shrink-0 border-l border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 shadow-sm bg-indigo-950/20">
          <h2 className="font-bold text-indigo-300 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {t("copilot_title")}
          </h2>
          <p className="text-[10px] text-slate-600 mt-1 leading-tight">{t("copilot_desc")}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!selectedPatient ? (
            <div className="text-center text-xs text-slate-600 mt-10">{t("waiting_patient")}</div>
          ) : (
            copilotMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  msg.role === 'user' 
                  ? 'bg-brand text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 border border-slate-300 rounded-bl-none'
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none leading-snug">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
          {isCopilotThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-300 rounded-xl rounded-bl-none p-3 flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={copilotEndRef} />
        </div>

        <div className="p-3 border-t border-slate-200 shadow-sm">
          <form onSubmit={handleCopilotSend} className="relative">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              disabled={!selectedPatient || isCopilotThinking}
              placeholder={t("ask_copilot")}
              className="w-full bg-slate-100 border border-slate-300 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!copilotInput.trim() || !selectedPatient || isCopilotThinking}
              className="absolute right-1.5 top-1.5 p-1.5 bg-brand hover:bg-indigo-500 rounded text-white disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
