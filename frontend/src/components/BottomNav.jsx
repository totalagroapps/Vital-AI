import React from 'react';
import { Home, Users, Calendar, MoreHorizontal, Sparkles, Pill } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNav = ({ activeTab, onTabChange, isDoctor }) => {
  const { t } = useLanguage();
  const activeColor = isDoctor ? 'text-brand-blue' : 'text-brand-purple';
  const activeFill = isDoctor ? 'fill-brand-blue/20' : 'fill-brand-purple/20';
  const glowShadow = isDoctor ? 'shadow-blue-500/50' : 'shadow-glow';
  const gradient = isDoctor ? 'from-brand-blue to-blue-500' : 'from-brand-purple to-brand-purpleLight';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-6 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        
        <button 
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? activeColor : 'text-gray-400'}`}
        >
          <Home size={24} className={activeTab === 'home' ? activeFill : ''} />
          <span className="text-[10px] font-medium">{t("home")}</span>
        </button>

        {isDoctor ? (
          <button 
            onClick={() => onTabChange('patients')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'patients' ? activeColor : 'text-gray-400'}`}
          >
            <Users size={24} className={activeTab === 'patients' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("patients")}</span>
          </button>
        ) : (
          <button 
            onClick={() => onTabChange('treatments')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'treatments' ? activeColor : 'text-gray-400'}`}
          >
            <Pill size={24} className={activeTab === 'treatments' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("treatments")}</span>
          </button>
        )}

        <div className="relative -top-6 flex justify-center w-16">
          <button 
            onClick={() => onTabChange(isDoctor ? 'ai' : 'triage')}
            className={`absolute bg-gradient-to-tr ${gradient} text-white rounded-full p-4 shadow-lg ${glowShadow} flex items-center justify-center transform transition active:scale-95`}
          >
            <Sparkles size={28} className="fill-white/20" />
          </button>
        </div>

        {isDoctor ? (
          <button 
            onClick={() => onTabChange('agenda')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'agenda' ? activeColor : 'text-gray-400'}`}
          >
            <Calendar size={24} className={activeTab === 'agenda' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("agenda")}</span>
          </button>
        ) : (
          <button 
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? activeColor : 'text-gray-400'}`}
          >
            <Calendar size={24} className={activeTab === 'history' ? activeFill : ''} />
            <span className="text-[10px] font-medium">{t("history")}</span>
          </button>
        )}

        <button 
          onClick={() => onTabChange('more')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'more' ? activeColor : 'text-gray-400'}`}
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium">{t("more")}</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;