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

const PatientHomeDesktop = ({ onNavigate, onLogout, userProfile, username }) => {
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
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <main className="mivor-page">
      {/* 1. HEADER */}
      <header className="mivor-header">
        <button className="mivor-logo-button" onClick={() => onNavigate("home")}>
          <img 
            src="/assets/mivor-logo.png" 
            alt="MIVOR.ai - Better Health. Brighter Lives." 
            className="mivor-logo" 
            onError={(e) => { e.target.src = '/images/mivor-logo.png'; }}
          />
        </button>

        <nav className="mivor-nav">
          <button className="active" onClick={() => onNavigate("home")}>
            {t('patient_nav_home') || 'Inicio'}
          </button>
          <button onClick={() => setShowAboutModal(true)}>
            {t('patient_nav_about') || 'Sobre MIVOR.ai'}
          </button>
          <button onClick={() => setShowHowModal(true)}>
            {t('patient_nav_how') || 'Cómo funciona'}
          </button>
          <button onClick={() => setShowContactModal(true)}>
            {t('patient_nav_contact') || 'Contacto'}
          </button>
        </nav>

        <div className="mivor-account">
          {/* Selector de Idioma */}
          <div className="relative" ref={langRef}>
            <button 
              className="language" 
              onClick={() => setShowLangDropdown(prev => !prev)}
              type="button"
            >
              <Globe size={16} className="text-[#1268ef]" />
              <span className="uppercase">{language}</span>
              <ChevronDown size={14} className={`transition-transform duration-150 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { changeLanguage(lang.code); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${language === lang.code ? 'bg-blue-50 text-[#1268ef] font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <button 
            className="notification" 
            onClick={() => onNavigate('search')} 
            title="Notificaciones"
            type="button"
          >
            <Bell size={20} className="text-[#101b56]" />
            <span />
          </button>

          {/* Avatar y Botón Mi cuenta */}
          <div className="relative" ref={userMenuRef}>
            <div className="flex items-center gap-3">
              <div 
                className="avatar" 
                onClick={() => setShowUserMenu(prev => !prev)}
                title={userProfile?.full_name || username || "Mi cuenta"}
              >
                <img
                  src={userProfile?.photo_url || "/images/mivor_avatar_default.png"}
                  alt="Perfil"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/images/mivor_avatar_default.png'; }}
                />
              </div>
              <button
                className="account-button"
                onClick={() => setShowUserMenu(prev => !prev)}
                type="button"
              >
                {t('patient_nav_my_account') || 'Mi cuenta'} <b>→</b>
              </button>
            </div>

            {/* Dropdown Menu Mi cuenta */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100/60 mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 flex items-center justify-center bg-gradient-to-br from-[#c89169] to-[#20263d] text-white font-bold">
                      <img
                        src={userProfile?.photo_url || "/images/mivor_avatar_default.png"}
                        alt="Perfil"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/images/mivor_avatar_default.png'; }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {userProfile?.full_name || username || "Mi cuenta"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {userProfile?.email || "Paciente"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); onNavigate('history'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#005dff] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <User size={15} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-slate-800 group-hover:text-[#005dff]">{t('patient_menu_history_title') || 'Mi historial de salud'}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_history_desc') || 'Ficha médica y antecedentes'}</span>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); onNavigate('documents'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText size={15} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-slate-800 group-hover:text-[#005dff]">{t('patient_menu_docs_title') || 'Mis analíticas e informes'}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_docs_desc') || 'Estudios y pruebas médicas'}</span>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); onNavigate('citas'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar size={15} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-slate-800 group-hover:text-[#005dff]">{tr('my_appointments', 'Mis Citas Médicas')}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">{tr('view_manage_appointments', 'Próximas consultas y reservas')}</span>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); setShowSecurityModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ShieldCheck size={15} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-slate-800 group-hover:text-[#005dff]">{t('patient_data_protected') || 'Seguridad y privacidad'}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_meds_desc') || 'Cifrado y protección de datos'}</span>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); setShowContactModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005dff] transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageCircle size={15} />
                    </div>
                    <div className="flex-1">
                      <span className="block text-slate-800 group-hover:text-[#005dff]">{t('patient_contact_support') || 'Contacto y soporte'}</span>
                      <span className="block text-[10px] text-slate-400 font-normal">Atención 24/7</span>
                    </div>
                  </button>
                </div>

                <div className="pt-2 mt-1.5 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => { setShowUserMenu(false); if (onLogout) onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                      <LogOut size={15} />
                    </div>
                    <span>{t('patient_menu_logout_title') || 'Cerrar sesión'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="mivor-hero">
        {/* Soft celestial flowing silk wave & ambient glow spanning across the hero */}
        <div className="hero-wave-bg pointer-events-none select-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 520" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <radialGradient id="emblemGlow" cx="54%" cy="48%" r="46%">
                <stop offset="0%" stopColor="#00c2ff" stopOpacity="0.65" />
                <stop offset="30%" stopColor="#38bdf8" stopOpacity="0.48" />
                <stop offset="60%" stopColor="#7dd3fc" stopOpacity="0.25" />
                <stop offset="85%" stopColor="#bae6fd" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="leftGlow" cx="15%" cy="60%" r="40%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#f0f9ff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="silkWave1" x1="100%" y1="10%" x2="0%" y2="80%">
                <stop offset="0%" stopColor="#93daf8" stopOpacity="0.75" />
                <stop offset="30%" stopColor="#70cdfa" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#bae6fd" stopOpacity="0.35" />
                <stop offset="85%" stopColor="#e0f2fe" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="silkWave2" x1="95%" y1="0%" x2="5%" y2="100%">
                <stop offset="0%" stopColor="#c2edff" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#aee4fe" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#dbeafe" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="strokeGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.4" />
                <stop offset="85%" stopColor="#bae6fd" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <filter id="waveBlurLarge" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="38" />
              </filter>
              <filter id="waveBlurSoft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="20" />
              </filter>
            </defs>

            <rect x="0" y="0" width="1440" height="520" fill="url(#leftGlow)" />
            <rect x="0" y="0" width="1440" height="520" fill="url(#emblemGlow)" />

            <path 
              d="M 1440,10 Q 1100,60 880,150 Q 640,240 420,270 Q 200,300 -50,320 L -50,520 L 1440,520 Z" 
              fill="url(#silkWave1)" 
              filter="url(#waveBlurLarge)" 
            />
            
            <path 
              d="M 1440,0 Q 1020,30 840,120 Q 620,210 380,240 Q 150,270 -50,300 L -50,520 L 1440,520 Z" 
              fill="url(#silkWave2)" 
              filter="url(#waveBlurLarge)" 
            />

            <path 
              d="M 1440,35 C 1150,95 950,165 750,205 C 550,245 320,285 -50,315" 
              stroke="url(#strokeGrad)" 
              strokeWidth="48" 
              fill="none" 
              filter="url(#waveBlurSoft)" 
            />
          </svg>
        </div>

        <div className="hero-copy">
          <h1>
            {tr('hero_title_p1', 'Tu salud,').trim().replace(/\s+,/g, ',')}<br />
            {tr('hero_title_p2', 'en manos de la')}<br />
            <strong>
              {tr('hero_title_p3', 'IA más avanzada')}<br />
              {tr('hero_title_p4', 'en medicina.')}
            </strong>
          </h1>
          <div className="protection-card" onClick={() => setShowSecurityModal(true)}>
            <div className="shield">
              <ShieldCheck size={26} className="text-[#0062ff]" strokeWidth={2.4} />
            </div>
            <div>
              <h3>{tr('hero_security_title', 'Tus datos están protegidos')}</h3>
              <p>{tr('hero_security_desc', 'Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).')}</p>
            </div>
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-glow" />
          <img 
            src="/assets/mivor-emblem.png" 
            alt="MIVOR.ai" 
            className="hero-emblem" 
            onError={(e) => { e.target.src = '/images/mivor-emblem.png'; }}
          />
        </div>

        <aside className="hero-features">
          <div className="feature">
            <div className="feature-icon blue">
              <svg viewBox="0 0 36 36" fill="none" stroke="#0062ff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="11.5" r="4" />
                <path d="M10 26.5c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" />
                <circle cx="9.5" cy="13.5" r="3" />
                <path d="M4 26.5c0-3.2 2.4-5.5 5.5-5.8" />
                <circle cx="26.5" cy="13.5" r="3" />
                <path d="M26.5 20.7c3.1.3 5.5 2.6 5.5 5.8" />
              </svg>
            </div>
            <div>
              <h3>
                {tr('pillar_tech_line1', 'TECNOLOGÍA')}
                <br />
                {tr('pillar_tech_line2', 'QUE CUIDA')}
              </h3>
              <p>
                {tr('pillar_tech_desc_line1', 'Inteligencia artificial')}
                <br />
                {tr('pillar_tech_desc_line2', 'al servicio de tu salud.')}
              </p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon green">
              <svg viewBox="0 0 36 36" fill="none" stroke="#00b894" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 19.5c-3.2-3.3-7-5.5-7-9.5 0-2.8 2.2-5 5-5 1.8 0 3.3.9 4 2.2.7-1.3 2.2-2.2 4-2.2 2.8 0 5 2.2 5 5 0 4-3.8 6.2-7 9.5l-2 2-2-2z" />
                <path d="M7 26.5c0-2.8 2.5-4.5 5.5-4.5h11c3 0 5.5 1.7 5.5 4.5" />
              </svg>
            </div>
            <div>
              <h3>
                {tr('pillar_people_line1', 'PERSONAS')}
                <br />
                {tr('pillar_people_line2', 'QUE IMPORTAN')}
              </h3>
              <p>
                {tr('pillar_people_desc_line1', 'Una atención más humana,')}
                <br />
                {tr('pillar_people_desc_line2', 'cercana y personalizada.')}
              </p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon purple">
              <svg viewBox="0 0 36 36" fill="none" stroke="#6400ff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="28" x2="30" y2="28" />
                <rect x="8" y="21" width="4.5" height="7" rx="1" />
                <rect x="15.5" y="16" width="4.5" height="12" rx="1" />
                <rect x="23" y="11" width="4.5" height="17" rx="1" />
                <path d="M7 17l6-5 6 3 9-7" />
                <polyline points="23 8 28 8 28 13" />
              </svg>
            </div>
            <div>
              <h3>
                {tr('pillar_future_line1', 'UN FUTURO')}
                <br />
                {tr('pillar_future_line2', 'MÁS SALUDABLE')}
              </h3>
              <p>
                {tr('pillar_future_desc_line1', 'Innovación hoy,')}
                <br />
                {tr('pillar_future_desc_line2', 'para una vida mejor mañana.')}
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
            <Brain size={28} className="text-[#6b20e9]" strokeWidth={2.2} />
          </div>
          <h2>{tr('card_ask_title', 'Pregunta a MIVOR.ai')}</h2>
          <p>{tr('card_ask_desc', 'Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica con la ayuda de una IA médica avanzada.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 2: Analiza tus pruebas médicas */}
        <button className="service-card blue" onClick={() => onNavigate('documents')}>
          <div className="service-icon">
            <FileText size={28} className="text-[#1268ef]" strokeWidth={2.2} />
          </div>
          <h2>{tr('card_analyze_title', 'Analiza tus pruebas médicas')}</h2>
          <p>{tr('card_analyze_desc', 'Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 3: Organiza tu historial de salud */}
        <button className="service-card green" onClick={() => onNavigate('history')}>
          <div className="service-icon">
            <Folder size={28} className="text-[#0bb89e]" strokeWidth={2.2} />
          </div>
          <h2>{tr('card_history_title', 'Organiza tu historial de salud')}</h2>
          <p>{tr('card_history_desc', 'Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 4: Últimos avances médicos */}
        <button className="service-card orange" onClick={() => onNavigate('search')}>
          <div className="service-icon">
            <Lightbulb size={28} className="text-[#ff6414]" strokeWidth={2.2} />
          </div>
          <h2>{tr('card_advances_title', 'Últimos avances médicos')}</h2>
          <p>{tr('card_advances_desc', 'Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 5: Encuentra tu médico */}
        <button className="service-card violet" onClick={() => onNavigate('doctors')}>
          <div className="service-icon">
            <Stethoscope size={28} className="text-[#6b20e9]" strokeWidth={2.2} />
          </div>
          <h2>{tr('card_doctors_title', 'Encuentra tu médico')}</h2>
          <p>{tr('card_doctors_desc', 'Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.')}</p>
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
                <strong>MIVOR.ai</strong> es una plataforma de salud impulsada por inteligencia artificial clínica de última generación, diseñada para acompañar tanto a pacientes como a médicos en la toma de decisiones informadas.
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">Privacidad y cifrado de grado médico conforme a normativas GDPR e ISO 27001.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Heart size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700">Enfoque centrado en humanizar la medicina y optimizar tiempos de respuesta.</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 italic">
                Nota: MIVOR.ai es una herramienta de orientación y soporte clínico. No sustituye el diagnóstico ni la prescripción directa de un médico colegiado.
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
                    <h5 className="font-bold text-xs text-slate-900">Consulta y Triaje Inteligente</h5>
                    <p className="text-[11px] text-slate-500">Expresa tus síntomas y recibe una evaluación guiada de prioridad y recomendaciones clínicas iniciales.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Interpretación de Pruebas</h5>
                    <p className="text-[11px] text-slate-500">Sube analíticas, recetas e informes en PDF o foto para comprender los valores y términos clínicos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Historial y Directorio Médico</h5>
                    <p className="text-[11px] text-slate-500">Todo tu historial consolidado y conexión directa con especialistas médicos verificados.</p>
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
              <p>Estamos disponibles las 24 horas para resolver cualquier duda médica o técnica sobre el uso de la plataforma.</p>
              
              <div className="space-y-2.5 pt-1">
                <a 
                  href="https://wa.me/34600000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 transition-colors"
                >
                  <MessageCircle size={18} className="text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Chat de WhatsApp 24/7</p>
                    <p className="text-slate-500">Atención inmediata a pacientes</p>
                  </div>
                </a>

                <a 
                  href="mailto:soporte@mivor.ai" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-900 transition-colors"
                >
                  <Mail size={18} className="text-[#005dff] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">soporte@mivor.ai</p>
                    <p className="text-slate-500">Consultas técnicas e institucionales</p>
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
                  <p className="text-[11px] text-slate-500 font-medium">Seguridad de grado hospitalario y privacidad clínica</p>
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
                En <strong>MIVOR.ai</strong>, la confidencialidad y protección de tu información de salud es nuestra máxima prioridad:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Lock size={18} className="text-[#005dff] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Cifrado de extremo a extremo</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Todos los datos, análisis clínicos e imágenes médicas se transmiten y almacenan bajo cifrado militar AES-256.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Cumplimiento ISO 27001 & RGPD</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Auditorías continuas de seguridad de la información conforme a estándares internacionales y normativa europea de protección de datos.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Privacidad absoluta de tus consultas</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tus informes y consultas médicas jamás son compartidos ni utilizados para entrenar modelos públicos de inteligencia artificial.
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
