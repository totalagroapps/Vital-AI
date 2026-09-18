import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  FileText, 
  Heart, 
  Users, 
  User, 
  HelpCircle, 
  Bell, 
  ChevronDown, 
  LogOut, 
  QrCode, 
  Pill,
  Shield
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

export default function PatientTopNav({
  activeTab = 'home',
  onNavigate,
  userProfile,
  username,
  onLogout,
  onOpenEmergencyPassport,
  className = ''
}) {
  const { t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const displayName = userProfile?.full_name || username || 'María Pérez';
  
  const getInitials = (name) => {
    if (!name) return 'MP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navTabs = [
    { id: 'home', label: 'Inicio', icon: Home, screen: 'home' },
    { id: 'citas', label: 'Mis consultas', icon: Calendar, screen: 'citas' },
    { id: 'documents', label: 'Mis documentos', icon: FileText, screen: 'documents' },
    { id: 'treatments', label: 'Mi salud', icon: Heart, screen: 'treatments' },
    { id: 'specialists', label: 'Conectar con especialistas', icon: Users, screen: 'specialists' },
    { id: 'history', label: 'Mi perfil', icon: User, screen: 'history' },
  ];

  const handleTabClick = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleOpenHelp = () => {
    window.open('https://wa.me/?text=Hola,%20tengo%20una%20consulta%20en%20MIVOR.ai', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className={`bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs select-none ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* 1. BRAND LOGO & SLOGAN */}
        <div className="flex items-center gap-6 shrink-0">
          <div 
            onClick={() => handleTabClick('home')} 
            className="flex items-center cursor-pointer select-none shrink-0 group"
            title="MIVOR.ai - Inicio"
          >
            <img 
              src="/images/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-8 lg:h-9 w-auto object-contain transition-transform group-hover:scale-102" 
              onError={(e) => { 
                if (e.target.src.indexOf('mivor-logo.png') !== -1) {
                  e.target.src = '/assets/mivor-logo.png';
                }
              }}
            />
          </div>

          {/* 2. HORIZONTAL NAVIGATION TABS (DESKTOP) */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.screen)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#e0f2fe] text-[#0284c7] shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#0284c7] stroke-[2.4]' : 'text-slate-400 stroke-[2]'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. RIGHT UTILITIES: LANGUAGE, HELP, NOTIFICATIONS, USER AVATAR */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          
          {/* Selector de idioma */}
          <div className="hidden sm:block">
            <LanguageSelector variant="pill" />
          </div>

          {/* ¿Necesitas ayuda? */}
          <button 
            type="button"
            onClick={handleOpenHelp}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0284c7] transition-colors cursor-pointer py-1.5 px-2 rounded-xl hover:bg-slate-50"
            title="¿Necesitas ayuda? Escríbenos por WhatsApp"
          >
            <HelpCircle size={17} className="stroke-[2.2] text-slate-500" />
            <span className="hidden xl:inline">¿Necesitas ayuda?</span>
          </button>

          {/* Campana de Notificaciones */}
          <button 
            type="button"
            onClick={() => handleTabClick('search')}
            className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer" 
            title="Notificaciones y avisos de salud"
          >
            <Bell size={18} className="stroke-[2.2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </button>

          {/* Menú de Usuario con Avatar y Dropdown */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity p-1 rounded-xl hover:bg-slate-50"
              title={displayName}
            >
              <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white font-black text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {userProfile?.photo_url ? (
                  <img src={userProfile.photo_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <span className="hidden sm:block text-xs font-bold text-slate-800 truncate max-w-[130px]">
                {displayName}
              </span>
              <ChevronDown size={14} className={`hidden sm:block text-slate-400 transition-transform duration-150 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown flotante de usuario */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
                {/* Cabecera del usuario */}
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    {userProfile?.email || username || 'Paciente activo'}
                  </p>
                </div>

                {/* Enlaces directos */}
                <div className="px-1.5 py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('history'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <User size={15} className="text-teal-600" />
                    <span>Mi perfil clínico</span>
                  </button>

                  {onOpenEmergencyPassport && (
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); onOpenEmergencyPassport(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <QrCode size={15} className="text-red-500" />
                      <span>Pasaporte QR de emergencia</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('citas'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Calendar size={15} className="text-sky-600" />
                    <span>Mis consultas y citas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('documents'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <FileText size={15} className="text-blue-600" />
                    <span>Mis documentos médicos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('treatments'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Pill size={15} className="text-rose-500" />
                    <span>Mi salud y medicación</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('specialists'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Users size={15} className="text-emerald-600" />
                    <span>Conectar con especialistas</span>
                  </button>
                </div>

                {/* Mobile Language Selector */}
                <div className="sm:hidden px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Idioma:</span>
                  <LanguageSelector variant="pill" />
                </div>

                {/* Cerrar sesión */}
                {onLogout && (
                  <div className="border-t border-slate-100 mt-1 pt-1 px-1.5">
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
