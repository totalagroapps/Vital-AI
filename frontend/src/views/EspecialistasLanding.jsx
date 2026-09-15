import React, { useEffect, useState } from 'react';
import {
  MapPin, Video, ShieldCheck, Calendar, Users, ArrowLeft, ArrowRight,
  Clock, Loader2, Search,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName, translateLanguageName } from '../i18n/catalogTranslations';
import SearchableSelect from '../components/SearchableSelect';
import LanguageFlag from '../components/LanguageFlag';

// Specialist search landing: filter form (specialty required, language/
// insurance/name optional) followed by the video/in-person choice.
const EspecialistasLanding = ({ apiUrl, onBack, onSelectVideo, onSelectPresencial, onMyAppointments }) => {
  const { t, language } = useLanguage();

  const [specialties, setSpecialties] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [insuranceCatalog, setInsuranceCatalog] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [specialtyIds, setSpecialtyIds] = useState([]);
  const [languageId, setLanguageId] = useState(null);
  const [insuranceId, setInsuranceId] = useState(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/specialties`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiUrl}/api/languages`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${apiUrl}/api/insurance-companies`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, l, i]) => { setSpecialties(s); setLanguages(l); setInsuranceCatalog(i); })
      .catch(() => {})
      .finally(() => setLoadingCatalogs(false));
  }, [apiUrl]);

  const buildFilters = () => ({
    specialty_ids: specialtyIds,
    language_id: languageId,
    insurance_company_id: insuranceId,
    name: name.trim() || undefined,
  });

  const handleSelect = (callback) => {
    if (specialtyIds.length === 0) {
      setFormError(t('land_err_specialty_required'));
      return;
    }
    setFormError('');
    callback(buildFilters());
  };

  return (
    <div className="min-h-screen bg-base pb-24 font-sans px-5 pt-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('land_back')}
        </button>
        {onMyAppointments && (
          <button
            onClick={onMyAppointments}
            className="flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:text-blue-600 transition-colors"
          >
            <Calendar className="w-4 h-4" /> {t('appts_title')}
          </button>
        )}
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark leading-tight mb-2">
        {t('land_title')}
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md">
        {t('land_subtitle')}
      </p>

      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft mb-6">
        <h3 className="font-bold text-gray-900 text-sm mb-4">{t('land_filter_title')}</h3>
        {loadingCatalogs ? (
          <div className="flex items-center justify-center py-6 text-brand-blue">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                {t('land_specialty_label')}
              </label>
              <SearchableSelect
                items={specialties}
                value={specialtyIds}
                onChange={setSpecialtyIds}
                multiple
                placeholder={t('land_specialty_placeholder')}
                renderLabel={(s) => translateSpecialtyName(s.name, language)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                  {t('land_language_label')}
                </label>
                <SearchableSelect
                  items={languages}
                  value={languageId}
                  onChange={setLanguageId}
                  placeholder={t('land_language_placeholder')}
                  clearLabel={t('land_any')}
                  renderLabel={(l) => translateLanguageName(l.code, l.name, language)}
                  renderIcon={(l) => <LanguageFlag code={l.code} />}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                  {t('land_insurance_label')}
                </label>
                <SearchableSelect
                  items={insuranceCatalog}
                  value={insuranceId}
                  onChange={setInsuranceId}
                  placeholder={t('land_insurance_placeholder')}
                  clearLabel={t('land_any')}
                  renderLabel={(i) => i.name}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5 uppercase tracking-wider">
                {t('land_name_label')}
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('land_name_placeholder')}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {formError && (
        <div className="p-3.5 rounded-xl text-sm text-center border bg-red-50 border-red-200 text-red-600 font-medium mb-4">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft relative">
          <span className="absolute top-4 left-4 w-12 h-12 rounded-full bg-brand-purple/10 text-brand-purple text-xl font-extrabold flex items-center justify-center z-10">1</span>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full h-[134px] sm:h-auto sm:w-[202px] md:w-56 shrink-0 rounded-2xl overflow-hidden bg-brand-purple/5 order-1 sm:order-2">
              <img
                src="/images/in-person.png"
                alt=""
                className="w-full h-full object-contain p-2"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0 order-2 sm:order-1">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 leading-snug pl-12 mb-2">
                {t('land_option_presencial_title')}
              </h3>
              <p className="text-base text-gray-500 leading-relaxed mb-4 pl-12">
                {t('land_option_presencial_desc')}
              </p>
              <ul className="space-y-3 mb-5">
                {[
                  { Icon: MapPin, text: t('land_option_presencial_bullet1') },
                  { Icon: Calendar, text: t('land_option_presencial_bullet2') },
                  { Icon: Users, text: t('land_option_presencial_bullet3') },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-center gap-2 text-base text-gray-600">
                    <Icon size={16} className="text-brand-purple shrink-0" /> {text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(onSelectPresencial)}
                className="w-full lg:max-w-xs flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 border-brand-purple text-brand-purple bg-white hover:bg-brand-purple hover:text-white shadow-md transition-all active:scale-95"
              >
                {t('land_option_presencial_cta')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-soft relative">
          <span className="absolute top-4 left-4 w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue text-xl font-extrabold flex items-center justify-center z-10">2</span>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full h-[134px] sm:h-auto sm:w-[202px] md:w-56 shrink-0 rounded-2xl overflow-hidden bg-brand-blue/5 order-1 sm:order-2">
              <img
                src="/images/video-call.png"
                alt=""
                className="w-full h-full object-contain p-2"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0 order-2 sm:order-1">
              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 leading-snug pl-12 mb-2">
                {t('land_option_video_title')}
              </h3>
              <p className="text-base text-gray-500 leading-relaxed mb-4 pl-12">
                {t('land_option_video_desc')}
              </p>
              <ul className="space-y-3 mb-5">
                {[
                  { Icon: Video, text: t('land_option_video_bullet1') },
                  { Icon: Clock, text: t('land_option_video_bullet2') },
                  { Icon: ShieldCheck, text: t('land_option_video_bullet3') },
                ].map(({ Icon, text }, i) => (
                  <li key={i} className="flex items-center gap-2 text-base text-gray-600">
                    <Icon size={16} className="text-brand-blue shrink-0" /> {text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelect(onSelectVideo)}
                className="w-full lg:max-w-xs flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 border-brand-blue text-brand-blue bg-white hover:bg-brand-blue hover:text-white shadow-md transition-all active:scale-95"
              >
                {t('land_option_video_cta')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 mb-8 mt-3">
        <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-700">{t('land_security_title')}.</span> {t('land_security_desc')}
        </p>
      </div>

      <h4 className="text-center text-base font-bold text-gray-900 mb-5">{t('land_how_title')}</h4>
      <div className="grid grid-cols-2 gap-8 text-center max-w-md mx-auto">
        {[
          { Icon: Calendar, title: t('land_how_step1_title'), text: t('land_how_step1_desc') },
          { Icon: Users, title: t('land_how_step2_title'), text: t('land_how_step2_desc') },
        ].map(({ Icon, title, text }, i) => (
          <div key={i} className="flex flex-col items-center px-1">
            <div className="w-16 h-16 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-2">
              <Icon size={26} />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-tight">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EspecialistasLanding;
