import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Clock, Loader2, ChevronLeft, ChevronRight,
  CalendarClock, Globe,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName } from '../i18n/catalogTranslations';
import DoctorAvatar from '../components/DoctorAvatar';

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const COMMON_TZ = [
  'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'America/New_York',
  'America/Los_Angeles', 'America/Argentina/Buenos_Aires', 'America/Mexico_City',
  'America/Bogota', 'Atlantic/Canary',
];

// 'YYYY-MM-DD' for the given instant, in the given timezone.
const dateKey = (iso, tz) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

const BookAppointment = ({ apiUrl, token, doctorId, doctor: doctorProp, onBack, onBooked, preview = false }) => {
  const { t, language, locale: uiLocale } = useLanguage();
  const locale = uiLocale;

  const [doctor, setDoctor] = useState(doctorProp || null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tz, setTz] = useState(BROWSER_TZ);
  const modality = 'video'; // all bookings are video-only
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    if (doctorProp) return;
    fetch(`${apiUrl}/api/doctors/${doctorId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDoctor)
      .catch(() => setError(t('book_error')));
  }, [apiUrl, doctorId, doctorProp]);

  const loadSlots = () => {
    setLoading(true);
    const from = new Intl.DateTimeFormat('en-CA').format(new Date());
    fetch(`${apiUrl}/api/doctors/${doctorId}/slots?from=${from}&days=45`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { setSlots(data); setError(''); })
      .catch(() => setError(t('book_error')))
      .finally(() => setLoading(false));
  };
  useEffect(loadSlots, [apiUrl, doctorId]);

  const visibleSlots = useMemo(
    () => slots.filter((s) => s.modality === modality || s.modality === 'both'),
    [slots, modality],
  );
  const byDay = useMemo(() => {
    const map = {};
    for (const s of visibleSlots) (map[dateKey(s.start, tz)] ||= []).push(s);
    return map;
  }, [visibleSlots, tz]);

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString(locale, { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const fmtLongDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });

  // month grid (Mon..Sun)
  const grid = useMemo(() => {
    const first = viewMonth;
    const startOffset = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), d);
      cells.push({ d, key: new Intl.DateTimeFormat('en-CA').format(dt) });
    }
    return cells;
  }, [viewMonth]);

  const todayKey = new Intl.DateTimeFormat('en-CA').format(new Date());
  const monthLabel = viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const canPrevMonth = viewMonth > new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(locale, { weekday: 'short' }));
  }, [locale]);

  const confirmBooking = async () => {
    setBooking(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          scheduled_at: selectedSlot.start,
          modality,
          reason: reason.trim() || null,
        }),
      });
      if (res.ok) {
        setConfirmed(await res.json());
      } else if (res.status === 409) {
        setError(t('book_slot_taken'));
        setSelectedSlot(null);
        loadSlots();
      } else {
        setError(t('book_error'));
      }
    } catch {
      setError(t('book_error'));
    } finally {
      setBooking(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6 text-center">
        {/* Used to say "Appointment confirmed!" in green — misleading, since
            `create_appointment` always leaves the appointment in
            `status=pending` until payment is confirmed (Stripe integration
            not wired up yet — see CLAUDE.md). Text/icon reflect the real state. */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <CalendarClock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-brand-dark">{t('book_confirmed_title')}</h2>
        <p className="text-sm text-gray-600 mt-2">
          {t('book_confirmed_desc')} <span className="font-bold">{fmtLongDate(confirmed.scheduled_at)}</span>, {fmtTime(confirmed.scheduled_at)} ({tz.replace('_', ' ')})
        </p>
        <p className="text-xs text-amber-600 mt-1">{t('book_confirmed_payment_note')}</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button onClick={onBooked} className="px-5 py-3 rounded-2xl bg-brand-blue text-white font-bold text-sm">
            {t('book_view_appointments')}
          </button>
          <button onClick={onBack} className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm">
            {t('book_back_to_doctor')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base px-5 pt-4 pb-16 lg:px-6 lg:pt-8">
      <div className="max-w-screen-xl mx-auto">
        <button onClick={onBack} className="mb-5 flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark">
          <ArrowLeft className="w-4 h-4" /> {preview ? t('book_preview_close') : t('detail_back_results')}
        </button>

        {preview && (
          <div className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-full">
            {t('book_preview_badge')}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left: doctor + settings */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4 h-fit">
            <div>
              <p className="text-xs text-gray-400 mb-2">{preview ? t('sched_title') : t('book_title')}</p>
              <div className="flex items-center gap-3">
                <DoctorAvatar avatarUrl={doctor?.avatar_url} fullName={doctor?.full_name} size={48} />
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-brand-dark truncate">{doctor?.full_name || '…'}</h2>
                  {doctor?.specialties?.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">
                      {doctor.specialties.map((s) => translateSpecialtyName(s.name, language)).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {doctor && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-brand-blue" />
                {doctor.appointment_duration_minutes} {t('book_minutes')}
              </p>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {t('book_timezone')}
              </p>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-dark bg-white"
              >
                <option value={BROWSER_TZ}>
                  {t('book_timezone_browser')} · {BROWSER_TZ.split('/').pop().replace('_', ' ')}
                </option>
                {doctor?.timezone && doctor.timezone !== BROWSER_TZ && (
                  <option value={doctor.timezone}>
                    {t('book_timezone_doctor')} · {doctor.timezone.split('/').pop().replace('_', ' ')}
                  </option>
                )}
                {COMMON_TZ.filter((z) => z !== BROWSER_TZ && z !== doctor?.timezone).map((z) => (
                  <option key={z} value={z}>{z.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: calendar + times */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 lg:p-6 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-4">{t('book_select_datetime')}</h3>

            {loading ? (
              <div className="flex flex-col items-center py-12 text-brand-blue">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">{t('book_loading_slots')}</p>
              </div>
            ) : visibleSlots.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">{t('book_no_slots')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 lg:gap-7">
                {/* calendar */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-3">
                    <button disabled={!canPrevMonth} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1.5 text-gray-400 disabled:opacity-30 hover:text-brand-blue">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-base font-bold text-brand-dark capitalize">{monthLabel}</span>
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1.5 text-gray-400 hover:text-brand-blue">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {weekdayLabels.map((w) => (
                      <span key={w} className="text-[11px] font-bold text-gray-400 uppercase py-1.5">{w}</span>
                    ))}
                    {grid.map((cell, i) => {
                      if (!cell) return <span key={i} className="aspect-square" />;
                      const has = byDay[cell.key]?.length > 0;
                      const isPast = cell.key < todayKey;
                      const active = selectedDate === cell.key;
                      return (
                        <div key={cell.key} className="aspect-square flex items-center justify-center">
                          <button
                            disabled={!has || isPast}
                            onClick={() => { setSelectedDate(cell.key); setSelectedSlot(null); }}
                            className={`w-4/5 aspect-square rounded-full text-sm sm:text-[15px] font-semibold transition-colors ${
                              active ? 'bg-brand-blue text-white'
                                : has && !isPast ? 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20'
                                : 'text-gray-300'
                            }`}
                          >
                            {cell.d}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* times */}
                <div className="sm:col-span-2 max-h-[460px] overflow-y-auto pr-1">
                  {!selectedDate ? (
                    <p className="text-xs text-gray-400 pt-2">{t('book_select_datetime')}</p>
                  ) : !byDay[selectedDate]?.length ? (
                    <p className="text-xs text-gray-400 pt-2">{t('book_no_slots_day')}</p>
                  ) : (
                    <div className="space-y-2.5">
                      {byDay[selectedDate].map((s) => (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s)}
                          className={`w-full py-3.5 rounded-xl text-sm font-bold border transition-colors ${
                            selectedSlot?.start === s.start
                              ? 'bg-brand-blue text-white border-brand-blue'
                              : 'border-brand-blue/40 text-brand-blue hover:bg-brand-blue/5'
                          }`}
                        >
                          {fmtTime(s.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedSlot && !preview && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm font-bold text-brand-dark capitalize">
                  {fmtLongDate(selectedSlot.start)} · {fmtTime(selectedSlot.start)}
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('book_reason_placeholder')}
                  rows={3}
                  className="w-full mt-3 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 resize-none focus:outline-none focus:border-brand-blue"
                />
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={confirmBooking}
                    disabled={booking}
                    className="flex-1 py-3 rounded-2xl bg-brand-blue text-white font-bold text-sm disabled:opacity-60"
                  >
                    {booking ? t('book_confirming') : t('book_confirm')}
                  </button>
                  <button onClick={() => setSelectedSlot(null)} className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-bold">
                    {t('book_change_slot')}
                  </button>
                </div>
              </div>
            )}
            {error && !selectedSlot && <p className="text-xs text-red-600 mt-3">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
