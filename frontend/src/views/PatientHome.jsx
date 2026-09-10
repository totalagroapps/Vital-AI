import React, { useState } from 'react';
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
  Lock 
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

  return (
    <>
      {/* ================= VISTA MÓVIL (RÉPLICA EXACTA DISEÑO OFICIAL DEL JEFE) ================= */}
      <div className="block lg:hidden w-full min-h-screen bg-white font-sans text-slate-900 pb-24 overflow-x-hidden select-none">
        
        {/* 1. Barra Superior Móvil: Logo + Selector Idioma + Hamburguesa */}
        <header className="w-full px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
          {/* Logo Marca */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <img 
              src="/images/mivor_nav_logo.png" 
              alt="MIVOR.ai" 
              className="h-7 w-auto object-contain" 
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
          </div>

          {/* Controles Derecha: Idioma + Menú */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            
            <button 
              onClick={() => setShowDrawer(true)} 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              title="Menú"
            >
              <Menu size={22} className="stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* Contenedor Principal Móvil */}
        <main className="px-4 py-3 space-y-3">
          
          {/* 2. Sección Hero Móvil */}
          <section 
            className="flex items-center justify-between gap-2 pt-1 pb-2 relative"
            style={{
              backgroundImage: 'radial-gradient(circle at 85% 35%, rgba(186, 230, 253, 0.45) 0%, rgba(224, 242, 254, 0.2) 45%, rgba(255, 255, 255, 0) 75%)'
            }}
          >
            {/* Texto Hero Izquierda */}
            <div className="flex-1 pr-1">
              <h1 className="text-[23px] sm:text-[26px] font-black text-slate-900 leading-[1.12] tracking-tight mb-2">
                Tu salud,<br />
                en manos de la<br />
                <span className="text-[#1d63ed]">IA más avanzada</span><br />
                en medicina.
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-normal max-w-[260px]">
                Entiende, gestiona y mejora tu bienestar con información médica fiable, personalizada y siempre disponible.
              </p>
            </div>

            {/* Arte Hero Derecha: Emblema Circular + Eslogan Cursivo */}
            <div className="w-[145px] sm:w-[170px] shrink-0 flex items-center justify-center relative">
              <img 
                src="/images/mivor_mobile_hero_art.png" 
                alt="MIVOR.ai" 
                className="w-full h-auto object-contain drop-shadow-xs select-none pointer-events-none" 
              />
            </div>
          </section>

          {/* 3. Tarjeta de Confianza / Protección de Datos */}
          <div 
            onClick={() => setShowSecurityModal(true)}
            className="bg-[#f0f7ff] hover:bg-[#e4f0ff] border border-blue-100/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-[#1d63ed] flex items-center justify-center shrink-0">
              <ShieldCheck size={24} className="stroke-[2.2]" />
            </div>
            <div className="flex-1 pr-1">
              <h4 className="text-[13px] sm:text-sm font-bold text-slate-900 leading-tight group-hover:text-[#1d63ed] transition-colors">
                Tus datos están protegidos
              </h4>
              <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-tight mt-0.5">
                Cifrado de nivel médico y cumplimiento con los más altos estándares de seguridad (ISO 27001, GDPR y normativa sanitaria).
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>

          {/* 4. Las 5 Tarjetas de Acción Móviles (Listado Vertical Oficial) */}
          <div className="space-y-2.5 pt-1">
            
            {/* Tarjeta 1: Pregunta a MIVOR.ai */}
            <div 
              onClick={() => onNavigate('general_chat')}
              className="bg-[#fbf9ff] hover:bg-[#f3edff] border border-purple-100/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Brain size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                  Pregunta a MIVOR.ai
                </h3>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                  Resuelve tus dudas de salud, entiende tus síntomas y descubre información médica y científica con la ayuda de una IA médica avanzada.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#9333ea] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Tarjeta 2: Analiza tus pruebas médicas */}
            <div 
              onClick={() => onNavigate('documents')}
              className="bg-[#f0f7ff] hover:bg-[#e2f0fe] border border-blue-100/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Activity size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                  Analiza tus pruebas médicas
                </h3>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                  Descubre qué dicen tus pruebas. MIVOR.ai las analiza con IA médica avanzada, identifica posibles alteraciones y te explica los resultados de forma clara y comprensible.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0284c7] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Tarjeta 3: Organiza tu historial de salud */}
            <div 
              onClick={() => onNavigate('history')}
              className="bg-[#f0fdf9] hover:bg-[#def7ee] border border-teal-100/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Folder size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                  Organiza tu historial de salud
                </h3>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                  Toda tu información médica en un solo lugar, para que tú o un familiar autorizado podáis facilitarla de forma segura a un médico cuando la necesitéis.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0d9488] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Tarjeta 4: Últimos avances médicos */}
            <div 
              onClick={() => onNavigate('search')}
              className="bg-[#fff8f1] hover:bg-[#ffeedd] border border-orange-100/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ffedd5] text-[#ea580c] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lightbulb size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                  Últimos avances médicos
                </h3>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                  Descubre los últimos avances médicos y científicos sobre enfermedades, tratamientos y salud, explicados de forma clara y actualizada.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#ea580c] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Tarjeta 5: Encuentra tu médico */}
            <div 
              onClick={() => onNavigate('doctors')}
              className="bg-[#faf5ff] hover:bg-[#ede5ff] border border-purple-100/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <UserCheck size={22} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-tight">
                  Encuentra tu médico
                </h3>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                  Busca un médico por especialidad y encuentra la opción que mejor se adapte a ti: una consulta cerca de donde estás o una videoconferencia rápida desde cualquier lugar.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <ArrowRight size={16} />
              </div>
            </div>

          </div>
        </main>

        {/* 5. Barra de Navegación Inferior Oficial Móvil (Las 5 pestañas de la maqueta) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1.5 pb-2.5 z-40 select-none">
          <div className="grid grid-cols-5 items-center text-center">
            
            {/* Pestaña 1: Para médicos */}
            <button 
              type="button" 
              onClick={() => { window.location.href = '/medico'; }}
              className="flex flex-col items-center justify-center gap-0.5 py-1 text-slate-600 hover:text-[#1d63ed] active:scale-95 transition-all"
            >
              <Users size={21} className="stroke-[2]" />
              <span className="text-[9.5px] font-medium leading-tight">Para médicos</span>
            </button>

            {/* Pestaña 2: Cómo funciona */}
            <button 
              type="button" 
              onClick={() => setShowHowModal(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 text-slate-600 hover:text-[#1d63ed] active:scale-95 transition-all"
            >
              <Sliders size={21} className="stroke-[2]" />
              <span className="text-[9.5px] font-medium leading-tight">Cómo funciona</span>
            </button>

            {/* Pestaña 3: Inicio (Central Activo) */}
            <button 
              type="button" 
              onClick={() => onNavigate('home')}
              className="flex flex-col items-center justify-center gap-0.5 py-1 active:scale-95 transition-all"
            >
              <Home size={23} className="text-[#1d63ed] fill-[#1d63ed]" />
              <span className="text-[10px] font-bold text-[#1d63ed] leading-tight">Inicio</span>
              <span className="w-6 h-[2px] bg-[#1d63ed] rounded-full mt-0.5" />
            </button>

            {/* Pestaña 4: Sobre MIVOR.ai */}
            <button 
              type="button" 
              onClick={() => setShowAboutModal(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 text-slate-600 hover:text-[#1d63ed] active:scale-95 transition-all"
            >
              <Info size={21} className="stroke-[2]" />
              <span className="text-[9.5px] font-medium leading-tight">Sobre MIVOR.ai</span>
            </button>

            {/* Pestaña 5: Eslogan / Misión */}
            <button 
              type="button" 
              onClick={() => setShowMissionModal(true)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 text-slate-600 hover:text-[#1d63ed] active:scale-95 transition-all"
            >
              <Heart size={21} className="text-[#1d63ed] stroke-[2]" />
              <span className="text-[7.5px] font-normal leading-[1.1] text-slate-500 max-w-[80px]">
                Juntos por una medicina más humana y eficiente.
              </span>
            </button>

          </div>
        </nav>

        {/* 6. DRAWER / MENÚ LATERAL MÓVIL */}
        {showDrawer && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
            <div className="w-4/5 max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
              
              <div>
                {/* Header Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src="/images/mivor_nav_logo.png" alt="MIVOR.ai" className="h-6 w-auto object-contain" />
                  </div>
                  <button 
                    onClick={() => setShowDrawer(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Perfil Mini */}
                <div 
                  onClick={() => { setShowDrawer(false); onNavigate('history'); }}
                  className="mt-4 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-50/60 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    <img 
                      src={userProfile?.photo_url || "/images/mivor_avatar_default.png"} 
                      alt="Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {userProfile?.full_name || username || "Mi cuenta"}
                    </h4>
                    <p className="text-[10px] text-[#1d63ed] font-semibold">Ver Historial y Perfil →</p>
                  </div>
                </div>

                {/* Enlaces de Navegación del Drawer */}
                <div className="mt-5 space-y-1">
                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('general_chat'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1d63ed] transition-colors text-left"
                  >
                    <Brain size={17} className="text-[#9333ea]" />
                    <span>Pregunta a MIVOR.ai</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('documents'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1d63ed] transition-colors text-left"
                  >
                    <Activity size={17} className="text-[#0284c7]" />
                    <span>Analiza tus pruebas médicas</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('history'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1d63ed] transition-colors text-left"
                  >
                    <Folder size={17} className="text-[#0d9488]" />
                    <span>Organiza tu historial de salud</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('search'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1d63ed] transition-colors text-left"
                  >
                    <Lightbulb size={17} className="text-[#ea580c]" />
                    <span>Últimos avances médicos</span>
                  </button>

                  <button 
                    onClick={() => { setShowDrawer(false); onNavigate('doctors'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1d63ed] transition-colors text-left"
                  >
                    <UserCheck size={17} className="text-[#7c3aed]" />
                    <span>Encuentra tu médico</span>
                  </button>

                  <div className="pt-2 pb-1 border-t border-slate-100 my-2" />

                  <button 
                    onClick={() => { setShowDrawer(false); setShowContactModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors text-left"
                  >
                    <MessageCircle size={16} className="text-emerald-600" />
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Sobre MIVOR.ai</h3>
                </div>
                <button onClick={() => setShowAboutModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="py-3 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>MIVOR.ai</strong> es una plataforma de salud impulsada por inteligencia artificial clínica de última generación, diseñada para acompañar a pacientes y médicos en la toma de decisiones informadas.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 text-[11px]">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span>Cifrado de grado médico y cumplimiento estricto con normativas GDPR e ISO 27001.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Heart size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Juntos por una medicina más humana, accesible y eficiente.</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowAboutModal(false)} className="bg-[#1d63ed] text-white font-semibold text-xs px-4 py-2 rounded-full">
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CÓMO FUNCIONA */}
        {showHowModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d63ed] flex items-center justify-center">
                    <Sliders size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Cómo funciona</h3>
                </div>
                <button onClick={() => setShowHowModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="py-3 space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1d63ed] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p><strong>Pregunta o sube tus informes:</strong> Escribe tus dudas de salud o sube tus análisis médicos en PDF o imagen.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1d63ed] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p><strong>Análisis clínico con IA:</strong> Nuestro sistema traduce jerga técnica compleja a explicaciones comprensibles y seguras.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1d63ed] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p><strong>Conecta con profesionales:</strong> Encuentra especialistas y comparte tu historial de forma segura para consultas presenciales o telemáticas.</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowHowModal(false)} className="bg-[#1d63ed] text-white font-semibold text-xs px-4 py-2 rounded-full">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MISIÓN / JUNTOS POR UNA MEDICINA */}
        {showMissionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Heart size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Nuestro Compromiso</h3>
                </div>
                <button onClick={() => setShowMissionModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="py-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 text-[13px]">
                  "Juntos por una medicina más humana y eficiente."
                </p>
                <p>
                  En MIVOR.ai creemos que la tecnología debe empoderar al paciente y facilitar la labor del profesional médico, reduciendo la ansiedad provocada por la falta de información y agilizando la atención médica.
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowMissionModal(false)} className="bg-[#1d63ed] text-white font-semibold text-xs px-4 py-2 rounded-full">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CONTACTO */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1d63ed] flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Contacto & Soporte</h3>
                </div>
                <button onClick={() => setShowContactModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <div className="py-3 space-y-2.5 text-xs text-slate-600">
                <p>Atención directa disponible 24/7:</p>
                <a 
                  href="https://wa.me/34600000000" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 text-emerald-900 font-semibold"
                >
                  <MessageCircle size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs">WhatsApp 24/7</p>
                    <p className="text-[10px] text-slate-500 font-normal">Respuesta inmediata</p>
                  </div>
                </a>
                <a 
                  href="mailto:soporte@mivor.ai" 
                  className="flex items-center gap-3 p-3 rounded-2xl border border-blue-100 bg-blue-50/60 text-blue-900 font-semibold"
                >
                  <Mail size={18} className="text-[#1d63ed] shrink-0" />
                  <div>
                    <p className="text-xs">soporte@mivor.ai</p>
                    <p className="text-[10px] text-slate-500 font-normal">Consultas médicas y técnicas</p>
                  </div>
                </a>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowContactModal(false)} className="bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-full">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PROTECCIÓN DE DATOS Y PRIVACIDAD */}
        {showSecurityModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1d63ed] flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">Tus datos están protegidos</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Seguridad de grado hospitalario y privacidad</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSecurityModal(false)} 
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-3.5 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <p>
                  En <strong>MIVOR.ai</strong>, la confidencialidad y protección de tu información de salud es nuestra máxima prioridad:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <Lock size={16} className="text-[#1d63ed] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[11.5px] text-slate-900">Cifrado de extremo a extremo</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Todos tus datos, consultas e informes médicos se transmiten y almacenan bajo cifrado militar AES-256.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[11.5px] text-slate-900">Cumplimiento ISO 27001 & RGPD</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Auditorías continuas de seguridad de la información conforme a estándares internacionales y normativa europea sanitaria.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[11.5px] text-slate-900">Privacidad clínica absoluta</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Tus informes jamás son compartidos ni comercializados ni usados para entrenar modelos públicos de IA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setShowSecurityModal(false)} 
                  className="bg-[#1d63ed] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-full transition-colors cursor-pointer"
                >
                  Entendido
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
