import React, { useState } from 'react';
import { ArrowLeft, MoreHorizontal, Info, Mic, Lock, ArrowRight } from 'lucide-react';

const TriageWizard = ({ onBack, onStartChat }) => {
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);

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
      alert('Tu navegador no soporta reconocimiento de voz.');
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
      <div className="absolute top-0 right-0 w-full h-[500px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-[85%] md:w-[60%] lg:w-[50%] h-[400px] md:h-full object-cover opacity-90" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 40%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Entiende tus síntomas</h2>
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white/50 backdrop-blur">
            <MoreHorizontal className="text-gray-600" size={20} />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 -z-10" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center text-[10px] font-bold">1</div>
            <span className="text-[10px] font-semibold text-brand-purple">Describe</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">2</div>
            <span className="text-[10px] text-gray-400">Preguntas</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">3</div>
            <span className="text-[10px] text-gray-400">Análisis IA</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">4</div>
            <span className="text-[10px] text-gray-400">Recomendaciones</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-6 relative">
          <div className="absolute right-0 top-0 bg-brand-purple text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</div>
          <h2 className="text-[32px] leading-tight font-bold text-gray-900 mb-4 max-w-[80%]">
            Hola, estoy aquí <br />
            para <span className="text-brand-purple">entender cómo</span> <br />
            <span className="text-brand-purple">puedo ayudarte.</span>
          </h2>
          <p className="text-sm text-gray-600 max-w-[70%]">
            Cuéntame qué te ocurre con el mayor detalle posible. Puedes escribir o usar la voz.
          </p>
        </div>

        {/* Info Box */}
        <div className="glass-card rounded-2xl p-4 flex gap-3 items-start w-full max-w-sm mb-8">
          <div className="mt-0.5 text-brand-purple border border-brand-purple/30 rounded-full p-1">
            <Info size={16} />
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Cuanta más información nos des, mejor será el análisis y las recomendaciones que pueda ofrecerte.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 mb-6 relative z-20">
          <h3 className="font-bold text-gray-900 mb-4">Cuéntame qué síntomas tienes</h3>
          
          <div className="relative mb-4">
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Empieza a escribir aquí..."
              className="w-full h-32 resize-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
              {symptoms.length}/1000
            </div>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button className="text-[11px] text-brand-purple font-medium bg-brand-purple/5 px-3 py-1.5 rounded-full border border-brand-purple/10 flex items-center gap-1.5">
              <CalendarIcon /> Desde cuándo
            </button>
            <button className="text-[11px] text-brand-purple font-medium bg-brand-purple/5 px-3 py-1.5 rounded-full border border-brand-purple/10 flex items-center gap-1.5">
              <ActivityIcon /> Intensidad
            </button>
            <button className="text-[11px] text-brand-purple font-medium bg-brand-purple/5 px-3 py-1.5 rounded-full border border-brand-purple/10 flex items-center gap-1.5">
              <MapPinIcon /> Dónde lo sientes
            </button>
            <button className="text-[11px] text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              + Añadir más
            </button>
          </div>

          {/* Voice Record */}
          <div className="flex flex-col items-center justify-center pt-4 pb-2">
            <div className="w-full flex items-center justify-center gap-2 mb-4 text-brand-purple/30">
              {/* Fake Audio Waveform */}
              <div className="flex items-center gap-1">
                {[1, 2, 1, 3, 2, 4, 2, 1, 3, 1, 2].map((h, i) => (
                  <div key={i} className="w-1 bg-current rounded-full" style={{ height: h * 4 + 'px' }} />
                ))}
              </div>
              <button 
                  onClick={toggleListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner mx-4 transition-all duration-300 ${isListening ? 'bg-brand-purple text-white shadow-glow animate-pulse scale-110' : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 hover:scale-105'}`}
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
                {isListening ? 'Escuchando atentamente...' : 'Pulsa el micrófono para hablar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isListening ? 'Habla ahora, estoy procesando tu voz' : 'Te escucho...'}
              </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-brand-purple/5 rounded-2xl p-4 flex gap-4 items-center mb-8 relative z-20">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-purple shadow-sm">
            <Lock size={20} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Vital IA te escucha y te entiende</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">Nuestra IA avanzada hará las preguntas adecuadas para comprender mejor tu caso.</p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 z-50">
        <button 
          onClick={() => onStartChat(symptoms)}
          disabled={!symptoms.trim()}
          className="w-full bg-gradient-to-r from-brand-purple to-brand-purpleLight text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:shadow-none transition-all"
        >
          Continuar <ArrowRight size={20} />
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
