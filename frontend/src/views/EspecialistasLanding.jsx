import React from 'react';
import {
  MapPin, Video, ShieldCheck, Calendar, Users, ArrowLeft, ArrowRight,
  Clock, Zap, Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PatientTopNav from '../components/PatientTopNav';

const EspecialistasLanding = ({ 
  apiUrl, 
  onBack, 
  onSelectVideo, 
  onSelectPresencial, 
  onMyAppointments,
  onNavigate,
  userProfile,
  username,
  onLogout 
}) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col">
      
      {/* ================= TOP NAVBAR SUPERIOR UNIFICADO ================= */}
      <PatientTopNav
        activeTab="specialists"
        onNavigate={onNavigate}
        userProfile={userProfile}
        username={username}
        onLogout={onLogout}
      />

      {/* ================= PAGE BODY ================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6 pb-24">
        
        {/* Top Header Row with Back link & Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
              <span>Volver al inicio</span>
            </button>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Conéctate con <span className="text-[#0d9488]">médicos especialistas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">
              Elige la opción que mejor se adapte a tus necesidades y encuentra atención médica de calidad.
            </p>
          </div>

          {/* Right Hero Banner matching official image */}
          <div className="hidden sm:flex items-center bg-white rounded-3xl p-3 pr-4 border border-slate-200/80 shadow-xs gap-4 shrink-0 max-w-md">
            <div className="pl-3">
              <div className="w-6 h-1 bg-teal-500 rounded-full mb-1.5" />
              <h4 className="text-sm font-black text-slate-900 leading-tight">Tu salud, <br /> en buenas manos</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Especialistas verificados.<br />Atención cercana y segura.</p>
            </div>
            <div className="w-32 h-20 rounded-2xl overflow-hidden shrink-0 bg-teal-50">
              <img 
                src="/images/especialistas_doctor_avatar.png" 
                alt="Médicos especialistas verificados" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/images/ai_doctor_bg.jpg";
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= TWO MAIN ACTION CARDS (SIN BARRA DE BÚSQUEDA) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Card 1: Cita Presencial */}
          <div className="bg-[#f4fbf7] border border-[#bbf7d0] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
              
              <div className="flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-black text-sm flex items-center justify-center shrink-0 mb-4 shadow-xs">
                  1
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Quiero un médico cercano <br /> para una <span className="text-[#0d9488]">cita presencial</span>
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 mb-5 leading-relaxed">
                  Encuentra médicos especialistas cerca de ti y reserva tu cita en su consulta.
                </p>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <MapPin size={16} className="text-[#0d9488] shrink-0" />
                    <span>Atención presencial en tu zona</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Calendar size={16} className="text-[#0d9488] shrink-0" />
                    <span>Elige el día y hora que te convenga</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <ShieldCheck size={16} className="text-[#0d9488] shrink-0" />
                    <span>Especialistas verificados</span>
                  </li>
                </ul>

                <button
                  onClick={() => onSelectPresencial({})}
                  className="px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Buscar médicos cerca de mí</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Card Image */}
              <div className="w-full sm:w-48 h-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-emerald-100/80 bg-white relative">
                <img 
                  src="/images/especialistas_presencial_card.png" 
                  alt="Consulta Presencial" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/images/in-person.png";
                  }}
                />
              </div>

            </div>
          </div>

          {/* Card 2: Videollamada */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
              
              <div className="flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white font-black text-sm flex items-center justify-center shrink-0 mb-4 shadow-xs">
                  2
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Quiero una cita rápida con un médico <br /> por <span className="text-[#2563eb]">videollamada</span>
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 mb-5 leading-relaxed">
                  Habla con un médico especialista por videollamada lo antes posible, estés donde estés.
                </p>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Zap size={16} className="text-[#2563eb] shrink-0" />
                    <span>Atención online inmediata</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Clock size={16} className="text-[#2563eb] shrink-0" />
                    <span>Sin desplazamientos ni esperas</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <ShieldCheck size={16} className="text-[#2563eb] shrink-0" />
                    <span>Médicos verificados</span>
                  </li>
                </ul>

                <button
                  onClick={() => onSelectVideo({})}
                  className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Iniciar videollamada</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Card Image */}
              <div className="w-full sm:w-48 h-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-blue-100/80 bg-white relative">
                <img 
                  src="/images/especialistas_video_card.png" 
                  alt="Videollamada médica" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/images/video-call.png";
                  }}
                />
              </div>

            </div>
          </div>

        </div>

        {/* ================= BOTTOM SECURITY BANNER ================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-extrabold text-slate-900">Atención segura y confidencial</span>
            <span className="mx-2 text-slate-300">|</span>
            <span>Todos los médicos están verificados y tu información está protegida.</span>
          </p>
        </div>

      </main>
    </div>
  );
};

export default EspecialistasLanding;
