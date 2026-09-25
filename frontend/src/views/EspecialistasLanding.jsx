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
    <div className="h-[100dvh] max-h-[100dvh] lg:min-h-screen lg:max-h-none bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col justify-between overflow-hidden lg:overflow-auto pb-[82px] sm:pb-[88px] lg:pb-0">
      
      {/* ================= TOP NAVBAR SUPERIOR UNIFICADO ================= */}
      <PatientTopNav
        activeTab="specialists"
        onNavigate={onNavigate}
        userProfile={userProfile}
        username={username}
        onLogout={onLogout}
      />

      {/* ================= PAGE BODY ================= */}
      <main className="flex-1 min-h-0 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 lg:py-6 flex flex-col justify-between gap-2.5 lg:gap-6 overflow-hidden lg:overflow-visible">
        
        {/* Top Header Row with Back link & Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 sm:gap-3 lg:gap-6 shrink-0">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors mb-0.5 sm:mb-2 cursor-pointer group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              <span>{t('return_home')}</span>
            </button>

            <h1 className="text-lg sm:text-2xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
             {t('especialistaslandi_conectate_con')} <span className="text-[#0055ff]">{t('especialistaslandi_medicos_especialistas')}</span>
            </h1>
            <p className="text-[11.5px] sm:text-xs lg:text-sm text-slate-500 font-medium mt-0.5 sm:mt-1 max-w-xl leading-relaxed">
             {t('especialistaslandi_elige_la_opcion_que_mejor')}
            </p>
          </div>

          {/* Right Hero Banner matching official image (Desktop only) */}
          <div className="hidden sm:flex items-center bg-white rounded-3xl p-3 pr-4 border border-slate-200/80 shadow-xs gap-4 shrink-0 max-w-md">
            <div className="pl-3">
              <div className="w-6 h-1 bg-blue-500 rounded-full mb-1.5" />
              <h4 className="text-sm font-black text-slate-900 leading-tight">{t('hero_title_p1')} <br /> {t('especialistaslandi_en_buenas_manos')}</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{t('especialistaslandi_especialistas_verificados')}<br />{t('especialistaslandi_atencion_cercana_y_segura')}</p>
            </div>
            <div className="w-32 h-20 rounded-2xl overflow-hidden shrink-0 bg-blue-50">
              <img 
                src="/images/especialistas_doctor_avatar.png" 
                alt={t('especialistaslandi_medicos_especialistas_verificados')} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/images/ai_doctor_bg.jpg";
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= MÓVIL: CUADRÍCULA 2 COLUMNAS COMPACTA (ZERO-SCROLL EN CUALQUIER SMARTPHONE) ================= */}
        <div className="grid grid-cols-2 lg:hidden gap-2.5 sm:gap-4 flex-1 min-h-0 my-auto items-stretch sm:flex-none sm:items-start sm:max-w-3xl sm:mx-auto sm:w-full">
          
          {/* Tarjeta Móvil 1: Cita Presencial */}
          <div 
            onClick={() => onSelectPresencial({})}
            className="bg-[#f4fbf7] border-2 border-[#bbf7d0] rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer group"
          >
            <div className="min-h-0 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#10b981] text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  1
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0055ff] flex items-center justify-center">
                  <MapPin size={13} className="stroke-[2.4]" />
                </div>
              </div>

              {/* Imagen thumbnail compacta */}
              <div className="w-full h-20 sm:h-36 rounded-xl overflow-hidden mb-2 bg-emerald-50 relative shrink-0">
                <img 
                  src="/images/especialistas_presencial_card.png" 
                  alt={t('especialistaslandi_consulta_presencial')} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = "/images/in-person.png"; }}
                />
                <span className="absolute bottom-1 left-1 bg-white/95 backdrop-blur-xs text-[9px] font-extrabold text-[#0055ff] px-1.5 py-0.5 rounded-md shadow-2xs">
                 {t('especialistaslandi_cerca_de_ti')}
                </span>
              </div>

              <div>
                <h3 className="text-[13.5px] sm:text-base font-black text-slate-900 leading-tight">
                 {t('presencial_modality_label')}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold line-clamp-2 mt-0.5 leading-snug">
                 {t('especialistaslandi_especialistas_en_consulta_medica_cer')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectPresencial({}); }}
              className="w-full mt-2.5 py-2.5 px-2 bg-[#0055ff] active:bg-[#0047d6] text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span>{t('especialistaslandi_buscar_presencial')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Tarjeta Móvil 2: Videollamada */}
          <div 
            onClick={() => onSelectVideo({})}
            className="bg-[#eff6ff] border-2 border-[#bfdbfe] rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between active:scale-[0.98] cursor-pointer group"
          >
            <div className="min-h-0 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-full bg-[#3b82f6] text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  2
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center">
                  <Video size={13} className="stroke-[2.4]" />
                </div>
              </div>

              {/* Imagen thumbnail compacta */}
              <div className="w-full h-20 sm:h-36 rounded-xl overflow-hidden mb-2 bg-blue-50 relative shrink-0">
                <img 
                  src="/images/especialistas_video_card.png" 
                  alt={t('especialistaslandi_videollamada_medica')} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = "/images/video-call.png"; }}
                />
                <span className="absolute bottom-1 left-1 bg-white/95 backdrop-blur-xs text-[9px] font-extrabold text-[#2563eb] px-1.5 py-0.5 rounded-md shadow-2xs">
                 {t('especialistaslandi_online')}
                </span>
              </div>

              <div>
                <h3 className="text-[13.5px] sm:text-base font-black text-slate-900 leading-tight">
                 {t('book_modality_video')}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold line-clamp-2 mt-0.5 leading-snug">
                 {t('especialistaslandi_atencion_online_inmediata_estes_dond')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelectVideo({}); }}
              className="w-full mt-2.5 py-2.5 px-2 bg-[#2563eb] active:bg-[#1d4ed8] text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span>{t('especialistaslandi_solicitar_video')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

        {/* ================= DESKTOP: DOS TARJETAS EXPANDIDAS (LG+) ================= */}
        <div className="hidden lg:grid grid-cols-2 gap-6 pt-2">
          
          {/* Card 1: Cita Presencial (Desktop) */}
          <div className="bg-[#f4fbf7] border border-[#bbf7d0] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
              
              <div className="flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-black text-sm flex items-center justify-center shrink-0 mb-4 shadow-xs">
                  1
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                 {t('especialistaslandi_quiero_un_medico_cercano')} <br /> {t('especialistaslandi_para_una')} <span className="text-[#0055ff]">{t('especialistaslandi_cita_presencial')}</span>
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 mb-5 leading-relaxed">
                 {t('land_option_presencial_desc')}
                </p>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <MapPin size={16} className="text-[#0055ff] shrink-0" />
                    <span>{t('land_option_presencial_bullet1')}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Calendar size={16} className="text-[#0055ff] shrink-0" />
                    <span>{t('especialistaslandi_elige_el_dia_y_hora')}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <ShieldCheck size={16} className="text-[#0055ff] shrink-0" />
                    <span>{t('land_option_presencial_bullet3')}</span>
                  </li>
                </ul>

                <button
                  onClick={() => onSelectPresencial({})}
                  className="px-6 py-3 bg-[#0055ff] hover:bg-[#0047d6] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('land_option_presencial_cta')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Card Image */}
              <div className="w-full sm:w-48 h-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-emerald-100/80 bg-white relative">
                <img 
                  src="/images/especialistas_presencial_card.png" 
                  alt={t('especialistaslandi_consulta_presencial')} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/images/in-person.png";
                  }}
                />
              </div>

            </div>
          </div>

          {/* Card 2: Videollamada (Desktop) */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
              
              <div className="flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white font-black text-sm flex items-center justify-center shrink-0 mb-4 shadow-xs">
                  2
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                 {t('especialistaslandi_quiero_una_cita_rapida_con')} <br /> {t('especialistaslandi_por')} <span className="text-[#2563eb]">{t('especialistaslandi_videollamada')}</span>
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 mb-5 leading-relaxed">
                 {t('land_option_video_desc')}
                </p>

                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Zap size={16} className="text-[#2563eb] shrink-0" />
                    <span>{t('land_option_video_bullet1')}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <Clock size={16} className="text-[#2563eb] shrink-0" />
                    <span>{t('land_option_video_bullet2')}</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <ShieldCheck size={16} className="text-[#2563eb] shrink-0" />
                    <span>{t('land_option_video_bullet3')}</span>
                  </li>
                </ul>

                <button
                  onClick={() => onSelectVideo({})}
                  className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('land_option_video_cta')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Card Image */}
              <div className="w-full sm:w-48 h-44 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-blue-100/80 bg-white relative">
                <img 
                  src="/images/especialistas_video_card.png" 
                  alt={t('especialistaslandi_videollamada_medica')} 
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
        <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border border-slate-200/80 shadow-2xs flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-brand flex items-center justify-center shrink-0">
            <ShieldCheck size={15} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-600 leading-snug">
            <span className="font-extrabold text-slate-900">{t('land_security_title')}</span>
            <span className="mx-1.5 text-slate-300">|</span>
            <span>{t('land_security_desc')}</span>
          </p>
        </div>

      </main>
    </div>
  );
};

export default EspecialistasLanding;
