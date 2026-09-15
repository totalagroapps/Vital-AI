import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Loader2, Plus, X, Clock, Globe, CalendarOff, CalendarPlus, Check,
  ChevronDown, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const COMMON_TZ = [
  'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'America/New_York',
  'America/Los_Angeles', 'America/Argentina/Buenos_Aires', 'America/Mexico_City',
  'America/Bogota', 'Atlantic/Canary',
];
const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

// date + "HH:MM" (wall time in `tz`) -> ISO string with that tz's offset.
const toZonedISO = (dateStr, timeStr, tz) => {
  const asUTC = new Date(`${dateStr}T${timeStr}:00Z`);
  const local = new Date(asUTC.toLocaleString('en-US', { timeZone: tz }));
  const offsetMin = Math.round((asUTC - local) / 60000);
  const sign = offsetMin <= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${dateStr}T${timeStr}:00${sign}${hh}:${mm}`;
};

const hhmm = (t) => (t ? t.slice(0, 5) : '');
const tmpId = () => (crypto?.randomUUID ? crypto.randomUUID() : `tmp-${Math.random()}`);
const keyOf = (row) => row.id || row._tmp;

const FIELD = 'border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-dark bg-white focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/10';
const openPicker = (e) => { try { e.currentTarget.showPicker(); } catch { /* unsupported */ } };

const PrettySelect = ({ className = '', children, ...props }) => (
  <div className="relative inline-block">
    <select {...props} className={`appearance-none pr-8 ${FIELD} ${className}`}>{children}</select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// normalized signatures to detect unsaved changes
const normSched = (list) => JSON.stringify(
  [...list]
    .map((s) => ({ w: s.weekday, a: hhmm(s.start_time), b: hhmm(s.end_time), m: s.modality }))
    .sort((x, y) => x.w - y.w || x.a.localeCompare(y.a) || x.m.localeCompare(y.m)),
);
const normExc = (list) => JSON.stringify(
  [...list]
    .map((e) => ({ k: e.kind, s: Date.parse(e.start_at), e: Date.parse(e.end_at), m: e.modality || null, r: e.reason || null }))
    .sort((x, y) => x.s - y.s || x.k.localeCompare(y.k)),
);

const DoctorSchedule = ({ apiUrl, authHeaders, doctorProfile, onProfileUpdated, onBack, headerExtra }) => {
  const { t, language } = useLanguage();
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const json = { ...authHeaders, 'Content-Type': 'application/json' };

  const allowedModalities = useMemo(() => {
    if (doctorProfile?.modality === 'video') return ['video'];
    if (doctorProfile?.modality === 'in_person') return ['in_person'];
    return ['video', 'in_person', 'both'];
  }, [doctorProfile]);

  const initial = {
    tz: doctorProfile?.timezone || 'Europe/Madrid',
    duration: doctorProfile?.appointment_duration_minutes ?? 30,
    buffer: doctorProfile?.appointment_buffer_minutes ?? 0,
  };
  const [tz, setTz] = useState(initial.tz);
  const [duration, setDuration] = useState(initial.duration);
  const [buffer, setBuffer] = useState(initial.buffer);
  const [saved, setSaved] = useState(initial);

  const [base, setBase] = useState({ schedules: [], exceptions: [] });
  const [schedules, setSchedules] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  // edit = { day, key }. key === null -> new block for that day.
  const [edit, setEdit] = useState(null);
  const [blockForm, setBlockForm] = useState({ start: '09:00', end: '13:00', modality: allowedModalities[0] });
  const [rowError, setRowError] = useState('');

  const [showBlockExc, setShowBlockExc] = useState(false);
  const [blockExc, setBlockExc] = useState({ from: '', to: '', allDay: true, start: '09:00', end: '13:00', reason: '' });
  const [showExtra, setShowExtra] = useState(false);
  const [extra, setExtra] = useState({ date: '', start: '10:00', end: '10:30', modality: allowedModalities[0] });
  const [excError, setExcError] = useState('');

  const configDirty =
    tz !== saved.tz ||
    Number(duration) !== Number(saved.duration) ||
    Number(buffer) !== Number(saved.buffer);
  const listsDirty = normSched(schedules) !== normSched(base.schedules) || normExc(exceptions) !== normExc(base.exceptions);
  const formOpen = edit !== null || showBlockExc || showExtra;
  const dirty = configDirty || listsDirty || formOpen;

  const weekdayName = (i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'long' });
  const modalityLabel = (m) =>
    m === 'both' ? t('sched_modality_both')
      : m === 'in_person' ? t('book_modality_in_person')
      : t('book_modality_video');

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/doctors/me/schedule`, { headers: authHeaders }).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${apiUrl}/api/doctors/me/exceptions`, { headers: authHeaders }).then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([s, e]) => { setBase({ schedules: s, exceptions: e }); setSchedules(s); setExceptions(e); })
      .catch(() => setError(t('sched_load_error')))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleBack = () => {
    if (dirty && !window.confirm(t('sched_unsaved_warning'))) return;
    onBack();
  };

  // local edits only — nothing hits the server until "Save"
  const openAdd = (day) => {
    setRowError('');
    setBlockForm({ start: '09:00', end: '13:00', modality: allowedModalities[0] });
    setEdit({ day, key: null });
  };
  const openEdit = (b) => {
    setRowError('');
    setBlockForm({ start: hhmm(b.start_time), end: hhmm(b.end_time), modality: b.modality });
    setEdit({ day: b.weekday, key: keyOf(b) });
  };
  const closeForm = () => { setEdit(null); setRowError(''); };

  const commitBlock = () => {
    if (blockForm.start >= blockForm.end) { setRowError(t('sched_time_order_error')); return; }
    const patch = { start_time: `${blockForm.start}:00`, end_time: `${blockForm.end}:00`, modality: blockForm.modality };
    setSchedules((prev) => {
      if (edit.key == null) return [...prev, { _tmp: tmpId(), weekday: edit.day, ...patch }];
      return prev.map((s) => (keyOf(s) === edit.key ? { ...s, ...patch } : s));
    });
    closeForm();
  };
  const deleteBlock = () => {
    setSchedules((prev) => prev.filter((s) => keyOf(s) !== edit.key));
    closeForm();
  };

  const commitBlockException = () => {
    if (!blockExc.from) { setExcError(t('sched_date_required')); return; }
    const to = blockExc.to || blockExc.from;
    const start_at = toZonedISO(blockExc.from, blockExc.allDay ? '00:00' : blockExc.start, tz);
    const end_at = toZonedISO(blockExc.allDay ? to : blockExc.from, blockExc.allDay ? '23:59' : blockExc.end, tz);
    if (new Date(start_at) >= new Date(end_at)) { setExcError(t('sched_time_order_error')); return; }
    setExcError('');
    setExceptions((prev) => [...prev, { _tmp: tmpId(), kind: 'unavailable', start_at, end_at, modality: null, reason: blockExc.reason.trim() || null }]);
    setShowBlockExc(false);
    setBlockExc({ from: '', to: '', allDay: true, start: '09:00', end: '13:00', reason: '' });
  };
  const commitExtra = () => {
    if (!extra.date) { setExcError(t('sched_date_required')); return; }
    if (extra.start >= extra.end) { setExcError(t('sched_time_order_error')); return; }
    setExcError('');
    setExceptions((prev) => [...prev, {
      _tmp: tmpId(), kind: 'extra', modality: extra.modality,
      start_at: toZonedISO(extra.date, extra.start, tz), end_at: toZonedISO(extra.date, extra.end, tz), reason: null,
    }]);
    setShowExtra(false);
    setExtra({ date: '', start: '10:00', end: '10:30', modality: allowedModalities[0] });
  };
  const removeException = (row) => setExceptions((prev) => prev.filter((e) => keyOf(e) !== keyOf(row)));

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      if (configDirty) {
        const r = await fetch(`${apiUrl}/api/doctors/me`, {
          method: 'PATCH', headers: json,
          body: JSON.stringify({ timezone: tz, appointment_duration_minutes: Number(duration), appointment_buffer_minutes: Number(buffer) }),
        });
        if (!r.ok) throw new Error();
        onProfileUpdated?.(await r.json());
      }

      const liveScheduleIds = new Set(schedules.filter((s) => s.id).map((s) => s.id));
      for (const s of base.schedules) {
        if (!liveScheduleIds.has(s.id)) {
          const r = await fetch(`${apiUrl}/api/doctors/me/schedule/${s.id}`, { method: 'DELETE', headers: authHeaders });
          if (!r.ok) throw new Error();
        }
      }
      for (const s of schedules) {
        const body = { weekday: s.weekday, start_time: hhmm(s.start_time), end_time: hhmm(s.end_time), modality: s.modality };
        if (!s.id) {
          const r = await fetch(`${apiUrl}/api/doctors/me/schedule`, { method: 'POST', headers: json, body: JSON.stringify(body) });
          if (!r.ok) throw new Error();
        } else {
          const orig = base.schedules.find((o) => o.id === s.id);
          const changed = !orig || hhmm(orig.start_time) !== body.start_time || hhmm(orig.end_time) !== body.end_time || orig.modality !== s.modality || orig.weekday !== s.weekday;
          if (changed) {
            const r = await fetch(`${apiUrl}/api/doctors/me/schedule/${s.id}`, { method: 'PATCH', headers: json, body: JSON.stringify(body) });
            if (!r.ok) throw new Error();
          }
        }
      }

      const liveExcIds = new Set(exceptions.filter((e) => e.id).map((e) => e.id));
      for (const e of base.exceptions) {
        if (!liveExcIds.has(e.id)) {
          const r = await fetch(`${apiUrl}/api/doctors/me/exceptions/${e.id}`, { method: 'DELETE', headers: authHeaders });
          if (!r.ok) throw new Error();
        }
      }
      for (const e of exceptions.filter((e) => !e.id)) {
        const r = await fetch(`${apiUrl}/api/doctors/me/exceptions`, {
          method: 'POST', headers: json,
          body: JSON.stringify({ start_at: e.start_at, end_at: e.end_at, kind: e.kind, modality: e.modality, reason: e.reason }),
        });
        if (!r.ok) throw new Error();
      }

      const [s2, e2] = await Promise.all([
        fetch(`${apiUrl}/api/doctors/me/schedule`, { headers: authHeaders }).then((r) => r.json()),
        fetch(`${apiUrl}/api/doctors/me/exceptions`, { headers: authHeaders }).then((r) => r.json()),
      ]);
      setBase({ schedules: s2, exceptions: e2 });
      setSchedules(s2);
      setExceptions(e2);
      setSaved({ tz, duration, buffer });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      return true;
    } catch {
      setError(t('sched_save_error'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  // preview reads slots from the DB, so unsaved changes must be saved first
  const handlePreview = async () => {
    if (dirty) {
      if (!window.confirm(t('sched_preview_unsaved_confirm'))) return;
      const ok = await saveAll();
      if (!ok) return;
    }
    window.open(`${window.location.origin}${window.location.pathname}?preview=${doctorProfile.id}`, '_blank');
  };

  const fmtExc = (iso) => new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const blockExceptions = exceptions.filter((e) => e.kind === 'unavailable');
  const extraExceptions = exceptions.filter((e) => e.kind === 'extra');

  const ModalitySelect = ({ value, onChange }) => (
    <PrettySelect value={value} onChange={(e) => onChange(e.target.value)}>
      {allowedModalities.map((m) => <option key={m} value={m}>{modalityLabel(m)}</option>)}
    </PrettySelect>
  );

  return (
    <div className="min-h-screen bg-base px-5 pt-4 pb-28 lg:px-8 lg:pt-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-2">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark">
            <ArrowLeft className="w-4 h-4" /> {t('detail_back')}
          </button>
          {headerExtra}
        </div>
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-extrabold text-brand-dark">{t('sched_title')}</h1>
          {dirty && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> {t('sched_unsaved')}
            </span>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-blue" /> {t('sched_config_title')}
          </h2>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> {t('book_timezone')}
            </label>
            <div className="relative">
              <select value={tz} onChange={(e) => setTz(e.target.value)} className={`w-full appearance-none font-medium py-2.5 pr-9 ${FIELD}`}>
                {[BROWSER_TZ, ...COMMON_TZ.filter((z) => z !== BROWSER_TZ)].map((z) => (
                  <option key={z} value={z}>{z.replace('_', ' ')}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t('sched_duration')}</label>
              <input type="number" min="15" max="480" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} className={`w-full py-2.5 ${FIELD}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t('sched_buffer')}</label>
              <input type="number" min="0" max="240" value={buffer} onChange={(e) => setBuffer(e.target.value)} className={`w-full py-2.5 ${FIELD}`} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-brand-blue"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">{t('sched_weekly_title')}</h2>
              <div className="divide-y divide-gray-100">
                {[0, 1, 2, 3, 4, 5, 6].map((wd) => {
                  const blocks = schedules.filter((s) => s.weekday === wd).sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time)));
                  const isFormHere = edit && edit.day === wd;
                  return (
                    <div key={wd} className="py-3.5">
                      <div className="flex items-start gap-3">
                        <span className="w-24 shrink-0 text-sm font-bold text-brand-dark capitalize pt-1.5">{weekdayName(wd)}</span>
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          {blocks.length === 0 && !isFormHere && (
                            <span className="text-sm text-gray-400 pt-1">{t('sched_no_blocks')}</span>
                          )}
                          {blocks.map((b) => (
                            <button
                              key={keyOf(b)}
                              onClick={() => openEdit(b)}
                              title={t('sched_edit_hint')}
                              className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                                edit && edit.key === keyOf(b)
                                  ? 'bg-brand-blue text-white border-brand-blue'
                                  : 'bg-brand-blue/10 text-brand-blue border-transparent hover:border-brand-blue/40'
                              }`}
                            >
                              {hhmm(b.start_time)}–{hhmm(b.end_time)}
                              <span className="font-medium opacity-80">· {modalityLabel(b.modality)}</span>
                            </button>
                          ))}
                          {!isFormHere && (
                            <button
                              onClick={() => openAdd(wd)}
                              className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-blue hover:text-blue-600"
                            >
                              <Plus className="w-4 h-4" /> {t('sched_add_block')}
                            </button>
                          )}
                        </div>
                      </div>

                      {isFormHere && (
                        <div className="mt-2.5 ml-0 sm:ml-24 sm:pl-3">
                          <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-2xl p-2.5">
                            <input type="time" value={blockForm.start} onChange={(e) => setBlockForm((f) => ({ ...f, start: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                            <span className="text-gray-400 text-xs">→</span>
                            <input type="time" value={blockForm.end} onChange={(e) => setBlockForm((f) => ({ ...f, end: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                            <ModalitySelect value={blockForm.modality} onChange={(v) => setBlockForm((f) => ({ ...f, modality: v }))} />
                            <button onClick={commitBlock} className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold">{t('sched_ok')}</button>
                            {edit.key != null && (
                              <button onClick={deleteBlock} className="px-3.5 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold">{t('sched_delete')}</button>
                            )}
                            <button onClick={closeForm} className="px-3.5 py-2 rounded-xl text-gray-500 text-xs font-bold">{t('sched_cancel')}</button>
                          </div>
                          {rowError && <p className="text-xs text-red-600 mt-1.5">{rowError}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">{t('sched_exceptions_title')}</h2>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarOff className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t('sched_blocks_title')}</p>
                    <p className="text-xs text-gray-500">{t('sched_blocks_desc')}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {blockExceptions.length === 0 && <p className="text-sm text-gray-400">{t('sched_no_exceptions')}</p>}
                  {blockExceptions.map((e) => (
                    <div key={keyOf(e)} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2.5 text-[13px]">
                      <span className="text-red-700 font-semibold">
                        {fmtExc(e.start_at)} → {fmtExc(e.end_at)}{e.reason ? ` · ${e.reason}` : ''}
                      </span>
                      <button onClick={() => removeException(e)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                {showBlockExc ? (
                  <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <label className="text-xs font-semibold text-gray-500">{t('sched_date_from')}</label>
                      <input type="date" value={blockExc.from} onChange={(e) => setBlockExc((f) => ({ ...f, from: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                      <label className="text-xs font-semibold text-gray-500">{t('sched_date_to')}</label>
                      <input type="date" value={blockExc.to} onChange={(e) => setBlockExc((f) => ({ ...f, to: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <input type="checkbox" checked={blockExc.allDay} onChange={(e) => setBlockExc((f) => ({ ...f, allDay: e.target.checked }))} />
                      {t('sched_all_day')}
                    </label>
                    {!blockExc.allDay && (
                      <div className="flex items-center gap-2">
                        <input type="time" value={blockExc.start} onChange={(e) => setBlockExc((f) => ({ ...f, start: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                        <span className="text-gray-400 text-xs">→</span>
                        <input type="time" value={blockExc.end} onChange={(e) => setBlockExc((f) => ({ ...f, end: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                      </div>
                    )}
                    <input type="text" value={blockExc.reason} onChange={(e) => setBlockExc((f) => ({ ...f, reason: e.target.value }))} placeholder={t('sched_reason')} className={`w-full ${FIELD}`} />
                    {excError && <p className="text-xs text-red-600">{excError}</p>}
                    <div className="flex gap-2">
                      <button onClick={commitBlockException} className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold">{t('sched_ok')}</button>
                      <button onClick={() => { setShowBlockExc(false); setExcError(''); }} className="px-3.5 py-2 rounded-xl text-gray-500 text-xs font-bold">{t('sched_cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setShowBlockExc(true); setShowExtra(false); setExcError(''); }} className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-blue">
                    <Plus className="w-4 h-4" /> {t('sched_add_block_exc')}
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarPlus className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t('sched_extra_title')}</p>
                    <p className="text-xs text-gray-500">{t('sched_extra_desc')}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-2">
                  {extraExceptions.length === 0 && <p className="text-sm text-gray-400">{t('sched_no_exceptions')}</p>}
                  {extraExceptions.map((e) => (
                    <div key={keyOf(e)} className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2.5 text-[13px]">
                      <span className="text-emerald-700 font-semibold">
                        {fmtExc(e.start_at)} → {fmtExc(e.end_at)}{e.modality ? ` · ${modalityLabel(e.modality)}` : ''}
                      </span>
                      <button onClick={() => removeException(e)} className="text-emerald-500 hover:text-emerald-700"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                {showExtra ? (
                  <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="date" value={extra.date} onChange={(e) => setExtra((f) => ({ ...f, date: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                      <input type="time" value={extra.start} onChange={(e) => setExtra((f) => ({ ...f, start: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                      <span className="text-gray-400 text-xs">→</span>
                      <input type="time" value={extra.end} onChange={(e) => setExtra((f) => ({ ...f, end: e.target.value }))} className={FIELD} onClick={openPicker} onFocus={openPicker} />
                      <ModalitySelect value={extra.modality} onChange={(v) => setExtra((f) => ({ ...f, modality: v }))} />
                    </div>
                    {excError && <p className="text-xs text-red-600">{excError}</p>}
                    <div className="flex gap-2">
                      <button onClick={commitExtra} className="px-3.5 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold">{t('sched_ok')}</button>
                      <button onClick={() => { setShowExtra(false); setExcError(''); }} className="px-3.5 py-2 rounded-xl text-gray-500 text-xs font-bold">{t('sched_cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setShowExtra(true); setShowBlockExc(false); setExcError(''); }} className="inline-flex items-center gap-1 text-[13px] font-bold text-brand-blue">
                    <Plus className="w-4 h-4" /> {t('sched_add_extra')}
                  </button>
                )}
              </div>
            </div>

            <div className="sticky bottom-[88px] z-30 bg-white/95 backdrop-blur rounded-2xl p-4 border border-gray-100 shadow-lg flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${dirty ? 'text-amber-600' : 'text-gray-400'}`}>
                {dirty ? t('sched_unsaved') : t('sched_all_saved')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreview}
                  disabled={saving || formOpen}
                  title={formOpen ? t('sched_close_form_first') : ''}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-brand-dark text-sm font-bold disabled:opacity-50"
                >
                  {t('sched_preview')}
                </button>
                <button
                  onClick={saveAll}
                  disabled={saving || !dirty || formOpen}
                  title={formOpen ? t('sched_close_form_first') : ''}
                  className="px-6 py-2.5 rounded-2xl bg-brand-blue text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedFlash ? <Check className="w-4 h-4" /> : null}
                  {savedFlash ? t('sched_saved') : t('sched_save_changes')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorSchedule;
