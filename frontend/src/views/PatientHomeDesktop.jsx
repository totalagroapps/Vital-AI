import React, { useState, useEffect } from 'react';
import './MivorPacienteHome.css';
import {
  ShieldCheck,
  ArrowRight,
  X,
  CheckCircle2,
  Lock,
  Brain,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PatientTopNav from '../components/PatientTopNav';

const PatientHomeDesktop = ({ onNavigate, onLogout, userProfile, username, onOpenGames, onOpenPreventiveCalendar }) => {
  const { t } = useLanguage();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Escape cierra el modal de seguridad y bloquea el scroll mientras está abierto
  useEffect(() => {
    if (!showSecurityModal) return undefined;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowSecurityModal(false); };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSecurityModal]);

  // Accesos rápidos bajo la tarjeta de seguridad: mismo formato para todos
  const shortcuts = [
    { id: 'games', onClick: onOpenGames, icon: Brain, title: t('patienthome_mente_activa'), subtitle: t('patienthomedesktop_memoria_calculo'), hint: t('patienthomedesktop_juegos_diarios_de_estimulacion_cognitiva'), tone: 'bg-violet-100 text-violet-700' },
    { id: 'prevention', onClick: onOpenPreventiveCalendar, icon: Calendar, title: t('brand_mivor_prevention'), subtitle: t('patienthomedesktop_cribados'), hint: t('patienthomedesktop_calendario_preventivo_y_vigilancia_diges'), tone: 'bg-sky-100 text-sky-700' },
  ];

  return (
    <main className="mivor-page">
      {/* 1. TOP NAVBAR SUPERIOR UNIFICADO */}
      <PatientTopNav
        activeTab="home"
        onNavigate={onNavigate}
        userProfile={userProfile}
        username={username}
        onLogout={onLogout}
      />

      {/* 2. HERO SECTION */}
      <section className="mivor-hero">
        {/* Portada Oficial MIVOR.ai (Hero Art con ondas celestiales y emblema central) */}
        <div className="hero-wave-bg pointer-events-none select-none overflow-hidden flex items-center justify-center">
          <img 
            src="/images/mivor_cover_hero.png" 
            alt={t('patienthomedesktop_mivor_ai_cover')} 
            className="w-full h-full object-contain object-[54%_center] pointer-events-none select-none" 
          />
        </div>

        <div className="hero-copy">
          <h1>
            {t('hero_title_p1')}<br />
            {t('patienthome_con_el_apoyo_de_la')}<br />
            <strong>
              {t('patienthome_ia_line1') || t('artificial_intelligence')}<br />
              {t('patienthome_ia_line2') || t('patienthome_mas_avanzada')}
            </strong>
          </h1>
          <p className="hero-subtitle">
            {t('patienthomedesktop_mas_informacion_mas_claridad_una')}
          </p>
          <div className="protection-card" onClick={() => setShowSecurityModal(true)}>
            <div className="shield">
              <img 
                src="/images/icon_security_shield.png" 
                alt={t('tab_security')} 
                className="w-full h-full object-contain drop-shadow-xs" 
              />
            </div>
            <div>
              <h3>{t('patient_data_protected')}</h3>
              <p>{t('hero_security_desc')}</p>
            </div>
          </div>

          {/* Accesos rápidos: misma anchura que la tarjeta de seguridad, mismo radio y tipografía */}
          <div className="grid grid-cols-2 gap-3 mt-3 w-full max-w-[660px]">
            {shortcuts.map(({ id, onClick, icon: Icon, title, subtitle, hint, tone }) => (
              <button
                key={id}
                type="button"
                onClick={onClick}
                title={hint}
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#b9d5fb] rounded-2xl shadow-xs transition-all active:scale-[0.98] cursor-pointer text-left group"
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-[#050838] leading-tight truncate">{title}</span>
                  <span className="block text-xs text-slate-500 font-semibold truncate">{subtitle}</span>
                </span>
                <ChevronRight size={16} className="text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Espaciador responsivo central: la portada ya integra el emblema central brillante */}
        <div className="hero-art pointer-events-none select-none" aria-hidden="true" />

        <aside className="hero-features">
          <div className="feature">
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_tech.png" 
                alt={t('patienthomedesktop_tecnologia_que_cuida')} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3>
                {t('pillar_tech_line1')}
                <br />
                {t('pillar_tech_line2')}
              </h3>
              <p>
                {t('pillar_tech_desc_line1')}
                <br />
                {t('pillar_tech_desc_line2')}
              </p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_people.png" 
                alt={t('patienthomedesktop_para_ti_y_para_quienes')} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3>
                {t('patienthomedesktop_para_ti_y_para')}
                <br />
                {t('patienthomedesktop_quienes_mas_quieres')}
              </h3>
              <p>
                {t('pillar_people_desc_line1')}
                <br />
                {t('pillar_people_desc_line2')}
              </p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_future.png" 
                alt={t('patienthomedesktop_un_futuro_mas_saludable')} 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3>
                {t('pillar_future_line1')}
                <br />
                {t('pillar_future_line2')}
              </h3>
              <p>
                {t('pillar_future_desc_line1')}
                <br />
                {t('pillar_future_desc_line2')}
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* 3. CINCO SERVICIOS INFERIORES */}
      <section className="service-grid">
        {/* Tarjeta 1: Pregunta a MIVOR.ai */}
        <button className="service-card violet" onClick={() => onNavigate('general_chat')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_ask.png" 
              alt={t('ask_vitalai')} 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{t('ask_vitalai')}</h2>
          <p>{t('patienthomedesktop_resuelve_tus_dudas_sobre_salud')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 2: Entiende tus pruebas médicas */}
        <button className="service-card blue" onClick={() => onNavigate('documents')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_explain.png" 
              alt={t('patienthome_entiende_tus_pruebas_medicas')} 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{t('patienthome_entiende_tus_pruebas_medicas')}</h2>
          <p>{t('patienthomedesktop_comprende_la_informacion_de_tus')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 3: Organiza tu historial de salud */}
        <button className="service-card green" onClick={() => onNavigate('history')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_history.png" 
              alt={t('organize_your_health_history')} 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{t('organize_your_health_history')}</h2>
          <p>{t('patienthomedesktop_toda_tu_informacion_medica_en')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 4: Descubre avances médicos */}
        <button className="service-card orange" onClick={() => onNavigate('search')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_advances.png" 
              alt={t('patienthome_descubre_avances_medicos')} 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{t('patienthome_descubre_avances_medicos')}</h2>
          <p>{t('patienthomedesktop_accede_a_informacion_actualizada_sob')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 5: Encuentra tu médico */}
        <button className="service-card violet" onClick={() => onNavigate('doctors')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_doctors.png" 
              alt={t('patient_card5_title')} 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{t('patient_card5_title')}</h2>
          <p>{t('patienthomedesktop_busca_un_profesional_sanitario_por')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>
      </section>

      {/* MODAL: PROTECCIÓN DE DATOS Y PRIVACIDAD */}
      {showSecurityModal && (
        <div 
          onClick={() => setShowSecurityModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#005dff] flex items-center justify-center">
                  <ShieldCheck size={24} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{t('patient_data_protected') || 'Tus datos están protegidos'}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{t('patienthomedesktop_seguridad_de_grado_hospitalario_y')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                {t('patienthome_en')} <strong>MIVOR.ai</strong>{t('patienthome_la_confidencialidad_y_proteccion_de')}
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Lock size={18} className="text-[#005dff] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{t('patienthome_cifrado_de_extremo_a_extremo')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('patienthomedesktop_todos_los_datos_analisis_clinicos')}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{t('patienthome_cumplimiento_iso_27001_rgpd')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('patienthomedesktop_auditorias_continuas_de_seguridad_de')}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{t('patienthomedesktop_privacidad_absoluta_de_tus_consultas')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('patienthomedesktop_tus_informes_y_consultas_medicas')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="bg-[#005dff] hover:bg-[#0052e0] text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                {t('patient_understood') || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PatientHomeDesktop;
