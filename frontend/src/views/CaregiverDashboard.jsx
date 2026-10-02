import React, { useState, useEffect } from 'react';
import { Activity, Pill, Stethoscope, AlertTriangle, ChevronLeft, HeartPulse } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function CaregiverDashboard({ apiUrl, onNavigateHome }) {
  const { t } = useLanguage();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedProfile = localStorage.getItem('mivor_patient_profile');
        if (!savedProfile) {
          onNavigateHome();
          return;
        }
        
        const p = JSON.parse(savedProfile);
        setProfile(p);
        
        const res = await fetch(`${apiUrl}/api/caregiver/timeline/${p.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setTimeline(data.timeline);
        }
      } catch (err) {
        console.error("Error fetching timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [apiUrl, onNavigateHome]);

  const getIcon = (type) => {
    switch(type) {
      case 'medication': return <Pill className="text-emerald-500" size={24} />;
      case 'triage': return <Stethoscope className="text-blue-500" size={24} />;
      case 'vital_sign': return <HeartPulse className="text-rose-500" size={24} />;
      default: return <Activity className="text-slate-500" size={24} />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'medication': return 'bg-emerald-50 border-emerald-100';
      case 'triage': return 'bg-blue-50 border-blue-100';
      case 'vital_sign': return 'bg-rose-50 border-rose-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onNavigateHome} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-mivor-navy">Panel Familiar</h1>
            <p className="text-sm text-slate-500">Supervisando a {profile?.full_name || 'paciente'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 mt-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Activity className="mx-auto text-slate-300 mb-3" size={48} />
            <h3 className="text-lg font-bold text-slate-700">Sin actividad reciente</h3>
            <p className="text-slate-500 mt-2">Aún no hay registros de salud para este familiar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <p>Esta vista te permite supervisar en tiempo real la actividad clínica y adherencia a la medicación de tu ser querido.</p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {timeline.map((event, idx) => {
                const d = new Date(event.date);
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = d.toLocaleDateString();

                return (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute -left-10 md:static z-10">
                      {getIcon(event.type)}
                    </div>
                    
                    <div className={`w-[calc(100%-1rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border shadow-sm ${getBgColor(event.type)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-800 text-base">{event.title}</h3>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">{timeStr}</span>
                      </div>
                      <p className="text-slate-600 text-sm">{event.description}</p>
                      <p className="text-xs text-slate-400 mt-2">{dateStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
