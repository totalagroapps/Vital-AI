import React, { useState, useRef } from 'react';
import { 
  Users, Calendar, Sparkles, BookOpen, Search, Mic, ArrowRight, 
  Bell, ChevronDown, LogOut 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const DoctorHomeDesktop = ({ onNavigate, onLogout, doctorProfile }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
  const doctorSpecialty = doctorProfile?.specialty || 'Médico';
  const doctorPhoto = doctorProfile?.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col selection:bg-brand-purple/20">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full bg-white border-b border-gray-100 px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="text-brand-purple">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2.2" />
              <path d="M8 13h8" className="text-brand-blue" strokeWidth="2.2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-brand-dark leading-none">
              VITAL <span className="text-brand-purple">IA</span>
            </span>
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest leading-none mt-1">
              MÉDICOS
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-8 text-sm font-medium">
          <button 
            onClick={() => onNavigate('home')} 
            className="text-brand-purple font-semibold border-b-2 border-brand-purple pb-1 transition-colors"
          >
            Inicio
          </button>
          <button 
            onClick={() => onNavigate('patients')} 
            className="text-gray-600 hover:text-brand-purple transition-colors pb-1"
          >
            Pacientes
          </button>
          <button 
            onClick={() => alert("Módulo de agenda médica en desarrollo (Asignado a Facundo).")} 
            className="text-gray-600 hover:text-brand-purple transition-colors pb-1"
          >
            Agenda
          </button>
          <button 
            onClick={() => onNavigate('copilot')} 
            className="text-gray-600 hover:text-brand-purple transition-colors pb-1"
          >
            Análisis
          </button>
          <button 
            onClick={() => alert("Biblioteca de evidencia médica (PubMed / Cochrane).")} 
            className="text-gray-600 hover:text-brand-purple transition-colors pb-1"
          >
            Recursos
          </button>
          <button 
            onClick={() => onNavigate('more')} 
            className="text-gray-600 hover:text-brand-purple transition-colors pb-1 flex items-center gap-1"
          >
            Más <ChevronDown size={14} />
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
          
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-slate-50 border border-gray-200/70 flex items-center justify-center text-gray-600 hover:text-brand-purple hover:bg-slate-100 transition-all">
              <Bell size={18} />
            </button>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-purple text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              1
            </span>
          </div>

          {/* Doctor Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 pl-2 py-1 pr-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
                <img 
                  src={doctorPhoto} 
                  alt={doctorName} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Dr+Ruiz&background=4F46E5&color=fff'; }}
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 leading-tight">
                  <span>{doctorName}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </div>
                <span className="text-[11px] text-gray-500 leading-tight">{doctorSpecialty}</span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{doctorName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{doctorProfile?.license_number || 'Colegiado'}</p>
                </div>
                <button 
                  onClick={() => { setShowProfileMenu(false); onNavigate('more'); }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-slate-50 transition-colors"
                >
                  Ver Perfil y Configuración
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={13} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </header>


      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-8 pt-8 pb-12">
        
        {/* 2. HERO SECTION */}
        <div className="flex items-center justify-between gap-8 mb-8">
          
          {/* Left Hero Text */}
          <div className="max-w-xl">
            <h1 className="text-[42px] lg:text-[46px] font-black text-brand-dark tracking-tight leading-[1.12] mb-3">
              Tu práctica médica,<br />
              potenciada por<br />
              <span className="text-brand-purple">inteligencia artificial.</span>
            </h1>
            <p className="text-sm lg:text-[15px] text-gray-500 leading-relaxed max-w-lg">
              Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.
            </p>
          </div>

          {/* Right Hero AI Head Image */}
          <div className="relative w-72 h-72 lg:w-84 lg:h-84 flex items-center justify-center pointer-events-none shrink-0">
            <img 
              src="/images/doctor_ai_head.jpg" 
              alt="Vital IA Medical Intelligence" 
              className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply"
            />
          </div>

        </div>


        {/* 3. 2x2 ACTION CARDS GRID */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          
          {/* Card 1: Mis pacientes */}
          <div 
            onClick={() => onNavigate('patients')}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-4 flex-1 pr-4">
              <div className="w-13 h-13 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 p-3">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">Mis pacientes</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  Busca, crea y gestiona pacientes. Accede a historial, medicación, pruebas e informes.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-purple text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Card 2: Mi agenda */}
          <div 
            onClick={() => alert("Módulo de agenda médica en desarrollo (Asignado a Facundo según el plan de trabajo).")}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-4 flex-1 pr-4">
              <div className="w-13 h-13 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 p-3">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">Mi agenda</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  Gestiona tu agenda, consultas presenciales y videollamadas, citas, pagos y próximas consultas.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Card 3: Asistente clínico IA */}
          <div 
            onClick={() => onNavigate('copilot')}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-4 flex-1 pr-4">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 p-3">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">Asistente clínico IA</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  Resume expedientes, analiza información clínica, compara pruebas y apoya tu diagnóstico.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Card 4: Evidencia médica */}
          <div 
            onClick={() => alert("Biblioteca científica y guías médicas conectadas a PubMed y Cochrane.")}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-start gap-4 flex-1 pr-4">
              <div className="w-13 h-13 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 p-3">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">Evidencia médica</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                  Accede a los últimos avances científicos, guías clínicas, estudios relevantes y recibe alertas de novedades importantes.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <ArrowRight size={16} />
            </div>
          </div>

        </div>


        {/* 4. SEARCH / COPILOT BANNER */}
        <div className="bg-white rounded-3xl p-6 border border-brand-purple/15 shadow-soft mb-12">
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">¿Qué necesitas hacer?</h4>
              <p className="text-xs text-gray-500">Busca un paciente o pregunta a Vital IA...</p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-slate-50 border border-gray-200/80 rounded-2xl p-1.5 focus-within:border-brand-purple/50 focus-within:ring-2 focus-within:ring-brand-purple/10 transition-all">
            <div className="pl-3.5 pr-2 text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Ej: "¿Buscar paciente Mohamed Amrani?" · "Resumen de su última analítica" · "Preparar consulta de hoy"'
              className="flex-1 bg-transparent border-none text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 py-2.5"
            />
            <button 
              type="button" 
              onClick={toggleListening}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-md' 
                  : 'bg-brand-purple text-white hover:bg-brand-purple/90 shadow-xs'
              }`}
              title={isListening ? "Detener grabación" : "Dictar consulta con voz"}
            >
              <Mic size={17} />
            </button>
          </form>

        </div>


        {/* 5. FOOTER / NOVEDADES MÉDICAS */}
        <div className="text-center pt-2 pb-6">
          <h4 className="text-sm font-extrabold text-gray-900 mb-1">Últimas novedades médicas</h4>
          <p className="text-xs text-gray-500">
            Mantente al día con los últimos avances científicos y alertas relevantes para tu práctica.
          </p>
        </div>

      </main>

    </div>
  );
};

export default DoctorHomeDesktop;
