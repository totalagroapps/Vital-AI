import React, { useState } from 'react';
import { ALL_COUNTRIES } from '../../../data/countries';
import { 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  ChevronDown 
} from 'lucide-react';
import iaHeaderImg from '../../../assets/Imges_Paciente.png';
import DoctorLocationMap from '../../../components/DoctorLocationMap';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function Step2Professional({ formData, updateFormData, onNext, onPrev }) {
  const { t, language } = useLanguage();
  const [bio, setBio] = useState(formData.bio || '');

  // Determinar país seleccionado por defecto para el teléfono de consulta (fallback a Colombia si no existe)
  const selectedCountryObj = ALL_COUNTRIES.find((c) => c.name === formData.country) || 
                             ALL_COUNTRIES.find((c) => c.name === 'Colombia') || 
                             ALL_COUNTRIES[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bio') {
      if (value.length <= 300) {
        setBio(value);
        updateFormData({ [name]: value });
      }
    } else {
      updateFormData({ [name]: value });
    }
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    updateFormData({ latitude, longitude });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="flex-1 flex gap-8 items-start">
      {/* Sidebar Izquierda - Exclusiva del Paso 2 */}
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
            <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-600 shrink-0">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">IA clínica avanzada</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Resúmenes inteligentes, evidencia médica y apoyo en decisiones.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Gestiona tus pacientes</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Historiales completos, consultas, pruebas y medicación en un solo lugar.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Seguro y confidencial</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Cumplimos los más altos estándares de seguridad y privacidad.</p>
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

      {/* Formulario Central - Información Profesional */}
      <main className="flex-1 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección 1: Información profesional */}
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{t('step_professional_info', 'Información profesional')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cuéntanos más sobre tu práctica médica.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('main_specialty_label', 'Especialidad principal *')}</label>
                <input
                  type="text"
                  name="specialty"
                  required
                  placeholder="Escribe tu especialidad"
                  value={formData.specialty || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nº de colegiado</label>
                <input
                  type="text"
                  name="colegiatedNumber"
                  required
                  placeholder="Ingresa tu número de colegiado"
                  value={formData.colegiatedNumber || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Colegio profesional</label>
                <input
                  type="text"
                  name="professionalCollege"
                  required
                  placeholder="Escribe tu colegio profesional"
                  value={formData.professionalCollege || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">País del colegio</label>
                <div className="relative">
                  <select
                    name="collegeCountry"
                    required
                    value={formData.collegeCountry || formData.country || 'Colombia'}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white appearance-none transition-all cursor-pointer"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Años de experiencia</label>
                <input
                  type="text"
                  name="experienceYears"
                  required
                  placeholder="Ej: 5 años"
                  value={formData.experienceYears || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subespecialidad <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  name="subspecialty"
                  placeholder="Ingresa tu subespecialidad"
                  value={formData.subspecialty || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Sobre ti */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900">Sobre ti <span className="text-slate-400 font-normal">(opcional)</span></h3>
            <label className="block text-xs font-semibold text-slate-600">Breve descripción profesional</label>
            <div className="relative">
              <textarea
                name="bio"
                rows={3}
                placeholder="Cuéntanos brevemente sobre tu trayectoria profesional, áreas de interés, enfoque de trabajo, etc."
                value={bio}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
                {bio.length}/300
              </span>
            </div>
          </div>

          {/* Sección 3: Dirección profesional */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dirección profesional y Ubicación</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa los datos de tu consultorio. El mapa ubicará automáticamente el punto según la ciudad y dirección que escribas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre de la clínica / centro</label>
                <input
                  type="text"
                  name="clinicName"
                  placeholder="Ej: Centro Médico San Rafael"
                  value={formData.clinicName || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dirección del consultorio</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Ej: Carrera 15 # 93-60, Consultorio 402"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Ej: Bogotá, Medellín, Cali, Madrid..."
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Mapa interactivo de ubicación exacta */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>📍 Ubicación en el mapa (Confirmación de Latitud y Longitud)</span>
                <span className="text-[11px] font-normal text-blue-600">Puedes mover el pin para ajustar la entrada exacta</span>
              </label>
              <DoctorLocationMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.address}
                city={formData.city}
                country={formData.country || 'Colombia'}
                onChange={handleLocationChange}
                readOnly={false}
                height="280px"
                title="Punto de atención médica"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Código postal</label>
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Código postal"
                  value={formData.zipCode || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Teléfono de consulta dinámico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Teléfono de consulta</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select
                      name="consultationPhoneCode"
                      value={formData.consultationPhoneCode || formData.phoneCode || selectedCountryObj.dialCode}
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

                  <input
                    type="tel"
                    name="consultationPhone"
                    placeholder="300 123 4567"
                    value={formData.consultationPhone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sitio web <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="url"
                  name="website"
                  placeholder="www.tusitio.com"
                  value={formData.website || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Botones de Navegación Inferiores */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
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
              <span>{t('continue_btn', 'Continuar')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}