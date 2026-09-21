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
import PatientTopNav from '../components/PatientTopNav';

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
  const displayName = patientProfile?.full_name || username || t('default_patient_name');
  // 'No especificado' es el valor guardado por defecto: se muestra traducido
  const ns = (v) => (!v || v === 'No especificado' ? t('not_specified') : v);
  const getInitials = (name) => {
    if (!name) return "MP";
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Calculate age
  const age = useMemo(() => {
    if (!patientProfile?.date_of_birth) return null;
    try {
      const dob = new Date(patientProfile.date_of_birth);
      if (isNaN(dob.getTime())) return null;
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms); 
      return Math.abs(age_dt.getUTCFullYear() - 1970);
    } catch {
      return null;
    }
  }, [patientProfile?.date_of_birth]);

  // Calculate BMI
  const bmiInfo = useMemo(() => {
    const weightVal = parseFloat(patientProfile?.weight);
    const heightVal = parseFloat(patientProfile?.height) / 100;
    if (!weightVal || !heightVal) return { value: "--", status: t('insufficient_data'), color: "text-slate-600 bg-slate-50 border-slate-200" };
    
    const bmi = (weightVal / (heightVal * heightVal)).toFixed(1);
    let status = "";
    let color = "";
    if (bmi < 18.5) { status = t('underweight'); color = "text-blue-600 bg-blue-50 border-blue-200"; }
    else if (bmi >= 18.5 && bmi < 24.9) { status = t('healthy'); color = "text-emerald-700 bg-emerald-50 border-emerald-200"; }
    else if (bmi >= 25 && bmi < 29.9) { status = t('overweight'); color = "text-amber-700 bg-amber-50 border-amber-200"; }
    else { status = t('obesity'); color = "text-red-700 bg-red-50 border-red-200"; }
    
    return { value: bmi, status, color };
  }, [patientProfile?.weight, patientProfile?.height]);

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    const emergencyUrl = patientProfile?.emergency_url || 
      `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.user_id || 'me')}`;
    const text = t('emergencypassportm_ficha_medica_de_emergencia_mivor') +
      t('medicalhistory_paciente', { displayName }) +
      t('emergencypassportm_grupo_sanguineo', { value: patientProfile?.blood_type || 'N/D' }) +
      t('medicalhistory_donante_de_organos_2', { value: ns(patientProfile?.organ_donor) }) +
      t('emergencypassportm_alergias_2', { value: patientProfile?.allergies || 'No registradas' }) +
      (patientProfile?.medical_notes ? t('emergencypassportm_alerta_medica_2', { medical_notes: patientProfile.medical_notes }) : '') +
      (patientProfile?.insurance_provider ? t('emergencypassportv_seguro', { insurance_provider: patientProfile.insurance_provider }) : '') +
      t('medicalhistory_contacto_de_urgencias', { value: ns(patientProfile?.emergency_contact) }) +
      t('medicalhistory_ver_ficha_tactica_en_vivo', { emergencyUrl });
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Handle Email Share
  const handleShareEmail = () => {
    const emergencyUrl = patientProfile?.emergency_url || 
      `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.user_id || 'me')}`;
    const subject = t('medicalhistory_ficha_medica_de_emergencia_mivor', { displayName });
    const body = t('medicalhistory_ficha_medica_de_emergencia_mivor_2') +
      t('medicalhistory_paciente_2', { displayName }) +
      t('medicalhistory_grupo_sanguineo', { value: patientProfile?.blood_type || 'N/D' }) +
      t('medicalhistory_donante_de_organos_3', { value: ns(patientProfile?.organ_donor) }) +
      t('medicalhistory_alergias', { value: patientProfile?.allergies || 'No registradas' }) +
      (patientProfile?.medical_notes ? t('medicalhistory_alerta_medica', { medical_notes: patientProfile.medical_notes }) : '') +
      (patientProfile?.insurance_provider ? t('medicalhistory_seguro', { insurance_provider: patientProfile.insurance_provider }) : '') +
      t('medicalhistory_contacto_de_urgencias_2', { value: ns(patientProfile?.emergency_contact) }) +
      t('medicalhistory_ver_ficha_tactica_en_vivo_2', { emergencyUrl });
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const safeName = escapeHtml(displayName);
    const safeContact = escapeHtml(ns(patientProfile?.emergency_contact));
    const safeDob = escapeHtml(patientProfile?.date_of_birth || 'No especificada');
    const safeGender = escapeHtml(ns(patientProfile?.gender));
    const safeBlood = escapeHtml(patientProfile?.blood_type || 'N/D');
    const safeDonor = escapeHtml(ns(patientProfile?.organ_donor));
    const safeInsurance = escapeHtml(ns(patientProfile?.insurance_provider));
    const safeNotes = escapeHtml(patientProfile?.medical_notes);

    const title = t('medicalhistory_pasaporte_medico', { safeName });
    const bodyHtml = `
      <div class="header" style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #0f172a; margin: 0;"><span style="color: #0d9488;">MIVOR.ai</span${t('medicalhistory_ficha_medica_de_emergencia')}ia</h1>
        <p style="color: #64748b; margin: 5px 0 0 0${t('medicalhistory_historial_clinico_centralizado_y_seg')}uro</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div><${t('medicalhistory_paciente_3')}ciente:</strong> ${safeName}</div>
        <div><strong${t('medicalhistory_contacto_emergencia')}:</strong> ${safeContact}</div>
      </div>

      <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px${t('medicalhistory_datos_biometricos_y_vitales')}les</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div><st${t('medicalhistory_fecha_nacimiento')}ento:</strong> ${safeDob} (${age ?? '--'} ${t('emergencypassportv_anos')}</div>
        <div><strong${t('medicalhistory_genero')}:</strong> ${safeGender}</div>
        <div><strong${t('medicalhistory_grupo_sanguineo_2')}:</strong> <span style="color: #dc2626; font-size: 16px; font-weight: bold;">${safeBlood}</span></div>
        <div><strong${t('medicalhistory_donante_de_organos_4')}:</strong> ${safeDonor}</div>
        <div><strong${t('medicalhistory_imc')}:</strong> ${bmiInfo?.value} (${bmiInfo?.status})</div>
        <div><strong${t('medicalhistory_seguro_medico')}:</strong> ${safeInsurance}</div>
      </div>

      ${safeNotes ? `
      <h3 style="color: #dc2626;"${t('medicalhistory_alerta_medica_2')}a</h3>
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; color: #991b1b; font-weight: bold; margin-bottom: 20px;">
        ${safeNotes}
      </div>
      ` : ''}
      
      <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;${t('medicalhistory_condiciones_clinicas')}as</h3>
      <div style="margin-bottom: 15px;">
        <str${t('medicalhistory_alergias_conocidas')}das:</strong> ${escapeHtml(patientProfile?.allergies || 'No registradas')}
      </div>
      <div style="margin-bottom: 15px;">
        <stro${t('medicalhistory_enfermedades_cronicas')}as:</strong> ${escapeHtml(patientProfile?.chronic_conditions || 'Ninguna')}
      </div>
      <div style="margin-bottom: 20px;">
        <stro${t('medicalhistory_medicacion_activa')}va:</strong> ${escapeHtml(patientProfile?.current_medications || 'Ninguna')}
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    ${t('medicalhistory_generado_automaticamente_por_mivor_a')}i el ${new Date().toLocaleString()}<br/>
       ${t('medicalhistory_documento_medico_informativo_y_tacti')}.
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



  const triageItems = useMemo(() => {
    if (patientProfile?.triages && patientProfile.triages.length > 0) {
      return patientProfile.triages.map(t_item => ({
        id: t_item.id || String(Math.random()),
        display_date: new Date(t_item.created_at).toLocaleString(),
        status_label: t_item.status === 'closed_red' ? t('medicalhistory_prioridad_alta') : (t_item.status === 'closed_yellow' ? t('medicalhistory_consulta_prioritaria') : t('medicalhistory_orientacion_general')),
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
          status_label: sev === t('medicalhistory_rojo') || sev === t('medicalhistory_urgencia') ? t('medicalhistory_prioridad_alta') : (sev === t('medicalhistory_naranja') || sev === t('medicalhistory_amarillo') ? t('medicalhistory_consulta_prioritaria') : t('medicalhistory_orientacion_general')),
          severity_badge: sev === 'ROJO' || sev === 'URGENCIA' ? 'bg-red-50 text-red-700 border border-red-200' : (sev === 'NARANJA' || sev === 'AMARILLO' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'),
          text: s.payload?.summary || s.payload?.title || s.title || t('medicalhistory_consulta_de_orientacion_de_salud')
        };
      });
    }
    return [];
  }, [patientProfile?.triages, sessions]);

  // Lists of conditions
  const allergiesList = (patientProfile?.allergies || "").split(',').map(s => s.trim()).filter(Boolean);
  const conditionsList = (patientProfile?.chronic_conditions || "").split(',').map(s => s.trim()).filter(Boolean);
  const medicationsList = (patientProfile?.current_medications || "").split(',').map(s => s.trim()).filter(Boolean);

  const toggleTriageAccordion = (id) => {
    setExpandedTriages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col">
      
      {/* ================= TOP NAVBAR SUPERIOR UNIFICADO ================= */}
      <PatientTopNav
        activeTab="history"
        onNavigate={onNavigate}
        userProfile={patientProfile}
        username={username}
        onLogout={onLogout}
        onOpenEmergencyPassport={() => setShowEmergencyModal(true)}
      />

      {/* ================= PAGE BODY ================= */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6 pb-24">
        
        {/* Title and Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
             {t('your_info')} <br />
              <span className="text-[#0d9488]">{t('centralized_clinical')}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
             {t('medicalhistory_manten_tu_informacion_biologica_actu')}
            </p>
          </div>
          
          <div className="flex items-center gap-4 self-start sm:self-center">
            {/* Tagline right above button */}
            <div className="hidden lg:block text-right">
              <p className="text-xs font-black text-slate-900">{t('medicalhistory_tu_salud_siempre_contigo')}</p>
              <p className="text-[10.5px] text-slate-400 font-medium">{t('medicalhistory_informacion_segura_mejor_atencion_ma')}</p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
            >
              {isEditing ? <X size={15} /> : <Edit3 size={15} />}
              <span>{isEditing ? t('cancel') : t('edit_information')}</span>
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
                  <h3 className="font-extrabold text-base text-white">{t('medical_identity')}</h3>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                   {t('medicalhistory_urgencias')}
                  </span>
                </div>

                <p className="text-xs font-semibold text-emerald-100/90 mb-0.5">
                  {patientProfile?.full_name || username || 'cristianlv11'}
                </p>
                <p className="text-[11px] text-emerald-200/70 mb-4">
                 {t('scan_in_emergencies')}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="bg-[#01252d]/80 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white border border-[#044a56]/40">
                    <Droplet size={13} className="text-emerald-300 fill-emerald-300/20" /> {patientProfile?.blood_type || 'N/D'}
                  </div>
                  <div className="bg-[#01252d]/80 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white border border-[#044a56]/40">
                    <Calendar size={13} className="text-emerald-300" /> {age !== null ? t('medicalhistory_anos', { age }) : t('medicalhistory_anos_2')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setShowEmergencyModal(true)}
                    className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 font-black text-xs rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldAlert size={15} className="text-red-600" />
                    <span>{t('medicalhistory_chapa_militar_qr')}</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2.5 bg-[#023b36]/60 hover:bg-[#024a44]/80 active:scale-95 text-emerald-100 font-semibold text-xs rounded-full border border-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText size={15} />
                    <span>{t('export_passport_pdf')}</span>
                  </button>
                </div>
              </div>

              {/* QR Code thumbnail */}
              <div 
                onClick={() => setShowEmergencyModal(true)}
                className="relative z-10 bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title={t('medicalhistory_tocar_para_ampliar')}
              >
                {patientProfile?.qr_code_base64 ? (
                  <img 
                    src={`data:image/png;base64,${patientProfile.qr_code_base64}`} 
                    alt={t('medicalhistory_qr_code')} 
                    className="w-24 h-24 rounded-lg object-contain" 
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <QrCode size={32} />
                    <span className="text-[9px] mt-1 font-bold">{t('medicalhistory_qr_activo')}</span>
                  </div>
                )}
                <span className="text-[9px] font-black text-slate-800 mt-1.5 uppercase tracking-wider">
                 {t('medicalhistory_tocar_para_ampliar_2')}
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('medicalhistory_peso')}</span>
                <span className="text-2xl font-black text-slate-900 mt-1">
                  {patientProfile?.weight || '--'} <span className="text-xs font-bold text-slate-500">kg</span>
                </span>
              </div>

              {/* Altura */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                  <Ruler size={22} />
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('medicalhistory_altura')}</span>
                <span className="text-2xl font-black text-slate-900 mt-1">
                  {patientProfile?.height || '--'} <span className="text-xs font-bold text-slate-500">cm</span>
                </span>
              </div>

              {/* IMC Highlighted */}
              <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-2xl p-5 shadow-xs flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center mb-2">
                  <Activity size={22} />
                </div>
                <span className="text-[10px] text-amber-800/80 font-bold uppercase tracking-wider">{t('bmi_short')}</span>
                <span className="text-2xl font-black text-[#d97706] mt-1">
                  {bmiInfo?.value || '--'}
                </span>
                <span className="text-xs font-bold text-amber-800 mt-0.5">
                  {bmiInfo?.status || t('insufficient_data')}
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('medicalhistory_donante_de_organos')}</span>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {ns(patientProfile?.organ_donor)}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('medicalhistory_seguro_medico_mutua')}</span>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {ns(patientProfile?.insurance_provider)}
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
                <span>{t('share_medical_file_whatsapp')}</span>
              </button>

              {/* Button 2: Email */}
              <button
                onClick={handleShareEmail}
                className="w-full py-3 px-4 bg-[#f0f9ff] hover:bg-[#e0f2fe] active:scale-[0.99] text-[#0284c7] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 border border-[#bae6fd] shadow-xs transition-all cursor-pointer"
              >
                <Mail size={16} />
                <span>{t('medicalhistory_compartir_por_email')}</span>
              </button>

              {/* Button 3: Edit */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 px-4 bg-[#ede9fe] hover:bg-[#ddd6fe] active:scale-[0.99] text-[#6d28d9] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 border border-[#ddd6fe] transition-all cursor-pointer"
              >
                <Edit3 size={16} />
                <span>{t('edit_information')}</span>
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
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">{t('known_allergies')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {allergiesList.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            <AlertTriangle size={10} /> {a}
                          </span>
                        ))}
                        {allergiesList.length === 0 && <span className="text-[11px] font-semibold text-slate-400">{t('medicalhistory_no_registradas')}</span>}
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
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">{t('chronic_diseases')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {conditionsList.map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            {c}
                          </span>
                        ))}
                        {conditionsList.length === 0 && <span className="text-[11px] font-semibold text-slate-400">{t('medicalhistory_no_registradas')}</span>}
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
                      <span className="text-xs font-extrabold text-slate-900 block mb-1">{t('current_medication')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {medicationsList.map((m, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                            {m}
                          </span>
                        ))}
                        {medicationsList.length === 0 && <span className="text-[11px] font-semibold text-slate-400">{t('medicalhistory_no_registradas')}</span>}
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
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{t('emergency_contact')}</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                        {ns(patientProfile?.emergency_contact)}
                      </span>
                    </div>
                  </div>
                  {patientProfile?.emergency_contact ? (
                    <a 
                      href={`tel:${patientProfile.emergency_contact.replace(/[^0-9+]/g, '')}`} 
                      className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      title={t('detail_action_call')}
                    >
                      <Phone size={16} />
                    </a>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                  )}
                </div>

                {/* Historial de Orientaciones de Salud */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-purple-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">{t('my_triage_history') || 'Historial de Orientaciones de Salud'}</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1">
                     {t('medicalhistory_mas_recientes')} <ChevronDown size={14} />
                    </span>
                  </div>

                  <div className="space-y-4">
                    {triageItems.length === 0 && <p className="text-xs font-semibold text-slate-400 text-center py-4">{t('medicalhistory_aun_no_tienes_orientaciones_de')}</p>}
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
                            <span>{isExpanded ? t('medicalhistory_ver_menos') : t('medicalhistory_ver_mas')}</span>
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
              <span>{t('medicalhistory_editar_informacion_de_perfil_medico')}</span>
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('full_name')}</label>
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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('date_of_birth')}</label>
                  <input 
                    type="date" 
                    value={patientProfile?.date_of_birth || ""} 
                    onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('gender')}</label>
                  <select 
                    value={patientProfile?.gender || ""} 
                    onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="">{t('medicalhistory_seleccionar')}</option>
                    <option value="Masculino">{t('male')}</option>
                    <option value="Femenino">{t('female')}</option>
                    <option value="Otro">{t('other')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medicalhistory_grupo_sangre')}</label>
                  <select 
                    value={patientProfile?.blood_type || ""} 
                    onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50 font-bold text-red-600"
                  >
                    <option value="">{t('medicalhistory_sin_especificar')}</option>
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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medicalhistory_altura_cm')}</label>
                  <input 
                    type="number" 
                    value={patientProfile?.height || ""} 
                    onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder={t('medicalhistory_ej_170')} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('weight_kg')}</label>
                  <input 
                    type="number" 
                    value={patientProfile?.weight || ""} 
                    onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder={t('medicalhistory_ej_65')} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('organ_donor')}</label>
                  <select 
                    value={patientProfile?.organ_donor || "No especificado"} 
                    onChange={e => setPatientProfile({...patientProfile, organ_donor: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  >
                    <option value="No especificado">{t('not_specified')}</option>
                    <option value="Sí">{t('donor_yes')}</option>
                    <option value="No">{t('donor_no')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('insurance_provider')}</label>
                  <input 
                    type="text" 
                    value={patientProfile?.insurance_provider || ""} 
                    onChange={e => setPatientProfile({...patientProfile, insurance_provider: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    placeholder={t('medicalhistory_ej_sanitas_sura_eps')} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('emergency_contact')}</label>
                <input 
                  type="text" 
                  value={patientProfile?.emergency_contact || ""} 
                  onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  placeholder={t('medicalhistory_nombre_telefono')} 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medicalhistory_alergias_conocidas_separadas_por_com')}</label>
                <textarea 
                  value={patientProfile?.allergies || ""} 
                  onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder={t('medicalhistory_rinitis_penicilina')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medicalhistory_enfermedades_cronicas_separadas_por_')}</label>
                <textarea 
                  value={patientProfile?.chronic_conditions || ""} 
                  onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder={t('medicalhistory_hipertension_asma')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medicalhistory_medicacion_activa_separadas_por_coma')}</label>
                <textarea 
                  value={patientProfile?.current_medications || ""} 
                  onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder={t('medicalhistory_losartan_50mg')}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('medical_notes')}</label>
                <textarea 
                  value={patientProfile?.medical_notes || ""} 
                  onChange={e => setPatientProfile({...patientProfile, medical_notes: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                  rows={2} 
                  placeholder={t('medicalhistory_marcapasos_protesis')}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-xs hover:bg-slate-50 cursor-pointer"
                >
                 {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-3 rounded-xl shadow-xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={18} /> {t('medicalhistory_guardar_cambios')}
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
              <span>{t('patient_menu_logout_title')}</span>
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
