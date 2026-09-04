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
        setSubmitError('Por favor completa los campos obligatorios: Nombre, Correo y Contraseña.');
        return;
      }
      if (pwd.length < 6) {
        setSubmitError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (formData.confirmPassword && pwd !== formData.confirmPassword) {
        setSubmitError('Las contraseñas no coinciden.');
        return;
      }
      if (!formData.termsAccepted) {
        setSubmitError('Debes aceptar los Términos de Servicio y la Política de Privacidad.');
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
      form.append('bio', formData.bio || `Especialista en ${formData.specialty || 'Medicina General'} con dedicación a la atención clínica personalizada.`);
      
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
      setSubmitError('Error de conexión con el servidor. Intenta de nuevo.');
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
          <div className="flex items-center gap-1.5">
             <div className="text-brand-purple">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                 <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2" />
                 <path d="M8 13h8" className="text-brand-blue" strokeWidth="2" />
               </svg>
             </div>
             <span className="font-bold text-xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">AI</span></span>
          </div>
          <span className="text-[10px] text-brand-blue font-bold tracking-widest uppercase ml-7">MÉDICOS</span>
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
          <span className="text-[10px] text-gray-500 font-medium">¿Ya tienes cuenta?</span>
          <button onClick={onNavigateLogin} className="text-sm font-bold text-brand-purple flex items-center gap-1 hover:text-purple-700">
            Iniciar sesión <ArrowRight size={14} />
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
              <h2 className="text-3xl font-bold text-brand-dark leading-tight mb-4">Únete a<br/><span className="text-brand-purple">VitalAI</span></h2>
              <p className="text-sm text-gray-500 mb-10 pr-4 leading-relaxed">
                La plataforma de IA médica hecha para profesionales como tú.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-brand-purple"><Brain size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">IA clínica avanzada</h4>
                    <p className="text-xs text-gray-500">Resúmenes inteligentes, análisis y apoyo en decisiones médicas.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500"><Users size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">Gestiona tus pacientes</h4>
                    <p className="text-xs text-gray-500">Historiales completos, pruebas, medicación y consultas en un solo lugar.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-brand-green"><Lock size={20}/></div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark mb-1">Seguro y confidencial</h4>
                    <p className="text-xs text-gray-500">Cumplimos con los más altos estándares de seguridad y privacidad.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-10 flex gap-3 items-center">
                 <Headphones className="text-gray-400" size={24}/>
                 <div>
                   <h4 className="font-bold text-xs text-brand-dark">¿Necesitas ayuda?</h4>
                   <p className="text-xs text-gray-500">Escríbenos a <a href="#" className="text-brand-blue">soporte@vitalai.com</a></p>
                 </div>
              </div>
            </div>

            {/* Middle Col - Forms */}
            <div className="col-span-1 lg:col-span-6 flex flex-col">
              <h1 className="text-2xl font-bold text-brand-dark mb-2">Crea tu cuenta profesional</h1>
              <p className="text-sm text-gray-500 mb-8">El proceso es rápido, seguro y 100% confidencial.</p>

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
                  <h3 className="font-bold text-brand-purple mb-4">1. Datos personales</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Nombre *</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ingresa tu nombre" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Apellidos</label>
                      <input 
                        type="text" 
                        value={formData.surname}
                        onChange={(e) => updateField('surname', e.target.value)}
                        placeholder="Ingresa tus apellidos" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Fecha de nacimiento</label>
                      <input 
                        type="date" 
                        value={formData.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">País de residencia</label>
                      <select 
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                      >
                        <option value="España">España</option>
                        <option value="México">México</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Chile">Chile</option>
                        <option value="Estados Unidos">Estados Unidos</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Correo electrónico *</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="tu@email.com" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Teléfono</label>
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
                  <h3 className="font-bold text-brand-purple mb-4">2. Crea tu contraseña</h3>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Crea una contraseña segura *</label>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        placeholder="Crea una contraseña segura" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Confirma tu contraseña *</label>
                      <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder="Repite tu contraseña" 
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Mínimo 6 caracteres, incluye números o letras.</p>
                </div>

                <div className="flex items-center justify-between pt-4 pb-12">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.termsAccepted}
                       onChange={(e) => updateField('termsAccepted', e.target.checked)}
                       className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple" 
                     />
                     <span className="text-xs text-gray-600 font-medium">He leído y acepto los <span className="text-brand-purple">Términos de servicio</span> y la <span className="text-brand-purple">Política de privacidad</span>.</span>
                   </label>
                   <button onClick={handleNext} className="bg-brand-purple text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md">
                     Continuar <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-3 flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
               <img src="/images/abstract_woman_bg.jpg" className="w-full h-64 object-cover object-top" />
               <div className="p-6">
                 <h3 className="text-xl font-bold text-brand-dark mb-4 leading-tight">La <span className="text-brand-purple">inteligencia artificial</span> que acompaña tu práctica médica.</h3>
                 <p className="text-xs text-gray-500 mb-6 leading-relaxed">Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.</p>
                 
                 <div className="space-y-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0"><Brain size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">Inteligencia que entiende tu contexto clínico</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"><Lock size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">Información confiable y basada en evidencia</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-green-50 text-brand-green flex items-center justify-center flex-shrink-0"><Activity size={16}/></div>
                     <p className="text-[11px] text-gray-600 font-medium">Análisis que te ayuda a decidir mejor</p>
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
                   <h3 className="text-lg font-bold text-brand-dark mb-2 leading-tight">La <span className="text-brand-purple">inteligencia artificial</span> que acompaña tu práctica médica.</h3>
                   <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">Ahorra tiempo, toma mejores decisiones y ofrece una atención excepcional a cada paciente.</p>
                   
                   <div className="space-y-3">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0"><Brain size={12}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-700">IA clínica avanzada</p>
                         <p className="text-[9px] text-gray-400">Resúmenes inteligentes, evidencia médica.</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"><Users size={12}/></div>
                       <div>
                         <p className="text-[10px] font-bold text-gray-700">Gestiona tus pacientes</p>
                         <p className="text-[9px] text-gray-400">Historiales completos, consultas en un solo lugar.</p>
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
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <h3 className="font-bold text-brand-dark text-lg mb-1">Información profesional</h3>
                <p className="text-xs text-gray-500 mb-6">Cuéntanos más sobre tu práctica médica.</p>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Especialidad principal</label>
                    <select 
                      value={formData.specialty}
                      onChange={(e) => updateField('specialty', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="Medicina General">Medicina General</option>
                      <option value="Cardiología">Cardiología</option>
                      <option value="Dermatología">Dermatología</option>
                      <option value="Traumatología">Traumatología</option>
                      <option value="Pediatría">Pediatría</option>
                      <option value="Neurología">Neurología</option>
                      <option value="Ginecología">Ginecología</option>
                      <option value="Oftalmología">Oftalmología</option>
                      <option value="Psiquiatría">Psiquiatría</option>
                      <option value="Endocrinología">Endocrinología</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Nº de colegiado</label>
                    <input 
                      type="text" 
                      value={formData.license}
                      onChange={(e) => updateField('license', e.target.value)}
                      placeholder="Ingresa tu número" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Colegio profesional</label>
                    <input 
                      type="text" 
                      value={formData.college}
                      onChange={(e) => updateField('college', e.target.value)}
                      placeholder="Ej. Colegio Oficial de Médicos" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">País del colegio</label>
                    <select 
                      value={formData.collegeCountry}
                      onChange={(e) => updateField('collegeCountry', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="España">España</option>
                      <option value="México">México</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Argentina">Argentina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Años de experiencia</label>
                    <select 
                      value={formData.experience}
                      onChange={(e) => updateField('experience', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none text-gray-700 bg-white"
                    >
                      <option value="1">1 año</option>
                      <option value="3">2 a 4 años</option>
                      <option value="5">5 a 9 años</option>
                      <option value="10">10 a 14 años</option>
                      <option value="15">15 o más años</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Idiomas de consulta</label>
                    <input 
                      type="text" 
                      value={formData.languages}
                      onChange={(e) => updateField('languages', e.target.value)}
                      placeholder="Español, Inglés..." 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>

                <h4 className="font-bold text-brand-dark text-sm mb-3">Sobre ti (opcional)</h4>
                <div className="mb-8">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Breve descripción profesional</label>
                  <textarea 
                    rows="4" 
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder="Cuéntanos brevemente sobre tu trayectoria profesional, áreas de interés..." 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none resize-none"
                  />
                  <div className="text-right text-[10px] text-gray-400 mt-1">{(formData.bio || '').length}/300</div>
                </div>

                <h4 className="font-bold text-brand-dark text-sm mb-3">Dirección profesional</h4>
                <div className="grid grid-cols-2 gap-6 mb-4">
                   <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Nombre de la clínica / centro</label>
                    <input 
                      type="text" 
                      value={formData.clinicName}
                      onChange={(e) => updateField('clinicName', e.target.value)}
                      placeholder="Ingresa el nombre de tu centro" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Dirección</label>
                    <input 
                      type="text" 
                      value={formData.clinicAddress}
                      onChange={(e) => updateField('clinicAddress', e.target.value)}
                      placeholder="Ingresa la dirección" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Ciudad</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Ciudad" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Código postal</label>
                    <input 
                      type="text" 
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="Postal" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Teléfono de consulta</label>
                    <input 
                      type="text" 
                      value={formData.clinicPhone}
                      onChange={(e) => updateField('clinicPhone', e.target.value)}
                      placeholder="Teléfono" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">Sitio web (opcional)</label>
                    <input 
                      type="text" 
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="www.tusitio.com" 
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-purple/20 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                   <button onClick={handleBack} className="bg-white border border-brand-purple text-brand-purple px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors">
                     Volver
                   </button>
                   <button onClick={handleNext} className="bg-brand-purple text-white px-8 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors">
                     Continuar <ArrowRight size={16} />
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
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <h3 className="font-bold text-brand-dark text-lg mb-1">Verificación profesional</h3>
                <p className="text-xs text-gray-500 mb-8">Sube tus documentos para validar tu identidad y credenciales. Es 100% seguro.</p>
                
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
                    <h4 className="font-bold text-sm text-brand-dark mb-2">Documento de identidad</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">DNI, pasaporte o documento oficial válido.</p>
                    <button type="button" className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors shadow-sm">
                      <UploadCloud size={14}/> {formData.idDocFile ? 'Cambiar archivo' : 'Subir archivo'}
                    </button>
                    {formData.idDocFile ? (
                      <p className="text-xs text-green-700 font-semibold mt-3 flex items-center gap-1">
                        <Check size={14} className="text-green-600"/> {formData.idDocFile.name}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-4">JPG, PNG o PDF. Máx. 10MB</p>
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
                    <h4 className="font-bold text-sm text-brand-dark mb-2">Diploma o Certificado de Colegiación</h4>
                    <p className="text-xs text-gray-500 mb-4 px-4">Certificado vigente de tu colegio médico o título.</p>
                    <button type="button" className="border border-brand-purple text-brand-purple bg-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-50 transition-colors shadow-sm">
                      <UploadCloud size={14}/> {formData.diplomaFile ? 'Cambiar archivo' : 'Subir archivo'}
                    </button>
                    {formData.diplomaFile ? (
                      <p className="text-xs text-green-700 font-semibold mt-3 flex items-center gap-1">
                        <Check size={14} className="text-green-600"/> {formData.diplomaFile.name}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 mt-4">JPG, PNG o PDF. Máx. 10MB</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-brand-green mb-8 bg-green-50/50 p-4 rounded-lg">
                   <Lock size={16}/> Tu información está protegida mediante encriptación y se almacena de forma segura en la nube.
                </div>
                
                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                   <button onClick={handleNext} className="bg-brand-purple text-white px-10 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md">
                     Verificar y continuar <ArrowRight size={16} />
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
                  <ArrowLeft size={16} /> Volver
                </button>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-100 text-brand-purple p-1.5 rounded-full"><Brain size={14}/></div>
                  <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">Opcional</span>
                </div>
                <h3 className="font-bold text-brand-dark text-2xl mb-2">Completa tu perfil profesional</h3>
                <p className="text-sm text-gray-500 mb-6">Ayuda a tus pacientes a conocerte mejor. Añade información adicional si deseas ofrecer una experiencia más cercana y personalizada.</p>
                
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
                          <h4 className="font-bold text-sm text-brand-dark">Foto profesional</h4>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">OPCIONAL</span>
                        </div>
                        <p className="text-xs text-gray-500">Añade una foto para que los pacientes puedan reconocerte.</p>
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
                     Omitir y finalizar
                   </button>
                   <button 
                     onClick={handleNext} 
                     disabled={isSubmitting}
                     className="bg-brand-purple text-white px-8 py-3 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
                   >
                     {isSubmitting ? 'Registrando...' : 'Finalizar inscripción'} <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            </div>

            {/* Right Col - Graphic */}
            <div className="hidden lg:flex lg:col-span-4 flex-col pt-4">
               <div className="bg-[#f8f9fc] rounded-3xl overflow-hidden shadow-sm h-full flex flex-col p-8">
                 <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" className="w-full h-48 object-cover rounded-xl mb-6 shadow-md border-4 border-white" />
                 
                 <h3 className="text-xl font-bold text-brand-dark mb-4 leading-tight">Tu perfil, tu mejor carta de presentación</h3>
                 <p className="text-sm text-gray-600 mb-8 leading-relaxed">Conecta con más pacientes y genera más confianza mostrando quién eres y dónde trabajas.</p>
                 
                 <div className="space-y-6 flex-1">
                   <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-white text-brand-purple flex items-center justify-center flex-shrink-0 shadow-sm"><User size={16}/></div>
                     <div>
                       <p className="text-xs font-bold text-gray-800">Muestra tu foto profesional</p>
                       <p className="text-[11px] text-gray-500 mt-0.5">Haz que los pacientes te reconozcan.</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white/60 rounded-xl p-4 flex gap-3 items-start mt-6">
                   <Info size={16} className="text-brand-purple mt-0.5 flex-shrink-0"/>
                   <p className="text-[10px] text-gray-600">Esta información es opcional y podrás completarla cuando quieras desde "Mi perfil".</p>
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

              <h1 className="text-4xl font-black text-brand-dark mb-4">¡Cuenta creada con éxito!</h1>
              <p className="text-lg text-gray-600 mb-8">Tu cuenta profesional de médico en VitalAI ya está lista.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-brand-purple mb-4">
                    <UserSquare2 size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Acceso Inmediato</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Puedes ingresar a tu dashboard y explorar el historial de pacientes y el Copiloto IA.</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <Globe size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Visibilidad de Especialista</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Tu perfil se lista en el directorio para derivaciones de pacientes del triaje clínico.</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-left">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-brand-green mb-4">
                    <Lock size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-brand-dark mb-2">Máxima Seguridad</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Tus diplomas y datos están protegidos en nuestra nube médica con encriptación.</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  localStorage.setItem('med_role', 'doctor');
                  window.location.href = '/medico';
                }} 
                className="bg-brand-purple text-white px-12 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-purple-700 transition-colors shadow-lg hover:shadow-purple-500/30 mb-4"
              >
                Entrar a mi Panel Médico <ArrowRight size={20} />
              </button>
              
              <button 
                onClick={() => window.location.href = '/'} 
                className="text-gray-500 hover:text-gray-700 font-semibold text-sm"
              >
                Ir al inicio
              </button>

            </div>
        )}
      </main>
    </div>
  );
};

export default DoctorOnboarding;
