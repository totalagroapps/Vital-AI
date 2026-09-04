import React, { useState, useRef } from 'react';
import { Bell, Users, Calendar, Sparkles, BookOpen, FlaskConical, Search, Mic, Video, ClipboardList, ArrowRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import DoctorHomeDesktop from './DoctorHomeDesktop';

const DoctorHome = ({ onNavigate, onLogout, doctorProfile }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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
      setSearchQuery((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        alert(t('microphone_permission_denied') || 'Permiso de micrófono denegado en tu navegador.');
      }
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { setIsListening(false); }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('patients');
    }
  };

  const doctorName = doctorProfile?.full_name || 'Dr. Alejandro Ruiz';
  const doctorSpecialty = doctorProfile?.specialty || 'Médico Especialista';
  const doctorPhoto = doctorProfile?.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';

  return (
    <>
    <div className="block lg:hidden flex-1 w-full relative min-h-screen pb-24 font-sans bg-base overflow-x-hidden">
      {/* Background Graphic for Mobile */}
      <div className="absolute top-14 right-0 w-[50%] h-[230px] pointer-events-none z-0 overflow-hidden">
        <img 
          src="/images/doctor_ai_head.jpg" 
          alt="Vital IA Medical Intelligence" 
          className="w-full h-full object-contain mix-blend-multiply" 
        />
      </div>

      {/* HEADER */}
      <div className="px-5 py-4 flex justify-between items-center bg-transparent relative z-20">
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-brand-dark tracking-tight flex items-center gap-1">
            <span className="text-brand-blue">VITAL</span> IA
          </h1>
          <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{t("doctors")}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <button className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-purple rounded-full border-2 border-white"></span>
          </button>
          <button onClick={onLogout} className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-brand-blue/30 shadow-sm" title={t("logout") || "Cerrar Sesión"}>
            <img src={doctorPhoto} alt={doctorName} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff'; }} />
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="px-5 pt-2 pb-6 relative z-10 flex flex-col gap-4">
        <div className="max-w-[65%]">
          <h2 className="text-2xl font-extrabold text-brand-dark leading-tight mb-2">
            {t("your_medical_practice") || "Tu práctica médica"},<br/>
            {t("enhanced_by_ai") || "potenciada por"}<br/>
            <span className="text-brand-purple">{t("artificial_intelligence") || "inteligencia artificial."}</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t("save_time_make_better_decisions") || "Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente."}
          </p>
        </div>

        {/* Prominent Doctor Profile Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-soft border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0 border border-gray-200 bg-slate-100">
            <img 
              src={doctorPhoto} 
              alt={doctorName} 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Dr+Ruiz&background=4F46E5&color=fff'; }} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold mb-1 border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t("online") || "En Línea"}
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm truncate">{doctorName}</h3>
            <p className="text-[11px] text-gray-500 truncate">{doctorSpecialty} · {doctorProfile?.license_number || 'Verificado'}</p>
          </div>
        </div>
      </div>


      {/* MAIN GRID */}
      <div className="px-5 space-y-4 relative z-20">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card 1: Mis pacientes */}
          <button onClick={() => onNavigate('patients')} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-4">
              <Users size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t("my_patients")}</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              {t("search_create_manage_patients")}
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 2: Mi agenda */}
          <button onClick={() => alert(t("agenda_in_development"))} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4">
              <Calendar size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t("my_schedule")}</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              {t("manage_schedule_consultations")}
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 3: Asistente clínico IA */}
          <button onClick={() => onNavigate('copilot')} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-4">
              <Sparkles size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 leading-tight">{t("ai_clinical_assistant")}</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              {t("summarize_files_analyze_clinical_info")}
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 4: Evidencia médica */}
          <button onClick={() => alert(t("evidence_module_in_development"))} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-4">
              <BookOpen size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{t("medical_evidence")}</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              {t("access_scientific_literature")}
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>
        </div>

        {/* Card 5: Analizar pruebas (Full width) */}
        <button onClick={() => onNavigate('copilot')} className="w-full bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex items-center hover:shadow-md transition-shadow group gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
            <FlaskConical size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{t("analyze_tests")}</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {t("analyze_tests_with_ai")}
            </p>
          </div>
          <div className="w-6 h-6 rounded-full bg-brand-teal text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ArrowRight size={14} />
          </div>
        </button>

        {/* AI Search Banner */}
        <div className="bg-brand-dark rounded-3xl p-5 shadow-xl relative overflow-hidden mt-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2 relative z-10">
            <Sparkles size={16} className="text-brand-purpleLight" />
            {t("what_do_you_need_to_do")}
          </h3>
          <p className="text-xs text-gray-400 mb-4 relative z-10">{t("search_patient_or_ask_vitalai")}</p>
          
          <form onSubmit={handleSearchSubmit} className="relative z-10 flex items-center bg-brand-dark border border-white/10 rounded-2xl p-1 shadow-inner">
            <button type="submit" className="pl-3 pr-2 text-gray-400 hover:text-white transition-colors" title="Buscar">
              <Search size={18} />
            </button>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("example_search_patient")}
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:ring-0 py-3"
            />
            <button 
              type="button" 
              onClick={toggleListening} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg scale-105' : 'bg-brand-purple text-white shadow-glow hover:scale-105'}`}
              title={isListening ? "Detener grabación" : "Dictar búsqueda o consulta"}
            >
              <Mic size={18} />
            </button>
          </form>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-6 bg-white rounded-3xl p-4 shadow-soft border border-gray-100">
          <div className="flex flex-col items-start p-2">
            <Users size={16} className="text-brand-purple mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">128</span>
            <span className="text-[9px] text-gray-500 leading-tight">{t("active_patients_this_month")}</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <Calendar size={16} className="text-brand-blue mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">24</span>
            <span className="text-[9px] text-gray-500 leading-tight">{t("consultations_today")}</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <Video size={16} className="text-brand-green mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">6</span>
            <span className="text-[9px] text-gray-500 leading-tight">{t("scheduled_videoconsultations")}</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <ClipboardList size={16} className="text-brand-orange mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">15</span>
            <span className="text-[9px] text-gray-500 leading-tight">{t("pending_reports_with_ai")}</span>
          </div>
        </div>
      </div>

      <BottomNav activeTab="home" onTabChange={(tab) => {
        if (tab === 'home') onNavigate('home');
        if (tab === 'patients') onNavigate('patients');
        if (tab === 'ai') onNavigate('copilot');
        if (tab === 'more') onNavigate('more');
      }} isDoctor={true} />
    </div>

    {/* DESKTOP VIEW */}
    <div className="hidden lg:block">
      <DoctorHomeDesktop onNavigate={onNavigate} onLogout={onLogout} doctorProfile={doctorProfile} />
    </div>
    </>
  );
};

export default DoctorHome;
