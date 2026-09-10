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
    <div className="flex-1 flex gap-8 items-start">
      {/* Contenido Central - Resumen de Información */}
      <main className="flex-1 space-y-6">
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
                <span>Datos personales</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>Editar</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <User size={14} /> Nombre completo
                </span>
                <span className="font-semibold text-slate-800">
                  {formData.firstName || formData.lastName ? `Dr. ${formData.firstName} ${formData.lastName}` : 'Dr. Juan Pérez López'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Calendar size={14} /> Fecha de nacimiento
                </span>
                <span className="font-semibold text-slate-800">{formData.birthDate || '15 / 04 / 1985'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Globe size={14} /> País de residencia
                </span>
                <span className="font-semibold text-slate-800">{formData.country || 'España'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Mail size={14} /> Correo electrónico
                </span>
                <span className="font-semibold text-slate-800">{formData.email || 'juan.perez@email.com'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Phone size={14} /> Teléfono
                </span>
                <span className="font-semibold text-slate-800">{formData.phone || '+34 600 123 456'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Languages size={14} /> Idioma preferido
                </span>
                <span className="font-semibold text-slate-800">{formData.language || 'Español'}</span>
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
                <span>Información profesional</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>Editar</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Stethoscope size={14} /> Especialidad principal
                </span>
                <span className="font-semibold text-slate-800">{formData.specialty || 'Cardiología'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <FileText size={14} /> Nº de colegiado
                </span>
                <span className="font-semibold text-slate-800">{formData.colegiatedNumber || '28/1234567'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Building2 size={14} /> Colegio profesional
                </span>
                <span className="font-semibold text-slate-800">{formData.professionalCollege || 'Colegio Oficial de Médicos de Madrid'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Globe size={14} /> País del colegio
                </span>
                <span className="font-semibold text-slate-800">{formData.collegeCountry || 'España'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Award size={14} /> Años de experiencia
                </span>
                <span className="font-semibold text-slate-800">{formData.experienceYears || '12 años'}</span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <Star size={14} /> Subespecialidad
                </span>
                <span className="font-semibold text-slate-800">{formData.subspecialty || 'Cardiología intervencionista'}</span>
              </div>

              <div className="flex items-start">
                <span className="w-48 text-slate-500 flex items-center gap-2 shrink-0 pt-0.5">
                  <AlignLeft size={14} /> Descripción profesional
                </span>
                <span className="font-medium text-slate-700 leading-relaxed">
                  {formData.bio || 'Especialista en cardiología intervencionista con experiencia en hemodinámica, angioplastia y manejo de enfermedades coronarias.'}
                </span>
              </div>

              {/* Dirección y Ubicación en Mapa */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center">
                  <span className="w-48 text-slate-500 flex items-center gap-2">
                    <Building2 size={14} /> Dirección de consulta
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formData.address ? `${formData.address}${formData.city ? `, ${formData.city}` : ''}` : 'Sin dirección especificada'}
                  </span>
                </div>

                <div className="pt-1">
                  <DoctorLocationMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    address={formData.address}
                    city={formData.city}
                    country={formData.country || 'Colombia'}
                    readOnly={true}
                    height="200px"
                    title="Ubicación geográfica confirmada"
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
                <span>Documentos enviados</span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} />
                <span>Editar</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Documento de identidad
                </span>
                <span className="font-medium text-slate-700">
                  {formData.identityDoc ? formData.identityDoc.name : 'Pasaporte – Juan Pérez López'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="w-48 text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Certificado de colegiación
                </span>
                <span className="font-medium text-slate-700">
                  {formData.colegiationCert ? formData.colegiationCert.name : 'Certificado vigente – COM Madrid'}
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
      <aside className="w-80 shrink-0 flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          {/* Header con Imagen IA */}
          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-4 shadow-sm">
              <img src={iaHeaderImg} alt="IA Médica" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-extrabold text-blue-950 leading-snug">
              La <span className="text-blue-600">inteligencia artificial</span> que acompaña tu práctica médica.
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.
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
            <p className="font-bold text-slate-700">¿Necesitas ayuda?</p>
            <p className="text-slate-500">Escríbenos a <span className="text-blue-600 font-medium">soporte@mivor.ai</span></p>
          </div>
        </div>
      </aside>
    </div>
  );
}