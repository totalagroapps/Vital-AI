import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Star, MapPin, Phone, Mail, Globe, GraduationCap,
  ShieldCheck, Loader2, Calendar, Building2, Pencil, MessageCircle,
  Video, Navigation, Map as MapIcon, Clock, Stethoscope, ShieldPlus,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName, translateLanguageName } from '../i18n/catalogTranslations';
import DoctorLocationMap from '../components/DoctorLocationMap';
import DoctorAvatar from '../components/DoctorAvatar';

// Doctor profile card, used both by patients and by a doctor viewing their
// own profile (isOwnProfile — adds an edit button, hides the booking CTA).
const hhmm = (time) => (time ? time.slice(0, 5) : '');
const weekdayName = (weekday, locale) =>
  new Date(2024, 0, 1 + weekday).toLocaleDateString(locale, { weekday: 'long' });
const scheduleModalityLabel = (t, modality) =>
  modality === 'both' ? t('sched_modality_both')
    : modality === 'in_person' ? t('book_modality_in_person')
    : t('book_modality_video');

function formatDistance(distanceKm) {
  if (distanceKm == null) return null;
  if (distanceKm >= 1) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm * 1000)} m`;
}

const InfoCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100">
    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
      {icon} {title}
    </h3>
    {children}
  </div>
);

const EspecialistaDetail = ({ apiUrl, doctorId, doctor: doctorProp, distanceKm, onBack, isOwnProfile, onEditProfile, onBook }) => {
  const { t, language, locale: uiLocale } = useLanguage();
  const [doctor, setDoctor] = useState(doctorProp || null);
  const [isLoading, setIsLoading] = useState(!doctorProp);
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctorProp) { setDoctor(doctorProp); return; }
    let cancelled = false;
    setIsLoading(true);
    setError('');
    fetch(`${apiUrl}/api/doctors/${doctorId}`)
      .then((res) => {
        if (!res.ok) throw new Error(t('especialistadetail_not_found'));
        return res.json();
      })
      .then((data) => { if (!cancelled) setDoctor(data); })
      .catch(() => { if (!cancelled) setError(t('detail_load_error')); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, doctorId, doctorProp]);

  const scheduleByDay = useMemo(() => {
    const map = {};
    for (const s of doctor?.availability_schedules || []) {
      (map[s.weekday] ||= []).push(s);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time)));
    }
    return map;
  }, [doctor?.availability_schedules]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center text-brand-blue">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm font-medium">{t('detail_loading')}</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-base px-5 pt-4">
        <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-bold text-gray-500">
          <ArrowLeft className="w-4 h-4" /> {t('detail_back')}
        </button>
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4 text-center">
          {error || t('detail_not_found')}
        </div>
      </div>
    );
  }

  const locale = uiLocale;
  const wip = () => alert(t('detail_action_wip'));
  // defense in depth against javascript: URLs
  const isSafeHttpUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const hasSafeWebsite = !!doctor.website && isSafeHttpUrl(doctor.website);
  const openWebsite = () => {
    if (!hasSafeWebsite) return;
    window.open(doctor.website, '_blank', 'noreferrer');
  };
  const hasLocation = doctor.lat != null && doctor.lng != null;
  const canGetDirections = hasLocation || !!doctor.address;
  // all bookings are video-only; hide the calendar entirely if the doctor doesn't offer it
  const offersVideo = doctor.modality === 'video' || doctor.modality === 'both';
  // own-profile view: open the booking calendar preview instead of trying to book
  const openOwnCalendarPreview = () => {
    window.open(`${window.location.origin}${window.location.pathname}?preview=${doctor.id}`, '_blank');
  };
  const handleVideoAction = () => (isOwnProfile ? openOwnCalendarPreview() : onBook?.(doctor));
  const openDirections = () => {
    if (!canGetDirections) return;
    const destination = hasLocation ? `${doctor.lat},${doctor.lng}` : doctor.address;
    const buildUrl = (originParam) =>
      `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(destination)}`;
    // pass the patient's real location as origin, or Maps falls back to a stale default
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => window.open(buildUrl(`&origin=${pos.coords.latitude},${pos.coords.longitude}`), '_blank', 'noopener,noreferrer'),
        () => window.open(buildUrl(''), '_blank', 'noopener,noreferrer'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      window.open(buildUrl(''), '_blank', 'noopener,noreferrer');
    }
  };
  const distanceLabel = formatDistance(distanceKm ?? doctor.distance_km);
  const specialtyNames = (doctor.specialties || []).map((s) => translateSpecialtyName(s.name, language));
  const languageNames = (doctor.languages || []).map((l) => translateLanguageName(l.code, l.name, language));
  const insuranceNames = (doctor.insurance_companies || []).map((i) => i.name);

  return (
    <div className="min-h-screen bg-base pb-28 font-sans px-5 pt-4 lg:px-6 lg:pt-8">
      <div className="max-w-screen-2xl mx-auto">

        <div className="flex items-center justify-between mb-5 gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors">
            <ArrowLeft className="w-4 h-4" /> {isOwnProfile ? t('detail_back') : t('detail_back_results')}
          </button>
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors shrink-0"
            >
              <Pencil className="w-4 h-4" /> {t('detail_edit_profile')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          <div className="lg:col-span-3 space-y-4">

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start gap-4">
                <DoctorAvatar avatarUrl={doctor.avatar_url} fullName={doctor.full_name} size={76} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-xl font-extrabold text-brand-dark truncate">{doctor.full_name}</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      <ShieldCheck size={11} /> {t('detail_affiliated')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {specialtyNames.join(', ') || t('detail_specialty_unset')}
                  </p>
                  {doctor.rating != null && (
                    <p className="mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-900">
                        <Star size={13} className="fill-amber-400 text-amber-400" /> {doctor.rating.toFixed(1)}
                      </span>
                    </p>
                  )}
                  {(doctor.clinic_name || doctor.address) && (
                    <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                      <MapPin size={13} className="shrink-0 mt-0.5" />
                      <span>
                        {doctor.clinic_name}
                        {doctor.clinic_name && doctor.address && <br />}
                        {doctor.address}
                      </span>
                    </p>
                  )}
                </div>
                {distanceLabel && (
                  <span className="text-sm font-bold text-brand-blue shrink-0 text-right">{distanceLabel}</span>
                )}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                <span className="font-bold">{t('detail_verified_title')}.</span>
                <br />
                {t('detail_verified_desc')}
              </p>
            </div>

            <div className={`grid gap-2 ${hasSafeWebsite ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <button onClick={wip} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:border-brand-blue/40 transition-colors">
                <MessageCircle className="w-5 h-5 text-brand-blue" />
                <span className="text-[10px] font-semibold">{t('detail_action_chat')}</span>
              </button>
              <button onClick={wip} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:border-brand-blue/40 transition-colors">
                <Phone className="w-5 h-5 text-brand-blue" />
                <span className="text-[10px] font-semibold">{t('detail_action_call')}</span>
              </button>
              <button
                onClick={handleVideoAction}
                disabled={!offersVideo}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:border-brand-blue/40 transition-colors disabled:opacity-40 disabled:hover:border-gray-200"
              >
                <Video className="w-5 h-5 text-brand-blue" />
                <span className="text-[10px] font-semibold">{t('detail_action_video')}</span>
              </button>
              <button
                onClick={openDirections}
                disabled={!canGetDirections}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:border-brand-blue/40 transition-colors disabled:opacity-40 disabled:hover:border-gray-200"
              >
                <Navigation className="w-5 h-5 text-brand-blue" />
                <span className="text-[10px] font-semibold">{t('detail_action_directions')}</span>
              </button>
              {hasSafeWebsite && (
                <button onClick={openWebsite} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10 transition-colors">
                  <Globe className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{t('detail_action_website')}</span>
                </button>
              )}
            </div>
          </div>

          {hasLocation ? (
            <div className="lg:col-span-2">
              <DoctorLocationMap address={doctor.address} lat={doctor.lat} lng={doctor.lng} onChange={() => {}} readOnly />
            </div>
          ) : (
            <div className="lg:col-span-2 bg-gray-50 border border-dashed border-gray-200 rounded-2xl h-48 lg:h-64 flex flex-col items-center justify-center text-gray-400 text-center px-4">
              <MapIcon className="w-7 h-7 mb-2" />
              <p className="text-xs max-w-[220px]">{t('detail_map_pending')}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

          <InfoCard icon={<Clock size={15} className="text-brand-blue" />} title={t('detail_hours_title')}>
            {Object.keys(scheduleByDay).length === 0 ? (
              <p className="text-xs text-gray-400">{t('detail_hours_pending')}</p>
            ) : (
              <div className="space-y-2.5">
                {[0, 1, 2, 3, 4, 5, 6].filter((wd) => scheduleByDay[wd]).map((wd) => (
                  <div key={wd}>
                    <p className="text-xs font-bold text-brand-dark capitalize">{weekdayName(wd, locale)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {scheduleByDay[wd].map((b) => (
                        <span key={b.id} className="text-[11px] font-semibold text-brand-blue bg-brand-blue/10 px-2 py-1 rounded-lg">
                          {hhmm(b.start_time)}–{hhmm(b.end_time)} · {scheduleModalityLabel(t, b.modality)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>

          <InfoCard icon={<Star size={15} className="text-amber-400" />} title={t('detail_reviews_title')}>
            <p className="text-xs text-gray-400">{t('detail_reviews_pending')}</p>
          </InfoCard>

          <InfoCard icon={<Stethoscope size={20} className="text-brand-purple" />} title={`${t('detail_about_prefix')} ${doctor.full_name}`}>
            <div className="space-y-3 text-[15.6px]">
              <div className="flex items-start gap-2 text-gray-700">
                <Stethoscope size={18} className="text-brand-purple shrink-0 mt-0.5" />
                <span>{specialtyNames.length > 0 ? `${t('detail_specialist_in')} ${specialtyNames.join(', ')}` : t('detail_specialty_unset')}</span>
              </div>
              {doctor.years_experience != null && (
                <div className="flex items-start gap-2 text-gray-700">
                  <Calendar size={18} className="text-brand-purple shrink-0 mt-0.5" />
                  <span>{doctor.years_experience} {t('detail_years_suffix')}</span>
                </div>
              )}
              {doctor.education && (
                <div className="flex items-start gap-2 text-gray-700">
                  <GraduationCap size={18} className="text-brand-purple shrink-0 mt-0.5" />
                  <span>{doctor.education}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-gray-700">
                <Globe size={18} className="text-brand-purple shrink-0 mt-0.5" />
                <span>{languageNames.join(', ') || '—'}</span>
              </div>
              {insuranceNames.length > 0 && (
                <div className="flex items-start gap-2 text-gray-700">
                  <ShieldPlus size={18} className="text-brand-purple shrink-0 mt-0.5" />
                  <span>{insuranceNames.join(', ')}</span>
                </div>
              )}
              {doctor.phone && (
                <div className="flex items-start gap-2 text-gray-700">
                  <Phone size={18} className="text-brand-purple shrink-0 mt-0.5" />
                  <span>{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-start gap-2 text-gray-700">
                  <Mail size={18} className="text-brand-purple shrink-0 mt-0.5" />
                  <span>{doctor.email}</span>
                </div>
              )}
              {!doctor.clinic_name && !doctor.address && !doctor.phone && !doctor.email && !doctor.website && (
                <p className="text-gray-400 pt-1">{t('detail_no_contact')}</p>
              )}
            </div>
          </InfoCard>

        </div>
      </div>

      {!isOwnProfile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="max-w-screen-2xl mx-auto">
            {offersVideo ? (
              <button
                onClick={() => onBook?.(doctor)}
                className="w-full lg:max-w-sm lg:mx-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-brand-blue hover:bg-blue-600 transition-colors"
              >
                <Calendar size={20} className="shrink-0" /> <span className="leading-none">{t('detail_appointment_cta')}</span>
              </button>
            ) : (
              <p className="text-center text-xs text-gray-500 py-2">{t('detail_no_video_notice')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EspecialistaDetail;
