import React, { useState, useEffect } from 'react';
import PatientHomeDesktop from './PatientHomeDesktop';
import { 
  Brain, 
  Folder, 
  Lightbulb, 
  Users, 
  Heart, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  Menu, 
  X, 
  Info, 
  Home, 
  Sliders, 
  Activity, 
  UserCheck, 
  CheckCircle2, 
  MessageCircle, 
  Mail, 
  LogOut, 
  Lock,
  Calendar,
  Bell,
  User,
  Paperclip,
  Mic,
  Sparkles,
  FileText,
  Stethoscope,
  Pill,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientHome = ({ onNavigate, onLogout, userProfile, username }) => {
  const { t } = useLanguage();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHowModal, setShowHowModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDrawer(false);
        setShowAboutModal(false);
        setShowHowModal(false);
        setShowMissionModal(false);
        setShowContactModal(false);
        setShowSecurityModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const isOverlayOpen = showDrawer || showAboutModal || showHowModal || showMissionModal || showContactModal || showSecurityModal;
    if (isOverlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showDrawer, showAboutModal, showHowModal, showMissionModal, showContactModal, showSecurityModal]);

  return (
    <>
      {/* ================= VISTA MÓVIL (ZERO-SCROLL 100DVH EN CUALQUIER TELÉFONO) ================= */}
      <div className="block lg:hidden w-full h-[100dvh] max-h-[100dvh] bg-white font-sans text-black flex flex-col justify-between overflow-hidden select-none pb-[88px] mivor-mobile-home">
        
        {/* 1. Barra Superior Móvil: Logo + Idioma + Campana + Perfil (Compacta) */}
        <header className="w-full px-3.5 py-1.5 sm:py-2 flex items-center justify-between border-b border-slate-100 bg-white shrink-0 mobile-header">
          {/* Logo Marca */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <img 
              src="/images/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-6.5 sm:h-7 w-auto object-contain" 
              onError={(e) => { e.target.src = '/assets/mivor-logo.png'; }}
            />
          </div>

          {/* Controles Derecha: Idioma + Campana + Perfil */}
          <div className="flex items-center gap-2">
            <LanguageSelector variant="pill" />
            
            <button 
              onClick={() => setShowContactModal(true)} 
              className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-black relative active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Notificaciones"
            >
              <Bell size={16} className="stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <button 
              onClick={() => setShowDrawer(true)} 
              className="w-8 h-8 rounded-full border border-slate-200 bg-blue-50 text-[#0062ff] flex items-center justify-center active:scale-95 transition-all cursor-pointer overflow-hidden shadow-2xs"
              title="Mi cuenta"
            >
              {userProfile?.photo_url ? (
                <img src={userProfile.photo_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={17} className="stroke-[2.2]" />
              )}
            </button>
          </div>
        </header>

        {/* Contenedor Principal Móvil: Ajustado a la pantalla sin scroll vertical */}
        <main className="flex-1 min-h-0 flex flex-col justify-between px-3 sm:px-4 py-1.5 sm:py-2 gap-1.5 sm:gap-2 overflow-hidden mobile-main">
          
          {/* 2. Sección Hero Móvil */}
          <section 
            className="flex items-center justify-between gap-2 px-1 relative shrink-0 mobile-hero"
            style={{
              backgroundImage: 'radial-gradient(circle at 85% 35%, rgba(186, 230, 253, 0.5) 0%, rgba(224, 242, 254, 0.2) 50%, rgba(255, 255, 255, 0) 80%)'
            }}
          >
            {/* Texto Hero Izquierda */}
            <div className="flex-1 min-w-0 pr-1">
              <h1 className="text-[14px] sm:text-[15.5px] font-black text-black leading-tight tracking-tight">
                Tu salud, en manos de la <span className="text-[#0055ff]">IA médica más avanzada</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-600 font-bold leading-tight mt-0.5 truncate">
                Más información. Mejores decisiones. Una vida más saludable.
              </p>
            </div>

            {/* Arte Hero Derecha: Emblema Circular con Glow */}
            <div className="w-10 h-10 sm:w-13 sm:h-13 shrink-0 relative flex items-center justify-center mobile-hero-emblem">
              <div className="absolute w-10 h-10 rounded-full bg-sky-300/40 blur-lg pointer-events-none" />
              <img 
                src="/assets/mivor-emblem.png" 
                alt="MIVOR.ai" 
                className="w-full h-auto object-contain relative z-1 mix-blend-multiply drop-shadow-xs select-none pointer-events-none" 
                onError={(e) => { e.target.src = '/images/mivor-emblem.png'; }}
              />
            </div>
          </section>

          {/* 3. Buscador / Pregunta a MIVOR.ai con Micrófono */}
          <div className="shrink-0 mobile-search">
            <div 
              onClick={() => onNavigate('general_chat')}
              className="w-full bg-white border-2 border-[#8ec3f8] rounded-full py-1 sm:py-1.5 pl-3.5 pr-1.5 flex items-center gap-2 shadow-2xs hover:border-[#0055ff] active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="text-black p-0.5">
                <Paperclip size={18} className="stroke-[2.5] -rotate-45" />
              </div>
              <div className="h-3.5 w-[1.5px] bg-slate-300" />
              <span className="flex-1 text-xs sm:text-[13px] text-black font-bold select-none truncate">
                Pregunta a MIVOR.ai...
              </span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('general_chat');
                }}
                className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#0055ff] text-white flex items-center justify-center shadow-xs hover:bg-blue-700 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Dictar pregunta"
              >
                <Mic size={16} className="stroke-[2.4]" />
              </button>
            </div>
          </div>

          {/* 4. Cuadrícula 2x2 de Servicios (Flexible, llena la pantalla y letras agrandadas) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 flex-1 min-h-0 items-stretch mobile-grid">
            
            {/* Tarjeta 1: Explica tus pruebas médicas */}
            <div 
              onClick={() => onNavigate('documents')}
              className="bg-[#ddecfe] hover:bg-[#d0e5fd] border-2 border-[#8ec3f8] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer group min-h-0 mobile-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="w-11 h-11 flex items-center justify-center shrink-0 mobile-card-icon">
                  <img src="/images/icon_card_explain.png" alt="Explica tus pruebas" className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#0055ff] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mobile-card-arrow">
                  <ArrowRight size={13} className="stroke-[2.8]" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex-1 min-h-0 flex flex-col justify-end">
                <h3 className="text-[13px] sm:text-[14.5px] font-black text-black leading-tight sm:leading-snug">
                  Explica tus pruebas médicas
                </h3>
                <p className="text-[10px] sm:text-[11.5px] text-slate-800 font-bold leading-tight sm:leading-snug mt-0.5 sm:mt-1 line-clamp-2">
                  Sube analíticas, recetas, radiografías o informes y comprende cada resultado.
                </p>
              </div>
            </div>

            {/* Tarjeta 2: Organiza tu historial de salud */}
            <div 
              onClick={() => onNavigate('history')}
              className="bg-[#d2f7eb] hover:bg-[#c0f2e2] border-2 border-[#6ae0b7] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer group min-h-0 mobile-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="w-11 h-11 flex items-center justify-center shrink-0 mobile-card-icon">
                  <img src="/images/icon_card_history.png" alt="Organiza tu historial" className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#009b78] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mobile-card-arrow">
                  <ArrowRight size={13} className="stroke-[2.8]" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex-1 min-h-0 flex flex-col justify-end">
                <h3 className="text-[13px] sm:text-[14.5px] font-black text-black leading-tight sm:leading-snug">
                  Organiza tu historial
                </h3>
                <p className="text-[10px] sm:text-[11.5px] text-slate-800 font-bold leading-tight sm:leading-snug mt-0.5 sm:mt-1 line-clamp-2">
                  Toda tu información médica reunida y disponible en un solo lugar.
                </p>
              </div>
            </div>

            {/* Tarjeta 3: Últimos avances médicos */}
            <div 
              onClick={() => onNavigate('search')}
              className="bg-[#ffe8d6] hover:bg-[#ffdcc1] border-2 border-[#fba86f] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer group min-h-0 mobile-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="w-11 h-11 flex items-center justify-center shrink-0 mobile-card-icon">
                  <img src="/images/icon_card_advances.png" alt="Últimos avances médicos" className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#f25500] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mobile-card-arrow">
                  <ArrowRight size={13} className="stroke-[2.8]" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex-1 min-h-0 flex flex-col justify-end">
                <h3 className="text-[13px] sm:text-[14.5px] font-black text-black leading-tight sm:leading-snug">
                  Últimos avances médicos
                </h3>
                <p className="text-[10px] sm:text-[11.5px] text-slate-800 font-bold leading-tight sm:leading-snug mt-0.5 sm:mt-1 line-clamp-2">
                  Conoce los tratamientos y novedades más recientes explicados con claridad.
                </p>
              </div>
            </div>

            {/* Tarjeta 4: Encuentra tu médico */}
            <div 
              onClick={() => onNavigate('doctors')}
              className="bg-[#ede0fe] hover:bg-[#e2cefd] border-2 border-[#be8efb] rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer group min-h-0 mobile-card"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="w-11 h-11 flex items-center justify-center shrink-0 mobile-card-icon">
                  <img src="/images/icon_card_doctors.png" alt="Encuentra tu médico" className="w-full h-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#7116e0] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mobile-card-arrow">
                  <ArrowRight size={13} className="stroke-[2.8]" />
                </div>
              </div>
              <div className="mt-1 sm:mt-2 flex-1 min-h-0 flex flex-col justify-end">
                <h3 className="text-[13px] sm:text-[14.5px] font-black text-black leading-tight sm:leading-snug">
                  Encuentra tu médico
                </h3>
                <p className="text-[10px] sm:text-[11.5px] text-slate-800 font-bold leading-tight sm:leading-snug mt-0.5 sm:mt-1 line-clamp-2">
                  Especialistas para videollamada online inmediata o cita presencial.
                </p>
              </div>
            </div>

          </div>

          {/* 5. Tira de Seguridad y Confianza (100% visible, nunca tapada por la barra inferior) */}
          <div 
            onClick={() => setShowSecurityModal(true)}
            className="bg-[#ddecfe]/90 hover:bg-[#d0e5fd] border-2 border-[#8ec3f8] rounded-xl px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2.5 shadow-2xs active:scale-[0.99] transition-all cursor-pointer shrink-0 mobile-security"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 mobile-security-icon">
                <img src="/images/icon_security_shield.png" alt="Seguridad" className="w-full h-full object-contain drop-shadow-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-[11.5px] sm:text-[13px] font-black text-black leading-tight">
                  Tus datos están protegidos
                </p>
                <p className="text-[9.5px] sm:text-[11px] font-bold text-slate-700 leading-tight truncate">
                  Cifrado de nivel médico (ISO 27001, GDPR)
                </p>
              </div>
            </div>
            <ChevronRight size={17} className="text-black stroke-[2.8] shrink-0" />
          </div>

        </main>

        {/* 6. DRAWER / MENÚ LATERAL MÓVIL */}
        {showDrawer && (
          <div 
            onClick={() => setShowDrawer(false)}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250 cursor-default"
            >
              
              <div>
                {/* Header Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src="/images/mivor_nav_logo.png" alt="MIVOR.ai" className="h-6 w-auto object-contain" />
                  </div>
                  <button 
                    onClick={() => setShowDrawer(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black"
                  >
                    <X size={18} className="stroke-[2.5]" />
                  </button>
                </div>

                {/* Perfil Mini */}
                <div 
                  onClick={() => { setShowDrawer(false); onNavigate('history'); }}
                  className="mt-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-50/60 transition-colors border border-slate-200"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    <img 
                      src={userProfile?.photo_url || "/images/mivor_avatar_default.png"} 
                      alt="Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-black truncate">
                      {userProfile?.full_name || username || "Mi cuenta"}
                    </h4>
                    <p className="text-[11px] text-[#0055ff] font-bold">Ver Historial y Perfil →</p>
                  </div>
                </div>

                {/* Enlaces de Navegación del Drawer */}
                <div className="mt-5 space-y-1">
                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('general_chat'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <Brain size={18} className="text-[#9333ea] stroke-[2.4]" />
                    <span>Pregunta a MIVOR.ai</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('documents'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <Activity size={18} className="text-[#0284c7] stroke-[2.4]" />
                    <span>Explica tus pruebas médicas</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('history'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <Folder size={18} className="text-[#0d9488] stroke-[2.4]" />
                    <span>Organiza tu historial de salud</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('search'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <Lightbulb size={18} className="text-[#ea580c] stroke-[2.4]" />
                    <span>Últimos avances médicos</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('doctors'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <UserCheck size={18} className="text-[#7c3aed] stroke-[2.4]" />
                    <span>Encuentra tu médico</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('citas'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-bold text-black hover:bg-slate-50 hover:text-[#0055ff] transition-colors text-left cursor-pointer"
                  >
                    <Calendar size={18} className="text-[#4f46e5] stroke-[2.4]" />
                    <span>{t('my_appointments') || 'Mis citas médicas'}</span>
                  </button>

                  <div className="pt-2 pb-1 border-t border-slate-100 my-2" />

                  <button 
                    onClick={() => { setShowDrawer(false); setShowContactModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-black hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <MessageCircle size={17} className="text-emerald-600 stroke-[2.4]" />
                    <span>Contacto y Soporte 24/7</span>
                  </button>
                </div>
              </div>

              {/* Footer Drawer */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => { setShowDrawer(false); onLogout(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Cerrar sesión</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: SOBRE MIVOR.ai */}
        {showAboutModal && (
          <div 
            onClick={() => setShowAboutModal(false)} 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-black text-base text-black">{t('patient_about_title') || 'Sobre MIVOR.ai'}</h3>
                </div>
                <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black cursor-pointer">
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
              <div className="py-3 space-y-2.5 text-[13px] text-black font-medium leading-relaxed">
                <p>
                  <strong>MIVOR.ai</strong> es una plataforma de salud impulsada por inteligencia artificial clínica de última generación, diseñada para acompañar a pacientes y médicos en la toma de decisiones informadas.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200 text-[12px] text-black">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span className="font-semibold text-black">Cifrado de grado médico y cumplimiento estricto con normativas GDPR e ISO 27001.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Heart size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-semibold text-black">Juntos por una medicina más humana, accesible y eficiente.</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowAboutModal(false)} className="bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer">
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center">
                    <Sliders size={18} />
                  </div>
                  <h3 className="font-black text-base text-black">{t('patient_how_it_works') || 'Cómo funciona'}</h3>
                </div>
                <button onClick={() => setShowHowModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black cursor-pointer">
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
              <div className="py-3 space-y-3 text-[13px] text-black font-medium leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055ff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p><strong className="text-black">Pregunta o sube tus informes:</strong> Escribe tus dudas de salud o sube tus análisis médicos en PDF o imagen.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055ff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p><strong className="text-black">Análisis clínico con IA:</strong> Nuestro sistema traduce jerga técnica compleja a explicaciones comprensibles y seguras.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0055ff] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p><strong className="text-black">Conecta con profesionales:</strong> Encuentra especialistas y comparte tu historial de forma segura para consultas presenciales o telemáticas.</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowHowModal(false)} className="bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer">
                  {t('patient_close') || 'Cerrar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MISIÓN / JUNTOS POR UNA MEDICINA */}
        {showMissionModal && (
          <div 
            onClick={() => setShowMissionModal(false)} 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Heart size={18} />
                  </div>
                  <h3 className="font-black text-base text-black">{t('patient_our_commitment') || 'Nuestro Compromiso'}</h3>
                </div>
                <button onClick={() => setShowMissionModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black cursor-pointer">
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
              <div className="py-3 space-y-2.5 text-[13px] text-black font-medium leading-relaxed">
                <p className="font-bold text-black text-[13.5px]">
                  {t('patient_commitment_quote') || '"Juntos por una medicina más humana y eficiente."'}
                </p>
                <p className="text-black">
                  En MIVOR.ai creemos que la tecnología debe empoderar al paciente y facilitar la labor del profesional médico, reduciendo la ansiedad provocada por la falta de información y agilizando la atención médica.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowMissionModal(false)} className="bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer">
                  {t('patient_close') || 'Cerrar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONTACTO */}
        {showContactModal && (
          <div 
            onClick={() => setShowContactModal(false)} 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0055ff] flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <h3 className="font-black text-base text-black">{t('patient_contact_support') || 'Contacto & Soporte'}</h3>
                </div>
                <button onClick={() => setShowContactModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black cursor-pointer">
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>
              <div className="py-3 space-y-2.5 text-[13px] text-black">
                <p className="font-bold text-black">Atención directa disponible 24/7:</p>
                <a 
                  href="https://wa.me/34600000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 text-black font-bold"
                >
                  <MessageCircle size={20} className="text-emerald-700 stroke-[2.4] shrink-0" />
                  <div>
                    <p className="text-[13px] text-black font-black">WhatsApp 24/7</p>
                    <p className="text-[11.5px] text-black font-semibold">Respuesta inmediata</p>
                  </div>
                </a>
                <a 
                  href="mailto:soporte@mivor.ai" 
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-blue-200 bg-blue-50/70 text-black font-bold"
                >
                  <Mail size={20} className="text-[#0055ff] stroke-[2.4] shrink-0" />
                  <div>
                    <p className="text-[13px] text-black font-black">soporte@mivor.ai</p>
                    <p className="text-[11.5px] text-black font-semibold">Consultas médicas y técnicas</p>
                  </div>
                </a>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowContactModal(false)} className="bg-slate-200 hover:bg-slate-300 text-black font-bold text-xs px-5 py-2.5 rounded-full cursor-pointer">
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 cursor-default"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0055ff] flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} className="stroke-[2.4]" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-black leading-tight">{t('patient_data_protected') || 'Tus datos están protegidos'}</h3>
                    <p className="text-[11px] text-black font-bold">Seguridad de grado hospitalario y privacidad</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSecurityModal(false)} 
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-black hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="py-3.5 space-y-2.5 text-[13px] text-black font-medium leading-relaxed">
                <p>
                  En <strong>MIVOR.ai</strong>, la confidencialidad y protección de tu información de salud es nuestra máxima prioridad:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
                    <Lock size={17} className="text-[#0055ff] stroke-[2.4] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-[12.5px] text-black">Cifrado de extremo a extremo</h4>
                      <p className="text-[11.5px] text-black font-medium mt-0.5">
                        Todos tus datos, consultas e informes médicos se transmiten y almacenan bajo cifrado militar AES-256.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="text-teal-600 stroke-[2.4] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-[12.5px] text-black">Cumplimiento ISO 27001 & RGPD</h4>
                      <p className="text-[11.5px] text-black font-medium mt-0.5">
                        Auditorías continuas de seguridad de la información conforme a estándares internacionales y normativa europea sanitaria.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5">
                    <ShieldCheck size={17} className="text-indigo-600 stroke-[2.4] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-[12.5px] text-black">Privacidad clínica absoluta</h4>
                      <p className="text-[11.5px] text-black font-medium mt-0.5">
                        Tus informes jamás son compartidos ni comercializados ni usados para entrenar modelos públicos de IA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setShowSecurityModal(false)} 
                  className="bg-[#0055ff] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                >
                  {t('patient_understood') || 'Entendido'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= VISTA ESCRITORIO (RÉPLICA OFICIAL) ================= */}
      <div className="hidden lg:block">
        <PatientHomeDesktop 
          onNavigate={onNavigate} 
          onLogout={onLogout} 
          userProfile={userProfile}
          username={username}
        />
      </div>
    </>
  );
};

export default PatientHome;
