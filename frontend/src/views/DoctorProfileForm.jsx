import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Search, X, Stethoscope, MapPin, Phone, Globe, Mail, GraduationCap, Building2, CheckCircle2, Camera } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName, translateLanguageName } from '../i18n/catalogTranslations';
import { CALLING_CODES_BY_LENGTH } from '../data/callingCodes';
import PhonePrefixSelect from '../components/PhonePrefixSelect';
import LanguageFlag from '../components/LanguageFlag';
import DoctorLocationMap from '../components/DoctorLocationMap';

// Doctor profile create/edit form (POST/PATCH /api/doctors/me).
// `existingProfile` null => create mode; otherwise edit mode.
const MODALITY_OPTIONS = [
  { value: 'video', key: 'profile_modality_video' },
  { value: 'in_person', key: 'profile_modality_in_person' },
  { value: 'both', key: 'profile_modality_both' },
];

const emptyForm = {
  full_name: '',
  modality: 'video',
  specialty_ids: [],
  language_ids: [],
  insurance_companies: [],
  address: '',
  lat: '',
  lng: '',
  avatar_url: '',
  clinic_name: '',
  phone_prefix: '+34',
  phone: '',
  email: '',
  website: '',
  years_experience: '',
  education: '',
};

// splits a stored "+34 600 123 456" phone into prefix + digits, longest dial codes first
function splitPhone(raw) {
  if (!raw) return { prefix: '+34', rest: '' };
  const trimmed = raw.trim();
  const match = CALLING_CODES_BY_LENGTH.find((c) => trimmed.startsWith(c.dial));
  if (match) {
    return { prefix: match.dial, rest: trimmed.slice(match.dial.length).replace(/\D/g, '') };
  }
  return { prefix: '+34', rest: trimmed.replace(/\D/g, '') };
}

function formatPhoneDigits(digits) {
  return digits.match(/.{1,3}/g)?.join(' ') || '';
}

