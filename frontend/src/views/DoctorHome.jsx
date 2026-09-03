import React from 'react';
import { Bell, Users, Calendar, Sparkles, BookOpen, FlaskConical, Search, Mic, Video, ClipboardList, ArrowRight } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const DoctorHome = ({ onNavigate, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-base font-sans overflow-x-hidden relative pb-24">
      {/* HEADER */}
      <div className="px-5 py-4 flex justify-between items-center bg-transparent relative z-20">
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-brand-dark tracking-tight flex items-center gap-1">
            <span className="text-brand-blue">VITAL</span> AI
          </h1>
          <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">MÉDICOS</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-gray-700 shadow-sm border border-gray-100 relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-purple rounded-full border-2 border-white"></span>
          </button>
          <button onClick={onLogout} className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            {/* Avatar genérico o foto del doctor */}
            <img src="/images/ai_doctor_bg.jpg" alt="Doctor Profile" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff'; }} />
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="px-5 pt-2 pb-6 relative z-10">
        <h2 className="text-3xl font-extrabold text-brand-dark leading-tight mb-3">
          Tu práctica médica,<br/>potenciada por<br/><span className="text-brand-blue">inteligencia artificial.</span>
        </h2>
        <p className="text-sm text-gray-600 max-w-[280px] leading-relaxed">
          Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.
        </p>
        
        {/* Background Image decoration */}
        <div className="absolute top-[-40px] right-[-80px] w-[300px] h-[300px] z-[-1] opacity-100 pointer-events-none">
           {/* We use the generated doctor image but styled as a background element with gradient fade */}
           <div className="w-full h-full bg-gradient-to-l from-transparent to-base absolute inset-0 z-10"></div>
           <div className="w-full h-full bg-gradient-to-t from-base to-transparent absolute inset-0 z-10"></div>
           <img src="/images/ai_doctor_bg.jpg" alt="AI Doctor" className="w-full h-full object-cover rounded-full blur-[1px]" onError={(e) => e.target.style.display = 'none'} />
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
            <h3 className="font-bold text-gray-900 mb-2">Mis pacientes</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              Busca, crea y gestiona pacientes. Accede a historial, medicación, pruebas e informes.
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 2: Mi agenda */}
          <button onClick={() => alert('Agenda en desarrollo')} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4">
              <Calendar size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Mi agenda</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              Gestiona tu agenda, consultas presenciales y videollamadas, citas, pagos y próximas consultas.
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
            <h3 className="font-bold text-gray-900 mb-2 leading-tight">Asistente clínico IA</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              Resume expedientes, analiza información clínica, compara pruebas y apoya tu diagnóstico.
            </p>
            <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center self-end group-hover:scale-110 transition-transform">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 4: Evidencia médica */}
          <button onClick={() => alert('Módulo de evidencia en desarrollo')} className="bg-white rounded-3xl p-5 text-left shadow-soft border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-4">
              <BookOpen size={22} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Evidencia médica</h3>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed flex-1">
              Accede a literatura científica, guías clínicas, protocolos y ensayos relevantes.
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
            <h3 className="font-bold text-gray-900 mb-1">Analizar pruebas</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Analíticas, radiografías, TAC, RMN e informes asociados a tus pacientes con apoyo de IA.
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
            ¿Qué necesitas hacer?
          </h3>
          <p className="text-xs text-gray-400 mb-4 relative z-10">Busca un paciente o pregunta a VitalAI...</p>
          
          <div className="relative z-10 flex items-center bg-brand-dark border border-white/10 rounded-2xl p-1 shadow-inner">
            <div className="pl-3 pr-2 text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Ej.: 'Buscar paciente Mohamed Amrani'" 
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:ring-0 py-3"
            />
            <button className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center text-white shadow-glow">
              <Mic size={18} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-6 bg-white rounded-3xl p-4 shadow-soft border border-gray-100">
          <div className="flex flex-col items-start p-2">
            <Users size={16} className="text-brand-purple mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">128</span>
            <span className="text-[9px] text-gray-500 leading-tight">Pacientes activos<br/>este mes</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <Calendar size={16} className="text-brand-blue mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">24</span>
            <span className="text-[9px] text-gray-500 leading-tight">Consultas hoy<br/>8 pendientes</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <Video size={16} className="text-brand-green mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">6</span>
            <span className="text-[9px] text-gray-500 leading-tight">Videoconsultas<br/>programadas</span>
          </div>
          <div className="flex flex-col items-start p-2 border-l border-gray-100">
            <ClipboardList size={16} className="text-brand-orange mb-2" />
            <span className="font-extrabold text-gray-900 text-lg">15</span>
            <span className="text-[9px] text-gray-500 leading-tight">Informes pendientes<br/>con IA</span>
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
  );
};

export default DoctorHome;
