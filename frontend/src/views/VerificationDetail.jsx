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
  ArrowLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  LogOut,
  Building2,
  Award,
  Stethoscope,
  RefreshCw,
  FileCheck,
  Eye,
  UserCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function DoctorVerificationDetail({ apiUrl, authHeaders, onBack, onLogout }) {
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();

  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'documentos' | 'notas' | 'historial'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [includeAll, setIncludeAll] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');
  const [toast, setToast] = useState(null);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
        if (data.length > 0 && (!selectedDoctorId || !data.some(d => d.id === selectedDoctorId))) {
          setSelectedDoctorId(data[0].id);
        }
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err.detail || t('verificationdetail_error_al_cargar_los_medicos'));
      }
    } catch (err) {
      console.error('Error fetching doctors for verification:', err);
      setError(t('verificationdetail_error_de_conexion_al_obtener'));
    } finally {
      setLoading(false);
    }
  };

  const doctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0] || null;

  // Sanitizador de nombres para prevenir prefijos duplicados tipo "Dr. Dr. Alejandro Ruiz"
  const cleanDoctorName = (doc) => {
    if (!doc) return t('default_doctor_name');
    const rawFirst = (doc.first_name || '').trim();
    const rawLast = (doc.last_name || '').trim();
    const isFemale = /^dra\.?\s+/i.test(rawFirst);
    const cleanFirst = rawFirst.replace(/^(dr\.|dra\.|dr|dra)\s+/i, '').replace(/^(dr\.|dra\.|dr|dra)\s+/i, '').trim();
    const prefix = isFemale ? t('verificationdetail_dra') : t('verificationdetail_dr');
    return `${prefix} ${cleanFirst} ${rawLast}`.trim();
  };

  // Iniciales del doctor
  const getDoctorInitials = (doc) => {
    if (!doc) return 'DR';
    const rawFirst = (doc.first_name || '').replace(/^(dr\.|dra\.|dr|dra)\s+/i, '').trim();
    const rawLast = (doc.last_name || '').trim();
    const fChar = rawFirst ? rawFirst[0] : '';
    const lChar = rawLast ? rawLast[0] : '';
    return (fChar + lChar).toUpperCase() || 'DR';
  };

  // Sanitizador de ubicación para evitar que se muestre "Centro Clínico" en el país
  const formatDoctorLocation = (doc) => {
    if (!doc) return t('not_specified');
    const clean = (val) => {
      if (!val) return null;
      const lower = val.toLowerCase();
      if (lower.includes('clínic') || lower.includes('telemedicina') || lower.includes('mivor')) return null;
      return val.trim();
    };

    const city = clean(doc.city);
    const country = clean(doc.residence_country) || clean(doc.country);

    if (city && country && city !== country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return t('not_specified');
  };

  // Resolver URLs relativas de documentos
  const resolveDocumentUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanBase = effectiveApiUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  // Cálculo de porcentaje de conformidad
  const calculateVerificationScore = (doc) => {
    if (!doc) return 0;
    if (doc.verification_status === 'verified') return 100;
    if (doc.verification_status === 'rejected') return 0;
    let score = 25;
    if (doc.identity_document_url) score += 25;
    if (doc.professional_registration_certificate_url) score += 25;
    if (doc.medical_license) score += 15;
    if (doc.specialty) score += 10;
    return Math.min(score, 85);
  };

  // Actualizar estado de verificación
  const handleUpdateStatus = async (newStatus) => {
    if (!doctor) return;
    setUpdating(true);
    try {
      const defaultNote = newStatus === 'verified'
        ? t('verificationdetail_medico_verificado_y_acreditado_ofici')
        : newStatus === 'rejected'
          ? t('verificationdetail_solicitud_de_verificacion_rechazada_')
          : t('verificationdetail_solicitud_en_revision_pendiente_de');

      const response = await fetch(`${baseApi}/doctor-verification/doctors/${doctor.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          verification_status: newStatus,
          verification_notes: auditNotes.trim() || defaultNote
        })
      });

      if (response.ok) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === doctor.id ? { ...d, verification_status: newStatus } : d))
        );
        showToast(
          newStatus === 'verified'
            ? t('verificationdetail_el_ha_sido_aprobado_y', { value: cleanDoctorName(doctor) })
            : newStatus === 'rejected'
              ? t('verificationdetail_el_estado_se_ha_establecido')
              : t('verificationdetail_el_estado_se_ha_establecido_2'),
          newStatus === 'verified' ? 'success' : newStatus === 'rejected' ? 'error' : 'info'
        );
        setAuditNotes('');
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.detail || t('verificationdetail_error_al_actualizar_el_estado_del'), 'error');
      }
    } catch (err) {
      console.error('Error updating doctor status:', err);
      showToast(t('verificationdetail_error_de_conexion_al_actualizar_el'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <CheckCircle2 size={13} className="text-emerald-600" />
            {t('status_verified', 'Verificado y Acreditado')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-xs">
            <XCircle size={13} className="text-rose-600" />
            {t('status_rejected', 'Rechazado')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-xs">
            <Clock size={13} className="text-amber-600" />
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

  // Filtrado de médicos
  const filteredDoctors = doctors.filter((d) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    const name = `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase();
    const spec = (d.specialty || '').toLowerCase();
    const license = (d.medical_license || '').toLowerCase();
    return name.includes(q) || spec.includes(q) || license.includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-500 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <ShieldCheck size={32} className="text-teal-600 animate-pulse" />
          </div>
          <Loader2 size={24} className="animate-spin text-teal-600 absolute -top-1 -right-1" />
        </div>
        <p className="font-bold text-sm text-slate-700">{t('loading_doctors_verif', 'Cargando expediente de verificación...')}</p>
        <p className="text-xs text-slate-400">{t('verificationdetail_conectando_con_el_registro_colegial')}</p>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-600 gap-4 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('could_not_load_data', 'No se pudieron cargar los datos de verificación')}</h2>
        <p className="text-xs text-slate-500 max-w-md">{error}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => fetchDoctors(includeAll)}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-teal-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {t('retry', 'Reintentar')}
          </button>
          <button
            onClick={handleGoBack}
            className="border border-slate-200 bg-white text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            {t('return_home', 'Volver')}
          </button>
        </div>
      </div>
    );
  }

  // Estado vacío cuando no hay médicos
  if (!loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-28 text-slate-800 font-sans antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mivor_logo.png" alt="MIVOR.ai" className="w-8 h-8 object-contain" onError={(e) => { e.target.src = '/logo.png'; }} />
            <span className="font-black text-slate-900 tracking-tight text-lg">MIVOR<span className="text-teal-600">.ai</span></span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              {t('verification_panel')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {onLogout && (
              <button onClick={onLogout} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                <LogOut size={14} />
                <span>{t('exit')}</span>
              </button>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-teal-100 shadow-sm">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('verificationdetail_bandeja_de_verificacion_al_dia')}</h2>
          <p className="text-xs text-slate-500 mb-8 leading-relaxed">
            {t('verificationdetail_no_se_han_encontrado_expedientes')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchDoctors(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              {t('verificationdetail_cargar_censo_completo')}
            </button>
            <button
              onClick={handleGoBack}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {t('returning')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const score = calculateVerificationScore(doctor);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased pb-32 selection:bg-teal-500 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* TOAST FLOTANTE */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          'bg-slate-800 text-white border-slate-900'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title={t('back', 'Volver')}
          >
            <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
          <div className="flex items-center gap-2.5">
            <img 
              src="/images/mivor_logo.png" 
              alt="MIVOR.ai" 
              className="w-8 h-8 object-contain" 
              onError={(e) => { e.target.src = '/logo.png'; }} 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 tracking-tight text-base leading-none">
                  MIVOR<span className="text-teal-600">.ai</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  <ShieldCheck size={11} className="text-teal-600" />
                  {t('verificationdetail_auditoria_oficial')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                {t('verificationdetail_panel_oficial_de_verificacion_colegi')}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Doctor Selector, Language, Logout */}
        <div className="flex items-center gap-3">
          {/* Selector de Médico con Avatar */}
          {doctors.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="font-bold text-slate-500 hidden md:inline">{t('select_doctor', 'Médico:')}</span>
              <select
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value) || e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs cursor-pointer max-w-[180px] sm:max-w-[260px] truncate"
              >
                {filteredDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {cleanDoctorName(d)} ({d.verification_status === 'verified' ? t('verificationdetail_verificado') : d.verification_status === 'rejected' ? t('verificationdetail_rechazado') : t('verificationdetail_pendiente')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <LanguageSelector />

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              title={t('patient_menu_logout_title')}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{t('exit')}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. HERO CARD DEL MÉDICO SELECCIONADO */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden">
          
          {/* Acento decorativo sutil en la esquina superior */}
          <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-teal-50/60 to-transparent pointer-events-none rounded-tr-3xl" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
            
            {/* Foto / Iniciales e Identidad */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md border-2 border-white ring-4 ring-teal-50">
                  {getDoctorInitials(doctor)}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-xs">
                  {doctor?.verification_status === 'verified' ? (
                    <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
                  ) : doctor?.verification_status === 'rejected' ? (
                    <XCircle size={18} className="text-rose-500 fill-rose-50" />
                  ) : (
                    <Clock size={18} className="text-amber-500 fill-amber-50" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {cleanDoctorName(doctor)}
                  </h1>
                  {getStatusBadge(doctor?.verification_status)}
                </div>

                {/* Especialidad y Metadatos */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-100">
                    <Stethoscope size={13} className="text-teal-600" />
                    {doctor?.specialty || t('doctoronboarding_medicina_general')}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail size={13} className="text-slate-400" />
                    {doctor?.email || t('doctorprofile_sin_correo')}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone size={13} className="text-slate-400" />
                    {doctor?.phone || t('doctorprofile_sin_telefono')}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    {formatDoctorLocation(doctor)}
                  </span>
                </div>

                {/* Sub-metadatos: Licencia médica y registro */}
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium">
                  <span>
                    {t('verificationdetail_licencia')} <strong className="text-slate-700 font-bold">{doctor?.medical_license || t('status_pending')}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t('verificationdetail_n_colegiado')} <strong className="text-slate-700 font-bold">{doctor?.professional_registration_number || doctor?.medical_license || t('verificationdetail_no_aportado')}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t('verificationdetail_colegio')} <strong className="text-slate-700 font-bold">{doctor?.professional_college || t('not_specified')}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {t('verificationdetail_expediente')} <strong className="text-slate-700 font-mono">{t('verificationdetail_med')}{String(doctor?.id).slice(0, 8)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Ver Perfil Público */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => navigate('/doctor/profile')}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>{t('view_doctor_profile', 'Ver perfil público')}</span>
                <ExternalLink size={14} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. NAVEGACIÓN POR PESTAÑAS (SEGMENTED TABS) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="bg-slate-200/70 p-1 rounded-2xl inline-flex gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('datos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'datos'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={15} className={activeTab === 'datos' ? 'text-teal-600' : 'text-slate-400'} />
              <span>{t('tab_data_verif', 'Datos y Verificación')}</span>
            </button>
            <button
              onClick={() => setActiveTab('documentos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'documentos'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={15} className={activeTab === 'documentos' ? 'text-teal-600' : 'text-slate-400'} />
              <span>{t('documents', 'Documentos Oficiales')}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {(doctor?.identity_document_url ? 1 : 0) + (doctor?.professional_registration_certificate_url ? 1 : 0)}/2
              </span>
            </button>
            <button
              onClick={() => setActiveTab('notas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notas'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={15} className={activeTab === 'notas' ? 'text-teal-600' : 'text-slate-400'} />
              <span>{t('tab_internal_notes', 'Notas de Auditoría')}</span>
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={15} className={activeTab === 'historial' ? 'text-teal-600' : 'text-slate-400'} />
              <span>{t('tab_verif_history', 'Historial del Expediente')}</span>
            </button>
          </div>

          {/* Buscador rápido de médicos */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('verificationdetail_buscar_por_medico_n_colegiado')}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs w-64 sm:w-80"
            />
          </div>
        </div>

        {/* 4. CONTENIDO PRINCIPAL POR PESTAÑAS */}
        <div className="mt-6">
          
          {/* TAB 1: DATOS Y VERIFICACIÓN */}
          {activeTab === 'datos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Columna Izquierda: Requisitos & Fichas de Validación (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. SECCIÓN IDENTIDAD PERSONAL */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{t('verificationdetail_identidad_personal_y_de_contacto')}</h3>
                        <p className="text-[11px] text-slate-400">{t('verificationdetail_cotejo_de_datos_civiles_y')}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t('verificationdetail_datos_verificables')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Nombre Completo */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Award size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('verificationdetail_nombre_del_profesional')}</span>
                          <span className="text-xs font-bold text-slate-900">{cleanDoctorName(doctor)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">{t('verificationdetail_cotejo_con_dni_nie')}</span>
                        {getStatusBadge(doctor?.verification_status === 'verified' ? 'verified' : 'pending')}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Mail size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('verificationdetail_correo_electronico')}</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{doctor?.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">{t('verificationdetail_verificacion_de_buzon_seguro')}</span>
                        {getStatusBadge(doctor?.email ? 'verified' : 'pending')}
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <Phone size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('verificationdetail_telefono_de_contacto')}</span>
                          <span className="text-xs font-bold text-slate-900">{doctor?.phone || t('verificationdetail_no_registrado')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">{t('verificationdetail_sms_otp_2fa')}</span>
                        {getStatusBadge(doctor?.phone ? 'verified' : 'pending')}
                      </div>
                    </div>

                    {/* Ubicación y Residencia */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{t('verificationdetail_pais_y_residencia_fiscal')}</span>
                          <span className="text-xs font-bold text-slate-900">{formatDoctorLocation(doctor)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">{t('verificationdetail_validacion_territorial')}</span>
                        {getStatusBadge(doctor?.verification_status === 'verified' ? 'verified' : 'pending')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN ACREDITACIÓN PROFESIONAL */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{t('verificationdetail_acreditacion_medica_y_colegiatura')}</h3>
                        <p className="text-[11px] text-slate-400">{t('verificationdetail_comprobacion_en_el_censo_del')}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {t('verificationdetail_censo_oficial')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Especialidad */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_especialidad_principal')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{doctor?.specialty || t('doctoronboarding_medicina_general')}</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_titulo_de_especialista_en_ciencias')}</span>
                    </div>

                    {/* Licencia Médica */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_licencia_medica_estatal')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">{doctor?.medical_license || t('verificationdetail_no_registrado')}</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_registro_publico_estatal_de_profesio')}</span>
                    </div>

                    {/* Nº Colegiado */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_numero_de_colegiado')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {doctor?.professional_registration_number || doctor?.medical_license || t('verificationdetail_no_aportado')}
                        </span>
                        {doctor?.professional_registration_number ? (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        ) : (
                          <Clock size={15} className="text-amber-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_censo_colegial_del_cgcom')}</span>
                    </div>

                    {/* Colegio Oficial */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_colegio_profesional')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.professional_college || t('not_specified')}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_sede_colegial_activa')}</span>
                    </div>

                    {/* Años de Experiencia */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_experiencia_acreditada')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.years_of_experience ? t('verification_years_practice', { years: doctor.years_of_experience }) : t('not_specified')}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_actividad_asistencial_continuada')}</span>
                    </div>

                    {/* Centro Clínico de Adscripción */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t('verificationdetail_centro_de_adscripcion')}</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.address || t('not_specified')}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">{t('verificationdetail_instalacion_sanitaria_homologada')}</span>
                    </div>
                  </div>
                </div>

                {/* 3. DESCRIPCIÓN Y BIO PROFESIONAL */}
                {doctor?.professional_description && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('verificationdetail_perfil_profesional_y_declaracion')}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{doctor.professional_description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Score de Conformidad & Auditoría (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* CARD GAUGE DE CONFORMIDAD */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900">{t('verificationdetail_indice_de_conformidad')}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {t('verificationdetail_algoritmo_mivor')}
                    </span>
                  </div>

                  <div className="flex flex-col items-center py-2 text-center">
                    <div className="relative flex h-28 w-28 items-center justify-center">
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={doctor?.verification_status === 'verified' ? 'text-emerald-500' : doctor?.verification_status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}
                          strokeDasharray={`${score}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-900 leading-none">{score}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">{t('verificationdetail_conforme')}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs font-bold text-slate-900">
                        {doctor?.verification_status === 'verified' ? t('verificationdetail_colegiacion_y_perfil_aprobado') :
                         doctor?.verification_status === 'rejected' ? t('verificationdetail_solicitud_no_conforme') :
                         t('verificationdetail_auditoria_pendiente_de_validacion')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        {doctor?.verification_status === 'verified'
                          ? t('verificationdetail_el_expediente_cumple_el_100')
                          : t('verificationdetail_revisa_los_documentos_adjuntos_antes')}
                      </p>
                    </div>
                  </div>

                  {/* Checklist de requisitos */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        {t('verificationdetail_identidad_acreditada')}
                      </span>
                      <span className="font-bold text-emerald-600">OK</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        {t('verificationdetail_licencia_medica_activa')}
                      </span>
                      <span className="font-bold text-emerald-600">OK</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        {doctor?.professional_registration_certificate_url ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Clock size={14} className="text-amber-500" />
                        )}
                        {t('step1personal_certificado_de_colegiacion')}
                      </span>
                      <span className={`font-bold ${doctor?.professional_registration_certificate_url ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {doctor?.professional_registration_certificate_url ? 'OK' : t('verificationdetail_revisar')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        {t('verificationdetail_canal_seguro_2fa')}
                      </span>
                      <span className="font-bold text-emerald-600">OK</span>
                    </div>
                  </div>
                </div>

                {/* CARD AUDITOR OFICIAL EN SESIÓN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('verificationdetail_auditor_oficial_en_sesion')}</h3>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                      VO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t('verificationdetail_verificador_oficial_mivor_ai')}</p>
                      <p className="text-[10px] text-teal-700 font-medium">{t('verificationdetail_colegio_oficial_de_medicos_de')}</p>
                      <span className="inline-block mt-0.5 text-[9px] font-mono text-slate-400">{t('verificationdetail_id_sesion_vo_es')}{String(doctor?.id || '101').padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>

                {/* NOTAS RÁPIDAS PARA EL DICTAMEN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{t('verificationdetail_notas_del_dictamen')}</h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {t('verificationdetail_estas_observaciones_quedaran_registr')}
                  </p>
                  <textarea
                    rows={3}
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder={t('verificationdetail_escribe_aqui_observaciones_sobre_la')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none font-medium"
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTOS OFICIALES */}
          {activeTab === 'documentos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{t('verificationdetail_expediente_documental_aportado')}</h3>
                    <p className="text-xs text-slate-400">{t('verificationdetail_inspeccion_de_titulos_oficiales_acre')}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {t('verificationdetail_2_documentos_requeridos')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documento 1: DNI / Documento de Identidad */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                        <FileCheck size={24} />
                      </div>
                      {doctor?.identity_document_url ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t('verificationdetail_documento_cargado')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {t('verificationdetail_pendiente_de_carga')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t('verificationdetail_documento_de_identidad_dni_nie')}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {doctor?.identity_document_url ? t('verificationdetail_dni_oficial_acreditacion_pdf') : t('verificationdetail_el_medico_aun_no_ha')}
                    </p>
                    {doctor?.identity_document_url ? (
                      <a
                        href={resolveDocumentUrl(doctor.identity_document_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>{t('verificationdetail_inspeccionar_documento')}</span>
                        <ExternalLink size={12} className={isRtl ? 'rotate-180' : ''} />
                      </a>
                    ) : (
                      <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{t('verificationdetail_se_requiere_subir_este_documento')}</span>
                      </div>
                    )}
                  </div>

                  {/* Documento 2: Certificado de Colegiación */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                        <Award size={24} />
                      </div>
                      {doctor?.professional_registration_certificate_url ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t('verificationdetail_certificado_cargado')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {t('verificationdetail_pendiente_de_carga')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t('verificationdetail_certificado_oficial_de_colegiacion_m')}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {doctor?.professional_registration_certificate_url ? t('verificationdetail_certificado_colegio_oficial_medicos_') : t('verificationdetail_pendiente_de_adjuntar_certificado_de')}
                    </p>
                    {doctor?.professional_registration_certificate_url ? (
                      <a
                        href={resolveDocumentUrl(doctor.professional_registration_certificate_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>{t('verificationdetail_inspeccionar_certificado')}</span>
                        <ExternalLink size={12} className={isRtl ? 'rotate-180' : ''} />
                      </a>
                    ) : (
                      <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{t('verificationdetail_pendiente_de_presentacion_por_el')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTAS DE AUDITORÍA */}
          {activeTab === 'notas' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-black text-slate-900 mb-1">{t('verificationdetail_notas_del_expediente_colegial')}</h3>
              <p className="text-xs text-slate-400 mb-6">
                {t('verificationdetail_registro_confidencial_de_observacion')}
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800">{t('verificationdetail_auditor_oficial_cgcom')}</span>
                    <span className="text-slate-400">{doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : t('verificationdetail_hoy')}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t('verificationdetail_expediente_iniciado_en_la_plataforma')} <strong className="font-mono">{doctor?.medical_license || t('verificationdetail_no_registrado')}</strong>{t('verificationdetail_datos_personales_cotejados_con_el')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-teal-800">{t('verificationdetail_resolucion_de_estado_actual')}</span>
                    <span className="text-teal-600 font-bold uppercase">{doctor?.verification_status || 'pending'}</span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    {doctor?.verification_status === 'verified'
                      ? t('verificationdetail_el_facultativo_cuenta_con_acreditaci')
                      : t('verificationdetail_el_expediente_se_encuentra_bajo')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL DEL EXPEDIENTE */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-black text-slate-900 mb-1">{t('verificationdetail_trazabilidad_y_linea_temporal')}</h3>
              <p className="text-xs text-slate-400 mb-6">{t('verificationdetail_historico_inmutable_de_eventos_asoci')}</p>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">{t('verificationdetail_registro_inicial')}</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{t('verificationdetail_creacion_del_perfil_profesional')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('verificationdetail_el_medico_completo_el_registro')} {doctor?.specialty || t('doctoronboarding_medicina_general')}.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {doctor?.created_at ? new Date(doctor.created_at).toLocaleString() : t('verificationdetail_fecha_registrada')}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{t('verificationdetail_cotejo_de_credenciales')}</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{t('verificationdetail_comprobacion_de_licencia_medica')}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('verificationdetail_licencia_medica_consultada_en_la', { medical_license: doctor?.medical_license })}
                  </p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-xs ${
                    doctor?.verification_status === 'verified' ? 'bg-emerald-600' :
                    doctor?.verification_status === 'rejected' ? 'bg-rose-600' : 'bg-amber-500'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    doctor?.verification_status === 'verified' ? 'text-emerald-600' :
                    doctor?.verification_status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {t('verificationdetail_estado_actual')}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                    {doctor?.verification_status === 'verified' ? t('verificationdetail_aprobado_y_verificado_oficialmente') :
                     doctor?.verification_status === 'rejected' ? t('status_rejected') : t('verificationdetail_pendiente_de_revision')}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t('verificationdetail_resolucion_administrativa_vigente_en')}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5. BARRA DE ACCIÓN FLOTANTE INFERIOR (MODERN ACTION DOCK) */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-8 max-w-5xl mx-auto z-40">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3.5">
          
          {/* Lado Izquierdo: Volver & Contexto */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft size={15} className={isRtl ? 'rotate-180' : ''} />
              <span>{t('return_home', 'Volver')}</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {t('verificationdetail_auditando_a')} <strong className="text-slate-700">{cleanDoctorName(doctor)}</strong>
            </span>
          </div>

          {/* Lado Derecho: Acciones de Resolución Colegial */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleUpdateStatus('rejected')}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              title={t('verificationdetail_rechazar_solicitud')}
            >
              <XCircle size={15} />
              <span>{t('mark_as_rejected', 'Rechazar')}</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('pending')}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              title={t('mark_as_pending')}
            >
              <Clock size={15} />
              <span>{t('mark_as_pending', 'Pendiente')}</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('verified')}
              disabled={updating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-5 py-2 text-xs font-black text-white shadow-md shadow-teal-600/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {updating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} className="text-emerald-200" />
              )}
              <span>{t('approve_doctor', 'Aprobar y Certificar')}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}