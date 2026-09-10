import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function Step5Success({ formData, onFinish }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleGoToDoctorMenu = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center max-w-4xl mx-auto w-full">
      {/* Ícono de Éxito Animado */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-emerald-100/80 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
            <Check size={32} strokeWidth={3} />
          </div>
        </div>
        
        {/* Destellos/puntos de adorno */}
        <span className="absolute -top-1 left-3 w-1.5 h-1.5 bg-emerald-300 rounded-full"></span>
        <span className="absolute top-2 right-1 w-2 h-2 bg-purple-300 rounded-full"></span>
        <span className="absolute bottom-2 left-0 w-2 h-2 bg-blue-300 rounded-full"></span>
        <span className="absolute -bottom-1 right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
      </div>

      {/* Título Principal */}
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
        {t('account_created_success', '¡Cuenta creada con éxito!')}
      </h1>
      <p className="text-sm text-slate-500 mt-2 font-medium">
        {t('account_received_desc', 'Hemos recibido tu información correctamente.')}
      </p>

      {/* Contenedor de las 3 Cards Informativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10 text-left">
        {/* Card 1: Verificación profesional */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-start gap-4">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Clock size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">
              {t('verification_in_progress', 'Verificación profesional en proceso')}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t('verification_time_desc', 'Nuestro equipo revisará tus documentos en un plazo de 24 a 48 horas hábiles.')}
            </p>
          </div>
        </div>

        {/* Card 2: Te notificaremos por email */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-start gap-4">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Mail size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">
              {t('notify_email', 'Te notificaremos por email')}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t('notify_email_desc', 'Te enviaremos un correo cuando tu cuenta sea verificada y puedas acceder a la plataforma.')}
            </p>
          </div>
        </div>

        {/* Card 3: Tu información está segura */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-start gap-4">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">
              {t('safe_confidential', 'Tu información está segura')}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t('safe_confidential_desc', 'Protegemos tus datos personales y profesionales bajo los más altos estándares de seguridad y privacidad.')}
            </p>
          </div>
        </div>
      </div>

      {/* Botón Principal */}
      <div className="mt-10">
        <button
          onClick={handleGoToDoctorMenu}
          className="inline-flex items-center justify-center gap-2 px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <span>{t('enter_doctor_portal', 'Ingresar al portal médico')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}