const DoctorProfileForm = ({ apiUrl, authHeaders, existingProfile, onSaved, onBack, headerExtra }) => {
  const { t, language } = useLanguage();
  const isEditing = !!existingProfile;

  const [form, setForm] = useState(() => {
    if (!existingProfile) return emptyForm;
    const { prefix, rest } = splitPhone(existingProfile.phone);
    return {
      full_name: existingProfile.full_name || '',
      modality: existingProfile.modality || 'video',
      specialty_ids: (existingProfile.specialties || []).map((s) => s.id),
      language_ids: (existingProfile.languages || []).map((l) => l.id),
      insurance_companies: (existingProfile.insurance_companies || []).map((i) => i.name),
      address: existingProfile.address || '',
      lat: existingProfile.lat ?? '',
      lng: existingProfile.lng ?? '',
      avatar_url: existingProfile.avatar_url || '',
      clinic_name: existingProfile.clinic_name || '',
      phone_prefix: prefix,
      phone: rest,
      email: existingProfile.email || '',
      website: existingProfile.website || '',
      years_experience: existingProfile.years_experience ?? '',
      education: existingProfile.education || '',
    };
  });

  const [specialties, setSpecialties] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [insuranceCatalog, setInsuranceCatalog] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [insuranceInput, setInsuranceInput] = useState('');
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const insuranceWrapperRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // avatar upload requires an existing profile, so only available in edit mode
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setAvatarUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${apiUrl}/api/doctors/me/avatar`, { method: 'POST', headers: authHeaders, body });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      } else {
        const detail = data.detail;
        setAvatarError(typeof detail === 'string' ? detail : t('profile_err_generic'));
      }
    } catch (err) {
      setAvatarError(t('profile_err_network'));
    }
    setAvatarUploading(false);
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [sRes, lRes, iRes] = await Promise.all([
          fetch(`${apiUrl}/api/specialties`),
          fetch(`${apiUrl}/api/languages`),
          fetch(`${apiUrl}/api/insurance-companies`),
        ]);
        setSpecialties(sRes.ok ? await sRes.json() : []);
        setLanguages(lRes.ok ? await lRes.json() : []);
        setInsuranceCatalog(iRes.ok ? await iRes.json() : []);
      } catch (e) {
        setError(t('profile_err_network'));
      }
      setLoadingCatalogs(false);
    };
    loadCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const toggleId = (field, id) => {
    setForm((prev) => {
      const has = prev[field].includes(id);
      return {
        ...prev,
        [field]: has ? prev[field].filter((x) => x !== id) : [...prev[field], id],
      };
    });
  };

  const addInsurance = (nameRaw) => {
    const name = nameRaw.trim();
    if (!name) return;
    setForm((prev) =>
      prev.insurance_companies.some((n) => n.toLowerCase() === name.toLowerCase())
        ? prev
        : { ...prev, insurance_companies: [...prev.insurance_companies, name] }
    );
    setInsuranceInput('');
  };

  const removeInsurance = (name) => {
    setForm((prev) => ({ ...prev, insurance_companies: prev.insurance_companies.filter((n) => n !== name) }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (insuranceWrapperRef.current && !insuranceWrapperRef.current.contains(e.target)) {
        setInsuranceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insuranceQuery = insuranceInput.trim().toLowerCase();
  const insuranceSuggestions = insuranceCatalog
    .filter((i) => !form.insurance_companies.some((n) => n.toLowerCase() === i.name.toLowerCase()))
    .filter((i) => !insuranceQuery || i.name.toLowerCase().includes(insuranceQuery))
    .slice(0, 8);

  const needsLocation = form.modality !== 'video';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const WEBSITE_RE = /^https?:\/\/.+\..+/i;
  const phoneDigits = form.phone.replace(/\D/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.specialty_ids.length === 0) {
      setError(t('profile_err_specialty_required'));
      return;
    }
    if (form.language_ids.length === 0) {
      setError(t('profile_err_language_required'));
      return;
    }
    if (needsLocation && (!form.address || form.lat === '' || form.lng === '')) {
      setError(t('profile_err_location_required'));
      return;
    }
    if (form.email && !EMAIL_RE.test(form.email)) {
      setError(t('profile_err_email_invalid'));
      return;
    }
    if (form.phone && (phoneDigits.length < 4 || phoneDigits.length > 14)) {
      setError(t('profile_err_phone_invalid'));
      return;
    }
    if (form.website && !WEBSITE_RE.test(form.website)) {
      setError(t('profile_err_website_invalid'));
      return;
    }

    const payload = {
      full_name: form.full_name,
      modality: form.modality,
      specialty_ids: form.specialty_ids,
      language_ids: form.language_ids,
      insurance_companies: form.insurance_companies,
      address: form.address || undefined,
      lat: form.lat !== '' ? parseFloat(form.lat) : undefined,
      lng: form.lng !== '' ? parseFloat(form.lng) : undefined,
      avatar_url: form.avatar_url || undefined,
      clinic_name: form.clinic_name || undefined,
      phone: phoneDigits ? `${form.phone_prefix} ${formatPhoneDigits(phoneDigits)}` : undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      years_experience: form.years_experience !== '' ? parseInt(form.years_experience, 10) : undefined,
      education: form.education || undefined,
    };

    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/doctors/me`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
        setTimeout(() => onSaved(data), 1200);
      } else {
        const detail = data.detail;
        const msg = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg).join('; ')
            : t('profile_err_generic');
        setError(msg);
      }
    } catch (e) {
      setError(t('profile_err_network'));
    }
    setIsSaving(false);
  };

  const filteredSpecialties = specialties.filter((s) =>
    translateSpecialtyName(s.name, language).toLowerCase().includes(specialtyFilter.toLowerCase())
  );

  const inputClass =
    'w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all';
  const labelClass = 'block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider';

  if (saved) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-5 font-sans">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <h2 className="text-lg font-extrabold text-brand-dark mb-1">
            {isEditing ? t('profile_saved_edit_title') : t('profile_saved_create_title')}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {t('profile_saved_desc')}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('profile_saved_reloading')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base pb-28 font-sans px-5 pt-4 lg:px-10 lg:pt-8">
      <div className="max-w-5xl mx-auto">
        {(onBack || headerExtra) ? (
          <div className="mb-4 flex items-center justify-between gap-2">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('profile_back')}
              </button>
            ) : <span />}
            {headerExtra}
          </div>
        ) : null}

        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="text-brand-blue" size={22} />
          <h2 className="text-xl font-extrabold text-brand-dark">
            {isEditing ? t('profile_edit_title') : t('profile_create_title')}
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          {isEditing ? t('profile_edit_subtitle') : t('profile_create_subtitle')}
        </p>

        {loadingCatalogs ? (
          <div className="flex flex-col items-center justify-center py-16 text-brand-blue">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium">{t('profile_loading_catalogs')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">{t('profile_section_basic')}</h3>
            <div>
              <label className={labelClass}>{t('profile_full_name')}</label>
              <input
                required
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder={t('profile_full_name_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('profile_modality')}</label>
              <select
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
                className={inputClass}
              >
                {MODALITY_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{t(m.key)}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue" /> {t('profile_section_location')}
            </h3>
            <div>
              <label className={labelClass}>{t('profile_address')}{needsLocation ? ' *' : ''}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder={t('profile_address_placeholder')}
                className={inputClass}
              />
            </div>
            <DoctorLocationMap
              address={form.address}
              lat={form.lat === '' ? null : form.lat}
              lng={form.lng === '' ? null : form.lng}
              onChange={({ lat, lng, address }) =>
                setForm((prev) => ({ ...prev, lat, lng, ...(address !== undefined ? { address } : {}) }))
              }
            />
            <p className="text-[11px] text-gray-400">
              {t('profile_location_note')}
            </p>
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('profile_section_specialties')}</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                placeholder={t('profile_search_specialty')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-sm text-brand-dark focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-2 grid content-start grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1">
              {filteredSpecialties.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.specialty_ids.includes(s.id)}
                    onChange={() => toggleId('specialty_ids', s.id)}
                    className="accent-brand-blue w-4 h-4"
                  />
                  {translateSpecialtyName(s.name, language)}
                </label>
              ))}
              {filteredSpecialties.length === 0 && (
                <p className="text-xs text-gray-400 col-span-2 text-center py-4">{t('profile_no_results')}</p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('profile_section_languages')}</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => {
                const active = form.language_ids.includes(l.id);
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => toggleId('language_ids', l.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-blue/40'
                    }`}
                  >
                    <LanguageFlag code={l.code} />
                    {translateLanguageName(l.code, l.name, language)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">{t('profile_section_insurance')}</h3>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={insuranceWrapperRef}>
                <input
                  type="text"
                  value={insuranceInput}
                  onChange={(e) => { setInsuranceInput(e.target.value); setInsuranceOpen(true); }}
                  onFocus={() => setInsuranceOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addInsurance(insuranceInput); setInsuranceOpen(false); }
                  }}
                  placeholder={t('profile_insurance_placeholder')}
                  className={`${inputClass} w-full`}
                />
                {insuranceOpen && insuranceSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden py-1 max-h-52 overflow-y-auto animate-in slide-in-from-top-2 duration-150">
                    {insuranceSuggestions.map((i) => (
                      <button
                        type="button"
                        key={i.id}
                        onClick={() => { addInsurance(i.name); setInsuranceOpen(false); }}
                        className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-brand-blue/5 hover:text-brand-blue transition-colors"
                      >
                        {i.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { addInsurance(insuranceInput); setInsuranceOpen(false); }}
                className="px-4 rounded-xl bg-brand-blue/10 text-brand-blue font-bold text-sm hover:bg-brand-blue/20 transition-colors shrink-0"
              >
                {t('profile_add')}
              </button>
            </div>
            {form.insurance_companies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.insurance_companies.map((name) => (
                  <span key={name} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {name}
                    <button type="button" onClick={() => removeInsurance(name)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">{t('profile_section_contact')}</h3>
            <div>
              <label className={labelClass}><Building2 className="w-3 h-3 inline mr-1" />{t('profile_clinic_name')}</label>
              <input type="text" value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}><Phone className="w-3 h-3 inline mr-1" />{t('profile_phone')}</label>
                <div className="flex gap-2">
                  <PhonePrefixSelect value={form.phone_prefix} onChange={(dial) => setForm({ ...form, phone_prefix: dial })} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="600 123 456"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" />{t('profile_email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}><Globe className="w-3 h-3 inline mr-1" />{t('profile_website')}</label>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder={t('doctorprofileform_https')} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t('profile_years_experience')}</label>
                <input type="number" min="0" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('profile_avatar_url')}</label>
                <div className="flex items-center gap-3">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                  )}
                  <input
                    type="url"
                    value={form.avatar_url}
                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder={t('doctorprofileform_https')}
                    className={`${inputClass} flex-1`}
                  />
                  {isEditing && (
                    <label className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand-blue/10 text-brand-blue text-xs font-bold cursor-pointer hover:bg-brand-blue/20 transition-colors">
                      {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                      {t('profile_avatar_upload')}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} disabled={avatarUploading} className="hidden" />
                    </label>
                  )}
                </div>
                {avatarError && <p className="text-[11px] text-red-600 mt-1.5">{avatarError}</p>}
                {!isEditing && <p className="text-[11px] text-gray-400 mt-1.5">{t('profile_avatar_upload_after_create')}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}><GraduationCap className="w-3 h-3 inline mr-1" />{t('profile_education')}</label>
              <textarea
                value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>
          </section>

            </div>

            {error && (
              <div className="p-3.5 rounded-xl text-sm text-center border bg-red-50 border-red-200 text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="sticky bottom-[88px] z-30 bg-white/95 backdrop-blur rounded-2xl p-4 border border-gray-100 shadow-lg">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full lg:max-w-sm lg:mx-auto lg:block py-4 rounded-2xl font-bold text-white bg-brand-blue hover:bg-blue-600 shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? t('profile_submit_edit') : t('profile_submit_create'))}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorProfileForm;
