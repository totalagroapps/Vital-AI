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
    <div className="h-screen w-full bg-white text-slate-900 flex flex-col justify-between font-sans select-none overflow-hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full shrink-0 border-b border-slate-100/90 bg-white/95 backdrop-blur-xs z-40">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-20 2xl:px-28 py-3 lg:py-4.5 xl:py-5 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            className="flex items-center cursor-pointer group shrink-0" 
            onClick={() => onNavigate('home')}
          >
            <img 
              src="/images/mivor_nav_logo.png" 
              alt="MIVOR.ai - Better Health. Brighter Lives." 
              className="h-7 sm:h-8 lg:h-9.5 xl:h-10.5 w-auto object-contain transition-transform" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </div>

          {/* Center Nav Links: Inicio, Sobre MIVOR.ai, Cómo funciona, Contacto */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 xl:gap-11">
            {/* Inicio con barra indicadora activa */}
            <button 
              onClick={() => onNavigate('home')} 
              className="text-xs lg:text-[14.5px] xl:text-[15.5px] font-semibold text-[#005dff] transition-colors py-1 cursor-pointer relative flex flex-col items-center"
            >
              <span>{t('patient_nav_home') || 'Inicio'}</span>
              <span className="absolute -bottom-1 w-full h-[2.2px] bg-[#005dff] rounded-full" />
            </button>
            
            <button 
              onClick={() => setShowAboutModal(true)} 
              className="text-xs lg:text-[14.5px] xl:text-[15.5px] font-medium text-slate-800 hover:text-[#005dff] transition-colors py-1 cursor-pointer"
            >
              {t('patient_nav_about') || 'Sobre MIVOR.ai'}
            </button>
            
            <button 
              onClick={() => setShowHowModal(true)} 
              className="text-xs lg:text-[14.5px] xl:text-[15.5px] font-medium text-slate-800 hover:text-[#005dff] transition-colors py-1 cursor-pointer"
            >
              {t('patient_nav_how') || 'Cómo funciona'}
            </button>

            <button 
              onClick={() => setShowContactModal(true)} 
              className="text-xs lg:text-[14.5px] xl:text-[15.5px] font-medium text-slate-800 hover:text-[#005dff] transition-colors py-1 cursor-pointer"
            >
              {t('patient_nav_contact') || 'Contacto'}
            </button>
          </nav>

          {/* Right Nav Controls: Idioma ES, Campana, Avatar, Mi cuenta */}
          <div className="flex items-center gap-2.5 lg:gap-3 shrink-0">
            <LanguageSelector variant="pill" />
            
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => onNavigate('search')} 
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Notificaciones"
              >
                <Bell size={15} className="text-slate-700" />
              </button>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
            </div>

            {/* User Avatar Circle */}
            <div 
              onClick={() => setShowUserMenu(prev => !prev)}
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#005dff]/40 transition-all shrink-0"
              title={userProfile?.full_name || username || "Mi cuenta"}
            >
              <img 
                src={userProfile?.photo_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"} 
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
                className="bg-[#005dff] hover:bg-[#0052e0] active:scale-95 text-white font-semibold text-xs px-4 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#005dff]/30"
                title={userProfile?.full_name || username || "Mi cuenta"}
              >
                <span>{t('patient_nav_my_account') || 'Mi cuenta'}</span>
                <ArrowRight size={13} className="stroke-[2.2]" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setShowUserMenu(false)} 
                  />

                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100/60 mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0">
                          <img 
                            src={userProfile?.photo_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"} 
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="w-full flex-1 min-h-0 relative overflow-hidden flex items-center justify-center py-1 xl:py-2">
        {/* Soft celestial flowing silk wave spanning across the entire hero */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 520" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              {/* Vibrant radial glow behind emblem */}
              <radialGradient id="emblemGlow" cx="50%" cy="48%" r="38%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
                <stop offset="35%" stopColor="#7dd3fc" stopOpacity="0.38" />
                <stop offset="65%" stopColor="#bae6fd" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              {/* Left subtle aura under title & security card */}
              <radialGradient id="leftGlow" cx="22%" cy="65%" r="35%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#f0f9ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              {/* Silk wave gradient 1 */}
              <linearGradient id="silkWave1" x1="100%" y1="10%" x2="20%" y2="85%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6" />
                <stop offset="28%" stopColor="#7dd3fc" stopOpacity="0.5" />
                <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#c7d2fe" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Silk wave gradient 2 */}
              <linearGradient id="silkWave2" x1="95%" y1="0%" x2="10%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#bae6fd" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#ddd6fe" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <filter id="waveBlurLarge" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="36" />
              </filter>
              <filter id="waveBlurSoft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="18" />
              </filter>
            </defs>

            {/* Left soft wash under title & security badge */}
            <rect x="0" y="0" width="1440" height="520" fill="url(#leftGlow)" />

            {/* Radial glow centered directly behind the emblem */}
            <rect x="0" y="0" width="1440" height="520" fill="url(#emblemGlow)" />

            {/* Organic silk ribbon wave curving behind emblem and 3 pillars */}
            <path 
              d="M 1440,20 Q 1120,60 960,150 T 620,310 Q 420,390 180,350 L 180,520 L 1440,520 Z" 
              fill="url(#silkWave1)" 
              filter="url(#waveBlurLarge)" 
            />
            
            {/* Secondary upper wave layer */}
            <path 
              d="M 1440,0 Q 1040,30 880,120 Q 720,210 500,230 Q 300,250 100,330 L 100,520 L 1440,520 Z" 
              fill="url(#silkWave2)" 
              filter="url(#waveBlurLarge)" 
            />

            {/* Subtle luminous wave ridge */}
            <path 
              d="M 1440,45 C 1180,105 1020,175 860,215 C 700,255 540,295 240,335" 
              stroke="#7dd3fc" 
              strokeWidth="32" 
              strokeOpacity="0.36" 
              fill="none" 
              filter="url(#waveBlurSoft)" 
            />
          </svg>
        </div>

        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-24 flex items-center justify-between gap-4 lg:gap-6 xl:gap-8 relative z-10">
          
          {/* Columna Izquierda: Titular H1 + Tarjeta de Confianza */}
          <div className="w-[33%] max-w-[360px] xl:max-w-[490px] flex flex-col justify-center shrink-0">
            <h1 className="text-[26px] sm:text-[34px] lg:text-[44px] xl:text-[52px] 2xl:text-[56px] font-black text-slate-950 leading-[0.98] tracking-[-0.03em] mb-3 lg:mb-3.5 xl:mb-4">
              {(t('hero_title_p1') || 'Tu salud,').trim().replace(/\s+,/g, ',')}<br />
              {t('hero_title_p2') || 'en manos de la'}<br />
              <span className="text-[#005dff]">
                {t('hero_title_p3') || 'IA más avanzada'}<br />
                {t('hero_title_p4') || 'en medicina.'}
              </span>
            </h1>

            {/* Tarjeta de Confianza */}
            <div 
              onClick={() => setShowSecurityModal(true)}
              className="bg-[#edf5fe] hover:bg-[#e4effd] border border-[#d6e8fc] rounded-[18px] xl:rounded-[22px] p-3 lg:p-3.5 xl:p-4 flex items-center gap-3 max-w-[360px] xl:max-w-[440px] shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#def3fe] text-[#005dff] flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-5 h-5 xl:w-6 xl:h-6 text-[#005dff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div>
                <h4 className="text-[11.5px] lg:text-[13px] xl:text-[14px] font-bold text-slate-900 leading-tight group-hover:text-[#005dff] transition-colors">
                  {t('hero_security_title') || 'Tus datos están protegidos'}
                </h4>
                <p className="text-[9.5px] lg:text-[10.5px] xl:text-[11.5px] text-slate-600 leading-snug mt-0.5 xl:mt-1">
                  {t('hero_security_desc') || 'Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).'}
                </p>
              </div>
            </div>
          </div>

          {/* Columna Centro: Emblema Circular con Escala Amplia */}
          <div className="w-[41%] flex items-center justify-center relative min-w-0">
            <img 
              src="/images/mivor_hero_feathered.png" 
              alt="MIVOR.ai" 
              className="w-full max-w-[320px] lg:max-w-[340px] xl:max-w-[500px] 2xl:max-w-[600px] max-h-[min(50vh,250px)] xl:max-h-[min(56vh,520px)] h-auto object-contain relative z-10 select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          {/* Columna Derecha: Los 3 Pilares */}
          <div className="flex flex-col justify-center gap-3.5 lg:gap-5 xl:gap-6 w-[25%] max-w-[280px] xl:max-w-[380px] shrink-0">
            {/* Pilar 1: TECNOLOGÍA QUE CUIDA */}
            <div className="flex items-center gap-2.5 xl:gap-4 group cursor-default">
              <div className="w-9 h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13 rounded-full bg-[#dbeefe] text-[#0284c7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5 xl:w-6.5 xl:h-6.5 text-[#0284c7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-[12px] lg:text-[13px] xl:text-[14px] text-slate-900 tracking-normal uppercase leading-tight">
                  {t('pillar_tech_line1') || 'TECNOLOGÍA'}<br />
                  {t('pillar_tech_line2') || 'QUE CUIDA'}
                </h4>
                <p className="text-[9px] lg:text-[10.5px] xl:text-[11.5px] text-slate-600 leading-snug mt-0.5">
                  Inteligencia artificial<br />
                  al servicio de tu salud.
                </p>
              </div>
            </div>

            {/* Pilar 2: PERSONAS QUE IMPORTAN */}
            <div className="flex items-center gap-2.5 xl:gap-4 group cursor-default">
              <div className="w-9 h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13 rounded-full bg-[#ccfbf1] text-[#00c5a0] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5 xl:w-6.5 xl:h-6.5 text-[#00c5a0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-[12px] lg:text-[13px] xl:text-[14px] text-slate-900 tracking-normal uppercase leading-tight">
                  {t('pillar_people_line1') || 'PERSONAS'}<br />
                  {t('pillar_people_line2') || 'QUE IMPORTAN'}
                </h4>
                <p className="text-[9px] lg:text-[10.5px] xl:text-[11.5px] text-slate-600 leading-snug mt-0.5">
                  Una atención más humana,<br />
                  cercana y personalizada.
                </p>
              </div>
            </div>

            {/* Pilar 3: UN FUTURO MÁS SALUDABLE */}
            <div className="flex items-center gap-2.5 xl:gap-4 group cursor-default">
              <div className="w-9 h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13 rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-4.5 h-4.5 lg:w-5.5 lg:h-5.5 xl:w-6.5 xl:h-6.5 text-[#7c3aed]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="13" width="3.5" height="8" rx="0.8" />
                  <rect x="8" y="9" width="3.5" height="12" rx="0.8" />
                  <rect x="14" y="5" width="3.5" height="16" rx="0.8" />
                  <path d="M2 10l6-4 6 3 8-7" />
                  <polyline points="18 2 22 2 22 6" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-[12px] lg:text-[13px] xl:text-[14px] text-slate-900 tracking-normal uppercase leading-tight">
                  {t('pillar_future_line1') || 'UN FUTURO'}<br />
                  {t('pillar_future_line2') || 'MÁS SALUDABLE'}
                </h4>
                <p className="text-[9px] lg:text-[10.5px] xl:text-[11.5px] text-slate-600 leading-snug mt-0.5">
                  Innovación hoy,<br />
                  para una vida mejor mañana.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CINCO TARJETAS INFERIORES */}
      <section className="w-full shrink-0 pb-3 lg:pb-4 xl:pb-5 pt-0">
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 2xl:px-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 xl:gap-5">
          
          {/* Tarjeta 1: Pregunta a MIVOR.ai (Pastel Lavender #fbfbfe) */}
          <div 
            onClick={() => onNavigate('general_chat')}
            className="bg-[#fbfbfe] hover:bg-[#f4effd] border border-[#f0ebfa]/70 rounded-[20px] xl:rounded-[24px] p-3.5 lg:p-4 xl:p-5 flex flex-col justify-between h-[210px] lg:h-[225px] xl:h-[250px] 2xl:h-[280px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#f1ebfc] flex items-center justify-center text-[#5c03f8] mb-2 xl:mb-3 group-hover:scale-105 transition-transform shrink-0">
                <Brain size={19} className="stroke-[2.2] xl:w-[22px] xl:h-[22px]" />
              </div>
              <h3 className="font-bold text-[13.5px] lg:text-[14.5px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                {t('card_ask_title') || 'Pregunta a MIVOR.ai'}
              </h3>
              <p className="text-[9.5px] lg:text-[10.8px] xl:text-[12px] text-slate-600 leading-[1.38] xl:leading-[1.42] font-normal">
                {t('card_ask_desc') || 'Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica con la ayuda de una IA médica avanzada.'}
              </p>
            </div>
            <div className="w-7.5 h-7.5 lg:w-8.5 lg:h-8.5 xl:w-10 xl:h-10 rounded-full bg-[#5c03f8] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform self-end mt-auto shrink-0">
              <ArrowRight size={14} className="stroke-[2.6] xl:w-[16px] xl:h-[16px]" />
            </div>
          </div>

          {/* Tarjeta 2: Analiza tus pruebas médicas (Pastel Sky Blue #eff8fe) */}
          <div 
            onClick={() => onNavigate('documents')}
            className="bg-[#eff8fe] hover:bg-[#e2f1fc] border border-[#dbeefe]/70 rounded-[20px] xl:rounded-[24px] p-3.5 lg:p-4 xl:p-5 flex flex-col justify-between h-[210px] lg:h-[225px] xl:h-[250px] 2xl:h-[280px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#def1fe] flex items-center justify-center text-[#005dff] mb-2 xl:mb-3 group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5 xl:w-6 xl:h-6 text-[#005dff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="12" y2="17" />
                  <polyline points="9 9 12 11 15 8" />
                </svg>
              </div>
              <h3 className="font-bold text-[13.5px] lg:text-[14.5px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                {t('card_analyze_title') || 'Analiza tus pruebas médicas'}
              </h3>
              <p className="text-[9.5px] lg:text-[10.8px] xl:text-[12px] text-slate-600 leading-[1.38] xl:leading-[1.42] font-normal">
                {t('card_analyze_desc') || 'Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.'}
              </p>
            </div>
            <div className="w-7.5 h-7.5 lg:w-8.5 lg:h-8.5 xl:w-10 xl:h-10 rounded-full bg-[#005dff] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform self-end mt-auto shrink-0">
              <ArrowRight size={14} className="stroke-[2.6] xl:w-[16px] xl:h-[16px]" />
            </div>
          </div>

          {/* Tarjeta 3: Organiza tu historial de salud (Pastel Mint #f0fffe) */}
          <div 
            onClick={() => onNavigate('history')}
            className="bg-[#f0fffe] hover:bg-[#e1fbf8] border border-[#ccfbf1]/70 rounded-[20px] xl:rounded-[24px] p-3.5 lg:p-4 xl:p-5 flex flex-col justify-between h-[210px] lg:h-[225px] xl:h-[250px] 2xl:h-[280px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#dcf9f1] flex items-center justify-center text-[#00c5a0] mb-2 xl:mb-3 group-hover:scale-105 transition-transform shrink-0">
                <Folder size={19} className="stroke-[2.2] xl:w-[22px] xl:h-[22px]" />
              </div>
              <h3 className="font-bold text-[13.5px] lg:text-[14.5px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                {t('card_history_title') || 'Organiza tu historial de salud'}
              </h3>
              <p className="text-[9.5px] lg:text-[10.8px] xl:text-[12px] text-slate-600 leading-[1.38] xl:leading-[1.42] font-normal">
                {t('card_history_desc') || 'Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.'}
              </p>
            </div>
            <div className="w-7.5 h-7.5 lg:w-8.5 lg:h-8.5 xl:w-10 xl:h-10 rounded-full bg-[#00c5a0] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform self-end mt-auto shrink-0">
              <ArrowRight size={14} className="stroke-[2.6] xl:w-[16px] xl:h-[16px]" />
            </div>
          </div>

          {/* Tarjeta 4: Últimos avances médicos (Pastel Warm Peach #faf4ee) */}
          <div 
            onClick={() => onNavigate('search')}
            className="bg-[#faf4ee] hover:bg-[#f6eae0] border border-[#fed7aa]/60 rounded-[20px] xl:rounded-[24px] p-3.5 lg:p-4 xl:p-5 flex flex-col justify-between h-[210px] lg:h-[225px] xl:h-[250px] 2xl:h-[280px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#ffe9db] flex items-center justify-center text-[#fc792b] mb-2 xl:mb-3 group-hover:scale-105 transition-transform shrink-0">
                <Lightbulb size={19} className="stroke-[2.2] xl:w-[22px] xl:h-[22px]" />
              </div>
              <h3 className="font-bold text-[13.5px] lg:text-[14.5px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                {t('card_advances_title') || 'Últimos avances médicos'}
              </h3>
              <p className="text-[9.5px] lg:text-[10.8px] xl:text-[12px] text-slate-600 leading-[1.38] xl:leading-[1.42] font-normal">
                {t('card_advances_desc') || 'Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.'}
              </p>
            </div>
            <div className="w-7.5 h-7.5 lg:w-8.5 lg:h-8.5 xl:w-10 xl:h-10 rounded-full bg-[#fc792b] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform self-end mt-auto shrink-0">
              <ArrowRight size={14} className="stroke-[2.6] xl:w-[16px] xl:h-[16px]" />
            </div>
          </div>

          {/* Tarjeta 5: Encuentra tu médico (Pastel Lilac #f8f8f9 / #f4f2fd) */}
          <div 
            onClick={() => onNavigate('doctors')}
            className="bg-[#f8f8f9] hover:bg-[#eae6fc] border border-[#ede9fe]/70 rounded-[20px] xl:rounded-[24px] p-3.5 lg:p-4 xl:p-5 flex flex-col justify-between h-[210px] lg:h-[225px] xl:h-[250px] 2xl:h-[280px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div>
              <div className="w-9 h-9 lg:w-10.5 lg:h-10.5 xl:w-12 xl:h-12 rounded-full bg-[#ece5fc] flex items-center justify-center text-[#5c03f8] mb-2 xl:mb-3 group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-5 h-5 xl:w-6 xl:h-6 text-[#5c03f8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 7a4 4 0 0 1 8 0v1H8V7z" />
                  <path d="M8.5 8a3.5 3.5 0 0 0 7 0" />
                  <path d="M9 11.5h6" />
                  <path d="M4.5 20c0-3.5 3.5-5.5 7.5-5.5s7.5 2 7.5 5.5" />
                  <path d="M10 14.5l2 3 2-3" />
                  <circle cx="9.5" cy="18.5" r="0.8" fill="currentColor" />
                  <circle cx="14.5" cy="18.5" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <h3 className="font-bold text-[13.5px] lg:text-[14.5px] xl:text-[16px] text-slate-900 mb-1 leading-snug">
                {t('card_doctors_title') || 'Encuentra tu médico'}
              </h3>
              <p className="text-[9.5px] lg:text-[10.8px] xl:text-[12px] text-slate-600 leading-[1.38] xl:leading-[1.42] font-normal">
                {t('card_doctors_desc') || 'Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.'}
              </p>
            </div>
            <div className="w-7.5 h-7.5 lg:w-8.5 lg:h-8.5 xl:w-10 xl:h-10 rounded-full bg-[#5c03f8] text-white flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform self-end mt-auto shrink-0">
              <ArrowRight size={14} className="stroke-[2.6] xl:w-[16px] xl:h-[16px]" />
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

    </div>
  );
};

export default PatientHomeDesktop;
