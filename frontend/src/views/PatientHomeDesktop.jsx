import React, { useState } from 'react';
import { 
  Brain, 
  FileText, 
  Folder, 
  Lightbulb, 
  Stethoscope, 
  Users, 
  Globe, 
  Heart, 
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

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      
      {/* 1. HEADER / TOP NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-40">
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => onNavigate('home')}
        >
          <img 
            src="/images/mivor_logo.png" 
            alt="MIVOR.ai" 
            className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform" 
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tight text-slate-900 leading-none">
              MIVOR<span className="text-teal-600">.ai</span>
            </span>
            <span className="text-[8px] uppercase font-black tracking-widest text-teal-600 leading-none mt-1">
              BETTER HEALTH. BRIGHTER LIVES.
            </span>
          </div>
        </div>

        {/* Center Menu Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <button 
            onClick={() => onNavigate('home')} 
            className="relative text-sm font-extrabold text-slate-900 transition-colors py-1 cursor-pointer"
          >
            Inicio
            <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#1d63ed] rounded-full" />
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
            onClick={() => onNavigate('home')} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Para pacientes
          </button>
          
          <button 
            onClick={() => { window.location.href = '/medico'; }} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Para médicos
          </button>
          
          <button 
            onClick={() => setShowContactModal(true)} 
            className="text-sm font-medium text-slate-600 hover:text-[#1d63ed] transition-colors py-1 cursor-pointer"
          >
            Contacto
          </button>
        </nav>

        {/* Right Section: Language, Notifications, Avatar, Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector />
          
          {/* Notifications Bell with red indicator */}
          <div className="relative">
            <button 
              onClick={() => onNavigate('search')} 
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Notificaciones de salud y avances"
            >
              <Bell size={17} />
            </button>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </div>

          {/* User Avatar */}
          <div 
            onClick={() => onNavigate('history')}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-[#1d63ed]/30 transition-all cursor-pointer"
            title={userProfile?.full_name || username || "Mi cuenta"}
          >
            <img 
              src={userProfile?.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"} 
              alt="Perfil" 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* "Mi cuenta" Button */}
          <button 
            onClick={() => onNavigate('history')}
            className="bg-[#1d63ed] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Mi cuenta</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-4 lg:py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 flex flex-col justify-center animate-fade-in-left">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] font-black text-slate-900 leading-[1.12] tracking-tight mb-3.5">
              Tu salud,<br />
              en manos de la<br />
              <span className="text-[#1d63ed]">IA más avanzada</span><br />
              en medicina.
            </h1>
            
            <p className="text-slate-600 text-xs sm:text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg font-normal">
              Entiende, gestiona y mejora tu bienestar con información médica fiable, personalizada y siempre disponible.
            </p>

            {/* Trust Security Card */}
            <div 
              onClick={() => onNavigate('history')}
              className="bg-[#f0f7ff] hover:bg-[#e4f0ff] border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3.5 max-w-lg shadow-2xs transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#1d63ed] flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#1d63ed] transition-colors">
                  Tus datos están protegidos
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                  Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-[#1d63ed] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>

          {/* Right Column: AI Circular Emblem + Slogan */}
          <div className="lg:col-span-6 relative flex items-center justify-center py-2 lg:py-4">
            {/* Ambient halo glow */}
            <div className="absolute inset-0 bg-radial from-sky-200/50 via-sky-100/20 to-transparent blur-3xl pointer-events-none" />
            
            <img 
              src="/images/mivor_hero_right_full_clean.png" 
              alt="Juntos por una medicina más humana y eficiente"
              className="w-full max-w-[530px] h-auto object-contain relative z-10 drop-shadow-xs"
              onError={(e) => { e.target.src = '/images/mivor_hero_art_clean.png'; }}
            />
          </div>
        </section>

        {/* 3. FIVE ACTION CARDS */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-10 my-3 lg:my-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 lg:gap-4">
            
            {/* Card 1: Pregunta a MIVOR.ai */}
            <div 
              onClick={() => onNavigate('general_chat')}
              className="bg-[#faf7ff] hover:bg-[#f2e7ff] border border-purple-100/90 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#ede2fc] text-purple-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <Brain size={22} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-sm lg:text-[15px] text-slate-900 mb-2 leading-snug">
                  Pregunta a MIVOR.ai
                </h3>
                <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed font-normal">
                  Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica y científica con la ayuda de una IA médica avanzada.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform self-end mt-4">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 2: Analiza tus pruebas médicas */}
            <div 
              onClick={() => onNavigate('documents')}
              className="bg-[#f4f8ff] hover:bg-[#e7f0ff] border border-blue-100/90 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#dbe9fe] text-[#1d63ed] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <FileText size={22} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-sm lg:text-[15px] text-slate-900 mb-2 leading-snug">
                  Analiza tus pruebas médicas
                </h3>
                <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed font-normal">
                  Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1d63ed] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform self-end mt-4">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 3: Organiza tu historial de salud */}
            <div 
              onClick={() => onNavigate('history')}
              className="bg-[#f0faf6] hover:bg-[#dff5ec] border border-teal-100/90 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#ccf0e2] text-teal-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <Folder size={22} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-sm lg:text-[15px] text-slate-900 mb-2 leading-snug">
                  Organiza tu historial de salud
                </h3>
                <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed font-normal">
                  Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform self-end mt-4">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 4: Últimos avances médicos */}
            <div 
              onClick={() => onNavigate('search')}
              className="bg-[#fff8f2] hover:bg-[#ffeedb] border border-orange-100/90 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#ffe4cc] text-orange-500 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <Lightbulb size={22} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-sm lg:text-[15px] text-slate-900 mb-2 leading-snug">
                  Últimos avances médicos
                </h3>
                <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed font-normal">
                  Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform self-end mt-4">
                <ArrowRight size={15} />
              </div>
            </div>

            {/* Card 5: Encuentra tu médico */}
            <div 
              onClick={() => onNavigate('doctors')}
              className="bg-[#f8f5ff] hover:bg-[#ede5ff] border border-purple-100/90 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-[#e6dbfd] text-purple-700 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                  <Stethoscope size={22} className="stroke-[2.2]" />
                </div>
                <h3 className="font-black text-sm lg:text-[15px] text-slate-900 mb-2 leading-snug">
                  Encuentra tu médico
                </h3>
                <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed font-normal">
                  Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform self-end mt-4">
                <ArrowRight size={15} />
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* 4. FOOTER BAR */}
      <footer className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex flex-wrap items-center gap-6 lg:gap-10">
          <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-semibold">
            <Users size={17} className="text-[#1d63ed]" />
            <span>Una IA médica de confianza</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-semibold">
            <Globe size={17} className="text-[#1d63ed]" />
            <span>Disponible 24/7</span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-semibold">
            <Heart size={17} className="text-[#1d63ed]" />
            <span>Mejor salud. Vidas más brillantes.</span>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('triage')}
          className="border border-slate-300 hover:border-[#1d63ed] text-slate-800 hover:text-[#1d63ed] px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <span>Descubre MIVOR.ai</span>
          <ArrowRight size={14} />
        </button>
      </footer>

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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>MIVOR.ai</strong> es la plataforma clínica de inteligencia artificial diseñada para empoderar a pacientes y profesionales médicos.
              </p>
              <p>
                Integramos análisis multimodales de analíticas y radiografías, triaje inteligente en tiempo real, búsqueda en repositorios científicos internacionales (PubMed, ClinicalTrials y Cochrane) y pasaportes de emergencia QR militares.
              </p>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-2 text-xs text-blue-800 font-semibold">
                <Lock size={15} className="shrink-0 text-blue-600" />
                <span>Cumplimiento estricto ISO 27001, HIPAA y RGPD Europeo.</span>
              </div>
            </div>
            <button 
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 bg-[#1d63ed] text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONTACTO */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1d63ed] flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Contacto & Soporte</h3>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3.5 text-sm text-slate-600">
              <p className="text-xs text-slate-500">
                ¿Tienes alguna consulta sobre la plataforma o necesitas asistencia médica técnica? Nuestro equipo está disponible 24/7.
              </p>
              <a 
                href="https://wa.me/?text=Hola%20MIVOR.ai,%20necesito%20asistencia%20con%20la%20plataforma." 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">Atención por WhatsApp</h4>
                  <p className="text-[11px] text-emerald-700">Respuesta inmediata</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Correo Oficial</h4>
                  <p className="text-[11px] text-slate-600">contacto@mivor.ai</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowContactModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientHomeDesktop;
