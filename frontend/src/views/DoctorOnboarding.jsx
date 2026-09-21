import { useLanguage } from '../contexts/LanguageContext';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Brain, Users, Lock, Headphones, Image as ImageIcon, Video, FileText, MapPin, Phone, Globe, UploadCloud, Info, User, UserSquare2, Activity } from 'lucide-react';

const steps = [
  { id: 1, title: 'Datos personales' },
  { id: 2, title: 'Información profesional' },
  { id: 3, title: 'Verificación profesional' },
  { id: 4, title: 'Perfil opcional' },
  { id: 5, title: 'Finalizar' }
];

const DoctorOnboarding = ({ onNavigateLogin }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    fullName: '',
    dateOfBirth: '',
    country: 'España',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialty: 'Medicina General',
    license: '',
    college: '',
    collegeCountry: 'España',
    experience: '5',
    subspecialty: '',
    bio: '',
    clinicName: '',
    clinicAddress: '',
    city: 'Madrid',
    postalCode: '',
    clinicPhone: '',
    website: '',
    languages: 'Español, Inglés',
    diplomaFile: null,
    idDocFile: null,
    profilePicFile: null,
    termsAccepted: true
  });

  const diplomaInputRef = React.useRef(null);
  const idDocInputRef = React.useRef(null);
  const profilePicInputRef = React.useRef(null);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (submitError) setSubmitError('');
  };

  const handleNext = async () => {
    setSubmitError('');

    // Step 1 validation
    if (currentStep === 1) {
      const email = (formData.email || '').trim();
      const pwd = formData.password || '';
      const name = (formData.name || formData.fullName || '').trim();
      if (!email || !pwd || !name) {
        setSubmitError(t('doctoronboarding_por_favor_completa_los_campos'));
        return;
      }
      if (pwd.length < 6) {
        setSubmitError(t('doctoronboarding_la_contrasena_debe_tener_al'));
        return;
      }
      if (formData.confirmPassword && pwd !== formData.confirmPassword) {
        setSubmitError(t('doctoronboarding_las_contrasenas_no_coinciden'));
        return;
      }
      if (!formData.termsAccepted) {
        setSubmitError(t('doctoronboarding_debes_aceptar_los_terminos_de'));
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Final Step 4 -> 5 Submission
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const form = new FormData();
      const cleanEmail = (formData.email || '').trim().toLowerCase();
      const computedFullName = (formData.fullName || `${formData.name || ''} ${formData.surname || ''}`).trim() || 'Dr. Profesional';
      
      form.append('username', cleanEmail);
      form.append('password', formData.password);
      form.append('full_name', computedFullName);
      form.append('specialty', formData.specialty || 'Medicina General');
      form.append('license_number', formData.license || 'COL-12345');
      form.append('experience_years', String(formData.experience || '5'));
      
      const computedLocation = [formData.clinicName, formData.city, formData.country].filter(Boolean).join(', ') || 'España';
      form.append('location', computedLocation);
      form.append('languages', formData.languages || 'Español');
      form.append('bio', formData.bio || t('doctoronboarding_especialista_en_con_dedicacion_a', { value: formData.specialty || 'Medicina General' }));
      
      if (formData.idDocFile) form.append('id_doc_file', formData.idDocFile);
      if (formData.diplomaFile) form.append('diploma_file', formData.diplomaFile);
      if (formData.profilePicFile) form.append('profile_pic_file', formData.profilePicFile);

      const res = await fetch(`${API_URL}/api/auth/register-doctor`, {
        method: 'POST',
        body: form
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success! Set token and role, go to step 5
        localStorage.setItem('med_token', data.access_token);
        localStorage.setItem('med_role', 'doctor');
        setCurrentStep(5);
      } else {
        setSubmitError(data.detail || 'Error al registrar el médico');
      }
    } catch (e) {
      console.error(e);
      setSubmitError(t('doctoronboarding_error_de_conexion_con_el'));
    }
    
    setIsSubmitting(false);
  };

  const handleBack = () => {
    setSubmitError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
             <img 
               src="/images/mivor_logo.png" 
               alt="MIVOR.ai" 
               className="w-7 h-7 object-contain" 
               onError={(e) => { e.target.src = '/logo.png'; }}
             />
             <span className="font-black text-xl tracking-tight text-slate-900">
               MIVOR<span className="text-teal-600">.ai</span>
             </span>
          </div>
          <span className="text-[10px] text-teal-700 font-bold tracking-widest uppercase ml-9">{t('doctors')}</span>
        </div>

                {/* Stepper */}
        <div className="hidden md:flex items-center flex-1 max-w-3xl mx-auto px-12">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 relative z-10 w-24">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm
                  ${currentStep > step.id ? 'bg-brand-purple text-white' : 
                    currentStep === step.id ? 'bg-brand-purple text-white ring-4 ring-brand-purple/20' : 
                    'bg-white border-2 border-gray-200 text-gray-400'}
                `}>
                  {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
                </div>
                <span className={`text-[10px] font-bold text-center leading-tight
                  ${currentStep >= step.id ? 'text-brand-purple' : 'text-gray-400'}
                `}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 -mt-6 transition-colors
                  ${currentStep > step.id ? 'bg-brand-purple' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 font-medium">{t('doctoronboarding_ya_tienes_cuenta')}</span>
          <button onClick={onNavigateLogin} className="text-sm font-bold text-brand-purple flex items-center gap-1 hover:text-purple-700">
           {t('doctoronboarding_iniciar_sesion')} <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left Col - Benefits */}
            <div className="hidden lg:flex lg:col-span-3 flex-col pt-12">
              <h2 className="text-3xl font-bold text-brand-dark leading-tight mb-4">{t('doctoronboarding_unete_a')}<br/><span className="text-teal-600">MIVOR.ai</span></h2>
              <p className="text-sm text-gray-500 mb-10 pr-4 leading-relaxed">
               {t('join_mivor_subtitle')}
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-brand-purple"><Brain size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">{t('clinical_ai_adv')}</h4>
                    <p className="text-xs text-gray-500">{t('doctoronboarding_resumenes_inteligentes_analisis_y_ap')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500"><Users size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">{t('manage_patients_feat')}</h4>
                    <p className="text-xs text-gray-500">{t('doctoronboarding_historiales_completos_pruebas_medica')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-brand-green"><Lock size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">{t('safe_confidential')}</h4>
                    <p className="text-xs text-gray-500">{t('doctoronboarding_cumplimos_con_los_mas_altos')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-10 flex gap-3 items-center">
                 <Headphones className="text-gray-400" size={24}/>
                 <div>
                   <h4 className="font-bold text-xs text-brand-dark">{t('patienttopnav_necesitas_ayuda')}</h4>
                   <p className="text-xs text-gray-500">{t('step2professional_escribenos_a')} <a href="#" className="text-teal-600 font-semibold">soporte@mivor.ai</a></p>
                 </div>
              </div>
            </div>

            {/* Middle Col - Forms */}
            <div className="col-span-1 lg:col-span-6 flex flex-col">
              <h1 className="text-2xl font-bold text-brand-dark mb-2">{t('doctoronboarding_crea_tu_cuenta_profesional')}</h1>
              <p className="text-sm text-gray-500 mb-8">{t('step1personal_el_proceso_es_rapido_seguro')}</p>

              {/* Data Sections */}
              <div className="space-y-6">
                
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                    <Info size={16} className="text-red-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 1. Datos personales */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-brand-purple mb-4">{t('doctoronboarding_1_datos_personales')}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('doctoronboarding_nombre')}</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={t('step1personal_ingresa_tu_nombre')} 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step1personal_apellidos')}</label>
                      <input 
                        type="text" 
                        value={formData.surname}
                        onChange={(e) => updateField('surname', e.target.value)}
                        placeholder={t('step1personal_ingresa_tus_apellidos')} 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step1personal_fecha_de_nacimiento')}</label>
                      <input 
                        type="date" 
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step1personal_pais_de_residencia')}</label>
                      <select 
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                      >
                        <option value="España">{t('doctoronboarding_espana')}</option>
                        <option value="México">{t('doctoronboarding_mexico')}</option>
                        <option value="Colombia">{t('doctoronboarding_colombia')}</option>
                        <option value="Argentina">{t('doctoronboarding_argentina')}</option>
                        <option value="Chile">{t('doctoronboarding_chile')}</option>
                        <option value="Estados Unidos">{t('doctoronboarding_estados_unidos')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('doctoronboarding_correo_electronico')}</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="tu@email.com" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('profile_phone')}</label>
                      <div className="flex gap-2">
                        <select className="w-24 border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-700 outline-none">
                          <option>🇪🇸 +34</option>
                          <option>🇲🇽 +52</option>
                          <option>🇨🇴 +57</option>
                          <option>🇦🇷 +54</option>
                        </select>
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="600 123 456" 
                          className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contraseña */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-brand-purple mb-4">{t('step1personal_2_crea_tu_contrasena')}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('doctoronboarding_crea_una_contrasena_segura')}</label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder={t('step1personal_crea_una_contrasena_segura')} 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('doctoronboarding_confirma_tu_contrasena')}</label>
                      <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder={t('step1personal_repite_tu_contrasena')} 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">{t('doctoronboarding_minimo_6_caracteres_incluye_numeros')}</p>
                </div>

                <div className="flex items-center justify-between pt-4 pb-12">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.termsAccepted}
                       onChange={(e) => updateField('termsAccepted', e.target.checked)}
                       className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple" 
                     />
                     <span className="text-xs text-gray-600 font-medium">{t('doctoronboarding_he_leido_y_acepto_los')} <span className="text-brand-purple">{t('doctoronboarding_terminos_de_servicio')}</span> {t('doctoronboarding_y_la')} <span className="text-brand-purple">{t('patient_privacy_policy')}</span>.</span>
                   </label>
                   <button onClick={handleNext} className="bg-brand-purple text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md">
                    {t('continue')} <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-3 flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
               <img src="/images/abstract_woman_bg.jpg" className="w-full h-64 object-cover object-top" />
               <div className="p-6">
                 <h3 className="text-xl font-bold text-brand-dark mb-4 leading-tight">{t('step1personal_la')} <span className="text-brand-purple">{t('artificial_intelligence')}</span> {t('step1personal_que_acompana_tu_practica_medica')}</h3>
                 <p className="text-xs text-gray-500 mb-6 leading-relaxed">{t('save_time_make_better_decisions')}</p>
                 
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0"><Brain size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">{t('step1personal_inteligencia_que_entiende_tu_context')}</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"><Lock size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">{t('step1personal_informacion_confiable_y_basada_en')}</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-green-50 text-brand-green flex items-center justify-center flex-shrink-0"><Activity size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">{t('step1personal_analisis_que_te_ayuda_a')}</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}
        
        {/* Step 2 */}
        {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-3 flex-col pt-4">
               <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm pb-6">
                 <img src="/images/abstract_woman_bg.jpg" className="w-full h-48 object-cover object-top" />
                 <div className="px-5 pt-4">
                   <h3 className="text-lg font-bold text-brand-dark mb-2 leading-tight">{t('step1personal_la')} <span className="text-brand-purple">{t('artificial_intelligence')}</span> {t('step1personal_que_acompana_tu_practica_medica')}</h3>
                   <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">{t('save_time_make_better_decisions')}</p>
                   
                   <div className="space-y-3">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0"><Brain size={12}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-700">{t('clinical_ai_adv')}</p>
                         <p className="text-[9px] text-gray-400">{t('doctoronboarding_resumenes_inteligentes_evidencia_med')}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"><Users size={12}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-700">{t('manage_patients_feat')}</p>
                         <p className="text-[9px] text-gray-400">{t('doctoronboarding_historiales_completos_consultas_en_u')}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Middle Col - Forms */}
            <div className="col-span-1 lg:col-span-8 lg:col-start-5 flex flex-col pt-4">
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-brand-purple flex items-center gap-2 font-bold text-sm hover:text-purple-700">
                  <ArrowLeft size={16} /> {t('returning')}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <h3 className="font-bold text-brand-dark text-lg mb-1">{t('step_professional_info')}</h3>
                <p className="text-xs text-gray-500 mb-6">{t('step2professional_cuentanos_mas_sobre_tu_practica')}</p>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step3professional_especialidad_principal')}</label>
                    <select 
                      value={formData.specialty}
                      onChange={(e) => updateField('specialty', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="Medicina General">{t('doctoronboarding_medicina_general')}</option>
                      <option value="Cardiología">{t('doctoronboarding_cardiologia')}</option>
                      <option value="Dermatología">{t('doctoronboarding_dermatologia')}</option>
                      <option value="Traumatología">{t('doctoronboarding_traumatologia')}</option>
                      <option value="Pediatría">{t('doctoronboarding_pediatria')}</option>
                      <option value="Neurología">{t('doctoronboarding_neurologia')}</option>
                      <option value="Ginecología">{t('doctoronboarding_ginecologia')}</option>
                      <option value="Oftalmología">{t('doctoronboarding_oftalmologia')}</option>
                      <option value="Psiquiatría">{t('doctoronboarding_psiquiatria')}</option>
                      <option value="Endocrinología">{t('doctoronboarding_endocrinologia')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_n_de_colegiado')}</label>
                    <input 
                      type="text" 
                      value={formData.license}
                      onChange={(e) => updateField('license', e.target.value)}
                      placeholder={t('doctoronboarding_ingresa_tu_numero')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_colegio_profesional')}</label>
                    <input 
                      type="text" 
                      value={formData.college}
                      onChange={(e) => updateField('college', e.target.value)}
                      placeholder={t('doctoronboarding_ej_colegio_oficial_de_medicos')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_pais_del_colegio')}</label>
                    <select 
                      value={formData.collegeCountry}
                      onChange={(e) => updateField('collegeCountry', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="España">{t('doctoronboarding_espana')}</option>
                      <option value="México">{t('doctoronboarding_mexico')}</option>
                      <option value="Colombia">{t('doctoronboarding_colombia')}</option>
                      <option value="Argentina">{t('doctoronboarding_argentina')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('profile_years_experience')}</label>
                    <select 
                      value={formData.experience}
                      onChange={(e) => updateField('experience', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="1">{t('doctoronboarding_1_ano')}</option>
                      <option value="3">{t('doctoronboarding_2_a_4_anos')}</option>
                      <option value="5">{t('doctoronboarding_5_a_9_anos')}</option>
                      <option value="10">{t('doctoronboarding_10_a_14_anos')}</option>
                      <option value="15">{t('doctoronboarding_15_o_mas_anos')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('doctordirectorymod_idiomas_de_consulta')}</label>
                    <input 
                      type="text" 
                      value={formData.languages}
                      onChange={(e) => updateField('languages', e.target.value)}
                      placeholder={t('doctoronboarding_espanol_ingles')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>

                <h4 className="font-bold text-brand-dark text-sm mb-3">{t('doctoronboarding_sobre_ti_opcional')}</h4>
                <div className="mb-8">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_breve_descripcion_profesional')}</label>
                  <textarea 
                    rows="4" 
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder={t('doctoronboarding_cuentanos_brevemente_sobre_tu_trayec')} 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none resize-none"
                  />
                  <div className="text-right text-[10px] text-gray-400 mt-1">{(formData.bio || '').length}/300</div>
                </div>

                <h4 className="font-bold text-brand-dark text-sm mb-3">{t('doctoronboarding_direccion_profesional')}</h4>
                <div className="grid grid-cols-2 gap-6 mb-4">
                   <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_nombre_de_la_clinica_centro')}</label>
                    <input 
                      type="text" 
                      value={formData.clinicName}
                      onChange={(e) => updateField('clinicName', e.target.value)}
                      placeholder={t('doctoronboarding_ingresa_el_nombre_de_tu')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('profile_address')}</label>
                    <input 
                      type="text" 
                      value={formData.clinicAddress}
                      onChange={(e) => updateField('clinicAddress', e.target.value)}
                      placeholder={t('doctoronboarding_ingresa_la_direccion')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_ciudad')}</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder={t('step2professional_ciudad')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('zip_code_label')}</label>
                    <input 
                      type="text" 
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder={t('doctoronboarding_postal')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('step2professional_telefono_de_consulta')}</label>
                    <input 
                      type="text" 
                      value={formData.clinicPhone}
                      onChange={(e) => updateField('clinicPhone', e.target.value)}
                      placeholder={t('profile_phone')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">{t('website_label')}</label>
                    <input 
                      type="text" 
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder={t('step2professional_www_tusitio_com')} 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                   <button onClick={handleBack} className="bg-white border border-brand-purple text-brand-purple px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors">
                    {t('returning')}
                   </button>
                   <button onClick={handleNext} className="bg-brand-purple text-white px-8 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors">
                    {t('continue')} <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>
            </div>
        )}


        {/* Step 3: Verificación Profesional */}
        {currentStep === 3 && (
            <div className="flex flex-col max-w-4xl mx-auto pt-4 h-full">
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-brand-purple flex items-center gap-2 font-bold text-sm hover:text-purple-700">
                  <ArrowLeft size={16} /> {t('returning')}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <h3 className="font-bold text-brand-dark text-lg mb-1">{t('doctoronboarding_verificacion_profesional')}</h3>
                <p className="text-xs text-gray-500 mb-8">{t('doctoronboarding_sube_tus_documentos_para_validar')}</p>
                
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2 mb-6">
                    <Info size={16} className="text-red-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={idDocInputRef} 
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) updateField('idDocFile', e.target.files[0]);
                  }} 
                />

                <input 
                  type="file" 
                  ref={diplomaInputRef} 
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) updateField('diplomaFile', e.target.files[0]);
                  }} 
                />

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div 
                    onClick={() => idDocInputRef.current?.click()}
                    className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group ${
                      formData.idDocFile ? 'border-green-300 bg-green-50/40' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UserSquare2 size={24}/>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mb-2">{t('step1personal_documento_de_identidad')}</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">{t('doctoronboarding_dni_pasaporte_o_documento_oficial')}</p>
                    <button type="button" className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors shadow-sm">
                      <UploadCloud size={14}/> {formData.idDocFile ? 'Cambiar archivo' : 'Subir archivo'}
                    </button>
                    {formData.idDocFile ? (
                      <p className="text-xs text-green-700 font-semibold mt-3 flex items-center gap-1">
                        <Check size={14} className="text-green-600"/> {formData.idDocFile.name}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-4">{t('doctoronboarding_jpg_png_o_pdf_max')}</p>
                    )}
                  </div>

                  <div 
                    onClick={() => diplomaInputRef.current?.click()}
                    className={`border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group ${
                      formData.diplomaFile ? 'border-green-300 bg-green-50/40' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText size={24}/>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mb-2">{t('doctoronboarding_diploma_o_certificado_de_colegiacion')}</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">{t('doctoronboarding_certificado_vigente_de_tu_colegio')}</p>
                    <button type="button" className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors shadow-sm">
                      <UploadCloud size={14}/> {formData.diplomaFile ? 'Cambiar archivo' : 'Subir archivo'}
                    </button>
                    {formData.diplomaFile ? (
                      <p className="text-xs text-green-700 font-semibold mt-3 flex items-center gap-1">
                        <Check size={14} className="text-green-600"/> {formData.diplomaFile.name}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-4">{t('doctoronboarding_jpg_png_o_pdf_max')}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-green mb-8 bg-green-50/50 p-4 rounded-lg">
                   <Lock size={16}/> {t('doctoronboarding_tu_informacion_esta_protegida_median')}
                </div>
                
                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                   <button onClick={handleNext} className="bg-brand-purple text-white px-10 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md">
                    {t('doctoronboarding_verificar_y_continuar')} <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>
        )}

        {/* Step 4: Perfil Opcional */}
        {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left Col - Form */}
            <div className="col-span-1 lg:col-span-8 flex flex-col pt-4">
              <div className="flex items-center mb-6">
                <button onClick={handleBack} className="text-brand-purple flex items-center gap-2 font-bold text-sm hover:text-purple-700">
                  <ArrowLeft size={16} /> {t('returning')}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-100 text-brand-purple p-1.5 rounded-full"><Brain size={14}/></div>
                  <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">{t('step4professional_opcional')}</span>
                </div>
                <h3 className="font-bold text-brand-dark text-2xl mb-2">{t('complete_prof_profile')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('doctoronboarding_ayuda_a_tus_pacientes_a')}</p>
                
                {submitError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2 mb-6">
                    <Info size={16} className="text-red-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={profilePicInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) updateField('profilePicFile', e.target.files[0]);
                  }} 
                />

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-brand-purple"><User size={20}/></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-brand-dark">{t('prof_photo_label')}</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">{t('optional_badge')}</span>
                        </div>
                        <p className="text-xs text-gray-500">{t('doctoronboarding_anade_una_foto_para_que')}</p>
                        {formData.profilePicFile && (
                          <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1">
                            <Check size={12} className="text-green-600"/> {formData.profilePicFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => profilePicInputRef.current?.click()}
                      className="border border-gray-200 bg-white text-brand-purple px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-50 shadow-sm"
                    >
                      <UploadCloud size={14}/> {formData.profilePicFile ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-10">
                   <button onClick={handleNext} disabled={isSubmitting} className="text-gray-500 font-bold text-sm hover:text-gray-700">
                    {t('skip_and_finish')}
                   </button>
                   <button 
                     onClick={handleNext} 
                     disabled={isSubmitting}
                     className="bg-brand-purple text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
                   >
                     {isSubmitting ? t('doctoronboarding_registrando') : t('doctoronboarding_finalizar_inscripcion')} <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-4 flex-col pt-4">
               <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden shadow-sm h-full flex flex-col p-8">
                 <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" className="w-full h-48 object-cover rounded-xl mb-6 shadow-md border-4 border-white" />
                 
                 <h3 className="text-xl font-bold text-brand-dark mb-4 leading-tight">{t('step4professional_tu_perfil_tu_mejor_carta')}</h3>
                 <p className="text-sm text-gray-600 mb-8 leading-relaxed">{t('step4professional_conecta_con_mas_pacientes_y')}</p>
                 
                 <div className="space-y-6 flex-1">
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-white text-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm"><User size={16}/></div>
                     <div>
                       <p className="text-xs font-bold text-gray-800">{t('step4professional_muestra_tu_foto_profesional')}</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">{t('step4professional_haz_que_los_pacientes_te')}</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white/60 rounded-xl p-4 flex gap-3 items-start mt-6">
                   <Info size={16} className="text-brand-purple mt-0.5 flex-shrink-0"/>
                   <p className="text-[10px] text-gray-600">{t('doctoronboarding_esta_informacion_es_opcional_y')}</p>
                 </div>
               </div>
            </div>
            </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
            <div className="flex flex-col items-center justify-center max-w-3xl mx-auto pt-16 h-full text-center">
              
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative z-10 shadow-inner">
                   <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
                     <Check size={32} strokeWidth={3} className="text-white" />
                   </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute top-0 right-[-20px] w-2 h-2 bg-brand-purple rounded-full"></div>
                <div className="absolute bottom-4 left-[-10px] w-3 h-3 bg-brand-blue rounded-full"></div>
              </div>

              <h1 className="text-4xl font-black text-brand-dark mb-4">{t('account_created_success')}</h1>
              <p className="text-lg text-gray-600 mb-8">{t('doctoronboarding_tu_cuenta_profesional_de_medico')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-brand-purple mb-4">
                    <UserSquare2 size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">{t('doctoronboarding_acceso_inmediato')}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t('doctoronboarding_puedes_ingresar_a_tu_dashboard')}</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <Globe size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">{t('doctoronboarding_visibilidad_de_especialista')}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t('doctoronboarding_tu_perfil_se_lista_en')}</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-brand-green mb-4">
                    <Lock size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">{t('doctoronboarding_maxima_seguridad')}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t('doctoronboarding_tus_diplomas_y_datos_estan')}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  localStorage.setItem('med_role', 'doctor');
                  window.location.href = '/medico';
                }} 
                className="bg-brand-purple text-white px-12 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-500/30 mb-4"
              >
               {t('doctoronboarding_entrar_a_mi_panel_medico')} <ArrowRight size={20} />
              </button>
              
              <button 
                onClick={() => window.location.href = '/'} 
                className="text-gray-500 hover:text-gray-700 font-semibold text-sm"
              >
               {t('doctoronboarding_ir_al_inicio')}
              </button>

            </div>
        )}
      </main>
    </div>
  );
};

export default DoctorOnboarding;
