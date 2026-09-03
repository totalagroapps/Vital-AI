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
      <div className="absolute top-0 right-0 w-[80%] md:w-[60%] h-[400px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="" 
          className="absolute top-0 right-0 w-full h-full object-cover opacity-80"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
      </div>

      <div className="relative z-10 px-6 pt-12 flex-1">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('home')} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {t("treatments")}
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="mb-6">
          <h2 className="text-[28px] leading-tight font-bold text-gray-900 mb-2">
            {t("my_medications")} <span className="text-brand-purple">{t("medications")}</span>
          </h2>
          <p className="text-sm text-gray-500">
            {t("mark_medications_taken")}
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-brand-purple text-white rounded-[28px] p-6 shadow-glow relative overflow-hidden mb-8">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg mb-1">{t("daily_progress")}</h3>
              <p className="text-xs text-white/80">{t("taken_today", { taken: medications.filter(m => m.taken_today).length, total: medications.length })}</p>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className="font-bold text-lg">
                {medications.length > 0 ? Math.round((medications.filter(m => m.taken_today).length / medications.length) * 100) : 0}%
              </span>
            </div>
          </div>
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
              <button onClick={() => setIsAdding(true)} className="bg-brand-purple text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-glow flex items-center gap-2 mx-auto">
                <Plus size={16} /> {t("add_medication")}
              </button>
            </div>
          ) : (
            <>
              {medications.map(med => (
                <div key={med.id} className={`bg-white rounded-3xl p-5 shadow-soft border transition-all flex items-center gap-4 ${med.taken_today ? 'border-brand-green bg-brand-green/5' : 'border-gray-100'}`}>
                  <button 
                    onClick={() => handleToggleLog(med)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${med.taken_today ? 'bg-brand-green text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Check size={24} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold truncate text-lg ${med.taken_today ? 'text-gray-900 line-through opacity-70' : 'text-gray-900'}`}>{med.medication_name}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">{med.dosage || t("unspecified_dosage")}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {med.frequency && <span className="text-[10px] bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-lg font-bold uppercase">{med.frequency}</span>}
                      {med.time_of_day && <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><Clock size={10}/> {med.time_of_day}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(med.id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {!isAdding && (
                <button onClick={() => setIsAdding(true)} className="w-full bg-white border border-gray-200 border-dashed rounded-3xl py-4 flex flex-col items-center justify-center text-gray-400 hover:text-brand-purple hover:border-brand-purple transition-colors mt-6">
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
              {medQueue.length > 0 && <span className="ml-2 text-xs font-normal text-brand-purple bg-brand-purple/10 px-2 py-1 rounded-lg">+{medQueue.length} pendientes</span>}
            </h3>
            
            <div className="mb-6 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-brand-blue mb-3 font-medium">{t("have_prescription")}</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                disabled={isExtracting}
                className="w-full bg-brand-blue text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {isExtracting ? t("analyzing_with_ai") : t("extract_from_prescription")}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("name")}</label>
                <input required type="text" value={newMed.medication_name} onChange={e => setNewMed({...newMed, medication_name: e.target.value})} placeholder={t("example_name")} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("dosage")}</label>
                  <input type="text" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} placeholder={t("example_dosage")} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("schedule")}</label>
                  <input type="text" value={newMed.time_of_day} onChange={e => setNewMed({...newMed, time_of_day: e.target.value})} placeholder={t("example_schedule")} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t("frequency")}</label>
                <input type="text" value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} placeholder={t("example_frequency")} className="w-full bg-gray-50 text-slate-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple" />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setIsAdding(false); setMedQueue([]); setNewMed({ medication_name: '', dosage: '', frequency: '', time_of_day: '' }); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold">{t("cancel")}</button>
              <button type="submit" className="flex-1 py-3 bg-brand-purple text-white rounded-xl text-sm font-bold shadow-glow">{t("save")}</button>
            </div>
          </form>
        )}

      </div>
      <BottomNav activeTab="treatments" onTabChange={(tab) => onNavigate(tab)} />
    </div>
  );
}
