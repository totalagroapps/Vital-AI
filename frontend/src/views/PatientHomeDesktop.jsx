import React, { useState, useEffect } from 'react';
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
  Lightbulb
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientHomeDesktop = ({ onNavigate, onLogout, userProfile, username }) => {
  const { t } = useLanguage();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHowModal, setShowHowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAboutModal(false);
        setShowHowModal(false);
        setShowContactModal(false);
        setShowSecurityModal(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full px-8 lg:px-12 xl:px-16 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        {/* Brand Logo */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => onNavigate('home')}
        >
          <img 
            src="/images/mivor_nav_logo.png" 
            alt="MIVOR.ai - Better Health. Brighter Lives." 
            className="h-9 lg:h-10 w-auto object-contain transition-transform" 
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
        </div>

        {/* Center Nav Links: Inicio, Sobre MIVOR.ai, Cómo funciona, Contacto */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 xl:gap-12">
          {/* Inicio (Texto azul con barrita subrayada activa debajo) */}
          <button 
            onClick={() => onNavigate('home')} 
            className="text-sm font-semibold text-[#1a65eb] transition-colors py-1 cursor-pointer relative flex flex-col items-center"
          >
            <span>{t('patient_nav_home') || 'Inicio'}</span>
            <span className="absolute -bottom-1 w-full h-[2.5px] bg-[#1a65eb] rounded-full" />
          </button>
          
          <button 
            onClick={() => setShowAboutModal(true)} 
            className="text-sm font-medium text-slate-800 hover:text-[#1a65eb] transition-colors py-1 cursor-pointer"
          >
            {t('patient_nav_about') || 'Sobre MIVOR.ai'}
          </button>
          
          <button 
            onClick={() => setShowHowModal(true)} 
            className="text-sm font-medium text-slate-800 hover:text-[#1a65eb] transition-colors py-1 cursor-pointer"
          >
            {t('patient_nav_how') || 'Cómo funciona'}
          </button>

          <button 
            onClick={() => setShowContactModal(true)} 
            className="text-sm font-medium text-slate-800 hover:text-[#1a65eb] transition-colors py-1 cursor-pointer"
          >
            {t('patient_nav_contact') || 'Contacto'}
          </button>
        </nav>

        {/* Right Nav Controls: Idioma ES, Campana, Avatar, Mi cuenta */}
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector variant="pill" />
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => onNavigate('search')} 
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Notificaciones"
            >
              <Bell size={17} className="text-slate-700" />
            </button>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </div>

          {/* User Avatar Circle */}
          <div 
            onClick={() => setShowUserMenu(prev => !prev)}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#1a65eb]/40 transition-all shrink-0"
            title={userProfile?.full_name || username || "Mi cuenta"}
          >
            <img 
              src={userProfile?.photo_url || "/images/mivor_avatar_default.png"} 
              alt="Perfil" 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </div>

          {/* Mi cuenta Button with Arrow & Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="bg-[#1a65eb] hover:bg-[#1554c7] active:scale-95 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#1a65eb]/30"
              title={userProfile?.full_name || username || "Mi cuenta"}
            >
              <span>{t('patient_nav_my_account') || 'Mi cuenta'}</span>
              <ArrowRight size={15} className="stroke-[2.2]" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setShowUserMenu(false)} 
                />

                <div className="absolute right-0 top-full mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Tarjeta de Usuario */}
                  <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100/60 mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0">
                        <img 
                          src={userProfile?.photo_url || "/images/mivor_avatar_default.png"} 
                          alt="Perfil" 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.src = '/logo.png'; }}
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

                  {/* Acciones de Cuenta */}
                  <div className="space-y-0.5">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('history');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1a65eb] transition-colors text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a65eb] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <User size={15} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-slate-800 group-hover:text-[#1a65eb]">{t('patient_menu_history_title') || 'Mi historial de salud'}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_history_desc') || 'Ficha médica y antecedentes'}</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('documents');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1a65eb] transition-colors text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText size={15} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-slate-800 group-hover:text-[#1a65eb]">{t('patient_menu_docs_title') || 'Mis analíticas e informes'}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_docs_desc') || 'Estudios y pruebas médicas'}</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSecurityModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1a65eb] transition-colors text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShieldCheck size={15} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-slate-800 group-hover:text-[#1a65eb]">{t('patient_data_protected') || 'Seguridad y privacidad'}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{t('patient_menu_meds_desc') || 'Cifrado y protección de datos'}</span>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowContactModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1a65eb] transition-colors text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <MessageCircle size={15} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-slate-800 group-hover:text-[#1a65eb]">{t('patient_contact_support') || 'Contacto y soporte'}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Atención 24/7</span>
                      </div>
                    </button>
                  </div>

                  {/* Separador y Botón de Cerrar Sesión */}
                  <div className="pt-2 mt-1.5 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all text-left group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                        <LogOut size={15} />
                      </div>
                      <span>{t('patient_menu_logout_title') || 'Cerrar sesión'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section 
        className="w-full px-8 lg:px-12 xl:px-16 pt-5 pb-5 flex items-center justify-between gap-6 relative"
        style={{
          backgroundImage: 'radial-gradient(ellipse 70% 60% at 55% 45%, rgba(186, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.22) 45%, rgba(240, 249, 255, 0.08) 75%, rgba(255, 255, 255, 0) 100%)'
        }}
      >
        {/* Columna Izquierda: Titular H1 + Tarjeta de Confianza */}
        <div className="w-full lg:w-[36%] xl:w-[35%] flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] 2xl:text-[54px] font-black text-slate-950 leading-[1.06] tracking-tight mb-6">
            {t('hero_title_p1') || 'Tu salud,'}<br />
            {t('hero_title_p2') || 'en manos de la'}<br />
            <span className="text-[#1a65eb]">
              {t('hero_title_p3') || 'IA más avanzada'}<br />
              {t('hero_title_p4') || 'en medicina.'}
            </span>
          </h1>

          {/* Tarjeta de Confianza */}
          <div 
            onClick={() => setShowSecurityModal(true)}
            className="bg-[#ebf4ff] hover:bg-[#e0f0fe] border border-blue-100/90 rounded-2xl p-4 flex items-center gap-3.5 max-w-[450px] shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1a65eb] flex items-center justify-center shrink-0">
              <ShieldCheck size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-[13.5px] font-bold text-slate-900 leading-snug group-hover:text-[#1a65eb] transition-colors">
                {t('hero_security_title') || 'Tus datos están protegidos'}
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                {t('hero_security_desc') || 'Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).'}
              </p>
            </div>
          </div>
        </div>

        {/* Columna Centro: Emblema Circular */}
        <div className="flex-1 flex items-center justify-center relative py-1">
          <img 
            src="/images/mivor_hero_circle_clean.png" 
            alt="MIVOR.ai" 
            className="w-full max-w-[320px] lg:max-w-[370px] xl:max-w-[410px] 2xl:max-w-[440px] h-auto object-contain relative z-10 select-none pointer-events-none drop-shadow-sm" 
          />
        </div>

        {/* Columna Derecha: Los 3 Pilares Horizontales */}
        <div className="flex flex-col justify-center gap-6 xl:gap-7 w-[28%] xl:w-[26%] shrink-0">
          {/* Pilar 1: TECNOLOGÍA QUE CUIDA */}
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#eff6ff] border border-blue-100 text-[#2563eb] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <svg className="w-6 h-6 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-[12px] xl:text-[13px] text-slate-900 tracking-wide uppercase leading-tight">
                {t('pillar_tech_line1') || 'TECNOLOGÍA'}<br />
                {t('pillar_tech_line2') || 'QUE CUIDA'}
              </h4>
              <p className="text-[11px] xl:text-[11.5px] text-slate-500 leading-snug mt-0.5">
                Inteligencia artificial al servicio de tu salud.
              </p>
            </div>
          </div>

          {/* Pilar 2: PERSONAS QUE IMPORTAN */}
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#f0fdf9] border border-teal-100 text-[#0d9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <svg className="w-6 h-6 text-[#0d9488]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-[12px] xl:text-[13px] text-slate-900 tracking-wide uppercase leading-tight">
                {t('pillar_people_line1') || 'PERSONAS'}<br />
                {t('pillar_people_line2') || 'QUE IMPORTAN'}
              </h4>
              <p className="text-[11px] xl:text-[11.5px] text-slate-500 leading-snug mt-0.5">
                Una atención más humana, cercana y personalizada.
              </p>
            </div>
          </div>

          {/* Pilar 3: UN FUTURO MÁS SALUDABLE */}
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="w-12 h-12 xl:w-13 xl:h-13 rounded-full bg-[#fbf5ff] border border-purple-100 text-[#9333ea] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <svg className="w-6 h-6 text-[#9333ea]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="13" width="4" height="8" rx="1" />
                <rect x="8" y="9" width="4" height="12" rx="1" />
                <rect x="14" y="5" width="4" height="16" rx="1" />
                <path d="M2 10l6-4 6 3 8-7" />
                <polyline points="18 2 22 2 22 6" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-[12px] xl:text-[13px] text-slate-900 tracking-wide uppercase leading-tight">
                {t('pillar_future_line1') || 'UN FUTURO'}<br />
                {t('pillar_future_line2') || 'MÁS SALUDABLE'}
              </h4>
              <p className="text-[11px] xl:text-[11.5px] text-slate-500 leading-snug mt-0.5">
                Innovación hoy, para una vida mejor mañana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CINCO TARJETAS DE ACCIÓN */}
      <section className="w-full px-8 lg:px-12 xl:px-16 pt-2 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 xl:gap-4.5">
          
          {/* Tarjeta 1: Pregunta a MIVOR.ai */}
          <div 
            onClick={() => onNavigate('general_chat')}
            className="bg-[#fbf9ff] hover:bg-[#f4ecff] border border-purple-100/90 rounded-3xl p-4.5 xl:p-5 flex flex-col justify-between min-h-[215px] xl:min-h-[235px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-100/80 flex items-center justify-center text-[#9333ea] mb-3 group-hover:scale-105 transition-transform">
                <Brain size={22} className="stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[14.5px] xl:text-[15.5px] text-slate-900 mb-1.5 leading-snug">
                {t('card_ask_title') || 'Pregunta a MIVOR.ai'}
              </h3>
              <p className="text-[11px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                {t('card_ask_desc') || 'Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica con la ayuda de una IA médica avanzada.'}
              </p>
            </div>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#7012ff] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Tarjeta 2: Analiza tus pruebas médicas */}
          <div 
            onClick={() => onNavigate('documents')}
            className="bg-[#f0f7fe] hover:bg-[#e2f0fd] border border-blue-100/90 rounded-3xl p-4.5 xl:p-5 flex flex-col justify-between min-h-[215px] xl:min-h-[235px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-100/80 flex items-center justify-center text-[#0284c7] mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#0284c7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <circle cx="10" cy="16" r="1.5" />
                  <polyline points="13 18 15 16 17 18" />
                </svg>
              </div>
              <h3 className="font-bold text-[14.5px] xl:text-[15.5px] text-slate-900 mb-1.5 leading-snug">
                {t('card_analyze_title') || 'Analiza tus pruebas médicas'}
              </h3>
              <p className="text-[11px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                {t('card_analyze_desc') || 'Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.'}
              </p>
            </div>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#0066ff] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Tarjeta 3: Organiza tu historial de salud */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-[#f0fdf9] hover:bg-[#def7ee] border border-emerald-100/90 rounded-3xl p-4.5 xl:p-5 flex flex-col justify-between min-h-[215px] xl:min-h-[235px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-teal-100/80 flex items-center justify-center text-[#0d9488] mb-3 group-hover:scale-105 transition-transform">
                <Folder size={22} className="stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[14.5px] xl:text-[15.5px] text-slate-900 mb-1.5 leading-snug">
                {t('card_history_title') || 'Organiza tu historial de salud'}
              </h3>
              <p className="text-[11px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                {t('card_history_desc') || 'Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.'}
              </p>
            </div>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#0d9488] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Tarjeta 4: Últimos avances médicos */}
          <div 
            onClick={() => onNavigate('search')}
            className="bg-[#fff8f2] hover:bg-[#ffeedb] border border-orange-100/90 rounded-3xl p-4.5 xl:p-5 flex flex-col justify-between min-h-[215px] xl:min-h-[235px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-orange-100/80 flex items-center justify-center text-[#ea580c] mb-3 group-hover:scale-105 transition-transform">
                <Lightbulb size={22} className="stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-[14.5px] xl:text-[15.5px] text-slate-900 mb-1.5 leading-snug">
                {t('card_advances_title') || 'Últimos avances médicos'}
              </h3>
              <p className="text-[11px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                {t('card_advances_desc') || 'Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.'}
              </p>
            </div>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#f95700] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
              <ArrowRight size={15} />
            </div>
          </div>

          {/* Tarjeta 5: Encuentra tu médico */}
          <div 
            onClick={() => onNavigate('doctors')}
            className="bg-[#faf7ff] hover:bg-[#efe6fe] border border-purple-100/90 rounded-3xl p-4.5 xl:p-5 flex flex-col justify-between min-h-[215px] xl:min-h-[235px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-100/80 flex items-center justify-center text-[#7c3aed] mb-3 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#7c3aed]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M10 13.5v2" />
                  <path d="M14 13.5v2" />
                </svg>
              </div>
              <h3 className="font-bold text-[14.5px] xl:text-[15.5px] text-slate-900 mb-1.5 leading-snug">
                {t('card_doctors_title') || 'Encuentra tu médico'}
              </h3>
              <p className="text-[11px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                {t('card_doctors_desc') || 'Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.'}
              </p>
            </div>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#7012ff] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
              <ArrowRight size={15} />
            </div>
          </div>

        </div>
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
                className="bg-[#1a65eb] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
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
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a65eb] flex items-center justify-center">
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
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1a65eb] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
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
                className="bg-[#1a65eb] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
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
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1a65eb] flex items-center justify-center">
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
                  <Mail size={18} className="text-[#1a65eb] shrink-0" />
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
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1a65eb] flex items-center justify-center">
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
                  <Lock size={18} className="text-[#1a65eb] shrink-0 mt-0.5" />
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
                className="bg-[#1a65eb] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                {t('patient_understood') || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientHomeDesktop;
