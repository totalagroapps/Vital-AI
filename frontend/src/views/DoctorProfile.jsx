import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Briefcase, ShieldCheck, Lock, Edit3, CheckCircle2, 
  Mail, Phone, Clock, Stethoscope, Award, Building2, Globe, 
  Plus, Trash2, UploadCloud, FileText, Camera, Loader2, Check, AlertCircle, Info,
  ArrowLeft
} from 'lucide-react';
import DoctorLocationMap from '../components/DoctorLocationMap';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function DoctorProfile({ onBack, apiUrl, authHeaders, doctorProfile, onLogout }) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [profile, setProfile] = useState(doctorProfile || null);
  const [loading, setLoading] = useState(!doctorProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); 
  const [isEditing, setIsEditing] = useState(false);

  // Estados de subida multimedia
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('gallery');

  // Formulario Información Personal & Profesional
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    country: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    website: '',
    specialty: '',
    colegiated_number: '',
    years_experience: '',
    professional_college: '',
    subspecialties: '',
    languages: 'Español (nativo)',
    bio: ''
  });

  // Formulario de Educación
  const [eduData, setEduData] = useState({
    institution: '',
    degree: '',
    field_of_study: '',
    start_year: '',
    end_year: ''
  });
  const [showEduForm, setShowEduForm] = useState(false);

  const token = localStorage.getItem('med_token');
  const effectiveApiUrl = apiUrl || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://127.0.0.1:8000');
  const cleanApiUrl = effectiveApiUrl.replace(/\/$/, '');
  const baseApi = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;
  const defaultHeaders = authHeaders || (token ? { 'Authorization': `Bearer ${token}` } : {});

  useEffect(() => {
    fetchProfile();
  }, []);

  const populateForm = (data) => {
    setFormData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      birth_date: data.date_of_birth || data.birth_date || '',
      country: data.country || data.residence_country || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      postal_code: data.postal_code || '',
      latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : '',
      longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : '',
      website: data.website || '',
      specialty: data.specialty || '',
      colegiated_number: data.colegiated_number || data.medical_license || '',
      years_experience: data.years_experience || data.years_of_experience || '',
      professional_college: data.professional_college || '',
      subspecialties: data.subspecialties || '',
      languages: data.languages || data.language || 'Español (nativo)',
      bio: data.bio || data.professional_description || ''
    });
  };

  const fetchProfile = async () => {
    try {
      const url = `${baseApi}/doctor-profile`;
      const response = await fetch(url, { headers: defaultHeaders });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        populateForm(data);
      } else if (doctorProfile) {
        setProfile(doctorProfile);
        populateForm(doctorProfile);
      }
    } catch (error) {
      console.error("Error cargando el perfil:", error);
      if (doctorProfile) {
        setProfile(doctorProfile);
        populateForm(doctorProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const mediaList = profile?.media || [];
  
  const getMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${cleanApiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Obtención dinámica de foto de perfil
  const profilePics = mediaList.filter(m => m.media_type === 'profile_picture');
  const latestProfilePic = profilePics.length > 0 ? profilePics[profilePics.length - 1] : null;
  const avatarUrl = latestProfilePic ? getMediaUrl(latestProfilePic.file_url) : (profile?.photo_url || null);

  // Filtrado de documentos oficiales
  const identityDoc = mediaList.find(m => m.media_type === 'identity_doc' || m.media_type === 'identity_document') || profile?.identity_document_url;
  const colegiationCert = mediaList.find(m => m.media_type === 'colegiation_cert' || m.media_type === 'certificate') || profile?.professional_registration_certificate_url;

  // Cálculo de completitud del perfil (%)
  const calculateCompletionPercentage = () => {
    const fieldsToTrack = [
      formData.first_name,
      formData.last_name,
      formData.email,
      formData.phone,
      formData.address,
      formData.city,
      formData.country,
      formData.specialty,
      formData.colegiated_number,
      formData.years_experience,
      formData.professional_college,
      formData.subspecialties,
      formData.languages,
      avatarUrl,
      identityDoc,
      colegiationCert
    ];

    const filledFields = fieldsToTrack.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((filledFields / fieldsToTrack.length) * 100);
  };

  const profileCompletion = calculateCompletionPercentage();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEduChange = (e) => setEduData({ ...eduData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    try {
      const url = `${baseApi}/doctor-profile`;
      const payload = {
        ...formData,
        latitude: formData.latitude !== '' && formData.latitude !== null && formData.latitude !== undefined 
          ? parseFloat(formData.latitude) 
          : null,
        longitude: formData.longitude !== '' && formData.longitude !== null && formData.longitude !== undefined 
          ? parseFloat(formData.longitude) 
          : null,
        years_of_experience: formData.years_experience 
          ? parseInt(formData.years_experience.toString().replace(/\D/g, '')) || null 
          : null
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 
          ...defaultHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
        showMessage('success', t('profile_updated_success', 'Perfil actualizado exitosamente'));
      } else {
        showMessage('error', t('profile_update_error', 'Error al guardar los datos'));
      }
    } catch (error) {
      showMessage('error', t('conn_error', 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  // Gestión de Educación
  const handleAddEducation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = `${baseApi}/doctor-profile/education`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          ...defaultHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...eduData,
          start_year: eduData.start_year ? parseInt(eduData.start_year) : null,
          end_year: eduData.end_year ? parseInt(eduData.end_year) : null
        })
      });
      if (response.ok) {
        await fetchProfile();
        setShowEduForm(false);
        setEduData({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
        showMessage('success', t('study_added_success', 'Estudio agregado correctamente'));
      }
    } catch (error) {
      showMessage('error', t('study_add_error', 'Error al agregar estudio'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!confirm(t('confirm_delete_study', '¿Deseas eliminar este registro académico?'))) return;
    try {
      const url = `${baseApi}/doctor-profile/education/${id}`;
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: defaultHeaders
      });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error eliminando educación:", error);
    }
  };

  // Subida de archivos multimedia
  const uploadMedia = async (file, mediaType, isProfilePic = false) => {
    if (!file) return;
    isProfilePic ? setUploadingImage(true) : setUploadingGallery(true);

    const formDataObj = new FormData();
    formDataObj.append('media_type', mediaType);
    formDataObj.append('file', file);

    try {
      const url = `${baseApi}/doctor-profile/media`;
      const uploadHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(url, {
        method: 'POST',
        headers: uploadHeaders,
        body: formDataObj
      });
      if (response.ok) {
        await fetchProfile();
        showMessage('success', t('file_upload_success', 'Archivo subido con éxito'));
      }
    } catch (error) {
      showMessage('error', t('file_upload_error', 'Error al subir el archivo'));
    } finally {
      isProfilePic ? setUploadingImage(false) : setUploadingGallery(false);
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!confirm(t('confirm_delete_file', '¿Seguro que deseas eliminar este archivo?'))) return;
    try {
      const url = `${baseApi}/doctor-profile/media/${id}`;
      const response = await fetch(url, { 
        method: 'DELETE',
        headers: defaultHeaders
      });
      if (response.ok) await fetchProfile();
    } catch (error) {
      console.error("Error eliminando archivo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* BARRA SUPERIOR DE NAVEGACIÓN */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t('back_to_home', 'Volver al Inicio')}</span>
          </button>
          <LanguageSelector />
        </div>

        {/* TÍTULO PRINCIPAL */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('doctor_profile_title', 'Mi perfil profesional')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('doctor_profile_subtitle', 'Consulta y actualiza tu información profesional y certificaciones.')}</p>
        </div>

        {/* TARJETA SUPERIOR DE PERFIL (HEADER) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Foto de Perfil en la cabecera */}
            <div 
              className="relative w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl overflow-hidden cursor-pointer group shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="animate-spin text-blue-600" size={24} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span>{formData.first_name?.[0] || 'D'}{formData.last_name?.[0] || 'R'}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={20} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => uploadMedia(e.target.files[0], 'profile_picture', true)} accept="image/*" className="hidden" />

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{formData.first_name || 'Doctor'} {formData.last_name || ''}</h2>
                {/* Badge de verificación dinámico */}
                {profile?.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 size={13} /> {t('status_verified', 'Verificado')}
                  </span>
                ) : profile?.verification_status === 'rejected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60">
                    <AlertCircle size={13} /> {t('status_rejected', 'Rechazado')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    <Clock size={13} /> {t('status_pending', 'Pendiente de verificación')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{formData.specialty || t('main_specialty_label', 'Especialidad médica')}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {formData.email || 'Sin correo'}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {formData.phone || 'Sin teléfono'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Edit3 size={14} /> {isEditing ? t('cancel_edit', 'Cancelar edición') : t('edit_profile', 'Editar perfil')}
          </button>
        </div>

        {/* NOTIFICACIÓN */}
        {message && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* PESTAÑAS */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-sm flex items-center justify-between overflow-x-auto hide-scrollbar gap-1">
          {[
            { id: 'personal', label: t('tab_personal', 'Información personal'), icon: User },
            { id: 'professional', label: t('tab_professional', 'Información profesional'), icon: Briefcase },
            { id: 'documents', label: t('tab_documents', 'Documentos y verificación'), icon: ShieldCheck },
            { id: 'security', label: t('tab_security', 'Seguridad'), icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  active 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENIDO PRINCIPAL + PANEL DERECHO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-6">

            {/* TAB INFORMACIÓN PERSONAL */}
            {activeTab === 'personal' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900">{t('tab_personal', 'Información personal')}</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('first_name_label', 'Nombre')}</label>
                      {isEditing ? (
                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.first_name || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('email_account_label', 'Correo electrónico')}</label>
                      <p className="text-xs font-bold text-slate-800">{formData.email || 'Sin especificar'}</p>
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('last_name_label', 'Apellidos')}</label>
                      {isEditing ? (
                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.last_name || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('clinic_address_label', 'Dirección')}</label>
                      {isEditing ? (
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.address || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('birth_date_label', 'Fecha de nacimiento')}</label>
                      {isEditing ? (
                        <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.birth_date || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('city_label', 'Ciudad')}</label>
                      {isEditing ? (
                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.city || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('country_residence_label', 'País de residencia')}</label>
                      {isEditing ? (
                        <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.country || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('zip_code_label', 'Código postal')}</label>
                      {isEditing ? (
                        <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.postal_code || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('phone_mobile_label', 'Teléfono')}</label>
                      {isEditing ? (
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-slate-800">{formData.phone || 'Sin especificar'}</p>
                      )}
                    </div>

                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                      <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('website_label', 'Sitio web')}</label>
                      {isEditing ? (
                        <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      ) : (
                        <p className="text-xs font-bold text-blue-600 truncate">{formData.website || 'Sin especificar'}</p>
                      )}
                    </div>
                  </div>

                  {/* Sección de Mapa y Coordenadas Geográficas */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
                      {t('geo_location_label', 'Ubicación geográfica del consultorio en el mapa')}
                    </label>
                    <DoctorLocationMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      address={formData.address}
                      city={formData.city}
                      country={formData.country || 'Colombia'}
                      onChange={({ latitude, longitude }) => setFormData(prev => ({ ...prev, latitude, longitude }))}
                      readOnly={!isEditing}
                      height="280px"
                      title={isEditing ? 'Ajustar punto de atención médica en el mapa' : 'Ubicación registrada en mapa'}
                    />
                  </div>

                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Info size={18} />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Mantén tu información actualizada para ofrecer la mejor atención a tus pacientes.
                      </p>
                    </div>
                    {isEditing && (
                      <button type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-2 cursor-pointer">
                        {saving && <Loader2 size={14} className="animate-spin" />} {t('save_changes', 'Guardar cambios')}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* TAB INFORMACIÓN PROFESIONAL */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-slate-900">{t('step_professional_info', 'Información profesional')}</h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{t('main_specialty_label', 'Especialidad principal *')}</label>
                        <input type="text" name="specialty" value={formData.specialty} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{t('medical_license_label', 'Nº de colegiado / Licencia *')}</label>
                        <input type="text" name="colegiated_number" value={formData.colegiated_number} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{t('years_exp_label', 'Años de experiencia *')}</label>
                        <input type="number" name="years_experience" value={formData.years_experience} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{t('professional_college_label', 'Colegio profesional')}</label>
                        <input type="text" name="professional_college" value={formData.professional_college} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{t('subspecialty_label', 'Subespecialidades')}</label>
                        <input type="text" name="subspecialties" value={formData.subspecialties} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" placeholder="Ej. Cardiología Pediátrica" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Idiomas</label>
                        <input type="text" name="languages" value={formData.languages} onChange={handleChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div className="sm:col-span-2 flex justify-end pt-2">
                        <button type="button" onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 cursor-pointer">
                          {saving ? t('saving_changes', 'Guardando...') : t('save_changes', 'Guardar cambios')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('main_specialty_label', 'Especialidad principal')}</label>
                        <p className="text-xs font-bold text-slate-800">{formData.specialty || 'Sin especificar'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('medical_license_label', 'Nº de colegiado / Licencia')}</label>
                        <p className="text-xs font-bold text-slate-800">{formData.colegiated_number || 'Sin especificar'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('years_exp_label', 'Años de experiencia')}</label>
                        <p className="text-xs font-bold text-slate-800">{formData.years_experience ? `${formData.years_experience} años` : 'Sin especificar'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-1">{t('professional_college_label', 'Colegio profesional')}</label>
                        <p className="text-xs font-bold text-slate-800">{formData.professional_college || 'Sin especificar'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estudios y Formación */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{t('academic_history', 'Historial de Estudios')}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Agrega tus títulos académicos y certificaciones.</p>
                    </div>
                    <button onClick={() => setShowEduForm(!showEduForm)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-all cursor-pointer">
                      <Plus size={15} /> {t('add_study', 'Añadir estudio')}
                    </button>
                  </div>

                  {showEduForm && (
                    <form onSubmit={handleAddEducation} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" name="institution" placeholder={`${t('institution', 'Institución')} *`} value={eduData.institution} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" required />
                        <input type="text" name="degree" placeholder={`${t('degree_title', 'Título / Grado')} *`} value={eduData.degree} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" required />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="text" name="field_of_study" placeholder={t('field_of_study', 'Campo de estudio')} value={eduData.field_of_study} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                        <input type="number" name="start_year" placeholder={t('start_year', 'Año inicio')} value={eduData.start_year} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                        <input type="number" name="end_year" placeholder={t('end_year', 'Año fin')} value={eduData.end_year} onChange={handleEduChange} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none" />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowEduForm(false)} className="px-3.5 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer">{t('save_changes', 'Guardar')}</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {profile?.educations?.length > 0 ? (
                      profile.educations.map((edu) => (
                        <div key={edu.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                              <Award size={20} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{edu.degree}</h4>
                              <p className="text-[11px] text-slate-500">{edu.institution} {edu.start_year && `• ${edu.start_year} - ${edu.end_year || 'Presente'}`}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteEducation(edu.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                        No has registrado estudios académicos aún.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB DOCUMENTOS Y VERIFICACIÓN */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('tab_documents', 'Documentos y Verificación')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Gestión de archivos de soporte legal y multimedia.</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('official_docs', 'Documentación oficial')}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${identityDoc ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t('identity_doc', 'Documento de Identidad')}</p>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {identityDoc ? 'Cargado correctamente' : 'Pendiente por subir'}
                          </span>
                        </div>
                      </div>
                      {identityDoc && <CheckCircle2 className="text-emerald-500" size={18} />}
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colegiationCert ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t('colegiation_cert', 'Certificado de Colegiación')}</p>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {colegiationCert ? 'Cargado correctamente' : 'Pendiente por subir'}
                          </span>
                        </div>
                      </div>
                      {colegiationCert && <CheckCircle2 className="text-emerald-500" size={18} />}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('clinic_gallery', 'Galería de fotos y videos')}</h4>
                      <p className="text-xs text-slate-500 mt-1">Anexa imágenes o videos de tu centro médico.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={selectedMediaType}
                        onChange={(e) => setSelectedMediaType(e.target.value)}
                        className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none bg-white font-medium cursor-pointer"
                      >
                        <option value="gallery">Imagen clínica</option>
                        <option value="video">Video presentación</option>
                      </select>
                      <button 
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploadingGallery}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        {uploadingGallery ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {t('attach_media', 'Anexar')}
                      </button>
                      <input type="file" ref={galleryInputRef} onChange={(e) => uploadMedia(e.target.files[0], selectedMediaType, false)} accept="image/*,video/*" className="hidden" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mediaList.filter(m => m.media_type !== 'identity_doc' && m.media_type !== 'identity_document' && m.media_type !== 'colegiation_cert' && m.media_type !== 'certificate' && m.media_type !== 'profile_picture').map((media) => (
                      <div key={media.id} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                        {media.media_type === 'video' || media.mime_type?.includes('video') ? (
                          <video src={getMediaUrl(media.file_url)} className="w-full h-full object-cover" />
                        ) : (
                          <img src={getMediaUrl(media.file_url)} alt="Media" className="w-full h-full object-cover" />
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => handleDeleteMedia(media.id)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB SEGURIDAD */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900">{t('tab_security', 'Seguridad')}</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña actual</label>
                    <input type="password" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nueva contraseña</label>
                    <input type="password" className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none" placeholder="••••••••" />
                  </div>
                  <button onClick={() => alert('Para cambiar tu contraseña contacta a soporte o usa la opción de recuperación de cuenta.')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all">
                    Actualizar contraseña
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* COLUMNA DERECHA: RESUMEN LATERAL DINÁMICO */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              
              {/* Encabezado con foto dinámica y nombre real */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Doctor" className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}` : 'Sin nombre'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">{formData.specialty || 'Sin especialidad'}</p>
                </div>
              </div>

              {/* Lista dinámica de campos del doctor */}
              <div className="space-y-4">
                {/* Especialidad */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('main_specialty_label', 'Especialidad principal')}</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{formData.specialty || 'Pendiente'}</p>
                  </div>
                </div>

                {/* Nº Colegiado */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Award size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('medical_license_label', 'Nº de colegiado / Licencia')}</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{formData.colegiated_number || 'Pendiente'}</p>
                  </div>
                </div>

                {/* Años de experiencia */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('years_exp_label', 'Años de experiencia')}</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {formData.years_experience ? `${formData.years_experience} años` : 'Pendiente'}
                    </p>
                  </div>
                </div>

                {/* Colegio profesional */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('professional_college_label', 'Colegio profesional')}</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{formData.professional_college || 'Pendiente'}</p>
                  </div>
                </div>

                {/* Subespecialidades */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('subspecialty_label', 'Subespecialidades')}</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{formData.subspecialties || 'Sin subespecialidades'}</p>
                  </div>
                </div>

                {/* Idiomas */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Idiomas</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{formData.languages || 'Sin idiomas registrados'}</p>
                  </div>
                </div>

                {/* Verificación */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado de verificación</p>
                    {profile?.verification_status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={12} /> {t('status_verified', 'Verificado')}
                      </span>
                    ) : profile?.verification_status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                        <AlertCircle size={12} /> {t('status_rejected', 'Rechazado')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Clock size={12} /> {t('status_pending', 'Pendiente de verificación')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD DE PORCENTAJE DE COMPLETITUD Y ESTADO DEL PERFIL */}
              <div className={`rounded-2xl p-4 border transition-all mt-4 ${
                profileCompletion === 100 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : 'bg-amber-50/70 border-amber-200'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      profileCompletion === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                      {profileCompletion === 100 ? <Check size={15} strokeWidth={3} /> : <Info size={15} />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${
                        profileCompletion === 100 ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        {profileCompletion === 100 ? t('profile_complete', 'Perfil completo') : t('profile_incomplete', 'Perfil incompleto')}
                      </h4>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${
                    profileCompletion === 100 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {profileCompletion}%
                  </span>
                </div>

                {/* Barra de progreso visual */}
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      profileCompletion === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>

                <p className={`text-[11px] mt-2 font-medium ${
                  profileCompletion === 100 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {profileCompletion === 100 
                    ? '¡Excelente! Todos tus datos están guardados.' 
                    : 'Completa tus datos personales, profesionales y foto para alcanzar el 100%.'}
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}