import React, { useState } from 'react';
import { ALL_COUNTRIES } from '../../../data/countries';
import { 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
  TrendingUp, 
  Heart, 
  Calendar, 
  Mail, 
  ChevronDown, 
  Lock, 
  Eye, 
  EyeOff, 
  FileText, 
  Award, 
  Upload, 
  ArrowRight 
} from 'lucide-react';
import iaBanner from '../../../assets/Imges_Paciente.png';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function Step1Personal({ formData, updateFormData, onNext }) {
  const { t, language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // País seleccionado por defecto (Colombia como fallback)
  const selectedCountryObj = ALL_COUNTRIES.find((c) => c.name === formData.country) || 
                             ALL_COUNTRIES.find((c) => c.name === 'Colombia') || 
                             ALL_COUNTRIES[0];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({ [name]: type === 'checkbox' ? checked : value });
  };

  const handleCountryChange = (e) => {
    const selected = ALL_COUNTRIES.find((c) => c.name === e.target.value);
    if (selected) {
      updateFormData({
        country: selected.name,
        phoneCode: selected.dialCode,
      });
    }
  };

  const handleFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData({ [field]: e.target.files[0] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      alert(t('terms_accept_label', 'Debes aceptar los Términos de servicio y la Política de privacidad.'));
      return;
    }
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8">
      {/* Sidebar Izquierda */}
      <aside className="w-full xl:w-72 shrink-0 flex flex-col justify-between py-2">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {t('join_mivor_title', 'Únete a MIVOR.ai')}
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {t('join_mivor_subtitle', 'La plataforma de IA médica hecha para profesionales como tú.')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('clinical_ai_adv', 'IA clínica avanzada')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('clinical_ai_adv_desc', 'Resúmenes inteligentes, análisis y apoyo en decisiones.')}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('manage_patients_feat', 'Gestiona tus pacientes')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('manage_patients_feat_desc', 'Historiales completos, pruebas y consultas en un lugar.')}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('safe_confidential', 'Seguro y confidencial')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('safe_confidential_desc', 'Cumplimos los más altos estándares de privacidad.')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/60 flex items-center gap-3">
          <HelpCircle className="text-blue-600 shrink-0" size={24} />
          <div className="text-xs">
            <p className="font-bold text-slate-700">{t('patienttopnav_necesitas_ayuda')}</p>
            <p className="text-blue-600 font-medium">soporte@mivor.ai</p>
          </div>
        </div>
      </aside>

      {/* Formulario Central */}
      <main className="w-full xl:flex-1 xl:max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t('create_prof_account', 'Crea tu cuenta profesional')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('step1personal_el_proceso_es_rapido_seguro')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1: Datos Personales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-blue-600">1. {t('step_personal_data', 'Datos personales')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('name')}</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder={t('step1personal_ingresa_tu_nombre')}
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_apellidos')}</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder={t('step1personal_ingresa_tus_apellidos')}
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                 {t('step1personal_fecha_de_nacimiento')}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date || ''}
                    onChange={handleChange}
                    className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all cursor-pointer relative z-10 opacity-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 text-slate-400 pointer-events-none z-0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_pais_de_residencia')}</label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country || selectedCountryObj.name}
                    onChange={handleCountryChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white appearance-none transition-all cursor-pointer"
                  >
                    {ALL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_correo_electronico')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={t('email_placeholder')}
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('profile_phone')}</label>
                <div className="flex gap-2">
                  {/* Selector independiente de código de área */}
                  <div className="relative shrink-0">
                    <select
                      name="phoneCode"
                      value={formData.phoneCode || selectedCountryObj.dialCode}
                      onChange={handleChange}
                      className="h-full pl-3 pr-7 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none hover:bg-white transition-all"
                    >
                      {ALL_COUNTRIES.map((c) => (
                        <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                          {c.flag} {c.dialCode} ({c.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Campo totalmente editable para el usuario */}
                  <input
                    type="tel"
                    name="phone"
                    placeholder="300 123 4567"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_idioma_preferido')}</label>
                <div className="relative">
                  <select
                    name="language"
                    value={formData.language || t('step1personal_espanol')}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white appearance-none transition-all cursor-pointer"
                  >
                    <option value="Español">{t('step1personal_espanol')}</option>
                    <option value="Inglés">{t('step1personal_ingles')}</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Crea tu contraseña */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-blue-600">{t('step1personal_2_crea_tu_contrasena')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_crea_una_contrasena_segura')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder={t('step1personal_crea_una_contrasena_segura')}
                    value={formData.password || ''}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('step1personal_confirma_tu_contrasena')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder={t('step1personal_repite_tu_contrasena')}
                    value={formData.confirmPassword || ''}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
             {t('step1personal_minimo_8_caracteres_incluye_mayuscul')}
            </p>
          </div>

          {/* Bloque 3: Verificación profesional */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-blue-600">{t('step1personal_3_verificacion_profesional')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-purple-100/70 text-purple-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">{t('step1personal_documento_de_identidad')}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('step1personal_dni_pasaporte_o_documento_oficial')}</p>
                  
                  <label className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all">
                    <Upload size={14} />
                    <span>{formData.identityDoc ? formData.identityDoc.name : t('step1personal_subir_archivo')}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'identityDoc')}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">{t('step1personal_jpg_png_o_pdf_max')}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-100/70 text-blue-600 shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">{t('step1personal_certificado_de_colegiacion')}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{t('step1personal_certificado_vigente_de_tu_colegio')}</p>
                  
                  <label className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 cursor-pointer shadow-sm transition-all">
                    <Upload size={14} />
                    <span>{formData.colegiationCert ? formData.colegiationCert.name : t('step1personal_subir_archivo')}</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(e, 'colegiationCert')}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">{t('step1personal_jpg_png_o_pdf_max')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span>{t('step1personal_tu_informacion_esta_protegida_y')}</span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={!!formData.termsAccepted}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>
                {t('terms_accept_label', 'He leído y acepto los Términos de servicio y la Política de privacidad de MIVOR.ai')}
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
            >
              <span>{t('continue_btn', 'Continuar')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>

      {/* Sidebar Derecha */}
      <aside className="w-full xl:w-80 shrink-0 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 border border-slate-200/60 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
        <div className="relative">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-sm border border-white">
            <img src={iaBanner} alt={t('step1personal_ia_medica')} className="w-full h-full object-cover" />
          </div>

          <h3 className="text-xl font-black text-slate-900 leading-snug">
           {t('step1personal_la')} <span className="text-blue-600">{t('artificial_intelligence')}</span> {t('step1personal_que_acompana_tu_practica_medica')}
          </h3>
          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
           {t('save_time_make_better_decisions')}
          </p>

          <div className="mt-6 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-purple-100 text-purple-600"><BrainCircuit size={16} /></div>
              <span>{t('step1personal_inteligencia_que_entiende_tu_context')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-blue-100 text-blue-600"><ShieldCheck size={16} /></div>
              <span>{t('step1personal_informacion_confiable_y_basada_en')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-600"><TrendingUp size={16} /></div>
              <span>{t('step1personal_analisis_que_te_ayuda_a')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 font-medium">
              <div className="p-1 rounded-lg bg-rose-100 text-rose-600"><Heart size={16} /></div>
              <span>{t('step1personal_herramientas_disenadas_para_medicos_')}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}