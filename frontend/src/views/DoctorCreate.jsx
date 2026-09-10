import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

import StepperHeader from './doctor/components/StepperHeader';
import Step1Personal from './doctor/components/Step1Personal';
import Step2Professional from './doctor/components/Step2Professional';
import Step3Professional from './doctor/components/Step3Professional';
import Step4OptionalProfile from './doctor/components/Step4Professional';
import Step5Success from './doctor/components/Step5Success';

const parseBirthDate = (str) => {
  if (!str) return null;
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[\/\-\s]+/).filter(Boolean);
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
};

export default function DoctorCreate({ apiUrl, onNavigateLogin, onRegisterSuccess }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Paso 1
    firstName: '',
    lastName: '',
    birthDate: '',
    country: 'Colombia',
    email: '',
    phone: '',
    language: 'Español',
    password: '',
    confirmPassword: '',
    identityDoc: null,
    colegiationCert: null,
    termsAccepted: false,

    // Paso 2
    specialty: '',
    colegiatedNumber: '',
    professionalCollege: '',
    collegeCountry: '',
    experienceYears: '',
    subspecialty: '',
    bio: '',
    clinicName: '',
    address: '',
    city: '',
    zipCode: '',
    latitude: null,
    longitude: null,
    consultationPhone: '',
    website: '',

    // Paso 4 (Opcional)
    profilePhoto: null,
    clinicImages: [],
    presentationVideo: null
  });

  const updateFormData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (stepNumber) => setCurrentStep(stepNumber);

  const handleRegisterDoctor = async () => {
    setIsSubmitting(true);
    setError(null);

    const yearsExp = formData.experienceYears
      ? parseInt(formData.experienceYears.toString().replace(/\D/g, '')) || null
      : null;

    const payload = {
      first_name: formData.firstName.trim() || 'Médico',
      last_name: formData.lastName.trim() || 'General',
      email: formData.email.trim(),
      medical_license: formData.colegiatedNumber.trim() || `LIC-${Date.now()}`,
      specialty: formData.specialty.trim() || 'Medicina General',
      subspecialties: formData.subspecialty?.trim() || null,
      phone: formData.phone?.trim() || null,
      date_of_birth: parseBirthDate(formData.birthDate),
      residence_country: formData.country || 'Colombia',
      country: formData.country || 'Colombia',
      city: formData.city?.trim() || null,
      address: formData.address?.trim() || null,
      postal_code: formData.zipCode?.trim() || null,
      latitude: formData.latitude !== null && formData.latitude !== undefined && formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== null && formData.longitude !== undefined && formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      consultation_phone: formData.consultationPhone?.trim() || null,
      website: formData.website?.trim() || null,
      professional_registration_number: formData.colegiatedNumber?.trim() || null,
      professional_college: formData.professionalCollege?.trim() || null,
      college_country: formData.collegeCountry?.trim() || null,
      years_of_experience: yearsExp,
      professional_description: formData.bio?.trim() || null,
      experience: formData.bio?.trim() || null,
      language: formData.language === 'Inglés' ? 'en' : (formData.language === 'Francés' ? 'fr' : (formData.language === 'Árabe' ? 'ar' : 'es')),
      password: formData.password || null
    };

    try {
      const baseApi = apiUrl || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const cleanApi = baseApi.replace(/\/$/, '');
      const registerUrl = cleanApi.endsWith('/api')
        ? `${cleanApi}/doctor-profile/register`
        : `${cleanApi}/api/doctor-profile/register`;

      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        const userId = responseData.user_id || responseData.id;

        // Subir fotos o documentos opcionales si se seleccionaron
        const filesToUpload = [];
        if (formData.profilePhoto) filesToUpload.push({ file: formData.profilePhoto, type: 'profile_picture' });
        if (formData.identityDoc) filesToUpload.push({ file: formData.identityDoc, type: 'identity_document' });
        if (formData.colegiationCert) filesToUpload.push({ file: formData.colegiationCert, type: 'certificate' });
        if (formData.clinicImages && formData.clinicImages.length > 0) {
          formData.clinicImages.forEach((img) => filesToUpload.push({ file: img, type: 'gallery' }));
        }

        const mediaUrl = cleanApi.endsWith('/api')
          ? `${cleanApi}/doctor-profile/media?user_id=${userId}`
          : `${cleanApi}/api/doctor-profile/media?user_id=${userId}`;

        for (const item of filesToUpload) {
          try {
            const fileData = new FormData();
            fileData.append('media_type', item.type);
            fileData.append('file', item.file);
            await fetch(mediaUrl, {
              method: 'POST',
              body: fileData
            });
          } catch (e) {
            console.warn('Error subiendo archivo opcional:', item.type, e);
          }
        }

        setCurrentStep(5);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || t('error_register_doctor', 'Error al registrar el perfil médico.'));
      }
    } catch (err) {
      console.error('Error in doctor registration:', err);
      setError(err.message || t('error_create_account', 'Error al crear la cuenta.'));
      alert(err.message || t('error_create_account', 'Error al crear la cuenta.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSuccess = () => {
    if (onRegisterSuccess) {
      onRegisterSuccess();
    } else if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header Fijo */}
      <header className="h-16 border-b border-slate-200/80 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Activity size={20} />
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            MIVOR<span className="text-blue-600">.ai</span>
            <span className="block text-[10px] text-blue-600 font-bold tracking-widest -mt-1 uppercase">PORTAL MÉDICO</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          {currentStep < 5 && (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:inline text-slate-500 font-medium">{t('already_have_account', '¿Ya tienes cuenta?')}</span>
              <button 
                onClick={onNavigateLogin || (() => navigate('/login'))} 
                className="px-4 py-2 text-blue-600 border border-blue-200 font-bold rounded-xl hover:bg-blue-50 transition-all text-xs cursor-pointer"
              >
                {t('login_button', 'Iniciar sesión')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Dynamic Content Area */}
      <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-4 md:p-6">
        {/* Stepper Header */}
        {currentStep < 5 && <StepperHeader currentStep={currentStep} />}

        {error && currentStep < 5 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Paso 1 */}
        {currentStep === 1 && (
          <Step1Personal 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
          />
        )}

        {/* Paso 2 */}
        {currentStep === 2 && (
          <Step2Professional 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
            onPrev={prevStep}
          />
        )}

        {/* Paso 3 */}
        {currentStep === 3 && (
          <Step3Professional 
            formData={formData} 
            onNext={nextStep} 
            onPrev={prevStep}
            goToStep={goToStep}
          />
        )}

        {/* Paso 4 */}
        {currentStep === 4 && (
          <Step4OptionalProfile 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
            onPrev={prevStep}
            onSubmitRegistration={handleRegisterDoctor}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Paso 5 */}
        {currentStep === 5 && (
          <Step5Success 
            formData={formData} 
            onFinish={handleFinishSuccess} 
          />
        )}
      </div>
    </div>
  );
}