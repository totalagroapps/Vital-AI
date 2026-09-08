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
      {/* ================= VISTA MÓVIL (DISEÑO OFICIAL MIVOR.ai) ================= */}
      <div className="block lg:hidden flex-1 w-full relative min-h-screen pb-28 font-sans bg-[#fcfdfe] overflow-x-hidden select-none">
        
        {/* Barra Superior: Logo MIVOR.ai + Selector de Idioma */}
        <div className="flex items-center justify-between pt-3 pb-2 px-5">
          <div className="flex items-center gap-2.5">
            <img 
              src="/images/mivor_logo.png" 
              alt="MIVOR.ai" 
              className="w-9 h-9 object-contain drop-shadow-sm" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tight text-[#0b1a30]">
                MIVOR<span className="text-[#00a896]">.ai</span>
              </span>
              <span className="text-[8.5px] uppercase font-extrabold tracking-widest text-[#00a896] -mt-1">
                BETTER HEALTH. BRIGHTER LIVES.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSelector />
          </div>
        </div>

        {/* Sección Hero: Titular Principal + Ilustración Circular */}
        <div className="px-5 pt-3 pb-3 relative">
          <div className="flex items-center justify-between gap-2">
            
            {/* Columna Izquierda: Textos */}
            <div className="flex-1 max-w-[62%]">
              <h1 className="text-[25px] leading-[1.18] font-black text-[#0b1a30] tracking-tight">
                Tu salud,<br />
                en manos de la<br />
                <span className="text-[#2563eb]">IA más avanzada</span><br />
                <span className="text-[#2563eb]">en medicina.</span>
              </h1>
              <p className="mt-2 text-[11.5px] leading-snug text-slate-500 font-medium pr-1">
                Entiende, gestiona y mejora tu bienestar con información médica fiable, personalizada y siempre disponible.
              </p>
            </div>

            {/* Columna Derecha: Ilustración Circular y Lema */}
            <div className="w-[38%] flex flex-col items-center relative">
              <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
              <img 
                src="/images/mivor_hero_art_clean.png" 
                alt="Juntos por una medicina más humana y eficiente"
                className="w-full max-w-[155px] object-contain drop-shadow-md relative z-10"
                onError={(e) => { e.target.src = '/images/mivor_hero_art.png'; }}
              />
            </div>
          </div>
        </div>

        {/* Tarjeta de Seguridad y Privacidad */}
        <div 
          onClick={() => onNavigate('history')}
          className="mx-5 mb-3.5 p-3.5 bg-[#f0f7ff] hover:bg-[#e6f2ff] active:scale-[0.99] border border-blue-100/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
              Tus datos están protegidos
            </h4>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">
              Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </div>

        {/* Tarjeta de Consulta IA: "Pregunta a MIVOR.ai" */}
        <div className="mx-5 mb-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
          {/* Cabecera de la tarjeta */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="fill-purple-600/30" />
              </div>
              <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                Pregunta a MIVOR.ai
              </h3>
            </div>
            <div className="bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
              <Brain size={13} className="text-[#2563eb]" />
              <span className="text-[10px] font-bold text-[#2563eb] tracking-tight">IA médica avanzada</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mb-3 font-medium">
            Consulta sobre tu salud o descubre los últimos avances médicos y científicos, con la ayuda de la IA más avanzada en medicina.
          </p>

          {/* Barra de Entrada de Consulta / Dictado */}
          <div 
            onClick={() => onNavigate('general_chat')}
            className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-full py-1.5 pl-3.5 pr-1.5 flex items-center gap-2 shadow-2xs transition-all cursor-text"
          >
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('documents');
              }}
              className="text-slate-400 hover:text-slate-600 p-1 -ml-1 transition-colors"
              title="Adjuntar estudio o análisis"
            >
              <Paperclip size={18} className="rotate-45" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200" />
            <span className="text-[11.5px] text-slate-400 font-normal flex-1 truncate">
              Ej.: ¿por qué tengo dolor de cabeza?
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem('autoStartMic', 'true');
                onNavigate('triage');
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="Dictar por voz"
            >
              <AudioLines size={16} />
            </button>
          </div>
        </div>

        {/* Cuadrícula de 4 Acciones (2x2) */}
        <div className="mx-5 grid grid-cols-2 gap-3 mb-4">
          
          {/* 1. Entiende tus síntomas */}
          <div 
            onClick={() => onNavigate('triage')}
            className="bg-[#faf5ff] hover:bg-[#f5eeff] active:scale-[0.98] border border-purple-100 rounded-3xl p-4 flex flex-col justify-between h-[165px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center mb-2 shadow-2xs">
                <Stethoscope size={18} />
              </div>
              <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight mb-1">
                Entiende tus síntomas
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Describe lo que sientes y obtén posibles causas, explicaciones y consejos.
              </p>
            </div>
            <div className="self-end w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 2. Analiza tus pruebas médicas */}
          <div 
            onClick={() => onNavigate('documents')}
            className="bg-[#f0f9ff] hover:bg-[#e4f4ff] active:scale-[0.98] border border-sky-100 rounded-3xl p-4 flex flex-col justify-between h-[165px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-[#2563eb] flex items-center justify-center mb-2 shadow-2xs">
                <FileText size={18} />
              </div>
              <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight mb-1">
                Analiza tus pruebas médicas
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Sube tus informes, radiografías y analíticas. La IA los analiza por ti en segundos.
              </p>
            </div>
            <div className="self-end w-7 h-7 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 3. Organiza tu historial de salud */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-[#f0fdf4] hover:bg-[#e3fcee] active:scale-[0.98] border border-emerald-100 rounded-3xl p-4 flex flex-col justify-between h-[165px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                <Folder size={18} />
              </div>
              <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight mb-1">
                Organiza tu historial de salud
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Centraliza toda la información médica y ten todo siempre a mano.
              </p>
            </div>
            <div className="self-end w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 4. Conéctate con médicos especialistas */}
          <div 
            onClick={() => onNavigate('doctors')}
            className="bg-[#fff7ed] hover:bg-[#ffeedb] active:scale-[0.98] border border-orange-100 rounded-3xl p-4 flex flex-col justify-between h-[165px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center mb-2 shadow-2xs">
                <Users size={18} />
              </div>
              <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight mb-1">
                Conéctate con médicos especialistas
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Encuentra al especialista adecuado y realiza videoconsultas seguras.
              </p>
            </div>
            <div className="self-end w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <ArrowRight size={13} />
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
