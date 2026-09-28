import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronRight, Pill } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFamilyProfile } from '../contexts/FamilyProfileContext';

const formatLate = (minutes) => {
  if (minutes < 60) return `hace ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `hace ${h} h ${m} min` : `hace ${h} h`;
};

// Campana de avisos del paciente. Muestra las tomas de medicación olvidadas por los familiares que
// administra (Modo Cuidador) y el acceso directo a las citas.
export default function NotificationsBell({ onNavigate, className = '' }) {
  const { t } = useLanguage();
  const { medicationAlerts = [], openFamilyMedications } = useFamilyProfile();
  const alertCount = medicationAlerts.length;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        title={t('patienttopnav_notificaciones_y_avisos_de_salud')}
        aria-label={t('patienttopnav_notificaciones_y_avisos_de_salud')}
        className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
      >
        <Bell size={18} className="stroke-[2.2]" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-4 text-center">
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95">
          <p className="text-xs font-black text-mivor-navy">{t('patienttopnav_notificaciones_y_avisos_de_salud')}</p>
          {alertCount > 0 ? (
            <ul className="my-3 space-y-2 max-h-72 overflow-y-auto">
              {medicationAlerts.map((alert) => (
                <li key={`${alert.patient_id}-${alert.medication_id}`}>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); openFamilyMedications?.(alert); }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-left transition-colors cursor-pointer"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <Pill size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black text-slate-800">
                        {(alert.patient_name || '').split(' ')[0].split('@')[0]} ({alert.relationship}) no ha tomado {alert.medication_name}
                        {alert.dosage ? ` ${alert.dosage}` : ''}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                        Programado a las {alert.scheduled_time} · {formatLate(alert.minutes_late)}
                      </span>
                      <span className="block text-[11px] text-red-600 font-bold mt-1">Ver sus tratamientos →</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center text-center py-5">
              <span className="w-10 h-10 rounded-full bg-mivor-blueSoft text-brand flex items-center justify-center mb-2">
                <Bell size={18} />
              </span>
              <p className="text-sm font-bold text-slate-700">{t('notifications_empty')}</p>
            </div>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => { setOpen(false); onNavigate('citas'); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-mivor-blueSoft text-xs font-bold text-slate-700 hover:text-brand transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2"><CalendarDays size={15} /> {t('patienttopnav_mis_consultas_y_citas')}</span>
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
