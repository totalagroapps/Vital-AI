import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  Bell, 
  X,
  MessageCircle,
  Mail,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientHomeDesktop = ({ onNavigate, onLogout, userProfile, username }) => {
  const { t } = useLanguage();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-3 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        {/* Brand Logo */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => onNavigate('home')}
        >
          <img 
            src="/images/mivor_nav_logo.png" 
            alt="MIVOR.ai - Better Health. Brighter Lives." 
            className="h-8 lg:h-9 xl:h-10 w-auto object-contain group-hover:scale-102 transition-transform" 
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9 xl:gap-11">
          <button 
            onClick={() => onNavigate('home')} 
            className="relative text-sm font-bold text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Inicio
            <span className="absolute -bottom-1.5 left-0 right-0 h-[2.5px] bg-[#1d63ed] rounded-full" />
          </button>
          
          <button 
            onClick={() => setShowAboutModal(true)} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Sobre MIVOR.ai
          </button>
          
          <button 
            onClick={() => onNavigate('triage')} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Cómo funciona
          </button>
          
          <button 
            onClick={() => setShowContactModal(true)} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Contacto
          </button>
        </nav>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <LanguageSelector />
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => onNavigate('search')} 
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Notificaciones de salud y avances"
            >
              <Bell size={16} />
            </button>
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </div>

          {/* User Profile Avatar */}
          <div 
            onClick={() => onNavigate('history')}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-[#1d63ed]/30 transition-all cursor-pointer"
            title={userProfile?.full_name || username || "Mi cuenta"}
          >
            <img 
              src={userProfile?.photo_url || "/images/mivor_avatar_default.png"} 
              alt="Perfil" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* "Mi cuenta" Button */}
          <button 
            onClick={() => onNavigate('history')}
            className="bg-[#1d63ed] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Mi cuenta</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1 flex flex-col justify-between py-3 lg:py-5">
        
        <section 
          className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 py-2 flex flex-col lg:flex-row items-center justify-between gap-8 relative"
          style={{
            backgroundImage: 'radial-gradient(ellipse 65% 55% at 65% 45%, rgba(190, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.2) 45%, rgba(255, 255, 255, 0) 75%)'
          }}
        >
          {/* Left Column: Headline, Subtitle, Trust Card */}
          <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col justify-center animate-fade-in-left">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] font-black text-slate-900 leading-[1.08] tracking-tight mb-2.5">
              Tu salud,<br />
              en manos de la<br />
              <span className="text-[#1d63ed]">IA más avanzada<br />en medicina.</span>
            </h1>
            
            <p className="text-slate-500 text-xs sm:text-sm lg:text-[14px] leading-relaxed mb-4 max-w-[460px] font-normal">
              Entiende, gestiona y mejora tu bienestar con información médica fiable, personalizada y siempre disponible.
            </p>

            {/* Trust Security Card */}
            <div 
              onClick={() => setShowSecurityModal(true)}
              className="bg-[#f0f7ff] hover:bg-[#e4f0ff] border border-blue-100/90 rounded-2xl p-3 px-4 flex items-center justify-between gap-3.5 max-w-[460px] shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#1d63ed] flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#1d63ed] transition-colors">
                  Tus datos están protegidos
                </h4>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                  Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).
                </p>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>

          {/* Right Column: AI Emblem + Cursive Slogan */}
          <div className="w-full lg:w-[55%] xl:w-[58%] flex items-center justify-center lg:justify-end relative">
            <img 
              src="/images/mivor_hero_right_perfect_clean.png" 
              alt="MIVOR.ai Innovación Médica" 
              className="w-full max-w-[560px] xl:max-w-[620px] h-auto object-contain select-none pointer-events-none drop-shadow-xs" 
            />
          </div>
        </section>

        {/* 3. FIVE ACTION CARDS */}
        <section className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 mt-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-3.5 xl:gap-4">
            
            {/* Card 1: Pregunta a MIVOR.ai */}
            <div 
              onClick={() => onNavigate('general_chat')}
              className="bg-[#f8f6fe] hover:bg-[#f2edfd] border border-purple-100/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] xl:min-h-[190px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div>
                <h3 className="font-bold text-[15px] sm:text-[16px] xl:text-[18px] text-slate-900 mb-2 leading-snug">
                  Pregunta a<br />MIVOR.ai
                </h3>
                <p className="text-[11px] sm:text-[11.5px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                  Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica y científica con la ayuda de una IA médica avanzada.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#6700f5] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 2: Analiza tus pruebas médicas */}
            <div 
              onClick={() => onNavigate('documents')}
              className="bg-[#f0f8ff] hover:bg-[#e2f0fe] border border-blue-100/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] xl:min-h-[190px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div>
                <h3 className="font-bold text-[15px] sm:text-[16px] xl:text-[18px] text-slate-900 mb-2 leading-snug">
                  Analiza tus<br />pruebas médicas
                </h3>
                <p className="text-[11px] sm:text-[11.5px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                  Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#0066ff] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 3: Organiza tu historial de salud */}
            <div 
              onClick={() => onNavigate('history')}
              className="bg-[#f0fbf7] hover:bg-[#def7ee] border border-emerald-100/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] xl:min-h-[190px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div>
                <h3 className="font-bold text-[15px] sm:text-[16px] xl:text-[18px] text-slate-900 mb-2 leading-snug">
                  Organiza tu<br />historial de salud
                </h3>
                <p className="text-[11px] sm:text-[11.5px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                  Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00b087] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 4: Últimos avances médicos */}
            <div 
              onClick={() => onNavigate('search')}
              className="bg-[#fff8f0] hover:bg-[#ffeed8] border border-orange-100/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] xl:min-h-[190px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div>
                <h3 className="font-bold text-[15px] sm:text-[16px] xl:text-[18px] text-slate-900 mb-2 leading-snug">
                  Últimos avances<br />médicos
                </h3>
                <p className="text-[11px] sm:text-[11.5px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                  Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#ff5500] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 5: Encuentra tu médico */}
            <div 
              onClick={() => onNavigate('doctors')}
              className="bg-[#f8f5ff] hover:bg-[#ede5ff] border border-purple-100/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between min-h-[175px] xl:min-h-[190px] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div>
                <h3 className="font-bold text-[15px] sm:text-[16px] xl:text-[18px] text-slate-900 mb-2 leading-snug">
                  Encuentra tu médico
                </h3>
                <p className="text-[11px] sm:text-[11.5px] xl:text-[12px] text-slate-600 leading-relaxed font-normal">
                  Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#7012ff] text-white flex items-center justify-center shadow-xs group-hover:scale-110 active:scale-95 transition-transform self-end mt-3">
                <ArrowRight size={15} />
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* MODAL: SOBRE MIVOR.ai */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Sobre MIVOR.ai</h3>
              </div>
              <button 
                onClick={() => setShowAboutModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
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
                className="bg-[#1d63ed] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTACTO & SOPORTE */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1d63ed] flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Contacto & Soporte</h3>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
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
                  <Mail size={18} className="text-[#1d63ed] shrink-0" />
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
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROTECCIÓN DE DATOS Y PRIVACIDAD */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1d63ed] flex items-center justify-center">
                  <ShieldCheck size={24} className="stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">Tus datos están protegidos</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Seguridad de grado hospitalario y privacidad clínica</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
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
                  <Lock size={18} className="text-[#1d63ed] shrink-0 mt-0.5" />
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
                className="bg-[#1d63ed] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientHomeDesktop;
