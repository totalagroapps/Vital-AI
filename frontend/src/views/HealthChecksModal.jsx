import React, { useCallback, useEffect, useState } from 'react';
import { X, HeartPulse, Droplet, Scale, ChevronLeft, PhoneCall } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { detectCountry, emergencyNumber } from '../utils/locale';

// "Mis controles de salud": tensión, glucosa y peso con números grandes.
// Lo usa el modo adulto mayor y, desde el perfil familiar, la familia.

const KINDS = [
  { kind: 'blood_pressure', icon: HeartPulse, title: 'health_bp', unit: 'mmHg', bg: 'bg-[#DCEBFD]', ink: 'text-[#1D5FD8]' },
  { kind: 'glucose', icon: Droplet, title: 'health_glucose', unit: 'mg/dL', bg: 'bg-[#FDE2E2]', ink: 'text-[#D63B3B]' },
  { kind: 'weight', icon: Scale, title: 'health_weight', unit: 'kg', bg: 'bg-[#D9F5EA]', ink: 'text-[#0F7A55]' },
];

const LEVEL_STYLE = {
  normal: 'bg-[#D9F5EA] text-[#0B6B47]',
  high: 'bg-[#FDF1D6] text-[#8A5A00]',
  low: 'bg-[#FDF1D6] text-[#8A5A00]',
  urgent_high: 'bg-[#FBD9D9] text-[#B3261E]',
  urgent_low: 'bg-[#FBD9D9] text-[#B3261E]',
};

const whenText = (iso, locale) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return sameDay ? time : `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · ${time}`;
};

