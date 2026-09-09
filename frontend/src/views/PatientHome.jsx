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
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientHome = ({ onNavigate, onLogout }) => {
  const { t } = useLanguage();

  return (
    <>
      {/* ================= VISTA MÓVIL (RÉPLICA EXACTA DISEÑO OFICIAL MIVOR.ai) ================= */}
      <div className="block lg:hidden w-full min-h-screen pb-24 px-4 pt-1 font-sans bg-white overflow-x-hidden select-none space-y-2.5">
        
        {/* 1. Barra Superior: Logo MIVOR.ai + Selector de Idioma */}
        <div className="flex items-center justify-between pt-1 pb-0.5">
          <div className="flex items-center gap-2.5">
            <img 
              src="/images/mivor_logo.png" 
              alt="MIVOR.ai" 
              className="w-9 h-9 object-contain" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            <div className="flex flex-col">
              <span className="font-black text-[22px] tracking-tight text-[#0b1a30] leading-none">
                MIVOR<span className="text-[#00a896]">.ai</span>
              </span>
              <span className="text-[8px] uppercase font-black tracking-widest text-[#00a896] mt-0.5">
                BETTER HEALTH. BRIGHTER LIVES.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <LanguageSelector />
          </div>
        </div>

        {/* 2. Sección Hero: Titular Principal + Ilustración Circular */}
        <div className="flex items-center justify-between gap-1 py-1">
          {/* Columna Izquierda: Textos */}
          <div className="flex-1 pr-1">
            <h1 className="text-[23px] sm:text-[25px] leading-[1.15] font-black text-[#0b1a30] tracking-tight">
              Tu salud,<br />
              en manos de la<br />
              <span className="text-[#2563eb]">IA más avanzada</span><br />
              <span className="text-[#2563eb]">en medicina.</span>
            </h1>
            <p className="mt-2 text-[11px] leading-snug text-slate-500 font-medium max-w-[230px]">
              Entiende, gestiona y mejora tu bienestar con información médica fiable, personalizada y siempre disponible.
            </p>
          </div>

          {/* Columna Derecha: Ilustración Circular y Lema */}
          <div className="w-[140px] sm:w-[155px] shrink-0 flex justify-end">
            <img 
              src="/images/mivor_hero_art_clean.png" 
              alt="Juntos por una medicina más humana y eficiente"
              className="w-full h-auto object-contain"
              onError={(e) => { e.target.src = '/images/mivor_hero_art.png'; }}
            />
          </div>
        </div>

        {/* 3. Tarjeta de Seguridad y Privacidad */}
        <div 
          onClick={() => onNavigate('history')}
          className="p-3 bg-[#f0f6ff] hover:bg-[#e6f0ff] active:scale-[0.99] border border-blue-100/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#dbeafe] text-[#2563eb] flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[12.5px] font-bold text-[#0b1a30] leading-tight">
              Tus datos están protegidos
            </h4>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">
              Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </div>

        {/* 4. Tarjeta de Consulta IA: "Pregunta a MIVOR.ai" */}
        <div className="p-3.5 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden">
          {/* Cabecera de la tarjeta */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center shrink-0">
                <Sparkles size={18} className="fill-[#7c3aed]/20" />
              </div>
              <h3 className="text-[14px] font-bold text-[#0b1a30] leading-tight">
                Pregunta a MIVOR.ai
              </h3>
            </div>
            <div className="bg-[#eff6ff] border border-blue-200/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
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
            className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-full py-1.5 pl-3.5 pr-1.5 flex items-center gap-2.5 shadow-2xs transition-all cursor-text"
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
              <Paperclip size={18} />
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
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] via-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform shrink-0"
              title="Dictar por voz"
            >
              <AudioLines size={16} />
            </button>
          </div>
        </div>

        {/* 5. Cuadrícula de 4 Acciones (2x2) */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          
          {/* 1. Entiende tus síntomas */}
          <div 
            onClick={() => onNavigate('triage')}
            className="bg-[#faf5ff] hover:bg-[#f5eeff] active:scale-[0.98] border border-purple-100 rounded-3xl p-3.5 flex flex-col justify-between min-h-[142px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white text-[#7c3aed] flex items-center justify-center mb-2 shadow-2xs">
                <Stethoscope size={20} />
              </div>
              <h4 className="text-[13px] font-bold text-[#0b1a30] leading-tight mb-1">
                Entiende tus síntomas
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Describe lo que sientes y obtén posibles causas, explicaciones y consejos.
              </p>
            </div>
            <div className="self-end mt-2 w-7 h-7 rounded-full bg-[#7c3aed] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 2. Analiza tus pruebas médicas */}
          <div 
            onClick={() => onNavigate('documents')}
            className="bg-[#f0f9ff] hover:bg-[#e4f4ff] active:scale-[0.98] border border-sky-100 rounded-3xl p-3.5 flex flex-col justify-between min-h-[142px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white text-[#0284c7] flex items-center justify-center mb-2 shadow-2xs">
                <FileText size={20} />
              </div>
              <h4 className="text-[13px] font-bold text-[#0b1a30] leading-tight mb-1">
                Analiza tus pruebas médicas
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Sube tus informes, radiografías y analíticas. La IA los analiza por ti en segundos.
              </p>
            </div>
            <div className="self-end mt-2 w-7 h-7 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 3. Organiza tu historial de salud */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-[#f0fdf4] hover:bg-[#e3fcee] active:scale-[0.98] border border-emerald-100 rounded-3xl p-3.5 flex flex-col justify-between min-h-[142px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white text-[#059669] flex items-center justify-center mb-2 shadow-2xs">
                <Folder size={20} />
              </div>
              <h4 className="text-[13px] font-bold text-[#0b1a30] leading-tight mb-1">
                Organiza tu historial de salud
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                Centraliza toda la información médica y ten todo siempre a mano.
              </p>
            </div>
            <div className="self-end mt-2 w-7 h-7 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <ArrowRight size={13} />
            </div>
          </div>

          {/* 4. Últimos Avances Médicos */}
          <div 
            onClick={() => onNavigate('search')}
            className="bg-[#fff7ed] hover:bg-[#ffeedb] active:scale-[0.98] border border-orange-100 rounded-3xl p-3.5 flex flex-col justify-between min-h-[142px] shadow-2xs cursor-pointer transition-all relative group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white text-[#ea580c] flex items-center justify-center mb-2 shadow-2xs">
                <Sparkles size={20} />
              </div>
              <h4 className="text-[13px] font-bold text-[#0b1a30] leading-tight mb-1">
                {t("latest_medical_advances") || "Últimos Avances Médicos"}
              </h4>
              <p className="text-[10px] text-slate-500 leading-tight font-medium">
                {t("latest_medical_advances_desc") || "Busca los últimos avances médicos sobre cualquier enfermedad o tratamiento."}
              </p>
            </div>
            <div className="self-end mt-2 w-7 h-7 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
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
