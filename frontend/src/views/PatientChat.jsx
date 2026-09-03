import React, { useRef, useEffect, useState } from "react";
import { ArrowLeft, Send, Paperclip, Mic, Image as ImageIcon, FileText, Loader2, Sparkles, X, Shield, AlertCircle, Activity, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from '../contexts/LanguageContext';

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
  onClearAttachment
, patientProfile, sessions}) => {
    const [isListening, setIsListening] = useState(false);
    const { t } = useLanguage();

  const toggleListening = () => {
    if (isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('browser_not_support_voice_recognition'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
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
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="text-gray-700" size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1">
            VITAL <span className="text-brand-purple">AI</span>
          </h2>
          <span className="text-[10px] text-brand-green font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
            {t('online')}
          </span>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          {/* Espacio para balancear el header */}
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
          
          <div className="flex items-center gap-1 mb-1">
            <button type="button" onClick={() => imageInputRef.current?.click()} className="px-3 py-2 text-gray-500 hover:text-brand-purple transition-colors rounded-xl hover:bg-brand-purple/10 flex items-center gap-2 text-sm font-semibold border border-gray-200 bg-white shadow-sm whitespace-nowrap">
              <ImageIcon size={18} />
              <span>{t('upload_image')}</span>
            </button>
            <button type="button" onClick={() => pdfInputRef.current?.click()} className="px-3 py-2 text-gray-500 hover:text-brand-green transition-colors rounded-xl hover:bg-brand-green/10 flex items-center gap-2 text-sm font-semibold border border-gray-200 bg-white shadow-sm whitespace-nowrap">
              <FileText size={18} />
              <span>{t('upload_pdf')}</span>
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
          <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" className="hidden" />
          <input type="file" ref={pdfInputRef} onChange={handlePdfChange} accept="application/pdf" className="hidden" />
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
               <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">{t('recent_history')}</h4>
               <div className="space-y-2">
                 {sessions.slice(0, 2).map((s, i) => (
                   <div key={i} className="text-[10px] p-2 bg-slate-50 rounded border border-slate-100 text-slate-600 truncate">
                     {new Date(s.created_at).toLocaleDateString()} - {t('medical_triage')}
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default PatientChat;
