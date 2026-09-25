import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  FileText, 
  Heart, 
  Users, 
  User, 
  HelpCircle, 
  ChevronDown, 
  LogOut, 
  QrCode, 
  Pill,
  Shield
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import SupportModal from './SupportModal';
import NotificationsBell from './NotificationsBell';
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
  const [showSupport, setShowSupport] = useState(false);
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

  const displayName = userProfile?.full_name || username || t('default_patient_name');
  
  const getInitials = (name) => {
    if (!name) return 'MP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navTabs = [
    { id: 'home', label: t('home'), shortLabel: t('home'), icon: Home, screen: 'home' },
    { id: 'citas', label: t('patienttopnav_mis_consultas'), shortLabel: t('nav_short_consultations'), icon: Calendar, screen: 'citas' },
    { id: 'documents', label: t('patienttopnav_mis_documentos'), shortLabel: t('nav_short_documents'), icon: FileText, screen: 'documents' },
    { id: 'treatments', label: t('patienttopnav_mi_salud'), shortLabel: t('patienttopnav_mi_salud'), icon: Heart, screen: 'treatments' },
    { id: 'specialists', label: t('patienttopnav_conectar_con_especialistas'), shortLabel: t('nav_short_specialists'), icon: Users, screen: 'specialists' },
    { id: 'history', label: t('patienttopnav_mi_perfil'), shortLabel: t('patienttopnav_mi_perfil'), icon: User, screen: 'history' },
  ];

  const handleTabClick = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleOpenHelp = () => setShowSupport(true);

  return (
    <header className={`bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs select-none ${className}`}>
      <div className="max-w-[1440px] mx-auto px-3 lg:px-4 xl:px-8 py-2 flex items-center justify-between gap-2 xl:gap-4">
        
        {/* 1. BRAND LOGO & SLOGAN */}
        <div className="flex items-center gap-2.5 xl:gap-6 shrink-0">
          <div 
            onClick={() => handleTabClick('home')} 
            className="flex items-center cursor-pointer select-none shrink-0 group"
            title={t('patienttopnav_mivor_ai_inicio')}
          >
            <img 
              src="/images/mivor-logo.png" 
              alt="MIVOR.ai" 
              className="h-7 lg:h-8 xl:h-9 w-auto object-contain transition-transform group-hover:scale-102" 
              onError={(e) => { 
                if (e.target.src.indexOf('mivor-logo.png') !== -1) {
                  e.target.src = '/assets/mivor-logo.png';
                }
              }}
            />
          </div>

          {/* 2. HORIZONTAL NAVIGATION TABS (DESKTOP) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 ml-1 xl:ml-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.screen)}
                  className={`flex items-center gap-1.5 px-2 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-[11.5px] xl:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-mivor-blueSoft text-brand shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-brand stroke-[2.4]' : 'text-slate-400 stroke-[2]'} />
                  <span className="hidden xl:inline">{tab.label}</span>
                  <span className="xl:hidden">{tab.shortLabel || tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. RIGHT UTILITIES: LANGUAGE, HELP, NOTIFICATIONS, USER AVATAR */}
        <div className="flex items-center gap-1.5 xl:gap-3 shrink-0">
          
          {/* Selector de idioma */}
          <div className="hidden sm:block">
            <LanguageSelector variant="pill" />
          </div>

          {/* ¿Necesitas ayuda? */}
          <button 
            type="button"
            onClick={handleOpenHelp}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand transition-colors cursor-pointer py-1.5 px-2 rounded-xl hover:bg-slate-50"
            title={t('patient_contact_support')}
          >
            <HelpCircle size={17} className="stroke-[2.2] text-slate-500" />
            <span className="hidden xl:inline">{t('patienttopnav_necesitas_ayuda')}</span>
          </button>

          {/* Campana de avisos (panel propio, sin punto rojo ficticio) */}
          <NotificationsBell onNavigate={handleTabClick} />

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
                    {userProfile?.email || username || t('patienttopnav_paciente_activo')}
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
                    <span>{t('patienttopnav_mi_perfil')}</span>
                  </button>

                  {onOpenEmergencyPassport && (
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); onOpenEmergencyPassport(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <QrCode size={15} className="text-red-500" />
                      <span>{t('patienttopnav_pasaporte_qr_de_emergencia')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('citas'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Calendar size={15} className="text-sky-600" />
                    <span>{t('patienttopnav_mis_consultas_y_citas')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('documents'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <FileText size={15} className="text-blue-600" />
                    <span>{t('patienttopnav_mis_documentos_medicos')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('treatments'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Pill size={15} className="text-rose-500" />
                    <span>{t('patienttopnav_mi_salud_y_medicacion')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleTabClick('specialists'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                  >
                    <Users size={15} className="text-emerald-600" />
                    <span>{t('patienttopnav_conectar_con_especialistas')}</span>
                  </button>
                </div>

                {/* Mobile Language Selector */}
                <div className="sm:hidden px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">{t('patienttopnav_idioma')}</span>
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
                      <span>{t('patient_menu_logout_title')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </header>
  );
}
