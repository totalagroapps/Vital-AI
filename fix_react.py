import os
import re

files = [
    'frontend/src/components/BottomNav.jsx',
    'frontend/src/views/PatientHome.jsx',
    'frontend/src/views/TriageWizard.jsx',
    'frontend/src/views/DocumentAnalyzer.jsx'
]

# We need to recreate BottomNav because it's completely destroyed by PS interpolation
bottom_nav = '''import React from 'react';
import { Home, Users, Calendar, MoreHorizontal, Sparkles } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-6 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        
        <button 
          onClick={() => onTabChange('home')}
          className={lex flex-col items-center gap-1 }
        >
          <Home size={24} className={activeTab === 'home' ? 'fill-brand-purple/20' : ''} />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange('patients')}
          className={lex flex-col items-center gap-1 }
        >
          <Users size={24} className={activeTab === 'patients' ? 'fill-brand-purple/20' : ''} />
          <span className="text-[10px] font-medium">Pacientes</span>
        </button>

        {/* Center Magic Button */}
        <div className="relative -top-6 flex justify-center w-16">
          <button 
            onClick={() => onTabChange('ai')}
            className="absolute bg-gradient-to-tr from-brand-purple to-brand-purpleLight text-white rounded-full p-4 shadow-glow flex items-center justify-center transform transition active:scale-95"
          >
            <Sparkles size={28} className="fill-white/20" />
          </button>
        </div>

        <button 
          onClick={() => onTabChange('agenda')}
          className={lex flex-col items-center gap-1 }
        >
          <Calendar size={24} className={activeTab === 'agenda' ? 'fill-brand-purple/20' : ''} />
          <span className="text-[10px] font-medium">Agenda</span>
        </button>

        <button 
          onClick={() => onTabChange('more')}
          className={lex flex-col items-center gap-1 }
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium">Más</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
'''
with open('frontend/src/components/BottomNav.jsx', 'w', encoding='utf-8') as f:
    f.write(bottom_nav)

# PatientHome doesn't have any JS interpolation that got swallowed? Let's check:
# wait, PatientHome doesn't use ` in classNames? No, I wrote it with normal quotes except maybe? Let's check TriageWizard.
