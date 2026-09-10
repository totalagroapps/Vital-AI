import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function StepperHeader({ currentStep }) {
  const { t } = useLanguage();

  const STEPS = [
    { id: 1, label: t('step_personal_data', 'Datos personales') },
    { id: 2, label: t('step_professional_info', 'Información profesional') },
    { id: 3, label: t('step_verification', 'Verificación') },
    { id: 4, label: t('step_optional_profile', 'Perfil Opcional') },
    { id: 5, label: t('step_finish', 'Finalizar') }
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative max-w-xl mx-auto px-2">
        {/* Linea de fondo general */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        
        {/* Linea de progreso activa */}
        <div 
          className="absolute top-4 left-6 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 88}%` }}
        />

        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : isActive 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/30' 
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.id}
              </div>
              
              <span 
                className={`text-[11px] md:text-xs font-medium transition-colors text-center ${
                  isActive 
                    ? 'text-blue-600 font-bold' 
                    : isCompleted 
                    ? 'text-slate-700 font-semibold' 
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}