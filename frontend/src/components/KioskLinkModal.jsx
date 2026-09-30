import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Tablet, Loader2, CheckCircle2, Trash2, KeyRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Vincular la tablet del Kiosko MIVOR con esta cuenta (o con la del familiar que se administra:
// authHeaders lleva X-Target-Patient-Id). El kiosko canjea el código por su propia llave.
export default function KioskLinkModal({ isOpen, onClose, apiUrl, authHeaders }) {
  const { t, locale } = useLanguage();
  const [devices, setDevices] = useState([]);
  const [code, setCode] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [justLinked, setJustLinked] = useState(false);
  const knownIds = useRef(new Set());

  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/devices`, { headers: authHeaders });
      if (!res.ok) return [];
      const list = await res.json();
      setDevices(list);
      return list;
    } catch {
      return [];
    }
  }, [apiUrl, authHeaders]);

  useEffect(() => {
    if (!isOpen) return;
    setCode(null);
    setJustLinked(false);
    loadDevices().then((list) => { knownIds.current = new Set(list.map((d) => d.id)); });
  }, [isOpen, loadDevices]);

  // Mientras el código es válido: cuenta atrás y comprobar si la tablet ya se vinculó
  useEffect(() => {
    if (!code) return undefined;
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const poll = setInterval(async () => {
      const list = await loadDevices();
      if (list.some((d) => !knownIds.current.has(d.id))) {
        knownIds.current = new Set(list.map((d) => d.id));
        setCode(null);
        setJustLinked(true);
      }
    }, 4000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [code, loadDevices]);

  useEffect(() => {
    if (code && secondsLeft === 0) setCode(null);
  }, [code, secondsLeft]);

  if (!isOpen) return null;

  const generateCode = async () => {
    setLoading(true);
    setJustLinked(false);
    try {
      const res = await fetch(`${apiUrl}/api/devices/pairing-code`, { method: 'POST', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCode(data.code);
      setSecondsLeft(data.expires_in);
    } catch {
      alert(t('kiosk_link_error'));
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (device) => {
    if (!window.confirm(t('kiosk_link_confirm_revoke', { name: device.device_name }))) return;
    const res = await fetch(`${apiUrl}/api/devices/${device.id}`, { method: 'DELETE', headers: authHeaders });
    if (res.ok) setDevices((prev) => prev.filter((d) => d.id !== device.id));
    else alert(t('kiosk_link_error'));
  };

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Tablet size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">{t('kiosk_link_title')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t('kiosk_link_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl" aria-label={t('symptomcamera_cerrar')}>
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {justLinked && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 text-sm font-bold">
              <CheckCircle2 size={18} /> {t('kiosk_link_success')}
            </div>
          )}

          {code ? (
            <div className="text-center bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('kiosk_link_code_label')}</p>
              <p className="text-4xl font-black tracking-[0.3em] text-mivor-navy tabular-nums">{code}</p>
              <p className="text-xs text-slate-500 mt-2">{t('kiosk_link_expires', { time: mmss })}</p>
              <ol className="text-left text-xs text-slate-600 mt-4 space-y-1 list-decimal pl-5">
                <li>{t('kiosk_link_step1')}</li>
                <li>{t('kiosk_link_step2')}</li>
                <li>{t('kiosk_link_step3')}</li>
              </ol>
              <p className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" /> {t('kiosk_link_waiting')}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={generateCode}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
              {t('kiosk_link_generate')}
            </button>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('kiosk_link_devices')}</h3>
            {devices.length === 0 ? (
              <p className="text-xs text-slate-400">{t('kiosk_link_none')}</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                {devices.map((d) => (
                  <li key={d.id} className="flex items-center justify-between p-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{d.device_name}</p>
                      <p className="text-[11px] text-slate-500">{t('kiosk_link_last_seen', { date: formatDate(d.last_seen_at || d.created_at) })}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revoke(d)}
                      className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl"
                    >
                      <Trash2 size={14} /> {t('kiosk_link_revoke')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