export default function HealthChecksModal({ isOpen, onClose, apiUrl, authHeaders }) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState({ latest: {}, items: [] });
  const [editing, setEditing] = useState(null);
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/health/readings?days=60`, { headers: authHeaders });
      if (res.ok) setData(await res.json());
    } catch { /* sin conexión: se queda lo último */ }
  }, [apiUrl, authHeaders?.Authorization, authHeaders?.['X-Target-Patient-Id']]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  if (!isOpen) return null;

  const start = (kind) => { setEditing(kind); setV1(''); setV2(''); setResult(null); setError(''); };

  const save = async () => {
    const n1 = parseFloat(String(v1).replace(',', '.'));
    const n2 = parseFloat(String(v2).replace(',', '.'));
    if (!Number.isFinite(n1) || (editing === 'blood_pressure' && !Number.isFinite(n2))) {
      setError(t('health_fill_numbers'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/health/readings`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: editing, value1: n1, value2: editing === 'blood_pressure' ? n2 : null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof body.detail === 'string' ? body.detail : t('health_save_error'));
      } else {
        setResult(body);
        load();
      }
    } catch {
      setError(t('health_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const current = KINDS.find((k) => k.kind === editing);
  const sos = emergencyNumber(detectCountry());
  const inputClass = 'w-full rounded-2xl border-2 border-[#C9DCFB] bg-white text-center text-[40px] font-extrabold py-3 focus:outline-none focus:border-[#1D6BF0]';

  return (
    <div className="fixed inset-0 z-[80] bg-[#EAF4FF] flex flex-col text-[#0D2B5E]" role="dialog" aria-modal="true">
      <header className="shrink-0 flex items-center gap-2 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        {editing ? (
          <button type="button" onClick={() => setEditing(null)} className="p-2 -ml-2 rounded-full" aria-label={t('health_back')}>
            <ChevronLeft size={30} />
          </button>
        ) : null}
        <h1 className="flex-1 text-[26px] font-extrabold leading-tight">
          {editing ? t(current.title) : t('senior_vitals_title')}
        </h1>
        <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-full" aria-label={t('senior_close')}>
          <X size={30} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!editing && (
          <>
            <div className="flex flex-col gap-3">
              {KINDS.map(({ kind, icon: Icon, title, bg, ink }) => {
                const last = data.latest?.[kind];
                return (
                  <button key={kind} type="button" onClick={() => start(kind)}
                    className={`${bg} rounded-[24px] p-4 flex items-center gap-4 text-left active:scale-[0.99]`}>
                    <span className={`grid place-items-center w-16 h-16 rounded-full bg-white ${ink} shrink-0`}>
                      <Icon size={32} strokeWidth={2.4} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[22px] font-extrabold">{t(title)}</span>
                      {last ? (
                        <>
                          <span className="block text-[20px] font-bold">{last.display}</span>
                          <span className="block text-[14px] text-[#3A4E6E]">{whenText(last.measured_at, locale)}</span>
                        </>
                      ) : (
                        <span className="block text-[16px] text-[#3A4E6E]">{t('health_none_yet')}</span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-2xl bg-[#1D6BF0] text-white text-[16px] font-bold px-3 py-2">{t('health_add')}</span>
                  </button>
                );
              })}
            </div>

            {data.items?.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[18px] font-extrabold mb-2">{t('health_history')}</h2>
                <ul className="flex flex-col gap-2">
                  {data.items.slice(0, 12).map((r) => (
                    <li key={r.id} className="rounded-2xl bg-white/80 px-4 py-3 flex items-center gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[16px] font-bold">{t(KINDS.find((k) => k.kind === r.kind)?.title)} · {r.display}</span>
                        <span className="block text-[13px] text-[#3A4E6E]">{whenText(r.measured_at, locale)}</span>
                      </span>
                      {r.level && (
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${LEVEL_STYLE[r.level]}`}>
                          {t(`health_level_${r.level.startsWith('urgent') ? 'urgent' : r.level}`)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="mt-6 text-[13px] text-[#3A4E6E] leading-snug">{t('health_disclaimer')}</p>
          </>
        )}

        {editing && !result && (
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            {editing === 'blood_pressure' ? (
              <>
                <label className="block">
                  <span className="block text-[18px] font-bold mb-1">{t('health_bp_high')}</span>
                  <input className={inputClass} inputMode="numeric" value={v1} onChange={(e) => setV1(e.target.value)} placeholder="130" autoFocus />
                </label>
                <label className="block">
                  <span className="block text-[18px] font-bold mb-1">{t('health_bp_low')}</span>
                  <input className={inputClass} inputMode="numeric" value={v2} onChange={(e) => setV2(e.target.value)} placeholder="85" />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="block text-[18px] font-bold mb-1">{current.unit}</span>
                <input className={inputClass} inputMode="decimal" value={v1} onChange={(e) => setV1(e.target.value)}
                  placeholder={editing === 'glucose' ? '110' : '72,5'} autoFocus />
              </label>
            )}
            {error && <p className="text-[16px] font-semibold text-[#B3261E]">{error}</p>}
            <button type="button" onClick={save} disabled={saving}
              className="w-full rounded-2xl bg-[#1D6BF0] text-white text-[22px] font-extrabold py-4 disabled:opacity-60">
              {saving ? t('health_saving') : t('health_save')}
            </button>
            <p className="text-[15px] text-[#3A4E6E] text-center">{t('health_voice_hint')}</p>
          </div>
        )}

        {editing && result && (
          <div className="flex flex-col gap-4 max-w-md mx-auto text-center">
            <p className="text-[18px] font-bold">{t('health_saved')}</p>
            <p className="text-[44px] font-extrabold leading-none">{result.display}</p>
            {result.level && (
              <p className={`rounded-2xl px-4 py-3 text-[19px] font-bold ${LEVEL_STYLE[result.level]}`}>{result.message}</p>
            )}
            {result.level?.startsWith('urgent') && (
              <a href={`tel:${sos}`} className="w-full rounded-2xl bg-[#E5293F] text-white text-[20px] font-extrabold py-4 flex items-center justify-center gap-2">
                <PhoneCall size={24} /> {t('senior_call_emergency', { number: sos })}
              </a>
            )}
            <button type="button" onClick={() => setEditing(null)} className="w-full rounded-2xl bg-white text-[#1D6BF0] border-2 border-[#1D6BF0] text-[20px] font-bold py-3">
              {t('health_done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
