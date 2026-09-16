import React from 'react';
import { Home, Clock, Calendar, Users, MoreHorizontal, Sparkles, Pill } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNav = ({ activeTab, onTabChange, isDoctor }) => {
  const { t } = useLanguage();

  if (isDoctor) {
    const activeColor = 'text-brand-blue';
    const activeFill = 'fill-brand-blue/20';
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-6 z-50 lg:hidden">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          <button 
            type="button"
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? activeColor : 'text-gray-400'}`}
          >
            <Home size={24} className={activeTab === 'home' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("home")}</span>
          </button>
          <button 
            type="button"
            onClick={() => onTabChange('patients')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'patients' ? activeColor : 'text-gray-400'}`}
          >
            <Users size={24} className={activeTab === 'patients' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("patients")}</span>
          </button>
          <div className="relative -top-6 flex justify-center w-16">
            <button 
              type="button"
              onClick={() => onTabChange('ai')}
              className="absolute bg-gradient-to-tr from-brand-blue to-blue-500 text-white rounded-full p-4 shadow-lg shadow-blue-500/50 flex items-center justify-center transform transition active:scale-95"
            >
              <Sparkles size={28} className="fill-white/20" />
            </button>
          </div>
          <button 
            type="button"
            onClick={() => onTabChange('agenda')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'agenda' ? activeColor : 'text-gray-400'}`}
          >
            <Calendar size={24} className={activeTab === 'agenda' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("agenda")}</span>
          </button>
          <button 
            type="button"
            onClick={() => onTabChange('more')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'more' ? activeColor : 'text-gray-400'}`}
          >
            <MoreHorizontal size={24} />
            <span className="text-[10px] font-medium">{t("more")}</span>
          </button>
        </div>
      </div>
    );
  }

  // ================= BARRA DE NAVEGACIÓN PACIENTE (4 PESTAÑAS OFICIALES DEL DISEÑO MÓVIL) =================
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 pb-3 z-50 select-none lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center text-center">
        
        {/* 1. Inicio */}
        <button 
          type="button" 
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        >
          <Home 
            size={22} 
            className={activeTab === 'home' ? 'text-[#0062ff] stroke-[2.4]' : 'text-slate-400'} 
          />
          <span className={`text-[10.5px] ${activeTab === 'home' ? 'font-bold text-[#0062ff]' : 'font-medium text-slate-500'}`}>
            Inicio
          </span>
          <span className={`w-6 h-[2px] rounded-full ${activeTab === 'home' ? 'bg-[#0062ff]' : 'bg-transparent'}`} />
        </button>

        {/* 2. Pregunta a MIVOR */}
        <button 
          type="button" 
          onClick={() => onTabChange('general_chat')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="relative">
            <Sparkles 
              size={21} 
              className={activeTab === 'general_chat' ? 'text-[#0062ff] stroke-[2.4]' : 'text-slate-400'} 
            />
          </div>
          <span className={`text-[10.5px] ${activeTab === 'general_chat' ? 'font-bold text-[#0062ff]' : 'font-medium text-slate-500'}`}>
            Pregunta a MIVOR
          </span>
          <span className={`w-6 h-[2px] rounded-full ${activeTab === 'general_chat' ? 'bg-[#0062ff]' : 'bg-transparent'}`} />
        </button>

        {/* 3. Mi Tratamiento */}
        <button 
          type="button" 
          onClick={() => onTabChange('treatments')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        >
          <Pill 
            size={21} 
            className={activeTab === 'treatments' ? 'text-[#0062ff] stroke-[2.4]' : 'text-slate-400'} 
          />
          <span className={`text-[10.5px] ${activeTab === 'treatments' ? 'font-bold text-[#0062ff]' : 'font-medium text-slate-500'}`}>
            Mi Tratamiento
          </span>
          <span className={`w-6 h-[2px] rounded-full ${activeTab === 'treatments' ? 'bg-[#0062ff]' : 'bg-transparent'}`} />
        </button>

        {/* 4. Mi cuenta */}
        <button 
          type="button" 
          onClick={() => onTabChange('more')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        >
          <Users 
            size={21} 
            className={activeTab === 'more' ? 'text-[#0062ff] stroke-[2.4]' : 'text-slate-400'} 
          />
          <span className={`text-[10.5px] ${activeTab === 'more' ? 'font-bold text-[#0062ff]' : 'font-medium text-slate-500'}`}>
            Mi cuenta
          </span>
          <span className={`w-6 h-[2px] rounded-full ${activeTab === 'more' ? 'bg-[#0062ff]' : 'bg-transparent'}`} />
        </button>

      </div>
    </div>
  );
};

export default BottomNav;