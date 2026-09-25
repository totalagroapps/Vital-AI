import React, { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Campana de avisos del paciente. Todavía no hay un servicio de notificaciones, así que muestra un
// estado vacío honesto (sin punto rojo) y el acceso directo a las citas, que es lo que el paciente busca.
export default function NotificationsBell({ onNavigate, className = '' }) {
  const { t } = useLanguage();
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
        className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
      >
        <Bell size={18} className="stroke-[2.2]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95">
          <p className="text-xs font-black text-mivor-navy">{t('patienttopnav_notificaciones_y_avisos_de_salud')}</p>
          <div className="flex flex-col items-center text-center py-5">
            <span className="w-10 h-10 rounded-full bg-mivor-blueSoft text-brand flex items-center justify-center mb-2">
              <Bell size={18} />
            </span>
            <p className="text-sm font-bold text-slate-700">{t('notifications_empty')}</p>
          </div>
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
