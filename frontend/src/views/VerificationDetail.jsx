import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  FileText,
  MessageSquare,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function DoctorVerificationDetail({ apiUrl, authHeaders, onBack, onLogout }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'documentos' | 'notas' | 'historial'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [includeAll, setIncludeAll] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const effectiveApiUrl = apiUrl || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'https://vitalai.up.railway.app');
  const cleanApiUrl = effectiveApiUrl.replace(/\/$/, '');
  const baseApi = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

  const getHeaders = () => {
    const token = localStorage.getItem('med_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(authHeaders || {})
    };
  };

  useEffect(() => {
    fetchDoctors(includeAll);
  }, [includeAll]);

  const fetchDoctors = async (showAll = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseApi}/doctor-verification/doctors?include_all=${showAll}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data[0].id);
        }
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err.detail || 'Error al cargar los médicos');
      }
    } catch (err) {
      console.error('Error fetching doctors for verification:', err);
      setError('Error de conexión al obtener médicos');
    } finally {
      setLoading(false);
    }
  };

  const doctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0] || null;

  // Actualizar estado de verificación
  const handleUpdateStatus = async (newStatus, notes = '') => {
    if (!doctor) return;
    setUpdating(true);
    try {
      const response = await fetch(`${baseApi}/doctor-verification/doctors/${doctor.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          verification_status: newStatus,
          verification_notes: notes || `Estado actualizado a ${newStatus} desde el panel oficial.`
        })
      });

      if (response.ok) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === doctor.id ? { ...d, verification_status: newStatus } : d))
        );
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.detail || 'Error al actualizar el estado del médico.');
      }
    } catch (err) {
      console.error('Error updating doctor status:', err);
      alert('Error de conexión al actualizar el estado.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {t('status_verified', 'Verificado')}
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle size={13} className="text-rose-500" />
            {t('status_rejected', 'Rechazado')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock size={13} className="text-amber-500" />
            {t('status_pending', 'Pendiente de Revisión')}
          </span>
        );
    }
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="font-semibold text-sm">{t('loading_doctors_verif', 'Cargando médicos para verificación...')}</p>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600 gap-4 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <AlertCircle size={48} className="text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800">{t('could_not_load_data', 'No se pudieron cargar los datos')}</h2>
        <p className="text-sm text-slate-500 max-w-md">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => fetchDoctors(includeAll)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all cursor-pointer"
          >
            {t('retry', 'Reintentar')}
          </button>
          <button
            onClick={handleGoBack}
            className="border border-slate-200 bg-white text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            {t('return_home', 'Volver al inicio')}
          </button>
        </div>
      </div>
    );
  }

  // Estado vacío amigable cuando no hay médicos
  if (!loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-28 text-slate-800 font-sans antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-600">{t('doctor_verification_title', 'Verificación de Médico')}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
              <span className="text-blue-600 font-semibold">{t('verification_panel', 'Panel de Verificación')}</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-semibold flex items-center gap-1 shadow-sm"
                  title="Cerrar sesión"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto mt-12">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No hay médicos para verificar</h2>
            <p className="text-xs text-slate-500 mb-6">
              Actualmente no se han encontrado solicitudes de verificación pendientes. Si deseas ver todos los registros registrados en la plataforma, puedes recargar la lista completa.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fetchDoctors(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                Recargar todos los médicos
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                >
                  Volver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filas para la tabla según el médico seleccionado
  const personalData = [
    { field: t('full_name', 'Nombre completo'), value: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'N/A', status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: t('identity_doc', 'Documento de identidad'), verifiedBy: doctor?.verification_status === 'verified' ? t('official_verifier', 'Verificador') : '-', date: doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-' },
    { field: t('email', 'Correo electrónico'), value: doctor?.email || 'N/A', status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: t('email_confirmation', 'Confirmación por email'), verifiedBy: doctor?.verification_status === 'verified' ? t('official_verifier', 'Verificador') : '-', date: doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-' },
    { field: t('phone', 'Teléfono'), value: doctor?.phone || t('not_registered', 'No registrado'), status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: 'SMS', verifiedBy: doctor?.verification_status === 'verified' ? t('official_verifier', 'Verificador') : '-', date: doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-' },
    { field: t('country', 'País de residencia'), value: doctor?.residence_country || doctor?.country || t('not_registered', 'No registrado'), status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: t('manual_review', 'Verificación manual'), verifiedBy: '-', date: '-' },
  ];

  const profData = [
    { field: t('main_specialty', 'Especialidad principal'), value: doctor?.specialty || t('general_specialty', 'General'), status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: t('med_license', 'Licencia profesional'), verifiedBy: doctor?.verification_status === 'verified' ? t('official_verifier', 'Verificador') : '-', date: doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-' },
    { field: t('med_license', 'Licencia médica'), value: doctor?.medical_license || 'N/A', status: doctor?.verification_status === 'verified' ? 'verified' : 'pending', method: t('med_registry_lookup', 'Consulta en registro médico'), verifiedBy: doctor?.verification_status === 'verified' ? t('official_verifier', 'Verificador') : '-', date: doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-' },
    { field: t('collegiate_num', 'Nº de colegiado'), value: doctor?.professional_registration_number || t('not_provided', 'No aportado'), status: doctor?.professional_registration_number ? (doctor?.verification_status === 'verified' ? 'verified' : 'pending') : 'pending', method: t('med_board', 'Colegio médico'), verifiedBy: '-', date: '-' },
    { field: t('professional_college', 'Colegio profesional'), value: doctor?.professional_college || t('not_provided', 'No aportado'), status: doctor?.professional_college ? (doctor?.verification_status === 'verified' ? 'verified' : 'pending') : 'pending', method: t('med_board', 'Colegio médico'), verifiedBy: '-', date: '-' },
    { field: t('years_experience', 'Años de experiencia'), value: doctor?.years_of_experience ? `${doctor.years_of_experience} ${t('years', 'años')}` : t('not_registered', 'No registrado'), status: 'pending', method: t('manual_review', 'Revisión manual'), verifiedBy: '-', date: '-' },
  ];

  const docsData = [
    { field: t('identity_doc', 'Documento de identidad'), value: doctor?.identity_document_url ? 'DNI_Document.pdf' : t('not_uploaded_yet', 'No subido aún'), url: doctor?.identity_document_url, status: doctor?.identity_document_url ? (doctor?.verification_status === 'verified' ? 'verified' : 'pending') : 'pending', method: t('doc_review', 'Revisión de documento'), verifiedBy: doctor?.identity_document_url ? t('official_verifier', 'Verificador') : '-', date: '-' },
    { field: t('colegiation_cert', 'Certificado de colegiación'), value: doctor?.professional_registration_certificate_url ? 'Certificado_Colegio.pdf' : t('not_uploaded_yet', 'No subido aún'), url: doctor?.professional_registration_certificate_url, status: doctor?.professional_registration_certificate_url ? (doctor?.verification_status === 'verified' ? 'verified' : 'pending') : 'pending', method: t('doc_review', 'Revisión de documento'), verifiedBy: doctor?.professional_registration_certificate_url ? t('official_verifier', 'Verificador') : '-', date: '-' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-28 text-slate-800 font-sans antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        
        {/* BREADCRUMBS, IDIOMA Y SELECTOR DE MÉDICO */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                <span>{t('back', 'Volver')}</span>
              </button>
            )}
            <nav className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-600">{t('doctor_verification_title', 'Verificación de Médico')}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
              <span>{t('verification_panel', 'Panel de Verificación')}</span>
              <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
              <span className="text-blue-600 font-semibold">{doctor ? `${doctor.first_name} ${doctor.last_name}` : t('details', 'Detalle')}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Médico */}
            {doctors.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">{t('select_doctor', 'Seleccionar médico:')}</span>
                <select
                  value={selectedDoctorId || ''}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.first_name} {d.last_name} ({d.verification_status || 'pending'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <LanguageSelector />
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-semibold flex items-center gap-1 shadow-sm"
                title="Cerrar sesión"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* TARJETA SUPERIOR DE INFORMACIÓN DEL MÉDICO */}
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl ring-4 ring-blue-50/50 shrink-0">
                {doctor ? `${doctor.first_name?.[0] || 'D'}${doctor.last_name?.[0] || 'R'}` : 'DR'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">
                    Dr. {doctor?.first_name} {doctor?.last_name}
                  </h1>
                  
                  {getStatusBadge(doctor?.verification_status)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-blue-600">{doctor?.specialty}</span>
                  <span className="flex items-center gap-1"><Mail size={13} /> {doctor?.email}</span>
                  <span className="flex items-center gap-1"><Phone size={13} /> {doctor?.phone || t('no_phone', 'Sin teléfono')}</span>
                  <span className="flex items-center gap-1"><MapPin size={13} /> {doctor?.city || doctor?.country || doctor?.residence_country || t('location_unspecified', 'Ubicación no especificada')}</span>
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px] text-slate-400">
                  <span>{t('medical_license', 'Licencia Médica')}: <strong className="text-slate-600">{doctor?.medical_license}</strong></span>
                  <span>ID: MED-{String(doctor?.id).slice(0, 8)}</span>
                  <span>{t('registration_date', 'Fecha de registro')}: {doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/doctor/profile')}
              className="flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <span>{t('view_doctor_profile', 'Ver perfil del médico')}</span>
              <ExternalLink size={14} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="mb-6 flex border-b border-slate-200 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('datos')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors cursor-pointer ${
              activeTab === 'datos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={16} />
            <span>{t('tab_data_verif', 'Datos y verificación')}</span>
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors cursor-pointer ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>{t('documents', 'Documentos')}</span>
          </button>
          <button
            onClick={() => setActiveTab('notas')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors cursor-pointer ${
              activeTab === 'notas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare size={16} />
            <span>{t('tab_internal_notes', 'Notas internas')}</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors cursor-pointer ${
              activeTab === 'historial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <History size={16} />
            <span>{t('tab_verif_history', 'Historial de verificaciones')}</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* TAB 1: DATOS Y VERIFICACIÓN */}
          {activeTab === 'datos' && (
            <>
              <div className="space-y-6 lg:col-span-8">
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">{t('col_field_doc', 'Campo / Documento')}</th>
                          <th className="px-6 py-3">{t('col_provided_val', 'Valor proporcionado')}</th>
                          <th className="px-6 py-3">{t('col_status', 'Estado')}</th>
                          <th className="px-6 py-3">{t('col_method', 'Método de verificación')}</th>
                          <th className="px-6 py-3">{t('col_verified_by', 'Verificado por')}</th>
                          <th className="px-6 py-3">{t('col_date', 'Fecha')}</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* DATOS PERSONALES */}
                        <tr className="bg-slate-50/40 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            {t('personal_data', 'Datos Personales')}
                          </td>
                        </tr>
                        {personalData.map((row, idx) => (
                          <tr key={`p-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-slate-600">{row.value}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}

                        {/* INFORMACIÓN PROFESIONAL */}
                        <tr className="bg-slate-50/40 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            {t('prof_data', 'Información Profesional')}
                          </td>
                        </tr>
                        {profData.map((row, idx) => (
                          <tr key={`pr-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-slate-600">{row.value}</td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}

                        {/* DOCUMENTOS */}
                        <tr className="bg-slate-50/40 font-bold text-blue-600">
                          <td colSpan={7} className="px-6 py-2.5 text-[10px] uppercase tracking-wider">
                            {t('documents', 'Documentos')}
                          </td>
                        </tr>
                        {docsData.map((row, idx) => (
                          <tr key={`d-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-slate-700">{row.field}</td>
                            <td className="px-6 py-3.5 text-blue-600">
                              {row.url ? (
                                <a href={row.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">
                                  {row.value}
                                </a>
                              ) : (
                                <span className="text-slate-400">{row.value}</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5">{getStatusBadge(row.status)}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.method}</td>
                            <td className="px-6 py-3.5 text-slate-500">{row.verifiedBy}</td>
                            <td className="px-6 py-3.5 text-slate-400">{row.date}</td>
                            <td className="px-3 py-3.5 text-slate-300 hover:text-slate-600 cursor-pointer">
                              <MoreHorizontal size={16} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* PANEL LATERAL DERECHO DE DATOS Y VERIFICACIÓN */}
              <div className="space-y-6 lg:col-span-4">
                {/* DONUT CHART ESTADO DE VERIFICACIÓN */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">{t('status_verification', 'Estado de verificación')}</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={doctor?.verification_status === 'verified' ? 'text-emerald-500' : doctor?.verification_status === 'rejected' ? 'text-red-500' : 'text-amber-500'}
                          strokeDasharray={doctor?.verification_status === 'verified' ? "100, 100" : doctor?.verification_status === 'rejected' ? "100, 100" : "50, 100"}
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-lg font-extrabold text-slate-800">
                        {doctor?.verification_status === 'verified' ? '100%' : doctor?.verification_status === 'rejected' ? '0%' : '50%'}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-800">
                        {doctor?.verification_status === 'verified' 
                          ? t('doctor_approved', 'Médico Aprobado') 
                          : doctor?.verification_status === 'rejected' 
                            ? t('doctor_rejected', 'Médico Rechazado') 
                            : t('review_pending', 'Revisión Pendiente')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          doctor?.verification_status === 'verified' 
                            ? 'bg-emerald-500' 
                            : doctor?.verification_status === 'rejected' 
                              ? 'bg-red-500' 
                              : 'bg-amber-500'
                        }`}></span>
                        <span className="text-slate-500">{t('col_status', 'Estado')}:</span>
                        <span className="font-bold text-slate-700 capitalize">
                          {doctor?.verification_status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIVIDAD RECIENTE */}
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">{t('platform_registration', 'Registro en la plataforma')}</h3>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600 text-xs">
                        VO
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">
                          {t('official_verifier', 'Verificador Oficial')} <span className="font-normal text-slate-500">({t('connected', 'conectado')})</span>
                        </p>
                        <span className="text-[10px] text-slate-400">MIVOR.ai Verification Engine</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="lg:col-span-12 space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">{t('docs_provided_title', 'Documentos aportados por el médico')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{t('identity_doc', 'Documento de identidad')}</h4>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{doctor?.identity_document_url || t('not_uploaded_yet', 'No subido aún')}</p>
                      </div>
                    </div>
                    {doctor?.identity_document_url && (
                      <a href={doctor.identity_document_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 cursor-pointer underline">
                        {t('view_file', 'Ver archivo')}
                      </a>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{t('colegiation_cert', 'Certificado de colegiación')}</h4>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{doctor?.professional_registration_certificate_url || t('not_uploaded_yet', 'No subido aún')}</p>
                      </div>
                    </div>
                    {doctor?.professional_registration_certificate_url && (
                      <a href={doctor.professional_registration_certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-purple-600 cursor-pointer underline">
                        {t('view_file', 'Ver archivo')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 & 4: NOTAS E HISTORIAL */}
          {(activeTab === 'notas' || activeTab === 'historial') && (
            <div className="lg:col-span-12 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm text-xs">
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('notes_history_title', 'Notas e Historial del Médico')}</h3>
              <p className="text-slate-500">Dr. {doctor?.first_name} {doctor?.last_name} | {t('medical_license', 'Licencia')}: {doctor?.medical_license}</p>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
                <p className="font-semibold text-slate-700">
                  {t('current_verif_status', 'Estado actual de verificación')}: <span className="text-blue-600 capitalize font-bold">{doctor?.verification_status || 'pending'}</span>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* BARRA INFERIOR DE ACCIONES FIJA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 py-3 px-6 backdrop-blur-md z-10 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
            <span>{t('return_home', 'Volver al inicio')}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpdateStatus('rejected')}
              disabled={updating}
              className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <XCircle size={16} />
              <span>{t('mark_as_rejected', 'Marcar como rechazado')}</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('pending')}
              disabled={updating}
              className="flex items-center gap-2 rounded-xl border border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <Clock size={16} />
              <span>{t('mark_as_pending', 'Marcar como pendiente')}</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('verified')}
              disabled={updating}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{t('approve_doctor', 'Aprobar médico')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}