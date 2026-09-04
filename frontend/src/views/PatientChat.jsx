import React, { useRef, useEffect, useState } from "react";
import { ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, FileText, Loader2, Sparkles, X, Shield, AlertCircle, Activity, Stethoscope, Plus, History, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientChat = ({
  messages,
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
  currentSessionId
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { t, language } = useLanguage();
  const internalImageRef = useRef(null);
  const internalPdfRef = useRef(null);
  const recognitionRef = useRef(null);
  const actualImageRef = imageInputRef || internalImageRef;
  const actualPdfRef = pdfInputRef || internalPdfRef;

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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex h-[100dvh] bg-base font-sans overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full relative border-r border-gray-200">
      {/* Header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="text-gray-700" size={22} />
          </button>
          <button 
            type="button" 
            onClick={startNewSession} 
            className="px-2.5 py-1.5 rounded-xl bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple font-bold text-xs flex items-center gap-1 transition-all active:scale-95 border border-brand-purple/20"
            title={t('new_consultation') || 'Nueva Consulta'}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{t('new_consultation') || 'Nueva'}</span>
          </button>
          {sessions && sessions.length > 0 && (
            <button 
              type="button" 
              onClick={() => setShowHistoryModal(true)} 
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 border border-slate-200 lg:hidden"
              title="Historial de consultas"
            >
              <History size={14} />
              <span>{sessions.length}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1">
            VITAL <span className="text-brand-purple">AI</span>
          </h2>
          <span className="text-[10px] text-brand-green font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
            {t('online')}
          </span>
        </div>

        <div className="flex items-center justify-end">
          <LanguageSelector />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 z-10 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="text-brand-purple" size={32} />
            </div>
            <p className="text-sm font-medium text-gray-600">{t('how_can_i_help')}</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.type === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                isUser 
                  ? "bg-brand-purple text-white rounded-br-sm" 
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
              }`}>
                {/* Imágen adjunta si existe */}
                {msg.image && (
                  <img src={msg.image} alt={t('attachment')} className="w-full max-w-[200px] h-auto rounded-lg mb-2 object-cover border border-white/20" />
                )}
                {/* PDF adjunto si existe */}
                {msg.pdf && (
                  <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg mb-2">
                    <FileText size={16} />
                    <span className="text-xs font-medium truncate">{t('attached_document')}</span>
                  </div>
                )}
                
                {/* Texto del mensaje */}
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text || msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text || msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-2 text-brand-purple">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs font-medium">{t('thinking')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white border-t border-gray-100 px-4 py-3 pb-24 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        
        {/* Vista previa de adjuntos */}
        {(selectedImagePreview || selectedPdfName) && (
          <div className="mb-3 flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            {selectedImagePreview ? (
              <img src={selectedImagePreview} alt={t('preview')} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-brand-green/10 text-brand-green flex items-center justify-center">
                <FileText size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {selectedPdfName || t('selected_image')}
              </p>
            </div>
            <button onClick={onClearAttachment} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          
          <div className="flex items-center gap-1.5 mb-1">
            <button 
              type="button" 
              onClick={() => actualImageRef.current?.click()} 
              className="px-3 py-2 text-slate-700 hover:text-brand-purple transition-colors rounded-xl hover:bg-brand-purple/10 flex items-center gap-1.5 text-xs font-bold border border-gray-200 bg-white shadow-sm whitespace-nowrap cursor-pointer active:scale-95"
              title={t('upload_image') || 'Subir Imagen'}
            >
              <ImageIcon size={16} className="text-brand-purple" />
              <span>{t('upload_image') || 'Subir Imagen'}</span>
            </button>
            <button 
              type="button" 
              onClick={() => actualPdfRef.current?.click()} 
              className="px-3 py-2 text-slate-700 hover:text-brand-green transition-colors rounded-xl hover:bg-brand-green/10 flex items-center gap-1.5 text-xs font-bold border border-gray-200 bg-white shadow-sm whitespace-nowrap cursor-pointer active:scale-95"
              title={t('upload_pdf') || 'Subir PDF'}
            >
              <FileText size={16} className="text-brand-green" />
              <span>{t('upload_pdf') || 'Subir PDF'}</span>
            </button>
          </div>

          <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-1 min-h-[44px]">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t('type_your_message')}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-gray-800 placeholder-gray-400 w-full outline-none"
              disabled={isLoading}
            />
          </div>

          {inputMessage.trim() || selectedImagePreview || selectedPdfName ? (
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-11 h-11 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-glow mb-0.5 transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={20} className="ml-1" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={toggleListening}
              className={`w-11 h-11 rounded-full flex items-center justify-center mb-0.5 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <Mic size={22} />
            </button>
          )}

          {/* Hidden Inputs */}
          <input type="file" ref={actualImageRef} onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
          <input type="file" ref={actualPdfRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
        </form>
      </div>

      </div>
      
      {/* Medical Context Sidebar - desktop only */}
      {patientProfile && (
        <div className="hidden lg:flex lg:flex-col w-80 bg-white shadow-xl z-20 overflow-y-auto shrink-0">
           <div className="p-5 border-b border-gray-100 bg-slate-50/50">
             <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
               <Shield size={14} className="text-brand-purple" /> {t('active_clinical_context')}
             </h3>
             
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
                 {patientProfile.full_name?.charAt(0) || 'P'}
               </div>
               <div>
                 <p className="font-bold text-sm text-gray-900 truncate max-w-[180px]">{patientProfile.full_name || t('patient')}</p>
                 <p className="text-[10px] text-gray-500 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> {t('identity_verified')}
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-2 text-xs">
               <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                 <p className="text-gray-400 mb-0.5 text-[10px]">{t('blood_type')}</p>
                 <p className="font-bold text-red-500">{patientProfile.blood_type || '--'}</p>
               </div>
               <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                 <p className="text-gray-400 mb-0.5 text-[10px]">{t('age')}</p>
                 <p className="font-bold text-gray-800">{patientProfile.date_of_birth ? new Date().getFullYear() - new Date(patientProfile.date_of_birth).getFullYear() : '--'} {t('years')}</p>
               </div>
             </div>
           </div>

           <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><AlertCircle size={14} className="text-brand-orange"/> {t('registered_allergies')}</h4>
                <p className="text-xs text-gray-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100">{patientProfile.allergies || t('none_registered')}</p>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Activity size={14} className="text-blue-500"/> {t('chronic_conditions')}</h4>
                <p className="text-xs text-gray-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100">{patientProfile.chronic_conditions || t('none_registered')}</p>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Stethoscope size={14} className="text-brand-green"/> {t('current_medication')}</h4>
                <p className="text-xs text-gray-600 bg-green-50 p-2.5 rounded-lg border border-green-100">{patientProfile.current_medications || t('none_registered')}</p>
              </div>
           </div>
           
           {sessions && sessions.length > 0 && (
             <div className="p-5 border-t border-gray-100">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('recent_history') || 'Consultas Recientes'}</h4>
                 <button 
                   type="button" 
                   onClick={startNewSession} 
                   className="text-[10px] font-bold text-brand-purple hover:underline"
                 >
                   + {t('new_consultation') || 'Nueva'}
                 </button>
               </div>
               <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                 {sessions.map((s) => (
                   <button 
                     key={s.id} 
                     type="button"
                     onClick={() => loadSession && loadSession(s.id)}
                     className={`w-full text-left p-2.5 rounded-xl border transition-all truncate block ${
                       s.id === currentSessionId 
                         ? 'border-brand-purple bg-brand-purple/10 text-brand-purple font-bold shadow-xs' 
                         : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                     }`}
                     title={s.title || 'Consulta'}
                   >
                     <div className="text-xs font-semibold truncate">{s.title || 'Consulta'}</div>
                     <div className="text-[9px] text-gray-400 mt-0.5">{new Date(s.created_at).toLocaleDateString()}</div>
                   </button>
                 ))}
               </div>
             </div>
           )}
        </div>
      )}

      {/* Mobile History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <History size={16} className="text-brand-purple" />
                <span>{t('recent_history') || 'Consultas Previas'}</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <button 
              type="button" 
              onClick={() => { startNewSession && startNewSession(); setShowHistoryModal(false); }}
              className="w-full py-2.5 px-4 mb-4 rounded-xl bg-brand-purple text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={16} />
              <span>+ {t('new_consultation') || 'Nueva Consulta'}</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessions && sessions.length > 0 ? (
                sessions.map((s) => (
                  <button 
                    key={s.id} 
                    type="button"
                    onClick={() => { loadSession && loadSession(s.id); setShowHistoryModal(false); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all truncate block ${
                      s.id === currentSessionId 
                        ? 'border-brand-purple bg-brand-purple/10 text-brand-purple font-bold' 
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{s.title || 'Consulta'}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(s.created_at).toLocaleString()}</div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-center text-gray-400 py-6">{t('no_previous_consultations') || 'No hay consultas previas.'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientChat;
