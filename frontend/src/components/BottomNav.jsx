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

  // ================= BARRA DE NAVEGACIÓN PACIENTE (5 PESTAÑAS DEL DISEÑO MIVOR.ai) =================
  const isTreatmentsActive = activeTab === 'treatments' || activeTab === 'agenda';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 pb-3.5 z-50 select-none lg:hidden">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center text-center">
        
        {/* 1. Inicio */}
        <button 
          type="button"
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none"
        >
          <Home 
            size={23} 
            className={activeTab === 'home' ? 'text-[#2563eb] fill-[#2563eb]' : 'text-slate-400'} 
          />
          <span className={`text-[11px] ${activeTab === 'home' ? 'font-bold text-[#2563eb]' : 'font-semibold text-slate-500'}`}>
            Inicio
          </span>
        </button>

        {/* 2. Historial */}
        <button 
          type="button"
          onClick={() => onTabChange('history')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none"
        >
          <Clock 
            size={23} 
            className={activeTab === 'history' ? 'text-[#2563eb] stroke-[2.5]' : 'text-slate-400'} 
          />
          <span className={`text-[11px] ${activeTab === 'history' ? 'font-bold text-[#2563eb]' : 'font-semibold text-slate-500'}`}>
            Historial
          </span>
        </button>

        {/* 3. Tratamientos */}
        <button 
          type="button"
          onClick={() => onTabChange('treatments')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none"
        >
          <Pill 
            size={23} 
            className={isTreatmentsActive ? 'text-[#2563eb] stroke-[2.5]' : 'text-slate-400'} 
          />
          <span className={`text-[11px] ${isTreatmentsActive ? 'font-bold text-[#2563eb]' : 'font-semibold text-slate-500'}`}>
            Tratamientos
          </span>
        </button>

        {/* 4. Médicos */}
        <button 
          type="button"
          onClick={() => onTabChange('doctors')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none"
        >
          <Users 
            size={23} 
            className={activeTab === 'doctors' ? 'text-[#2563eb] stroke-[2.5]' : 'text-slate-400'} 
          />
          <span className={`text-[11px] ${activeTab === 'doctors' ? 'font-bold text-[#2563eb]' : 'font-semibold text-slate-500'}`}>
            Médicos
          </span>
        </button>

        {/* 5. Más */}
        <button 
          type="button"
          onClick={() => onTabChange('more')}
          className="flex flex-col items-center justify-center gap-1 py-1 transition-colors active:scale-95 focus:outline-none"
        >
          <MoreHorizontal 
            size={23} 
            className={activeTab === 'more' ? 'text-[#2563eb] stroke-[2.5]' : 'text-slate-400'} 
          />
          <span className={`text-[11px] ${activeTab === 'more' ? 'font-bold text-[#2563eb]' : 'font-semibold text-slate-500'}`}>
            Más
          </span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;