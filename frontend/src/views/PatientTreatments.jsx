import React, { useState, useEffect, useRef } from 'react';
import { Pill, Plus, Check, Clock, Trash2, ArrowLeft, UploadCloud, Loader2, Paperclip, Printer } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import PatientTopNav from '../components/PatientTopNav';
import { printHtmlContent, escapeHtml } from '../utils/printPdf';

export default function PatientTreatments({ 
  apiUrl, 
  authHeaders, 
  onNavigate,
  userProfile,
  username,
  onLogout 
}) {
  const { t, locale } = useLanguage();
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMed, setNewMed] = useState({ medication_name: '', dosage: '', frequency: '', time_of_day: '' });
  const [isExtracting, setIsExtracting] = useState(false);
  const [medQueue, setMedQueue] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/medications`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMedications(data.reminders || []);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);
    setMedQueue([]);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await fetch(`${apiUrl}/api/documents/extract_medication`, {
        method: 'POST',
        headers: {
          'Authorization': authHeaders.Authorization
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.medications && data.medications.length > 0) {
          const med = data.medications[0];
          setIsAdding(true);
          setNewMed({
            medication_name: med.medication_name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            time_of_day: med.time_of_day || ''
          });
          if (data.medications.length > 1) {
            setMedQueue(data.medications.slice(1));
            alert(t("multiple_medications_extracted", { count: data.medications.length }));
          }
        } else {
          alert(t("no_medications_found"));
        }
      } else {
        alert(t("document_analysis_error"));
      }
    } catch (err) {
      console.error(err);
      alert(t("connection_error"));
    }
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      processFiles(pastedFiles);
    }
  };

  const handleToggleLog = async (med) => {
    // Optimistic update
    setMedications(prev => prev.map(m => m.id === med.id ? { ...m, taken_today: !m.taken_today } : m));
    
    try {
      if (med.taken_today) {
        await fetch(`${apiUrl}/api/medications/${med.id}/log`, { method: 'DELETE', headers: authHeaders });
      } else {
        await fetch(`${apiUrl}/api/medications/${med.id}/log`, { method: 'POST', headers: authHeaders });
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      fetchMedications();
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!newMed.medication_name) return;
    try {
      const res = await fetch(`${apiUrl}/api/medications`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed)
      });
      if (res.ok) {
        fetchMedications();
        if (medQueue.length > 0) {
          const nextMed = medQueue[0];
          setNewMed({
            medication_name: nextMed.medication_name || '',
            dosage: nextMed.dosage || '',
            frequency: nextMed.frequency || '',
            time_of_day: nextMed.time_of_day || ''
          });
          setMedQueue(prev => prev.slice(1));
        } else {
          setNewMed({ medication_name: '', dosage: '', frequency: '', time_of_day: '' });
          setIsAdding(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("confirm_delete_treatment"))) return;
    try {
      await fetch(`${apiUrl}/api/medications/${id}`, { method: 'DELETE', headers: authHeaders });
      fetchMedications();
    } catch (e) {
      console.error(e);
    }
  };


  const handlePrintFridgeSheet = async () => {
    if (!medications || medications.length === 0) {
      alert(t('patienttreatments_no_tienes_medicamentos_registrados_para_'));
      return;
    }
    const patientName = userProfile?.full_name || username || t('default_patient_name');
    const dateStr = new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const medRows = medications.map(m => `
      <tr>
        <td style="padding: 10px 12px; font-weight: bold; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
          💊 ${escapeHtml(m.medication_name)}
        </td>
        <td style="padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
          ${escapeHtml(m.dosage || t('patienttreatments_segun_indicacion_medica'))}
        </td>
        <td style="padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0;">
          ${escapeHtml(m.time_of_day || m.frequency || t('patienttreatments_horario_habitual'))}
        </td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; width: 22px; height: 22px; border: 2px solid #0047d6; border-radius: 6px;"></span>
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 3px solid #0047d6; padding-bottom: 14px; margin-bottom: 20px;">
          <h1 style="color: #0b1a30; margin: 0; font-size: 26px; font-weight: 800;">
            MIVOR<span style="color: #0047d6;">.ai</span> — Plan de Medicación Diario
          </h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">
            Hoja de control clara para la nevera • ${escapeHtml(patientName)}
          </p>
          <p style="color: #94a3b8; margin: 2px 0 0 0; font-size: 12px;">Fecha de emisión: ${escapeHtml(dateStr)}</p>
        </div>

        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #0047d6;">
          📌 <strong>Instrucciones para el paciente o cuidador:</strong> Mantén esta hoja en un lugar visible (como la nevera). Marca la casilla con un bolígrafo cada vez que tomes tu medicación para no olvidar ninguna toma.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #0047d6; color: #ffffff;">
              <th style="padding: 12px; text-align: left; font-size: 14px; border-radius: 8px 0 0 0;">Medicamento</th>
              <th style="padding: 12px; text-align: left; font-size: 14px;">Dosis</th>
              <th style="padding: 12px; text-align: left; font-size: 14px;">Horario / Momento</th>
              <th style="padding: 12px; text-align: center; font-size: 14px; border-radius: 0 8px 0 0;">Tomado</th>
            </tr>
          </thead>
          <tbody>
            ${medRows}
          </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 30px; font-size: 12px; color: #475569; border-top: 2px dashed #cbd5e1; padding-top: 16px;">
          <div>
            <strong>Teléfono de Emergencias:</strong> 112 / 911<br />
            <strong>Centro de Salud / Hospital:</strong> Consulte su centro habitual
          </div>
          <div style="text-align: right;">
            <strong>Aviso de seguridad:</strong> No suspender ni alterar dosis de tratamientos sin consultar a su médico colegiado.
          </div>
        </div>
      </div>
    `;

    await printHtmlContent(`Plan_Medicacion_${patientName.replace(/\s+/g, '_')}`, htmlContent);
  };

  return (
    <div className="flex flex-col min-h-screen bg-base font-sans relative pb-28 overflow-x-hidden">
      {/* Top Navbar Unificado */}
      <PatientTopNav
        activeTab="treatments"
        onNavigate={onNavigate}
        userProfile={userProfile}
        username={username}
        onLogout={onLogout}
      />

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

      <div className="relative z-10 px-6 pt-12 flex-1">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="text-slate-800" size={20} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs">
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              {t("treatments")}
            </h2>
          </div>
          <div className="w-10"></div>
        </div>

        <div className="mb-6 relative max-w-full md:max-w-[75%]">
          <div className="absolute -inset-4 bg-gradient-to-r from-white via-white/95 to-transparent blur-md z-[-1] pointer-events-none"></div>
          <h1 className="relative z-10 text-2xl lg:text-3xl font-black text-mivor-navy tracking-tight leading-tight mb-1.5">
            {t("my_medications")} <span className="text-brand font-black tracking-tight">{t("medications")}</span>
          </h1>
          <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-700 max-w-[90%]">
            {t("mark_medications_taken")}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 text-white rounded-[28px] p-6 shadow-lg relative overflow-hidden mb-8 border border-blue-500/20">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-lg mb-1 text-white tracking-tight">{t("daily_progress")}</h3>
              <p className="text-xs text-blue-100/90 font-medium">{t("taken_today", { taken: medications.filter(m => m.taken_today).length, total: medications.length })}</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-blue-400/40 bg-blue-900/40 flex items-center justify-center">
              <span className="font-black text-lg text-white">
                {medications.length > 0 ? Math.round((medications.filter(m => m.taken_today).length / medications.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Prescription Upload Card */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <UploadCloud size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{t("have_prescription") || "¿Tienes una receta médica?"}</h4>
              <p className="text-xs text-slate-600 font-medium">{t("extract_from_prescription_desc") || "Sube tu receta en PDF o foto para cargar la medicación automáticamente."}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isExtracting}
            className="w-full sm:w-auto px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0 disabled:opacity-50"
          >
            {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            <span>{isExtracting ? (t("analyzing_with_ai") || "Analizando...") : (t("upload_prescription_pdf") || "Subir PDF / Imagen")}</span>
          </button>
        </div>

        
        {/* Botón Imprimir Plan Nevera */}
        {medications.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handlePrintFridgeSheet}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-2xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              title={t('patienttreatments_genera_una_hoja_clara_en_pdf')}
            >
              <Printer size={16} className="text-brand" />
              <span>{t('patienttreatments_imprimir_plan_para_la_nevera')}</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4 mb-8">
          {isLoading ? (
            <p className="text-center text-slate-500 text-sm py-4">{t("loading")}</p>
          ) : medications.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-soft border border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pill className="text-slate-400 w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{t("no_active_treatments")}</h3>
              <p className="text-xs text-slate-500 mb-6">{t("add_medication_prompt")}</p>
              <button onClick={() => setIsAdding(true)} className="bg-brand hover:bg-brand-hover text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md flex items-center gap-2 mx-auto transition-all active:scale-95">
                <Plus size={16} /> {t("add_medication")}
              </button>
            </div>
          ) : (
            <>
              {medications.map(med => (
                <div key={med.id} className={`bg-white rounded-3xl p-5 shadow-soft border transition-all flex items-center gap-4 ${med.taken_today ? 'border-blue-500 bg-blue-50/20' : 'border-slate-100'}`}>
                  <button 
                    onClick={() => handleToggleLog(med)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${med.taken_today ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <Check size={24} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold truncate text-lg ${med.taken_today ? 'text-slate-900 line-through opacity-70' : 'text-slate-900'}`}>{med.medication_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{med.dosage || t("unspecified_dosage")}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {med.frequency && <span className="text-[10px] bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-lg font-bold uppercase">{med.frequency}</span>}
                      {med.time_of_day && <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium"><Clock size={10}/> {med.time_of_day}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(med.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {!isAdding && (
                <button onClick={() => setIsAdding(true)} className="w-full bg-white border border-slate-200 border-dashed rounded-3xl py-4 flex flex-col items-center justify-center text-slate-400 hover:text-brand hover:border-brand transition-colors mt-6">
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t("add_another")}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleAddMedication} onPaste={handlePaste} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 mt-4 animate-fade-in-up">
            <h3 className="font-bold text-slate-900 mb-4">
              {t("new_medication")}
              {medQueue.length > 0 && <span className="ml-2 text-xs font-normal text-blue-800 bg-blue-100/80 px-2 py-1 rounded-lg">+{medQueue.length} {t('patienttreatments_pendientes')}</span>}
            </h3>
            
            <div className="mb-6 bg-blue-50 border border-blue-200/60 rounded-2xl p-4 text-center">
              <p className="text-xs text-blue-800 mb-3 font-semibold">{t("have_prescription")}</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif,image/*,application/pdf" 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isExtracting}
                className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} className="-rotate-45 stroke-[2.2]" />}
                {isExtracting ? t("analyzing_with_ai") : t('patienttreatments_adjuntar_o_pegar_ctrl_v_receta')}
              </button>
              <p className="text-[10px] text-blue-600/90 mt-1.5 font-medium">
               {t('patienttreatments_soporta_varias_imagenes_o_pdfs')}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t("name")}</label>
                <input 
                  required 
                  type="text" 
                  value={newMed.medication_name} 
                  onChange={e => setNewMed({...newMed, medication_name: e.target.value})} 
                  placeholder={t("example_name")} 
                  style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                  className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand font-semibold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t("dosage")}</span>
                    {!newMed.dosage && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">{t('patienttreatments_sugerido_rellenar')}</span>}
                  </label>
                  <input 
                    type="text" 
                    value={newMed.dosage} 
                    onChange={e => setNewMed({...newMed, dosage: e.target.value})} 
                    placeholder={t("example_dosage")} 
                    style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                    className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t("schedule")}</span>
                    {!newMed.time_of_day && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">{t('patienttreatments_sugerido_rellenar')}</span>}
                  </label>
                  <input 
                    type="text" 
                    value={newMed.time_of_day} 
                    onChange={e => setNewMed({...newMed, time_of_day: e.target.value})} 
                    placeholder={t("example_schedule")} 
                    style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                    className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand font-semibold" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>{t("frequency")}</span>
                  {!newMed.frequency && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">{t('patienttreatments_sugerido_rellenar')}</span>}
                </label>
                <input 
                  type="text" 
                  value={newMed.frequency} 
                  onChange={e => setNewMed({...newMed, frequency: e.target.value})} 
                  placeholder={t("example_frequency")} 
                  style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                  className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand font-semibold" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setIsAdding(false); setMedQueue([]); setNewMed({ medication_name: '', dosage: '', frequency: '', time_of_day: '' }); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold active:scale-95 transition-all">{t("cancel")}</button>
              <button type="submit" className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all">{t("save")}</button>
            </div>
          </form>
        )}

      </div>
      <BottomNav activeTab="treatments" onTabChange={(tab) => onNavigate(tab)} />
    </div>
  );
}
