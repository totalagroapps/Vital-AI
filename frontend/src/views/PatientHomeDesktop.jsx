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
            className="w-full h-full object-cover object-center pointer-events-none select-none" 
          />
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
              <img 
                src="/images/icon_security_shield.png" 
                alt="Seguridad" 
                className="w-full h-full object-contain drop-shadow-xs" 
              />
            </div>
            <div>
              <h3>{tr('hero_security_title', 'Tus datos están protegidos')}</h3>
              <p>{tr('hero_security_desc', 'Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).')}</p>
            </div>
          </div>
        </div>

        {/* Espaciador responsivo central: la portada ya integra el emblema central brillante */}
        <div className="hero-art pointer-events-none select-none" aria-hidden="true" />

        <aside className="hero-features">
          <div className="feature">
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_tech.png" 
                alt="Tecnología que cuida" 
                className="w-full h-full object-contain" 
              />
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
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_people.png" 
                alt="Personas que importan" 
                className="w-full h-full object-contain" 
              />
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
            <div className="feature-icon">
              <img 
                src="/images/icon_pillar_future.png" 
                alt="Un futuro más saludable" 
                className="w-full h-full object-contain" 
              />
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
            <img 
              src="/images/icon_card_ask.png" 
              alt="Pregunta a MIVOR.ai" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{tr('card_ask_title', 'Pregunta a MIVOR.ai')}</h2>
          <p>{tr('card_ask_desc', 'Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica con la ayuda de una IA médica avanzada.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 2: Explica tus pruebas médicas */}
        <button className="service-card blue" onClick={() => onNavigate('documents')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_explain.png" 
              alt="Explica tus pruebas médicas" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2>{tr('card_analyze_title', 'Explica tus pruebas médicas')}</h2>
          <p>{tr('card_analyze_desc', 'Descubre qué dicen tus pruebas. MIVOR.ai traduce y explica términos clínicos y analíticas para facilitarte su comprensión a ti y a tu médico de forma clara y sencilla.')}</p>
          <span className="service-arrow">
            <ArrowRight size={22} className="text-white" strokeWidth={2.6} />
          </span>
        </button>

        {/* Tarjeta 3: Organiza tu historial de salud */}
        <button className="service-card green" onClick={() => onNavigate('history')}>
          <div className="service-icon">
            <img 
              src="/images/icon_card_history.png" 
              alt="Organiza tu historial de salud" 
              className="w-full h-full object-contain" 
            />
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
            <img 
              src="/images/icon_card_advances.png" 
              alt="Últimos avances médicos" 
              className="w-full h-full object-contain" 
            />
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
            <img 
              src="/images/icon_card_doctors.png" 
              alt="Encuentra tu médico" 
              className="w-full h-full object-contain" 
            />
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
                    <h5 className="font-bold text-xs text-slate-900">Orientación Inteligente de Salud</h5>
                    <p className="text-[11px] text-slate-500">Expresa tus síntomas y recibe una guía explicativa clara para comprender lo que sientes y preparar tu consulta médica.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Explicación de Pruebas y Analíticas</h5>
                    <p className="text-[11px] text-slate-500">Sube analíticas, recetas e informes en PDF o foto para traducir y comprender términos clínicos tanto para ti como para tu médico.</p>
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
