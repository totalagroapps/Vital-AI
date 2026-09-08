import React from 'react';
import PatientHomeDesktop from './PatientHomeDesktop';
import { 
  Stethoscope, 
  FileText, 
  Folder, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles, 
  Brain, 
  Paperclip, 
  AudioLines, 
  ArrowRight 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientHome = ({ onNavigate, onLogout }) => {
  const { t } = useLanguage();

  return (
    <>
      {/* ================= VISTA MÓVIL (DISEÑO OFICIAL MIVOR.ai - COMPACTO SIN SCROLL) ================= */}
      <div className="block lg:hidden w-full min-h-[100dvh] max-h-[100dvh] flex flex-col justify-between pt-1 pb-[62px] px-3.5 font-sans bg-[#fcfdfe] overflow-y-auto no-scrollbar select-none">
        
        {/* 1. Barra Superior: Logo MIVOR.ai + Selector de Idioma */}
        <div className="flex items-center justify-between pt-1 pb-0.5 px-1">
          <div className="flex items-center gap-2">
            <img 
              src="/images/mivor_logo.png" 
              alt="MIVOR.ai" 
              className="w-7 h-7 object-contain drop-shadow-xs" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-[#0b1a30] leading-none">
                MIVOR<span className="text-[#00a896]">.ai</span>
              </span>
              <span className="text-[7px] uppercase font-extrabold tracking-wider text-[#00a896] mt-0.5">
                BETTER HEALTH. BRIGHTER LIVES.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 scale-90 origin-right">
            <LanguageSelector />
          </div>
        </div>

        {/* 2. Sección Hero: Titular Principal + Ilustración Circular */}
        <div className="px-1 py-1">
          <div className="flex items-center justify-between gap-2">
            
            {/* Columna Izquierda: Textos */}
            <div className="flex-1 max-w-[65%]">
              <h1 className="text-[18px] sm:text-[20px] leading-[1.12] font-black text-[#0b1a30] tracking-tight">
                Tu salud,<br />
                en manos de la<br />
                <span className="text-[#2563eb]">IA más avanzada</span><br />
                <span className="text-[#2563eb]">en medicina.</span>
              </h1>
              <p className="mt-1 text-[9.5px] leading-tight text-slate-500 font-medium line-clamp-2 pr-1">
                Entiende, gestiona y mejora tu bienestar con información médica fiable y personalizada.
              </p>
            </div>

            {/* Columna Derecha: Ilustración Circular y Lema */}
            <div className="w-[35%] flex flex-col items-center relative shrink-0">
              <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />
              <img 
                src="/images/mivor_hero_art_clean.png" 
                alt="Juntos por una medicina más humana y eficiente"
                className="w-full max-w-[100px] max-h-[100px] object-contain drop-shadow-sm relative z-10"
                onError={(e) => { e.target.src = '/images/mivor_hero_art.png'; }}
              />
            </div>
          </div>
        </div>

        {/* 3. Tarjeta de Seguridad y Privacidad */}
        <div 
          onClick={() => onNavigate('history')}
          className="p-2 bg-[#f0f7ff] hover:bg-[#e6f2ff] active:scale-[0.99] border border-blue-100/90 rounded-2xl flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer transition-all"
        >
          <div className="w-7 h-7 rounded-xl bg-blue-100/80 text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={17} className="stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-bold text-slate-900 leading-tight">
              Tus datos están protegidos
            </h4>
            <p className="text-[9px] text-slate-500 leading-tight mt-0.5 font-medium line-clamp-1">
              Cifrado médico y cumplimiento con los más altos estándares (ISO 27001, GDPR).
            </p>
          </div>
          <ChevronRight size={15} className="text-slate-400 shrink-0" />
        </div>

        {/* 4. Tarjeta de Consulta IA: "Pregunta a MIVOR.ai" */}
        <div className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-2xs relative overflow-hidden">
          {/* Cabecera de la tarjeta */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="fill-purple-600/30" />
              </div>
              <h3 className="text-[12px] font-bold text-slate-900 leading-tight">
                Pregunta a MIVOR.ai
              </h3>
            </div>
            <div className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <Brain size={11} className="text-[#2563eb]" />
              <span className="text-[8.5px] font-bold text-[#2563eb] tracking-tight">IA médica avanzada</span>
            </div>
          </div>

          <p className="text-[9.5px] text-slate-500 leading-tight mb-2 font-medium line-clamp-1">
            Consulta sobre tu salud con la asistencia de la IA más avanzada en medicina.
          </p>

          {/* Barra de Entrada de Consulta / Dictado */}
          <div 
            onClick={() => onNavigate('general_chat')}
            className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-full py-1 pl-2.5 pr-1 flex items-center gap-2 shadow-2xs transition-all cursor-text"
          >
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('documents');
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
              title="Adjuntar estudio o análisis"
            >
              <Paperclip size={15} className="rotate-45" />
            </button>
            <div className="w-[1px] h-3.5 bg-slate-200" />
            <span className="text-[10.5px] text-slate-400 font-normal flex-1 truncate">
              Ej.: ¿por qué tengo dolor de cabeza?
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem('autoStartMic', 'true');
                onNavigate('triage');
              }}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="Dictar por voz"
            >
              <AudioLines size={13} />
            </button>
          </div>
        </div>

        {/* 5. Cuadrícula de 4 Acciones (2x2) */}
        <div className="grid grid-cols-2 gap-2">
          
          {/* 1. Entiende tus síntomas */}
          <div 
            onClick={() => onNavigate('triage')}
            className="bg-[#faf5ff] hover:bg-[#f5eeff] active:scale-[0.98] border border-purple-100 rounded-2xl p-2.5 flex flex-col justify-between min-h-[90px] shadow-2xs cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="w-6 h-6 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center shadow-2xs">
                  <Stethoscope size={14} />
                </div>
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <ArrowRight size={10} />
                </div>
              </div>
              <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">
                Entiende tus síntomas
              </h4>
              <p className="text-[9px] text-slate-500 leading-tight font-medium mt-0.5 line-clamp-2">
                Describe lo que sientes y obtén posibles causas y consejos.
              </p>
            </div>
          </div>

          {/* 2. Analiza tus pruebas médicas */}
          <div 
            onClick={() => onNavigate('documents')}
            className="bg-[#f0f9ff] hover:bg-[#e4f4ff] active:scale-[0.98] border border-sky-100 rounded-2xl p-2.5 flex flex-col justify-between min-h-[90px] shadow-2xs cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="w-6 h-6 rounded-lg bg-sky-100/80 text-[#2563eb] flex items-center justify-center shadow-2xs">
                  <FileText size={14} />
                </div>
                <div className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <ArrowRight size={10} />
                </div>
              </div>
              <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">
                Analiza tus pruebas
              </h4>
              <p className="text-[9px] text-slate-500 leading-tight font-medium mt-0.5 line-clamp-2">
                Sube informes, radiografías y analíticas para analizarlos.
              </p>
            </div>
          </div>

          {/* 3. Organiza tu historial de salud */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-[#f0fdf4] hover:bg-[#e3fcee] active:scale-[0.98] border border-emerald-100 rounded-2xl p-2.5 flex flex-col justify-between min-h-[90px] shadow-2xs cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <Folder size={14} />
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <ArrowRight size={10} />
                </div>
              </div>
              <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">
                Organiza tu historial
              </h4>
              <p className="text-[9px] text-slate-500 leading-tight font-medium mt-0.5 line-clamp-2">
                Centraliza tu información médica y ten todo siempre a mano.
              </p>
            </div>
          </div>

          {/* 4. Conéctate con médicos especialistas */}
          <div 
            onClick={() => onNavigate('doctors')}
            className="bg-[#fff7ed] hover:bg-[#ffeedb] active:scale-[0.98] border border-orange-100 rounded-2xl p-2.5 flex flex-col justify-between min-h-[90px] shadow-2xs cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="w-6 h-6 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Users size={14} />
                </div>
                <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <ArrowRight size={10} />
                </div>
              </div>
              <h4 className="text-[11.5px] font-bold text-slate-900 leading-tight">
                Médicos especialistas
              </h4>
              <p className="text-[9px] text-slate-500 leading-tight font-medium mt-0.5 line-clamp-2">
                Encuentra al especialista adecuado y realiza videoconsultas.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ================= VISTA ESCRITORIO (PRESERVADA) ================= */}
      <div className="hidden lg:block">
        <PatientHomeDesktop onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </>
  );
};

export default PatientHome;
