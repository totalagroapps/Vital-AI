import React, { useState } from 'react';
import { ArrowLeft, MoreHorizontal, Info, Mic, Lock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TriageWizard = ({ onBack, onStartChat }) => {
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    const shouldAutoStart = localStorage.getItem('autoStartMic') === 'true';
    if (shouldAutoStart) {
      localStorage.removeItem('autoStartMic');
      setTimeout(() => {
        toggleListening();
      }, 500);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('browser_voice_recognition_not_supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try { recognition.start(); } catch (e) { setIsListening(false); }
  };

  return (
    <div className="min-h-screen bg-base font-sans relative overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[55%] md:w-[45%] lg:w-[40%] h-[380px] md:h-[500px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top opacity-60 mix-blend-multiply" 
          style={{ maskImage: "linear-gradient(to right, transparent 0%, transparent 30%, black 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 30%, black 100%)" }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base to-transparent" />
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-base via-base/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="text-slate-800" size={20} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs">
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">{t('understand_your_symptoms')}</h2>
          </div>
          <button className="w-10 h-10 rounded-full border border-slate-200/80 flex items-center justify-center bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 -z-10" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">1</div>
            <span className="text-[10px] font-bold text-teal-800">{t('describe')}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">2</div>
            <span className="text-[10px] text-gray-400">{t('questions')}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">3</div>
            <span className="text-[10px] text-gray-400">{t('ai_analysis')}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">4</div>
            <span className="text-[10px] text-gray-400">{t('recommendations')}</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-6 relative max-w-full md:max-w-[75%]">
          <div className="absolute -inset-4 bg-gradient-to-r from-white via-white/95 to-transparent blur-md z-[-1] pointer-events-none"></div>
          <div className="inline-block bg-teal-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full mb-2 tracking-wider">IA</div>
          <h2 className="relative z-10 text-[26px] md:text-[32px] leading-tight font-extrabold text-slate-900 mb-2 drop-shadow-xs">
            {t('hello_im_here')} <br />
            <span className="text-teal-700 font-black tracking-tight">{t('to_understand_how')}</span> <br />
            {t('i_can_help_you')}
          </h2>
          <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-700 max-w-[85%]">
            {t('tell_me_what_happens')}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-white/90 backdrop-blur-xs border border-teal-200/60 rounded-2xl p-4 flex gap-3 items-start w-full max-w-sm mb-8 shadow-xs">
          <div className="mt-0.5 text-teal-800 bg-teal-100 p-1.5 rounded-full">
            <Info size={16} />
          </div>
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
            {t('more_info_better_analysis')}
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 mb-6 relative z-20">
          <h3 className="font-bold text-gray-900 mb-4">{t('tell_me_your_symptoms')}</h3>
          
          <div className="relative mb-4">
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t('start_typing_here')}
              className="w-full h-32 resize-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
              {symptoms.length}/1000
            </div>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 flex items-center gap-1.5 active:scale-95 transition-all">
              <CalendarIcon /> {t('since_when')}
            </button>
            <button className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 flex items-center gap-1.5 active:scale-95 transition-all">
              <ActivityIcon /> {t('intensity')}
            </button>
            <button className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200/60 flex items-center gap-1.5 active:scale-95 transition-all">
              <MapPinIcon /> {t('where_do_you_feel_it')}
            </button>
            <button className="text-[11px] text-gray-600 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              + {t('add_more')}
            </button>
          </div>

          {/* Voice Record */}
          <div className="flex flex-col items-center justify-center pt-4 pb-2">
            <div className="w-full flex items-center justify-center gap-2 mb-4 text-teal-700/40">
              {/* Fake Audio Waveform */}
              <div className="flex items-center gap-1">
                {[1, 2, 1, 3, 2, 4, 2, 1, 3, 1, 2].map((h, i) => (
                  <div key={i} className="w-1 bg-current rounded-full" style={{ height: h * 4 + 'px' }} />
                ))}
              </div>
              <button 
                  onClick={toggleListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner mx-4 transition-all duration-300 ${isListening ? 'bg-teal-700 text-white shadow-lg animate-pulse scale-110' : 'bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 hover:scale-105'}`}
                >
                  <Mic size={28} />
                </button>
                <div className="flex items-center gap-1">
                  {[2, 1, 3, 2, 4, 2, 1, 3, 1, 2, 1].map((h, i) => (
                    <div key={i} className={`w-1 bg-current rounded-full transition-all duration-300 ${isListening ? 'animate-pulse' : ''}`} style={{ height: (isListening ? h * 6 : h * 4) + 'px' }} />
                  ))}
                </div>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {isListening ? t('listening_closely') : t('press_mic_to_talk')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isListening ? t('speak_now_processing') : t('im_listening')}
              </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-teal-50/60 border border-teal-200/50 rounded-2xl p-4 flex gap-4 items-center mb-8 relative z-20">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-800 shadow-sm shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{t('vitalai_listens_understands')}</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">{t('our_ai_will_ask_questions')}</p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-xs border-t border-gray-100 z-50">
        <button 
          onClick={() => onStartChat(symptoms)}
          disabled={!symptoms.trim()}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.99]"
        >
          {t('continue')} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

// Mini icons for the tags
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const ActivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

export default TriageWizard;
