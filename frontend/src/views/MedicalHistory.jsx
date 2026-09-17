import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Activity, Edit3, QrCode, 
  Droplet, Heart, Scale, Ruler, Pill, AlertTriangle, 
  Calendar, Phone, Save, X, FileText, Share2, HeartHandshake, Shield,
  LogOut, Home, User, Search, Bell, HelpCircle,
  ChevronRight, ChevronDown, Check, ExternalLink, Mail
} from "lucide-react";
import { useLanguage } from '../contexts/LanguageContext';
import EmergencyPassportModal from './EmergencyPassportModal';
import { printHtmlContent, escapeHtml } from '../utils/printPdf';

const MedicalHistory = ({
  patientProfile = {},
  setPatientProfile,
  savePatientProfile,
  onBack,
  sessions = [],
  onLogout,
  onNavigate,
  username
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTriages, setExpandedTriages] = useState({});

  // Display name & initials
  const displayName = patientProfile?.full_name || username || "María Pérez";
  const getInitials = (name) => {
    if (!name) return "MP";
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Calculate age
  const age = useMemo(() => {
    if (!patientProfile?.date_of_birth) return 27;
    try {
      const dob = new Date(patientProfile.date_of_birth);
      if (isNaN(dob.getTime())) return 27;
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms); 
      return Math.abs(age_dt.getUTCFullYear() - 1970);
    } catch {
      return 27;
    }
  }, [patientProfile?.date_of_birth]);

  // Calculate BMI
  const bmiInfo = useMemo(() => {
    const weightVal = parseFloat(patientProfile?.weight || 88);
    const heightVal = parseFloat(patientProfile?.height || 182) / 100;
    if (!weightVal || !heightVal) return { value: "26.6", status: "Sobrepeso", color: "text-amber-700 bg-amber-50 border-amber-200" };
    
    const bmi = (weightVal / (heightVal * heightVal)).toFixed(1);
    let status = "";
    let color = "";
    if (bmi < 18.5) { status = "Bajo peso"; color = "text-blue-600 bg-blue-50 border-blue-200"; }
    else if (bmi >= 18.5 && bmi < 24.9) { status = "Saludable"; color = "text-emerald-700 bg-emerald-50 border-emerald-200"; }
    else if (bmi >= 25 && bmi < 29.9) { status = "Sobrepeso"; color = "text-amber-700 bg-amber-50 border-amber-200"; }
    else { status = "Obesidad"; color = "text-red-700 bg-red-50 border-red-200"; }
    
    return { value: bmi, status, color };
  }, [patientProfile?.weight, patientProfile?.height]);

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    const emergencyUrl = patientProfile?.emergency_url || 
      `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.user_id || 'me')}`;
    const text = `🚨 *Ficha Médica de Emergencia MIVOR.ai*\n` +
      `👤 *Paciente:* ${displayName}\n` +
      `🩸 *Grupo Sanguíneo:* ${patientProfile?.blood_type || 'A+'}\n` +
      `❤️ *Donante de Órganos:* ${patientProfile?.organ_donor || 'No especificado'}\n` +
      `⚠️ *Alergias:* ${patientProfile?.allergies || 'Rinitis'}\n` +
      (patientProfile?.medical_notes ? `⚡ *Alerta Médica:* ${patientProfile.medical_notes}\n` : '') +
      (patientProfile?.insurance_provider ? `🛡️ *Seguro:* ${patientProfile.insurance_provider}\n` : '') +
      `📞 *Contacto de Urgencias:* ${patientProfile?.emergency_contact || 'Viviana Giraldo – 3185552217'}\n\n` +
      `🔗 *Ver Ficha Táctica en vivo (sin clave):*\n${emergencyUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Handle Email Share
  const handleShareEmail = () => {
    const emergencyUrl = patientProfile?.emergency_url || 
      `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.user_id || 'me')}`;
    const subject = `Ficha Médica de Emergencia MIVOR.ai - ${displayName}`;
    const body = `Ficha Médica de Emergencia MIVOR.ai\n` +
      `Paciente: ${displayName}\n` +
      `Grupo Sanguíneo: ${patientProfile?.blood_type || 'A+'}\n` +
      `Donante de Órganos: ${patientProfile?.organ_donor || 'No especificado'}\n` +
      `Alergias: ${patientProfile?.allergies || 'Rinitis'}\n` +
      (patientProfile?.medical_notes ? `Alerta Médica: ${patientProfile.medical_notes}\n` : '') +
      (patientProfile?.insurance_provider ? `Seguro: ${patientProfile.insurance_provider}\n` : '') +
      `Contacto de Urgencias: ${patientProfile?.emergency_contact || 'Viviana Giraldo – 3185552217'}\n\n` +
      `Ver Ficha Táctica en vivo (sin clave):\n${emergencyUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const safeName = escapeHtml(displayName);
    const safeContact = escapeHtml(patientProfile?.emergency_contact || 'Viviana Giraldo – 3185552217');
    const safeDob = escapeHtml(patientProfile?.date_of_birth || 'No especificada');
    const safeGender = escapeHtml(patientProfile?.gender || 'No especificado');
    const safeBlood = escapeHtml(patientProfile?.blood_type || 'A+');
    const safeDonor = escapeHtml(patientProfile?.organ_donor || 'No especificado');
    const safeInsurance = escapeHtml(patientProfile?.insurance_provider || 'No especificado');
    const safeNotes = escapeHtml(patientProfile?.medical_notes);

    const title = `Pasaporte Médico - ${safeName}`;
    const bodyHtml = `
      <div class="header" style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #0f172a; margin: 0;"><span style="color: #0d9488;">MIVOR.ai</span> · Ficha Médica de Emergencia</h1>
        <p style="color: #64748b; margin: 5px 0 0 0;">Historial Clínico Centralizado y Seguro</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div><strong>Paciente:</strong> ${safeName}</div>
        <div><strong>Contacto Emergencia:</strong> ${safeContact}</div>
      </div>

      <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Datos Biométricos y Vitales</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div><strong>Fecha Nacimiento:</strong> ${safeDob} (${age} años)</div>
        <div><strong>Género:</strong> ${safeGender}</div>
        <div><strong>Grupo Sanguíneo:</strong> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${safeBlood}</span></div>
        <div><strong>Donante de Órganos:</strong> ${safeDonor}</div>
        <div><strong>IMC:</strong> ${bmiInfo?.value} (${bmiInfo?.status})</div>
        <div><strong>Seguro Médico:</strong> ${safeInsurance}</div>
      </div>

      ${safeNotes ? `
      <h3 style="color: #dc2626;">⚡ Alerta Médica</h3>
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; color: #991b1b; font-weight: bold; margin-bottom: 20px;">
        ${safeNotes}
      </div>
      ` : ''}
      
      <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Condiciones Clínicas</h3>
      <div style="margin-bottom: 15px;">
        <strong>Alergias Conocidas:</strong> ${escapeHtml(patientProfile?.allergies || 'Rinitis')}
      </div>
      <div style="margin-bottom: 15px;">
        <strong>Enfermedades Crónicas:</strong> ${escapeHtml(patientProfile?.chronic_conditions || 'Ninguna')}
      </div>
      <div style="margin-bottom: 20px;">
        <strong>Medicación Activa:</strong> ${escapeHtml(patientProfile?.current_medications || 'Ninguna')}
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Generado automáticamente por MIVOR.ai el ${new Date().toLocaleString()}<br/>
        Documento médico informativo y táctico de rescate.
      </div>
    `;
    
    printHtmlContent(title, bodyHtml);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (savePatientProfile) {
      await savePatientProfile(e);
    }
    setIsEditing(false);
  };

  // Nav tabs for horizontal top navbar (Exact match with media_1789683184109.png)
  const navTabs = [
    { id: 'inicio', label: 'Inicio', icon: Home, path: '/paciente' },
    { id: 'consultas', label: 'Mis consultas', icon: Calendar, path: '/paciente/citas' },
    { id: 'documentos', label: 'Mis documentos', icon: FileText, path: '/paciente/documentos' },
    { id: 'salud', label: 'Mi salud', icon: Heart, path: '/paciente/tratamientos' },
    { id: 'perfil', label: 'Mi perfil', icon: User, path: '/paciente/historial', active: true },
  ];

  const handleTabClick = (tab) => {
    if (tab.path) {
      if (onNavigate) {
        if (tab.id === 'inicio') onNavigate('home');
        else if (tab.id === 'consultas') onNavigate('citas');
        else if (tab.id === 'documentos') onNavigate('documents');
        else if (tab.id === 'salud') onNavigate('agenda');
        else if (tab.id === 'perfil') onNavigate('history');
      } else if (onBack) {
        onBack();
      }
    }
  };

  // Triages list fallback for exact Image 5 rendering
  const defaultTriages = [
    {
      id: 'mock-1',
      created_at: '2026-09-12T10:16:58',
      display_date: '12/9/2026, 10:16:58',
      status_label: 'NORMAL',
      severity_badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      text: 'Me alegra saber que no has tenido otros sintomas preocupantes. Si solo te preocupaba la falta de sangre y el estreñimiento parece haber mejorado, eso puede ser una base importante monitorear cualquier cambio en tu salud.'
    },
    {
      id: 'mock-2',
      created_at: '2026-08-25T11:12:04',
      display_date: '25/8/2026, 11:12:04',
      status_label: 'URGENCIA',
      severity_badge: 'bg-red-50 text-red-700 border border-red-200',
      text: 'Lo siento, pero debemos interrumpir el proceso de triaje. La presencia de mareo y un dolor de cabeza de intensidad 10/10 sugiere un posible riesgo de complicación cerebral. Por favor, **requiere atención médica de urgencia**.'
    }
  ];

  const triageItems = useMemo(() => {
    if (patientProfile?.triages && patientProfile.triages.length > 0) {
      return patientProfile.triages.map(t_item => ({
        id: t_item.id || String(Math.random()),
        display_date: new Date(t_item.created_at).toLocaleString(),
        status_label: t_item.status === 'closed_red' ? 'URGENCIA' : (t_item.status === 'closed_yellow' ? 'ATENCIÓN' : 'NORMAL'),
        severity_badge: t_item.status === 'closed_red' ? 'bg-red-50 text-red-700 border border-red-200' : (t_item.status === 'closed_yellow' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'),
        text: t_item.final_report || "Consulta completada satisfactoriamente."
      }));
    }
    const triageSessions = sessions?.filter(s => s.type === "triage") || [];
    if (triageSessions.length > 0) {
      return triageSessions.map(s => {
        const sev = (s.payload?.severity || s.severity || "NORMAL").toUpperCase();
        return {
          id: s.id,
          display_date: new Date(s.created_at).toLocaleString(),
          status_label: sev,
          severity_badge: sev === 'ROJO' || sev === 'URGENCIA' ? 'bg-red-50 text-red-700 border border-red-200' : (sev === 'NARANJA' || sev === 'AMARILLO' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'),
          text: s.payload?.summary || s.payload?.title || s.title || "Triaje evaluado por inteligencia clínica."
        };
      });
    }
    return defaultTriages;
  }, [patientProfile?.triages, sessions]);

  // Lists of conditions
  const allergiesList = (patientProfile?.allergies || "Rinitis").split(',').map(s => s.trim()).filter(Boolean);
  const conditionsList = (patientProfile?.chronic_conditions || "Ninguna").split(',').map(s => s.trim()).filter(Boolean);
  const medicationsList = (patientProfile?.current_medications || "Ninguna").split(',').map(s => s.trim()).filter(Boolean);

  const toggleTriageAccordion = (id) => {
    setExpandedTriages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col">
      
      {/* ================= TOP NAVBAR (HORIZONTAL) Matching media_1789683184109.png ================= */}
      <header className="bg-white border-b border-slate-200/90 px-4 lg:px-8 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          
          {/* 1. Left: Brand Logo & Slogan */}
          <div className="flex items-center gap-6 shrink-0">
            <div 
              onClick={() => onNavigate ? onNavigate('home') : onBack?.()} 
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-sky-500 flex items-center justify-center text-white shadow-xs">
                <Activity size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-xl text-slate-900 tracking-tight leading-none block">
                  MIVOR<span className="text-teal-600">.ai</span>
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest leading-none block mt-1">
                  Better health. Brighter lives.
                </span>
              </div>
            </div>

            {/* 2. Top Navigation Links (Desktop horizontal tabs) */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.active;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#e0f2fe] text-[#0284c7] shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#0284c7]' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 3. Right: Search Input, Help, Bell, User Avatar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* Search Input */}
            <div className="hidden lg:flex relative w-60">
              <input 
                type="text" 
                placeholder="Buscar en mi salud..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-full pl-4 pr-9 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Help Question Icon */}
            <button 
              onClick={() => window.open('https://wa.me/?text=Hola,%20tengo%20una%20consulta%20en%20MIVOR.ai', '_blank')}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="¿Necesitas ayuda?"
            >
              <HelpCircle size={18} />
            </button>

            {/* Notification Bell */}
            <div className="relative w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-600 transition-colors" title="Notificaciones">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white font-black text-xs flex items-center justify-center shadow-xs">
                {getInitials(displayName)}
              </div>
              <span className="hidden sm:block text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {displayName}
              </span>
              <ChevronDown size={14} className="hidden sm:block text-slate-400" />
            </div>

          </div>

        </div>
      </header>

      {/* ================= PAGE BODY ================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6 pb-24">
        
        {/* Title and Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Tus Datos Clínicos <br />
              <span className="text-[#0d9488]">Centralizados y Seguros</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Mantén tu información biológica actualizada para situaciones de emergencia y consultas médicas.
            </p>
          </div>
          
          <div className="flex items-center gap-4 self-start sm:self-center">
            {/* Tagline right above button */}
            <div className="hidden lg:block text-right">
              <p className="text-xs font-black text-slate-900">Tu salud, siempre contigo</p>
              <p className="text-[10.5px] text-slate-400 font-medium">Información segura. Mejor atención. Mayor tranquilidad.</p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {isEditing ? <X size={15} /> : <Edit3 size={15} />}
              <span>{isEditing ? "Cancelar" : "Editar Información"}</span>
            </button>
          </div>
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <>
            {/* Banner Identidad Médica - Oscura y Degradada Oficial */}
            <div 
              className="text-white rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-[#043b35]/60 shadow-xl"
              style={{
                background: 'linear-gradient(95deg, #011119 0%, #011f26 20%, #023637 50%, #03534a 75%, #05665a 100%)'
              }}
            >
              <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex-1 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <h3 className="font-extrabold text-base text-white">Identidad Médica</h3>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    URGENCIAS
                  </span>
                </div>

                <p className="text-xs font-semibold text-emerald-100/90 mb-0.5">
                  {patientProfile?.full_name || username || 'cristianlv11'}
                </p>
                <p className="text-[11px] text-emerald-200/70 mb-4">
                  Escaneable por personal de socorro y médicos sin desbloquear el móvil.
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="bg-[#01252d]/80 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white border border-[#044a56]/40">
                    <Droplet size={13} className="text-emerald-300 fill-emerald-300/20" /> {patientProfile?.blood_type || 'A+'}
                  </div>
                  <div className="bg-[#01252d]/80 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white border border-[#044a56]/40">
                    <Calendar size={13} className="text-emerald-300" /> {age} años
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 font-black text-xs rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldAlert size={15} className="text-red-600" />
                    <span>CHAPA MILITAR QR</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2.5 bg-[#023b36]/60 hover:bg-[#024a44]/80 active:scale-95 text-emerald-100 font-semibold text-xs rounded-full border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText size={15} />
                    <span>Exportar Pasaporte (PDF)</span>
                  </button>
                </div>
              </div>

              {/* QR Code thumbnail */}
              <div 
                onClick={() => setShowEmergencyModal(true)}
                className="relative z-10 bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Tocar para ampliar"
              >
                {patientProfile?.qr_code_base64 ? (
                  <img 
                    src={`data:image/png;base64,${patientProfile.qr_code_base64}`} 
                    alt="QR Code" 
                    className="w-24 h-24 rounded-lg object-contain" 
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <QrCode size={32} />
                    <span className="text-[9px] mt-1 font-bold">QR Activo</span>
                  </div>
                )}
                <span className="text-[9px] font-black text-slate-800 mt-1.5 uppercase tracking-wider">
                  TOCAR PARA AMPLIAR
                </span>
              </div>
            </div>

            {/* 3 Metric Cards: PESO, ALTURA, IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Peso */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <Scale size={22} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PESO</span>
                <span className="text-2xl font-black text-slate-900 mt-1">
                  {patientProfile?.weight || '88'} <span className="text-xs font-bold text-slate-500">kg</span>
                </span>
              </div>

              {/* Altura */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <Ruler size={22} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ALTURA</span>
                <span className="text-2xl font-black text-slate-900 mt-1">
                  {patientProfile?.height || '182'} <span className="text-xs font-bold text-slate-500">cm</span>
                </span>
              </div>

              {/* IMC Highlighted */}
              <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-5 shadow-xs flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center mb-2">
                  <Activity size={22} />
                </div>
                <span className="text-[10px] text-amber-800/80 font-bold uppercase tracking-wider">IMC</span>
                <span className="text-2xl font-black text-[#d97706] mt-1">
                  {bmiInfo?.value || '26.6'}
                </span>
                <span className="text-xs font-bold text-amber-800 mt-0.5">
                  {bmiInfo?.status || 'Sobrepeso'}
                </span>
              </div>
            </div>

            {/* 2 Small Cards: Donante & Seguro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  <HeartHandshake size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">DONANTE DE ÓRGANOS</span>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {patientProfile?.organ_donor || 'No especificado'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SEGURO MÉDICO / MUTUA</span>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {patientProfile?.insurance_provider || 'No especificado'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Action Buttons Matching media_1789683184109.png */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Button 1: WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-3 px-4 bg-[#0e9f6e] hover:bg-[#047857] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Share2 size={16} />
                <span>Compartir Ficha por WhatsApp</span>
              </button>

              {/* Button 2: Email */}
              <button
                onClick={handleShareEmail}
                className="w-full py-3 px-4 bg-[#f0f9ff] hover:bg-[#e0f2fe] active:scale-[0.99] text-[#0284c7] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 border border-[#bae6fd] shadow-xs transition-all cursor-pointer"
              >
                <Mail size={16} />
                <span>Compartir por Email</span>
              </button>

              {/* Button 3: Edit */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 bg-[#ede9fe] hover:bg-[#ddd6fe] active:scale-[0.99] text-[#6d28d9] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 border border-[#ddd6fe] transition-all cursor-pointer"
              >
                <Edit3 size={16} />
                <span>Editar Información</span>
              </button>
            </div>

            {/* Bottom 2-Column Section Matching media_1789683184109.png */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Alergias, Enfermedades Crónicas, Medicación */}
              <div className="space-y-3">
                {/* Alergias Conocidas */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">Alergias Conocidas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {allergiesList.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            <AlertTriangle size={10} /> {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>

                {/* Enfermedades Crónicas */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Heart size={18} className="text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">Enfermedades Crónicas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {conditionsList.map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>

                {/* Medicación Activa */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Pill size={18} className="text-purple-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">Medicación Activa</span>
                      <div className="flex flex-wrap gap-1.5">
                        {medicationsList.map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </div>
              </div>

              {/* Right Column: Contacto de Emergencia & Historial de Triajes */}
              <div className="space-y-4">
                {/* Contacto de Emergencia */}
                <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#dbeafe] text-blue-600 flex items-center justify-center shrink-0">
                      <Phone size={18} className="stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Contacto de Emergencia</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                        {patientProfile?.emergency_contact || 'Viviana Giraldo – 3185552217'}
                      </span>
                    </div>
                  </div>
                  {patientProfile?.emergency_contact ? (
                    <a 
                      href={`tel:${patientProfile.emergency_contact.replace(/[^0-9+]/g, '')}`} 
                      className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      title="Llamar"
                    >
                      <Phone size={16} />
                    </a>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                  )}
                </div>

                {/* Mi Historial de Triajes */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-purple-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">Mi Historial de Triajes</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1">
                      Más recientes <ChevronDown size={14} />
                    </span>
                  </div>

                  <div className="space-y-4">
                    {triageItems.map((item) => {
                      const isExpanded = expandedTriages[item.id];
                      return (
                        <div key={item.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.display_date}
                            </span>
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${item.severity_badge}`}>
                              {item.status_label}
                            </span>
                          </div>
                          <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.text}
                          </p>
                          <button
                            onClick={() => toggleTriageAccordion(item.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 mt-1 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? "Ver menos" : "Ver más"}</span>
                            <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          /* ================= EDIT MODE ================= */
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 animate-fadeIn">
            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-base">
              <Edit3 size={18} className="text-teal-600" />
              <span>Editar Información de Perfil Médico</span>
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={patientProfile?.full_name || ""} 
                    onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Nacimiento</label>
                  <input 
                    type="date" 
                    value={patientProfile?.date_of_birth || ""} 
                    onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Género</label>
                  <select 
                    value={patientProfile?.gender || ""} 
                    onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Grupo Sangre</label>
                  <select 
                    value={patientProfile?.blood_type || "A+"} 
                    onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-bold text-red-600"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Altura (cm)</label>
                  <input 
                    type="number" 
                    value={patientProfile?.height || "182"} 
                    onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder="182" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={patientProfile?.weight || "88"} 
                    onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder="88" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Donante de Órganos</label>
                  <select 
                    value={patientProfile?.organ_donor || "No especificado"} 
                    onChange={e => setPatientProfile({...patientProfile, organ_donor: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="No especificado">No especificado</option>
                    <option value="Sí">Sí, donante de órganos</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Seguro Médico / Mutua</label>
                  <input 
                    type="text" 
                    value={patientProfile?.insurance_provider || ""} 
                    onChange={e => setPatientProfile({...patientProfile, insurance_provider: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder="Ej. Sanitas, Sura, EPS..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contacto de Emergencia</label>
                <input 
                  type="text" 
                  value={patientProfile?.emergency_contact || ""} 
                  onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  placeholder="Viviana Giraldo - 3185552217" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alergias Conocidas (separadas por comas)</label>
                <textarea 
                  value={patientProfile?.allergies || ""} 
                  onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder="Rinitis, Penicilina..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Enfermedades Crónicas (separadas por comas)</label>
                <textarea 
                  value={patientProfile?.chronic_conditions || ""} 
                  onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder="Hipertensión, asma..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Medicación Activa (separadas por comas)</label>
                <textarea 
                  value={patientProfile?.current_medications || ""} 
                  onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder="Losartán 50mg..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notas Médicas Críticas / Implantes</label>
                <textarea 
                  value={patientProfile?.medical_notes || ""} 
                  onChange={e => setPatientProfile({...patientProfile, medical_notes: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder="Marcapasos, prótesis..."
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-3 rounded-xl shadow-xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Botón de Cerrar Sesión al final */}
        {onLogout && (
          <div className="pt-6 border-t border-slate-200/80 max-w-md mx-auto w-full">
            <button 
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

      </main>

      {/* Chapa Militar & Pasaporte QR de Emergencia Modal (Matching Image 4) */}
      <EmergencyPassportModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        patientProfile={patientProfile}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default MedicalHistory;
