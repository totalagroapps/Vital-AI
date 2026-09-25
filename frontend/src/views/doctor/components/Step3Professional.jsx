import React from 'react';
import { 
  User, 
  Calendar, 
  Globe, 
  Mail, 
  Phone, 
  Languages, 
  Stethoscope, 
  FileText, 
  Building2, 
  Award, 
  Star, 
  AlignLeft, 
  CheckCircle2, 
  Pencil, 
  ArrowLeft, 
  ArrowRight, 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';
import iaHeaderImg from '../../../assets/Imges_Paciente.png';
import DoctorLocationMap from '../../../components/DoctorLocationMap';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function Step3Professional({ formData, onNext, onPrev, goToStep }) {
  const { t, language } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8 items-start">
      {/* Contenido Central - Resumen de Información */}
      <main className="w-full xl:flex-1 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-full bg-blue-100 text-blue-600">
              <CheckCircle2 size={18} />
            </span>
            {t('review_info_title', 'REVISA TU INFORMACIÓN')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('review_info_desc', 'Por favor, verifica que todos tus datos sean correctos antes de continuar.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1: Datos Personales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <User size={18} />
                </div>
                <span>{t('step_personal_data')}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>{t('edit_btn')}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <User size={14} /> {t('step3professional_nombre_completo')}
                </span>
                <span className="font-semibold text-slate-800">
                  {formData.firstName || formData.lastName ? `Dr. ${formData.firstName} ${formData.lastName}` : t('not_specified')}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Calendar size={14} /> {t('step1personal_fecha_de_nacimiento')}
                </span>
                <span className="font-semibold text-slate-800">{formData.birthDate || '15 / 04 / 1985'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Globe size={14} /> {t('step1personal_pais_de_residencia')}
                </span>
                <span className="font-semibold text-slate-800">{formData.country || t('not_specified')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Mail size={14} /> {t('step1personal_correo_electronico')}
                </span>
                <span className="font-semibold text-slate-800">{formData.email || t('step3professional_juan_perez_email_com')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Phone size={14} /> {t('profile_phone')}
                </span>
                <span className="font-semibold text-slate-800">{formData.phone || '+34 600 123 456'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Languages size={14} /> {t('step1personal_idioma_preferido')}
                </span>
                <span className="font-semibold text-slate-800">{formData.language || t('step1personal_espanol')}</span>
              </div>
            </div>
          </div>

          {/* Bloque 2: Información Profesional */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Stethoscope size={18} />
                </div>
                <span>{t('step_professional_info')}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>{t('edit_btn')}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Stethoscope size={14} /> {t('step3professional_especialidad_principal')}
                </span>
                <span className="font-semibold text-slate-800">{formData.specialty || t('not_specified')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <FileText size={14} /> {t('step2professional_n_de_colegiado')}
                </span>
                <span className="font-semibold text-slate-800">{formData.colegiatedNumber || '28/1234567'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Building2 size={14} /> {t('step2professional_colegio_profesional')}
                </span>
                <span className="font-semibold text-slate-800">{formData.professionalCollege || t('not_specified')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Globe size={14} /> {t('step2professional_pais_del_colegio')}
                </span>
                <span className="font-semibold text-slate-800">{formData.collegeCountry || t('not_specified')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Award size={14} /> {t('profile_years_experience')}
                </span>
                <span className="font-semibold text-slate-800">{formData.experienceYears || t('not_specified')}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Star size={14} /> {t('step2professional_subespecialidad')}
                </span>
                <span className="font-semibold text-slate-800">{formData.subspecialty || t('not_specified')}</span>
              </div>

              <div className="flex items-start">
                <span className="w-48 text-slate-500 flex items-center gap-2 shrink-0 pt-0.5">
                  <AlignLeft size={14} /> {t('step3professional_descripcion_profesional')}
                </span>
                <span className="font-medium text-slate-700 leading-relaxed">
                  {formData.bio || t('not_specified')}
                </span>
              </div>

              {/* Dirección y Ubicación en Mapa */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center">
                  <span className="w-48 text-slate-500 flex items-center gap-2">
                    <Building2 size={14} /> {t('step3professional_direccion_de_consulta')}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formData.address ? `${formData.address}${formData.city ? `, ${formData.city}` : ''}` : t('not_specified')}
                  </span>
                </div>

                <div className="pt-1">
                  <DoctorLocationMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    address={formData.address}
                    city={formData.city}
                    country={formData.country || t('doctoronboarding_colombia')}
                    readOnly={true}
                    height="200px"
                    title={t('step3professional_ubicacion_geografica_confirmada')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 3: Documentos Enviados */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
                <span>{t('step3professional_documentos_enviados')}</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>{t('edit_btn')}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> {t('step1personal_documento_de_identidad')}
                </span>
                <span className="font-medium text-slate-700">
                  {formData.identityDoc ? formData.identityDoc.name : t('not_specified')}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> {t('step1personal_certificado_de_colegiacion')}
                </span>
                <span className="font-medium text-slate-700">
                  {formData.colegiationCert ? formData.colegiationCert.name : t('not_specified')}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('back_btn', 'Volver')}</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>{t('confirm_and_continue', 'Confirmar y continuar')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>

      {/* Sidebar Derecha */}
      <aside className="w-full xl:w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          {/* Header con Imagen IA */}
          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-4 shadow-sm">
              <img src={iaHeaderImg} alt={t('step1personal_ia_medica')} className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-extrabold text-blue-950 leading-snug">
             {t('step1personal_la')} <span className="text-blue-600">{t('artificial_intelligence')}</span> {t('step1personal_que_acompana_tu_practica_medica')}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
             {t('save_time_make_better_decisions')}
            </p>
          </div>

          {/* Cards Informativas */}
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-600 shrink-0">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('clinical_ai_adv', 'IA clínica avanzada')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t('clinical_ai_adv_desc', 'Resúmenes inteligentes, evidencia médica y apoyo en decisiones.')}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('manage_patients_feat', 'Gestiona tus pacientes')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t('manage_patients_feat_desc', 'Historiales completos, consultas, pruebas y medicación en un solo lugar.')}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{t('safe_confidential', 'Seguro y confidencial')}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t('safe_confidential_desc', 'Cumplimos los más altos estándares de seguridad y privacidad.')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Soporte */}
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <HelpCircle className="text-blue-600 shrink-0" size={22} />
          <div className="text-xs">
            <p className="font-bold text-slate-700">{t('patienttopnav_necesitas_ayuda')}</p>
            <p className="text-slate-500">{t('step2professional_escribenos_a')} <span className="text-blue-600 font-medium">soporte@mivor.ai</span></p>
          </div>
        </div>
      </aside>
    </div>
  );
}