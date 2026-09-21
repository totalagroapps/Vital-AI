import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Star, ChevronRight, Video, Loader2, CalendarPlus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName, translateLanguageName } from '../i18n/catalogTranslations';

// Video search. `initialFilters` (specialty/language/insurance/name) come
// pre-selected from the landing form; the name field here refines further.
const EspecialistasVideoSearch = ({ apiUrl, initialFilters, onBack, onSelectDoctor, onBookDoctor }) => {
  const { t, language } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState(initialFilters?.name || '');

  const fetchDoctors = async (searchName) => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ modality: 'video', limit: '20', offset: '0' });
      if (searchName) params.set('name', searchName);
      (initialFilters?.specialty_ids || []).forEach((id) => params.append('specialty_ids', id));
      if (initialFilters?.language_id) params.set('language_id', initialFilters.language_id);
      if (initialFilters?.insurance_company_id) params.set('insurance_company_id', initialFilters.insurance_company_id);
      const res = await fetch(`${apiUrl}/api/doctors?${params.toString()}`);
      if (!res.ok) throw new Error(t('especialistasvideo_no_se_pudo_cargar_la'));
      const data = await res.json();
      setDoctors(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(t('especialistasvideo_no_se_pudo_conectar_con'));
      setDoctors([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDoctors(initialFilters?.name || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-base pb-24 font-sans px-5 pt-4">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t('especialistasvideo_especialistas')}
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Video className="text-brand-blue" size={22} />
        <h2 className="text-xl font-extrabold text-brand-dark">{t('especialistasvideo_cita_rapida_por_videollamada')}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">{t('especialistasvideo_medicos_disponibles_ahora_mismo_sin')}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); fetchDoctors(name); }}
        className="relative mb-5"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('land_name_placeholder')}
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-brand-dark focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
        />
      </form>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-brand-blue">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm font-medium">{t('especialistasvideo_buscando_medicos')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4 text-center">
          {error}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
          {t('especialistasvideo_no_hay_medicos_disponibles_por')}
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
            {total} {t('especialistasvideo_medico_disponible', { value: total !== 1 ? 's' : '' })}{total !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {doctors.map((d) => (
              <div
                key={d.id}
                role="button"
                tabIndex={0}
                onClick={() => onBookDoctor(d.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') onBookDoctor(d.id); }}
                className="group w-full text-left bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all flex items-center gap-3 cursor-pointer"
              >
                <button
                  type="button"
                  title={t('especialistasvideo_ver_perfil')}
                  onClick={(e) => { e.stopPropagation(); onSelectDoctor(d.id); }}
                  className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center shrink-0 text-lg hover:ring-2 hover:ring-brand-blue/50 transition"
                >
                  {(d.full_name || '?').trim().charAt(0).toUpperCase()}
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    title={t('especialistasvideo_ver_perfil')}
                    onClick={(e) => { e.stopPropagation(); onSelectDoctor(d.id); }}
                    className="font-bold text-gray-900 text-sm truncate max-w-full block text-left hover:text-brand-blue transition-colors"
                  >
                    {d.full_name || t('especialistasvideo_medico_sin_nombre')}
                  </button>
                  <p className="text-[11px] text-gray-500 truncate">
                    {(d.specialties || []).map((s) => translateSpecialtyName(s.name, language)).join(', ') || 'Especialidad no informada'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {d.rating != null && (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
                        <Star size={12} className="fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)}
                      </span>
                    )}
                    {(d.languages || []).length > 0 && (
                      <span className="text-[10px] text-gray-400 truncate">
                        {d.languages.map((l) => translateLanguageName(l.code, l.name, language)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5 text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelectDoctor(d.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-bold text-brand-blue whitespace-nowrap flex items-center gap-0.5"
                  >
                    {t('especialistasvideo_ver_perfil')} <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                    <CalendarPlus className="w-3.5 h-3.5" /> {t('especialistasvideo_reservar')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EspecialistasVideoSearch;
