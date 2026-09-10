import React, { useState } from 'react';
import { 
  Star, 
  Info, 
  User, 
  Building2, 
  Video, 
  FileText, 
  Eye, 
  Upload, 
  Pencil, 
  ArrowLeft, 
  ArrowRight, 
  Image as ImageIcon 
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function Step4OptionalProfile({ formData, updateFormData, onNext, onPrev, onSubmitRegistration, isSubmitting }) {
  const { t, language } = useLanguage();
  const [profilePhoto, setProfilePhoto] = useState(formData.profilePhoto || null);
  const [clinicImages, setClinicImages] = useState(formData.clinicImages || []);
  const [presentationVideo, setPresentationVideo] = useState(formData.presentationVideo || null);

  const handleFileUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    if (key === 'clinicImages') {
      const updated = [...clinicImages, file];
      setClinicImages(updated);
      updateFormData({ clinicImages: updated });
    } else {
      if (key === 'profilePhoto') setProfilePhoto(file);
      if (key === 'presentationVideo') setPresentationVideo(file);
      updateFormData({ [key]: file });
    }
  };

  const handleSkip = () => {
    if (onSubmitRegistration) {
      onSubmitRegistration();
    } else {
      onNext();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitRegistration) {
      onSubmitRegistration();
    } else {
      onNext();
    }
  };

  return (
    <div className="flex-1 flex gap-8 items-start">
      {/* Contenido Central - Paso Opcional */}
      <main className="flex-1 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold mb-2">
            <Star size={13} className="fill-blue-600" />
            <span>{t('optional_badge', 'OPCIONAL')}</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t('complete_prof_profile', 'Completa tu perfil profesional')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('complete_prof_desc', 'Ayuda a tus pacientes a conocerte mejor. Añade información adicional si deseas ofrecer una experiencia más cercana y personalizada.')}
          </p>
        </div>

        {/* Banner Informativo */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{t('optional_note', 'Este paso es opcional y no afecta a la aprobación de tu cuenta.')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Foto profesional */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <User size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Foto profesional</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Añade una foto profesional para que los pacientes puedan reconocerte.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all">
              <Upload size={14} />
              <span>{profilePhoto ? profilePhoto.name.slice(0, 12) + '...' : 'Subir foto'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
            </label>
          </div>

          {/* Card 2: Imágenes de tu clínica o consulta */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <Building2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Imágenes de tu clínica o consulta</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Comparte imágenes de tu consulta, instalaciones o equipo profesional.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all">
              <Upload size={14} />
              <span>Añadir imágenes</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'clinicImages')} />
            </label>
          </div>

          {/* Card 3: Vídeo de presentación */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <Video size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Vídeo de presentación</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Sube un breve vídeo presentándote y cuéntales a tus pacientes sobre ti.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-all">
              <Upload size={14} />
              <span>{presentationVideo ? presentationVideo.name.slice(0, 12) + '...' : 'Subir vídeo'}</span>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'presentationVideo')} />
            </label>
          </div>

          {/* Card 4: Información adicional */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <FileText size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Información adicional</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Añade información sobre tu experiencia, idiomas, áreas de interés, etc.</p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <Pencil size={14} />
              <span>Completar</span>
            </button>
          </div>

          {/* Card 5: Vista previa de tu perfil */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <Eye size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Vista previa de tu perfil</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Así es como verán los pacientes tu perfil con la información que añadas.</p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Ver vista previa</span>
            </button>
          </div>

          {/* Botones de Navegación e Omitir */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('back_btn', 'Volver')}</span>
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
              >
                {t('skip_and_finish', 'Omitir y finalizar')}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>{isSubmitting ? t('registering_doctor', 'Registrando médico...') : t('save_and_finish', 'Guardar y registrar')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Sidebar Derecha - Banner del Perfil */}
      <aside className="w-80 shrink-0 space-y-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          {/* Ilustración de Perfil Profesional */}
          <div className="bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md mb-2">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop" 
                alt="Doctor Profile Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              Tu perfil, tu mejor carta de presentación
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Conecta con más pacientes y genera más confianza mostrando quién eres y dónde trabajas.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <User size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Muestra tu foto profesional</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Haz que los pacientes te reconozcan.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ImageIcon size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Comparte imágenes de tu consulta</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Muéstrales tu espacio y tu equipo.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Video size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Añade un vídeo de presentación</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Cuéntales quién eres y qué te mueve.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Star size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800">Destaca tu experiencia</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Idiomas, especialidades, trayectoria...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nota informativa inferior */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
          <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <span className="font-bold text-slate-700">Esta información es opcional</span> y podrás completarla cuando quieras desde "Mi perfil".
          </p>
        </div>
      </aside>
    </div>
  );
}