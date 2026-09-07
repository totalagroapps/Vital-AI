import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Clock, Trash2, ArrowLeft, UploadCloud, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function PatientTreatments({ apiUrl, authHeaders, onNavigate }) {
  const { t } = useLanguage();
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

  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    setMedQueue([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
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
          <h2 className="relative z-10 text-[26px] md:text-[30px] leading-tight font-extrabold text-slate-900 mb-1.5 drop-shadow-xs">
            {t("my_medications")} <span className="text-teal-700 font-black tracking-tight">{t("medications")}</span>
          </h2>
          <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-700 max-w-[90%]">
            {t("mark_medications_taken")}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-teal-800 text-white rounded-[28px] p-6 shadow-lg relative overflow-hidden mb-8 border border-teal-500/20">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-lg mb-1 text-white tracking-tight">{t("daily_progress")}</h3>
              <p className="text-xs text-teal-100/90 font-medium">{t("taken_today", { taken: medications.filter(m => m.taken_today).length, total: medications.length })}</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-teal-400/40 bg-teal-900/40 flex items-center justify-center">
              <span className="font-black text-lg text-white">
                {medications.length > 0 ? Math.round((medications.filter(m => m.taken_today).length / medications.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Prescription Upload Card */}
        <div className="mb-8 bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-200/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
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
            className="w-full sm:w-auto px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0 disabled:opacity-50"
          >
            {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            <span>{isExtracting ? (t("analyzing_with_ai") || "Analizando...") : (t("upload_prescription_pdf") || "Subir PDF / Imagen")}</span>
          </button>
        </div>

        {/* List */}
        <div className="space-y-4 mb-8">
          {isLoading ? (
            <p className="text-center text-gray-500 text-sm py-4">{t("loading")}</p>
          ) : medications.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-soft border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pill className="text-gray-400 w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{t("no_active_treatments")}</h3>
              <p className="text-xs text-gray-500 mb-6">{t("add_medication_prompt")}</p>
              <button onClick={() => setIsAdding(true)} className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md flex items-center gap-2 mx-auto transition-all active:scale-95">
                <Plus size={16} /> {t("add_medication")}
              </button>
            </div>
          ) : (
            <>
              {medications.map(med => (
                <div key={med.id} className={`bg-white rounded-3xl p-5 shadow-soft border transition-all flex items-center gap-4 ${med.taken_today ? 'border-teal-500 bg-teal-50/20' : 'border-gray-100'}`}>
                  <button 
                    onClick={() => handleToggleLog(med)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${med.taken_today ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Check size={24} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold truncate text-lg ${med.taken_today ? 'text-gray-900 line-through opacity-70' : 'text-gray-900'}`}>{med.medication_name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">{med.dosage || t("unspecified_dosage")}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {med.frequency && <span className="text-[10px] bg-teal-100/80 text-teal-800 px-2 py-0.5 rounded-lg font-bold uppercase">{med.frequency}</span>}
                      {med.time_of_day && <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><Clock size={10}/> {med.time_of_day}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(med.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {!isAdding && (
                <button onClick={() => setIsAdding(true)} className="w-full bg-white border border-gray-200 border-dashed rounded-3xl py-4 flex flex-col items-center justify-center text-gray-400 hover:text-teal-700 hover:border-teal-600 transition-colors mt-6">
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t("add_another")}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Add Form */}
        {isAdding && (
          <form onSubmit={handleAddMedication} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mt-4 animate-fade-in-up">
            <h3 className="font-bold text-gray-900 mb-4">
              {t("new_medication")}
              {medQueue.length > 0 && <span className="ml-2 text-xs font-normal text-teal-800 bg-teal-100/80 px-2 py-1 rounded-lg">+{medQueue.length} pendientes</span>}
            </h3>
            
            <div className="mb-6 bg-teal-50 border border-teal-200/60 rounded-2xl p-4 text-center">
              <p className="text-xs text-teal-800 mb-3 font-semibold">{t("have_prescription")}</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isExtracting}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {isExtracting ? t("analyzing_with_ai") : t("extract_from_prescription")}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("name")}</label>
                <input 
                  required 
                  type="text" 
                  value={newMed.medication_name} 
                  onChange={e => setNewMed({...newMed, medication_name: e.target.value})} 
                  placeholder={t("example_name")} 
                  style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                  className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t("dosage")}</span>
                    {!newMed.dosage && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">Sugerido rellenar</span>}
                  </label>
                  <input 
                    type="text" 
                    value={newMed.dosage} 
                    onChange={e => setNewMed({...newMed, dosage: e.target.value})} 
                    placeholder={t("example_dosage")} 
                    style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                    className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{t("schedule")}</span>
                    {!newMed.time_of_day && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">Sugerido rellenar</span>}
                  </label>
                  <input 
                    type="text" 
                    value={newMed.time_of_day} 
                    onChange={e => setNewMed({...newMed, time_of_day: e.target.value})} 
                    placeholder={t("example_schedule")} 
                    style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                    className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>{t("frequency")}</span>
                  {!newMed.frequency && <span className="text-[9px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold border border-amber-300">Sugerido rellenar</span>}
                </label>
                <input 
                  type="text" 
                  value={newMed.frequency} 
                  onChange={e => setNewMed({...newMed, frequency: e.target.value})} 
                  placeholder={t("example_frequency")} 
                  style={{ color: '#0f172a', backgroundColor: '#f8fafc' }}
                  className="w-full bg-slate-50 !text-slate-900 placeholder:text-slate-400 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setIsAdding(false); setMedQueue([]); setNewMed({ medication_name: '', dosage: '', frequency: '', time_of_day: '' }); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold active:scale-95 transition-all">{t("cancel")}</button>
              <button type="submit" className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all">{t("save")}</button>
            </div>
          </form>
        )}

      </div>
      <BottomNav activeTab="treatments" onTabChange={(tab) => onNavigate(tab)} />
    </div>
  );
}
