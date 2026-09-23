import React, { useState, useEffect, useRef } from 'react';
import './MivorPacienteHome.css';
import { 
  ShieldCheck, 
  ArrowRight, 
  Bell, 
  X, 
  MessageCircle, 
  Mail, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  User, 
  FileText, 
  Heart,
  Sparkles,
  Brain,
  Folder,
  Lightbulb,
  Users,
  TrendingUp,
  Stethoscope,
  Globe,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PatientTopNav from '../components/PatientTopNav';

const PatientHomeDesktop = ({ onNavigate, onLogout, userProfile, username, apiUrl, authHeaders, onOpenCalculators, onOpenGames, onOpenPreventiveCalendar, onOpenConsensus, onOpenScribe }) => {
  const { language, changeLanguage, t } = useLanguage();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHowModal, setShowHowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const tr = (key, fallback) => {
    const val = t(key);
    return (val && val !== key) ? val : fallback;
  };

  const langRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAboutModal(false);
        setShowHowModal(false);
        setShowContactModal(false);
        setShowSecurityModal(false);
        setShowUserMenu(false);
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const isModalOpen = showAboutModal || showHowModal || showContactModal || showSecurityModal;
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAboutModal, showHowModal, showContactModal, showSecurityModal]);

  const languages = [
    { code: 'es', label: t('step1personal_espanol') },
    { code: 'en', label: t('patienthomedesktop_english') },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
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
            alt="MIVOR.ai Cover" 
            className="w-full h-full object-contain object-[54%_center] pointer-events-none select-none" 
          />
        </div>

        <div className="hero-copy">
          <h1>
            {t('hero_title_p1')}<br />
            {t('patienthome_con_el_apoyo_de_la')}<br />
            <strong>
              {t('artificial_intelligence')}<br />
              {t('patienthome_mas_avanzada')}
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

          {/* Tarjetas de Acceso Directo: Calculadoras Clínicas y Mente Activa */}
          <div className="flex items-center gap-3 mt-3 w-full max-w-md">
            <button
              type="button"
              onClick={onOpenCalculators}
              className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 hover:bg-teal-50/90 border border-teal-200/80 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer group text-left"
              title="Calculadoras de riesgo cardiovascular SCORE2, brecha de colesterol LDL y función renal"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-100/90 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Heart size={16} className="text-teal-700 stroke-[2.4]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Calculadoras & Cardio</h4>
                <p className="text-[10px] text-teal-700 font-semibold truncate">SCORE2 • LDL • Renal</p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenGames}
              className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 hover:bg-violet-50/90 border border-violet-200/80 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer group text-left"
              title="Juegos diarios de estimulación cognitiva, memoria y agilidad mental"
            >
              <div className="w-8 h-8 rounded-xl bg-violet-100/90 text-violet-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Brain size={16} className="text-violet-700 stroke-[2.4]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-800 leading-tight">Mente Activa</h4>
                <p className="text-[10px] text-violet-700 font-semibold truncate">Memoria • Cálculo</p>
              </div>
            </button>
          </div>

          {/* Segunda fila: CaPtyVa, Consensus, MedAlly y Modo Cuidador Kiosko */}
          <div className="flex items-center gap-2 mt-2 w-full max-w-lg">
            <button
              type="button"
              onClick={onOpenPreventiveCalendar}
              className="flex-1 px-2.5 py-2 bg-white/90 hover:bg-sky-50 border border-sky-200/80 rounded-xl shadow-2xs transition text-left cursor-pointer flex items-center gap-1.5"
              title="Calendario Preventivo y Vigilancia Digestiva CaPtyVa"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-sky-700" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-800 leading-none">CaPtyVa</div>
                <div className="text-[9px] text-sky-700 font-semibold mt-0.5 truncate">Cribados</div>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenConsensus}
              className="flex-1 px-2.5 py-2 bg-white/90 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl shadow-2xs transition text-left cursor-pointer flex items-center gap-1.5"
              title="Medidor de Consenso de Evidencia Científica en PubMed"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles size={13} className="text-emerald-700" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-800 leading-none">Consensus</div>
                <div className="text-[9px] text-emerald-700 font-semibold mt-0.5 truncate">PubMed</div>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenScribe}
              className="flex-1 px-2.5 py-2 bg-white/90 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl shadow-2xs transition text-left cursor-pointer flex items-center gap-1.5"
              title="MedAlly: Preparador de Consulta Médica (1 Página)"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FileText size={13} className="text-indigo-700" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-800 leading-none">MedAlly</div>
                <div className="text-[9px] text-indigo-700 font-semibold mt-0.5 truncate">Preparar Cita</div>
              </div>
            </button>
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

      {/* MODAL: SOBRE MIVOR.ai */}
      {showAboutModal && (
        <div 
          onClick={() => setShowAboutModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{t('patient_nav_about') || 'Sobre MIVOR.ai'}</h3>
              </div>
              <button 
                onClick={() => setShowAboutModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>MIVOR.ai</strong> {t('patienthomedesktop_es_una_plataforma_de_salud')}
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">{t('patienthomedesktop_privacidad_y_cifrado_de_grado')}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Heart size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">{t('patienthomedesktop_enfoque_centrado_en_humanizar_la')}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">
                {t('patienthomedesktop_nota_mivor_ai_es_una')}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowAboutModal(false)}
                className="bg-[#005dff] hover:bg-[#0052e0] text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                {t('patient_understood') || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CÓMO FUNCIONA */}
      {showHowModal && (
        <div 
          onClick={() => setShowHowModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005dff] flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{t('patient_how_title') || 'Cómo funciona MIVOR.ai'}</h3>
              </div>
              <button 
                onClick={() => setShowHowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm text-slate-600 leading-relaxed">
              <p>
                {t('patient_how_desc') || 'MIVOR.ai integra IA clínica avanzada entrenada con literatura médica validada para ofrecerte orientación y soporte continuo.'}
              </p>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#005dff] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{t('patienthomedesktop_orientacion_inteligente_de_salud')}</h5>
                    <p className="text-[11px] text-slate-500">{t('patienthomedesktop_expresa_tus_sintomas_y_recibe')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{t('patienthomedesktop_explicacion_de_pruebas_y_analiticas')}</h5>
                    <p className="text-[11px] text-slate-500">{t('patienthomedesktop_sube_analiticas_recetas_e_informes')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{t('patienthomedesktop_historial_y_directorio_medico')}</h5>
                    <p className="text-[11px] text-slate-500">{t('patienthomedesktop_todo_tu_historial_consolidado_y')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowHowModal(false)}
                className="bg-[#005dff] hover:bg-[#0052e0] text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                {t('patient_understood') || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTACTO & SOPORTE */}
      {showContactModal && (
        <div 
          onClick={() => setShowContactModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005dff] flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{t('patient_contact_support') || 'Contacto & Soporte'}</h3>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-slate-600">
              <p>{t('patienthomedesktop_estamos_disponibles_las_24_horas')}</p>
              
              <div className="space-y-2.5 pt-1">
                <a 
                  href="https://wa.me/34600000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 transition-colors"
                >
                  <MessageCircle size={18} className="text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">{t('patienthomedesktop_chat_de_whatsapp_24_7')}</p>
                    <p className="text-slate-500">{t('patienthomedesktop_atencion_inmediata_a_pacientes')}</p>
                  </div>
                </a>

                <a 
                  href="mailto:soporte@mivor.ai" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-900 transition-colors"
                >
                  <Mail size={18} className="text-[#005dff] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">soporte@mivor.ai</p>
                    <p className="text-slate-500">{t('patienthomedesktop_consultas_tecnicas_e_institucionales')}</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setShowContactModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                {t('patient_close') || 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
