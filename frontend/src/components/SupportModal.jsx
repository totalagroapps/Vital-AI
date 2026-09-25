import React, { useEffect } from 'react';
import { X, MessageCircle, Mail, LifeBuoy, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { emergencyNumber } from '../utils/locale';

// Número de WhatsApp de soporte (solo dígitos, con prefijo internacional). Si no está configurado,
// no se muestra la opción: mejor ocultarla que enviar al paciente a un número que no existe.
const SUPPORT_WHATSAPP = (import.meta.env.VITE_SUPPORT_WHATSAPP || '').replace(/\D/g, '');
const SUPPORT_EMAIL = 'soporte@mivor.ai';

// Modal único de ayuda y soporte del paciente (barra superior, menú móvil y chat)
export default function SupportModal({ isOpen, onClose }) {
  const { t, country } = useLanguage();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mivor-blueSoft text-brand flex items-center justify-center">
              <LifeBuoy size={20} />
            </div>
            <h3 id="support-modal-title" className="font-extrabold text-lg text-mivor-navy">{t('patient_contact_support')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('patient_close')}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-2.5 text-sm text-slate-600">
          <p className="font-semibold text-slate-700">{t('support_intro')}</p>

          {SUPPORT_WHATSAPP && (
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors"
            >
              <MessageCircle size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-mivor-navy">{t('patienthome_whatsapp_24_7')}</p>
                <p className="text-xs text-slate-500">{t('documentanalyzer_respuesta_inmediata')}</p>
              </div>
            </a>
          )}

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 p-3 rounded-2xl border border-mivor-border bg-mivor-blueSoft/60 hover:bg-mivor-blueSoft transition-colors"
          >
            <Mail size={20} className="text-brand shrink-0" />
            <div>
              <p className="text-sm font-bold text-mivor-navy">{SUPPORT_EMAIL}</p>
              <p className="text-xs text-slate-500">{t('patienthome_consultas_medicas_y_tecnicas')}</p>
            </div>
          </a>

          <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{t('support_emergency_notice', { number: emergencyNumber(country) })}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-full transition-colors cursor-pointer"
        >
          {t('patient_close')}
        </button>
      </div>
    </div>
  );
}
