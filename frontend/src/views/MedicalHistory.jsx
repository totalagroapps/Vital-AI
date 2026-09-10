import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, ShieldCheck, ShieldAlert, Activity, Edit3, QrCode, 
  Droplet, Heart, Scale, Ruler, Pill, AlertTriangle, 
  Calendar, Phone, Save, X, FileText, Share2, HeartHandshake, Shield,
  LogOut
} from "lucide-react";
import { useLanguage } from '../contexts/LanguageContext';
import EmergencyPassportModal from './EmergencyPassportModal';
import { printHtmlContent, escapeHtml } from '../utils/printPdf';

const MedicalHistory = ({
  patientProfile,
  setPatientProfile,
  savePatientProfile,
  onBack,
  sessions,
  onLogout
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const triageSessions = sessions?.filter(s => s.type === "triage") || [];

  // Calculate age
  const age = useMemo(() => {
    if (!patientProfile.date_of_birth) return "--";
    const dob = new Date(patientProfile.date_of_birth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  }, [patientProfile.date_of_birth]);

  // Calculate BMI
  const bmiInfo = useMemo(() => {
    if (!patientProfile.weight || !patientProfile.height) return null;
    const w = parseFloat(patientProfile.weight);
    const h = parseFloat(patientProfile.height) / 100; // cm to m
    if (!w || !h) return null;
    const bmi = (w / (h * h)).toFixed(1);
    
    let status = "";
    let color = "";
    if (bmi < 18.5) { status = t("underweight"); color = "text-blue-500 bg-blue-50 border-blue-200"; }
    else if (bmi >= 18.5 && bmi < 24.9) { status = t("healthy"); color = "text-brand-green bg-brand-green/10 border-brand-green/20"; }
    else if (bmi >= 25 && bmi < 29.9) { status = t("overweight"); color = "text-amber-600 bg-amber-50 border-amber-200"; }
    else { status = t("obesity"); color = "text-red-600 bg-red-50 border-red-200"; }
    
    return { value: bmi, status, color };
  }, [patientProfile.weight, patientProfile.height]);

  
  const handleShareWhatsApp = () => {
    const emergencyUrl = patientProfile.emergency_url || 
      `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile.user_id || 'me')}`;
    const text = `🚨 *Ficha Médica de Emergencia MIVOR.ai*\n` +
      `👤 *Paciente:* ${patientProfile.full_name || 'Paciente'}\n` +
      `🩸 *Grupo Sanguíneo:* ${patientProfile.blood_type || 'N/D'}\n` +
      `❤️ *Donante de Órganos:* ${patientProfile.organ_donor || 'No especificado'}\n` +
      `⚠️ *Alergias:* ${patientProfile.allergies || 'Sin alergias conocidas'}\n` +
      (patientProfile.medical_notes ? `⚡ *Alerta Médica:* ${patientProfile.medical_notes}\n` : '') +
      (patientProfile.insurance_provider ? `🛡️ *Seguro:* ${patientProfile.insurance_provider}\n` : '') +
      `📞 *Contacto de Urgencias:* ${patientProfile.emergency_contact || 'No especificado'}\n\n` +
      `🔗 *Ver Ficha Táctica en vivo (sin clave):*\n${emergencyUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleExportPDF = () => {
    const safeName = escapeHtml(patientProfile.full_name) || t("not_specified");
    const safeContact = escapeHtml(patientProfile.emergency_contact) || t("not_specified");
    const safeDob = escapeHtml(patientProfile.date_of_birth) || t("not_specified");
    const safeGender = escapeHtml(patientProfile.gender) || t("not_specified");
    const safeBlood = escapeHtml(patientProfile.blood_type) || t("not_specified");
    const safeDonor = escapeHtml(patientProfile.organ_donor) || t("donor_not_specified");
    const safeInsurance = escapeHtml(patientProfile.insurance_provider) || t("not_specified");
    const safeNotes = escapeHtml(patientProfile.medical_notes);

    const title = `${t("medical_passport")} - ${safeName || 'Paciente'}`;
    const bodyHtml = `
      <div class="header">
        <h1><span class="brand">MIVOR.ai</span> · ${t("medical_passport")}</h1>
        <p>${t("emergency_info_document")} · ${t('app_slogan')}</p>
      </div>
      
      <div class="grid">
        <div><div class="label">${t("patient_name")}</div><div class="value">${safeName}</div></div>
        <div><div class="label">${t("emergency_contact")}</div><div class="value">${safeContact}</div></div>
      </div>

      <h2>${t("biometric_data_vital_signs")}</h2>
      <div class="grid">
        <div><div class="label">${t("date_of_birth")}</div><div class="value">${safeDob} (${escapeHtml(age)} ${t("years")})</div></div>
        <div><div class="label">${t("gender")}</div><div class="value">${safeGender}</div></div>
        <div><div class="label">${t("blood_type")}</div><div class="value" style="color: #e11d48; font-size: 18px; font-weight: bold;">${safeBlood}</div></div>
        <div><div class="label">${t("organ_donor")}</div><div class="value">${safeDonor}</div></div>
        <div>
          <div class="label">${t("bmi_index")}</div>
          <div class="value">
            ${bmiInfo ? `${escapeHtml(bmiInfo.value)} (${escapeHtml(bmiInfo.status)})` : t("insufficient_data")}
          </div>
        </div>
        <div><div class="label">${t("insurance_provider")}</div><div class="value">${safeInsurance}</div></div>
      </div>

      ${safeNotes ? `
      <h2>⚡ ${t("medical_notes")}</h2>
      <div style="margin-bottom: 20px; background: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 8px; color: #9f1239; font-weight: bold;">
        ${safeNotes}
      </div>
      ` : ''}
      
      <h2>${t("clinical_history")}</h2>
      <div style="margin-bottom: 20px;">
        <div class="label" style="margin-bottom: 8px;">${t("known_allergies")}</div>
        <div>
          ${patientProfile.allergies ? patientProfile.allergies.split(',').map(a => `<span class="badge alert-badge">${escapeHtml(a.trim())}</span>`).join('') : t("none_registered")}
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <div class="label" style="margin-bottom: 8px;">${t("chronic_diseases")}</div>
        <div>
          ${patientProfile.chronic_conditions ? patientProfile.chronic_conditions.split(',').map(a => `<span class="badge">${escapeHtml(a.trim())}</span>`).join('') : t("none_registered")}
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <div class="label" style="margin-bottom: 8px;">${t("current_medications")}</div>
        <div>
          ${patientProfile.current_medications ? patientProfile.current_medications.split(',').map(a => `<span class="badge med-badge">${escapeHtml(a.trim())}</span>`).join('') : t("none_registered")}
        </div>
      </div>
      
      <div class="footer">
        ${t("auto_generated_document")} ${escapeHtml(new Date().toLocaleString())}<br/>
        ${t("informative_summary")} · MIVOR.ai Medical Systems
      </div>
    `;
    
    printHtmlContent(title, bodyHtml);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await savePatientProfile(e);
    setIsEditing(false);
  };

  const renderTags = (text, icon, emptyText, colorClass) => {
    if (!text || text.trim() === "") return <p className="text-xs text-gray-400 italic">{emptyText}</p>;
    const tags = text.split(',').map(t => t.trim()).filter(t => t);
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, i) => (
          <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${colorClass}`}>
            {icon} {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-base font-sans relative pb-28 overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[55%] md:w-[45%] lg:w-[40%] h-[380px] md:h-[500px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top opacity-60 mix-blend-multiply"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 30%, black 100%)' }} 
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base to-transparent" />
        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-base via-base/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="text-slate-800" size={20} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs">
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              {t("medical_profile")}
            </h2>
          </div>
          <button 
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1.5 flex items-center gap-1.5 font-extrabold text-xs rounded-full transition-all shadow-xs active:scale-95 ${isEditing ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-teal-700 text-white hover:bg-teal-800 border border-teal-700 shadow-sm'}`}
            title={isEditing ? (t("cancel") || "Cancelar") : (t("edit_information") || "Editar Información")}
          >
            {isEditing ? <X size={15} /> : <Edit3 size={15} />}
            <span>{isEditing ? (t("cancel") || "Cancelar") : (t("edit_information") || "Editar")}</span>
          </button>
        </div>

        {/* Hero Title */}
        <div className="mb-6 relative max-w-full md:max-w-[75%]">
          <div className="absolute -inset-4 bg-gradient-to-r from-white via-white/95 to-transparent blur-md z-[-1] pointer-events-none"></div>
          <h2 className="relative z-10 text-[26px] md:text-[30px] leading-tight font-extrabold text-slate-900 mb-1.5 drop-shadow-xs">
            {t("your_info")} <br />
            <span className="text-teal-700 font-black tracking-tight">{t("centralized_clinical")}</span>
          </h2>
          <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-700 max-w-[90%]">
            {t("keep_data_updated")}
          </p>
        </div>

        {/* QR Passport & Chapa Militar - Refined Glass Card */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-teal-800 text-white rounded-[28px] p-6 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border border-teal-500/20">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex-1 w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-white">
                <ShieldCheck size={20} className="text-teal-300" />
                {t("medical_identity")}
              </h3>
              <span className="text-[10px] uppercase font-black tracking-widest bg-red-500/90 text-white px-2 py-0.5 rounded-full border border-red-400/40">
                Urgencias
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium mb-1">{patientProfile.full_name || t("patient")}</p>
            <p className="text-[10px] text-teal-100/70 mb-3">{t("scan_in_emergencies")}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Droplet size={14} className="text-white" /> {patientProfile.blood_type || '--'}
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-white" /> {age} {t("years")}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setShowEmergencyModal(true)} 
                className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-white text-teal-900 hover:bg-teal-50 backdrop-blur-sm px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <ShieldAlert size={15} className="text-red-600" />
                <span>Chapa Militar QR</span>
              </button>

              <button 
                type="button"
                onClick={handleExportPDF} 
                className="flex items-center justify-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl transition-all active:scale-95"
              >
                <FileText size={15} />
                <span>{t("export_passport_pdf")}</span>
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowEmergencyModal(true)}
            className="relative z-10 transition-transform active:scale-95 hover:opacity-95 focus:outline-none"
            title="Ampliar Chapa Militar y Código QR"
          >
            {patientProfile.qr_code_base64 ? (
              <div className="bg-white p-2.5 rounded-2xl shadow-xl flex flex-col items-center">
                <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-24 h-24 rounded-xl" />
                <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase tracking-wider">Tocar para ampliar</span>
              </div>
            ) : (
              <div className="w-24 h-24 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-white/50 border border-white/30 border-dashed p-3">
                <QrCode size={24} className="mb-1" />
                <span className="text-[9px] text-center">{t("missing_data")}</span>
              </div>
            )}
          </button>
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <div className="space-y-6">
            
            {/* Quick Vitals / Biometrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex flex-col items-center text-center">
                <Scale size={20} className="text-purple-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("weight")}</span>
                <span className="text-lg font-bold text-gray-900 mt-1">{patientProfile.weight || '--'} <span className="text-xs font-medium text-gray-500">kg</span></span>
              </div>
              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex flex-col items-center text-center">
                <Ruler size={20} className="text-teal-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("height")}</span>
                <span className="text-lg font-bold text-gray-900 mt-1">{patientProfile.height || '--'} <span className="text-xs font-medium text-gray-500">cm</span></span>
              </div>
              <div className={`rounded-[24px] p-4 shadow-soft border flex flex-col items-center text-center ${bmiInfo ? bmiInfo.color : 'bg-white border-gray-100'}`}>
                <Activity size={20} className="mb-2 opacity-80" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t("bmi")}</span>
                <span className="text-lg font-bold mt-1">{bmiInfo ? bmiInfo.value : '--'}</span>
                {bmiInfo && <span className="text-[9px] font-bold mt-0.5">{bmiInfo.status}</span>}
              </div>
            </div>

            {/* Critical Identity Badges (Organ Donor & Insurance) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${patientProfile.organ_donor === 'Sí' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  <HeartHandshake size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("organ_donor") || "Donante"}</span>
                  <span className={`text-xs font-extrabold truncate block ${patientProfile.organ_donor === 'Sí' ? 'text-rose-600' : 'text-slate-800'}`}>
                    {patientProfile.organ_donor === 'Sí' ? (t("donor_yes") || "Sí, donante") : (patientProfile.organ_donor || t("donor_not_specified") || "No especificado")}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t("insurance_provider") || "Seguro"}</span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block">
                    {patientProfile.insurance_provider || t("not_specified") || "No registrado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Critical Medical Alert Notes */}
            {patientProfile.medical_notes && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-[24px] p-4 flex items-start gap-3 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                    {t("medical_notes") || "Alerta Médica / Implantes Críticos"}
                  </h4>
                  <p className="text-xs font-bold text-rose-800 mt-1 leading-relaxed">
                    {patientProfile.medical_notes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar (Share WhatsApp & Edit) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Share2 size={16} />
                <span>{t("share_medical_file_whatsapp") || "Compartir por WhatsApp"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-3 px-4 bg-brand-purple/10 hover:bg-brand-purple/20 active:scale-[0.99] text-brand-purple font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-brand-purple/30 transition-all shadow-sm"
              >
                <Edit3 size={16} className="text-brand-purple" />
                <span>{t("edit_information") || "Editar Información"}</span>
              </button>
            </div>

            {/* Clinical Data */}
            <div className="bg-white rounded-[28px] shadow-soft border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-orange-500" /> {t("known_allergies")}
                </h3>
                {renderTags(patientProfile.allergies, <AlertTriangle size={12}/>, t("no_allergies"), "bg-orange-50 text-orange-700 border border-orange-100")}
              </div>
              
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-red-500" /> {t("chronic_diseases")}
                </h3>
                {renderTags(patientProfile.chronic_conditions, <Activity size={12}/>, t("no_chronic_diseases"), "bg-red-50 text-red-700 border border-red-100")}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <Pill size={16} className="text-brand-purple" /> {t("current_medication")}
                </h3>
                {renderTags(patientProfile.current_medications, <Pill size={12}/>, t("no_medications"), "bg-brand-purple/10 text-brand-purple border border-brand-purple/20")}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-blue-50 rounded-[24px] p-5 border border-blue-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Phone size={14} /> {t("emergency_contact")}
                </h3>
                <p className="text-sm font-bold text-blue-700">{patientProfile.emergency_contact || t("not_specified")}</p>
              </div>
              {patientProfile.emergency_contact && (
                <a href={`tel:${patientProfile.emergency_contact.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
                  <Phone size={16} />
                </a>
              )}
            </div>

            {/* Triages Previos */}
            {triageSessions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1">{t("previous_consultations")}</h3>
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-soft overflow-hidden">
                  {triageSessions.slice(0, 5).map((session, idx) => (
                    <div key={session.id} className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${idx < (triageSessions.length > 5 ? 4 : triageSessions.length - 1) ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {(session.payload?.title || session.title || t("triage_consultation"))}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={10}/>
                          {new Date(session.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric'})}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        (session.payload?.severity || session.severity) === "ROJO" ? "bg-red-50 text-red-600 border border-red-200" :
                        (session.payload?.severity || session.severity) === "NARANJA" ? "bg-orange-50 text-orange-600 border border-orange-200" :
                        (session.payload?.severity || session.severity) === "AMARILLO" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                        (session.payload?.severity || session.severity) === "VERDE" ? "bg-brand-green/10 text-brand-green border border-brand-green/20" :
                        "bg-brand-purple/10 text-brand-purple border border-brand-purple/20"
                      }`}>
                        {(session.payload?.severity || session.severity) || "INFO"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 animate-fade-in">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-sm">
              <Edit3 size={18} className="text-brand-purple" />
              {t("edit_information")}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("full_name")}</label>
                  <input type="text" required value={patientProfile.full_name || ""} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("birth_date")}</label>
                  <input type="date" required value={patientProfile.date_of_birth || ""} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("gender")}</label>
                  <select value={patientProfile.gender || ""} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50">
                    <option value="">{t("select")}</option>
                    <option value="Masculino">{t("male")}</option>
                    <option value="Femenino">{t("female")}</option>
                    <option value="Otro">{t("other")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("blood")}</label>
                  <select value={patientProfile.blood_type || ""} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 px-1">
                    <option value="">--</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("height_cm")}</label>
                  <input type="number" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="175" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("weight_kg")}</label>
                  <input type="number" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="70" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("organ_donor") || "Donante de Órganos"}</label>
                  <select 
                    value={patientProfile.organ_donor || "No especificado"} 
                    onChange={e => setPatientProfile({...patientProfile, organ_donor: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                  >
                    <option value="No especificado">{t("donor_not_specified") || "No especificado"}</option>
                    <option value="Sí">{t("donor_yes") || "Sí, donante de órganos"}</option>
                    <option value="No">{t("donor_no") || "No"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("insurance_provider") || "Seguro Médico / Mutua"}</label>
                  <input 
                    type="text" 
                    value={patientProfile.insurance_provider || ""} 
                    onChange={e => setPatientProfile({...patientProfile, insurance_provider: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" 
                    placeholder={t("insurance_provider_placeholder") || "Ej. Sanitas, Adeslas (Póliza #)..."} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("medical_notes") || "Notas Médicas Críticas / Implantes"}</label>
                <textarea 
                  value={patientProfile.medical_notes || ""} 
                  onChange={e => setPatientProfile({...patientProfile, medical_notes: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" 
                  rows={2} 
                  placeholder={t("medical_notes_placeholder") || "Ej. Marcapasos bicameral, prótesis de titanio, diabético insulino-dependiente..."}
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("known_allergies_comma")}</label>
                <textarea value={patientProfile.allergies || ""} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Penicilina, polen..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("chronic_diseases_comma")}</label>
                <textarea value={patientProfile.chronic_conditions || ""} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Hipertensión, asma..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("current_medications_comma")}</label>
                <textarea value={patientProfile.current_medications || ""} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Losartán 50mg, Ibuprofeno..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">{t("emergency_contact")}</label>
                <input type="text" value={patientProfile.emergency_contact || ""} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="Nombre y teléfono" />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-2xl shadow-sm">{t("cancel")}</button>
                <button type="submit" className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-3 rounded-2xl shadow-glow transition-transform active:scale-95 flex items-center justify-center gap-2">
                  <Save size={18} /> {t("save_profile")}
                </button>
              </div>
            </form>
          </div>
        )}

        {!isEditing && (
          <div className="relative z-10 px-6 mt-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-purple" />
              {t("my_triage_history")}
            </h3>
            {patientProfile.triages && patientProfile.triages.length > 0 ? (
              <div className="space-y-4">
                {patientProfile.triages.map(t_item => (
                  <div key={t_item.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-gray-500 font-medium">{new Date(t_item.created_at).toLocaleString()}</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-bold tracking-wider ${
                          t_item.status === 'closed_red' ? 'bg-red-50 text-red-600 border border-red-200' :
                          t_item.status === 'closed_yellow' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                          'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                        {t_item.status === 'closed_red' ? t("urgency") : t_item.status === 'closed_yellow' ? t("attention") : t("normal")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{t_item.final_report}</div>
                    {t_item.recommended_specialty && (
                      <div className="mt-4 p-4 bg-brand-purple/5 border border-brand-purple/10 rounded-xl">
                        <p className="text-[11px] text-brand-purple font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          {t("smart_referral")}
                        </p>
                        <p className="text-sm font-bold text-gray-900">{t("recommended_specialty")}: {t_item.recommended_specialty}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-500">{t("no_previous_triages")}</p>
              </div>
            )}
          </div>
        )}

        {/* Botón de Cerrar Sesión al final de la ficha médica */}
        {onLogout && (
          <div className="mt-8 pt-6 border-t border-slate-200/80 max-w-md mx-auto w-full">
            <button 
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <LogOut size={16} />
              <span>{t("logout") || "Cerrar sesión"}</span>
            </button>
          </div>
        )}

      </div>

      {/* Chapa Militar & Pasaporte QR de Emergencia Modal */}
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

