import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Video, MapPin, Calendar, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import CancelAppointmentModal from '../components/CancelAppointmentModal';
import PatientTopNav from '../components/PatientTopNav';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
};
const CANCELABLE = new Set(['pending', 'confirmed']);

const MisCitas = ({ 
  apiUrl, 
  authHeaders, 
  onBack, 
  isDoctor = false,
  onNavigate,
  userProfile,
  username,
  onLogout
}) => {
  const { t, language, locale: uiLocale } = useLanguage();
  const locale = uiLocale;

  const [tab, setTab] = useState('upcoming');
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/appointments/me?when=${tab}`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { setAppts(data); setError(''); })
      .catch(() => setError(t('appts_error')))
      .finally(() => setLoading(false));
  };
  useEffect(load, [apiUrl, tab]);

  const confirmCancel = async (reason) => {
    const id = cancelTarget;
    setCancellingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason }),
      });
      if (res.ok) load();
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-base pb-28 font-sans">
      {!isDoctor && (
        <PatientTopNav
          activeTab="citas"
          onNavigate={onNavigate}
          userProfile={userProfile}
          username={username}
          onLogout={onLogout}
        />
      )}
      <div className="max-w-screen-md mx-auto px-5 pt-6 lg:px-6 lg:pt-8">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('detail_back')}
        </button>
        <h1 className="text-xl font-extrabold text-brand-dark mb-4">{t(isDoctor ? 'appts_title_doctor' : 'appts_title')}</h1>

        <div className="flex gap-2 mb-5">
          {['upcoming', 'past'].map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === tb ? 'bg-brand-blue text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {t(tb === 'upcoming' ? 'appts_tab_upcoming' : 'appts_tab_past')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-brand-blue"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : error ? (
          <p className="text-sm text-red-600 py-8 text-center">{error}</p>
        ) : appts.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">
            {t(isDoctor
              ? (tab === 'upcoming' ? 'appts_empty_upcoming_doctor' : 'appts_empty_past_doctor')
              : (tab === 'upcoming' ? 'appts_empty_upcoming' : 'appts_empty_past'))}
          </p>
        ) : (
          <div className="space-y-3">
            {appts.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                  {a.modality === 'in_person' ? <MapPin className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand-dark truncate">
                    {isDoctor ? (a.patient?.full_name || a.patient?.username || '—') : (a.doctor?.full_name || '—')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 capitalize">
                    <Calendar className="w-3.5 h-3.5" /> {fmt(a.scheduled_at)}
                  </p>
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[a.status] || ''}`}>
                    {t(`appts_status_${a.status}`)}
                  </span>
                </div>
                {CANCELABLE.has(a.status) && tab === 'upcoming' && (
                  <button
                    onClick={() => setCancelTarget(a.id)}
                    disabled={cancellingId === a.id}
                    className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 shrink-0 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    {cancellingId === a.id ? t('appts_cancelling') : t('appts_cancel')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CancelAppointmentModal
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        isDoctor={isDoctor}
        submitting={cancellingId === cancelTarget}
      />
    </div>
  );
};

export default MisCitas;
