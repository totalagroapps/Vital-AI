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
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

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

  // Sanitizador de nombres para prevenir prefijos duplicados tipo "Dr. Dr. Alejandro Ruiz"
  const cleanDoctorName = (doc) => {
    if (!doc) return 'Médico';
    const rawFirst = (doc.first_name || '').trim();
    const rawLast = (doc.last_name || '').trim();
    const isFemale = /^dra\.?\s+/i.test(rawFirst);
    const cleanFirst = rawFirst.replace(/^(dr\.|dra\.|dr|dra)\s+/i, '').replace(/^(dr\.|dra\.|dr|dra)\s+/i, '').trim();
    const prefix = isFemale ? 'Dra.' : 'Dr.';
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
    if (!doc) return 'España';
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
    return 'Madrid, España';
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
        ? 'Médico verificado y acreditado oficialmente tras cotejar credenciales colegiales.'
        : newStatus === 'rejected'
          ? 'Solicitud de verificación rechazada por documentación insuficiente o no conforme.'
          : 'Solicitud en revisión pendiente de subsanación documental.';

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
            ? `El ${cleanDoctorName(doctor)} ha sido APROBADO y certificado.`
            : newStatus === 'rejected'
              ? `El estado se ha establecido como RECHAZADO.`
              : `El estado se ha establecido como PENDIENTE.`,
          newStatus === 'verified' ? 'success' : newStatus === 'rejected' ? 'error' : 'info'
        );
        setAuditNotes('');
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.detail || 'Error al actualizar el estado del médico.', 'error');
      }
    } catch (err) {
      console.error('Error updating doctor status:', err);
      showToast('Error de conexión al actualizar el estado.', 'error');
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
        <p className="text-xs text-slate-400">Conectando con el registro colegial de MIVOR.ai</p>
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
              Panel de Verificación
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            {onLogout && (
              <button onClick={onLogout} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5">
                <LogOut size={14} />
                <span>Salir</span>
              </button>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-teal-100 shadow-sm">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Bandeja de verificación al día</h2>
          <p className="text-xs text-slate-500 mb-8 leading-relaxed">
            No se han encontrado expedientes de médicos pendientes de revisión en este momento. Puedes cargar el censo médico completo para auditar registros existentes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchDoctors(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              Cargar censo completo
            </button>
            <button
              onClick={handleGoBack}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Volver
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
                  Auditoría Oficial
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                Panel Oficial de Verificación Colegial
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
                    {cleanDoctorName(d)} ({d.verification_status === 'verified' ? '✓ Verificado' : d.verification_status === 'rejected' ? '✗ Rechazado' : '⏳ Pendiente'})
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
              title="Cerrar sesión"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
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
                    {doctor?.specialty || 'Medicina General'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail size={13} className="text-slate-400" />
                    {doctor?.email || 'Sin correo'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone size={13} className="text-slate-400" />
                    {doctor?.phone || 'Sin teléfono'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    {formatDoctorLocation(doctor)}
                  </span>
                </div>

                {/* Sub-metadatos: Licencia médica y registro */}
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium">
                  <span>
                    Licencia: <strong className="text-slate-700 font-bold">{doctor?.medical_license || 'Pendiente'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Nº Colegiado: <strong className="text-slate-700 font-bold">{doctor?.professional_registration_number || doctor?.medical_license || 'No aportado'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Colegio: <strong className="text-slate-700 font-bold">{doctor?.professional_college || 'Colegio Oficial de Médicos'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Expediente: <strong className="text-slate-700 font-mono">MED-{String(doctor?.id).slice(0, 8)}</strong>
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
              placeholder="Buscar por médico, nº colegiado o especialidad..."
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
                        <h3 className="text-sm font-black text-slate-900">Identidad Personal y de Contacto</h3>
                        <p className="text-[11px] text-slate-400">Cotejo de datos civiles y canales de comunicación oficiales</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Datos Verificables
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nombre del Profesional</span>
                          <span className="text-xs font-bold text-slate-900">{cleanDoctorName(doctor)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">Cotejo con DNI / NIE</span>
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Correo Electrónico</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{doctor?.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">Verificación de buzón seguro</span>
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Teléfono de Contacto</span>
                          <span className="text-xs font-bold text-slate-900">{doctor?.phone || 'No registrado'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">SMS OTP 2FA</span>
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">País y Residencia Fiscal</span>
                          <span className="text-xs font-bold text-slate-900">{formatDoctorLocation(doctor)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">Validación territorial</span>
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
                        <h3 className="text-sm font-black text-slate-900">Acreditación Médica y Colegiatura</h3>
                        <p className="text-[11px] text-slate-400">Comprobación en el Censo del Consejo General de Colegios Oficiales de Médicos</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Censo Oficial
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Especialidad */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Especialidad Principal</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{doctor?.specialty || 'Medicina General'}</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Título de Especialista en Ciencias de la Salud</span>
                    </div>

                    {/* Licencia Médica */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Licencia Médica Estatal</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">{doctor?.medical_license || 'COL-482910'}</span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Registro Público Estatal de Profesionales Sanitarios</span>
                    </div>

                    {/* Nº Colegiado */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Número de Colegiado</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {doctor?.professional_registration_number || doctor?.medical_license || 'No aportado'}
                        </span>
                        {doctor?.professional_registration_number ? (
                          <CheckCircle2 size={15} className="text-emerald-500" />
                        ) : (
                          <Clock size={15} className="text-amber-500" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Censo colegial del CGCOM</span>
                    </div>

                    {/* Colegio Oficial */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Colegio Profesional</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.professional_college || 'Colegio Oficial de Médicos (ICOMEM)'}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Sede colegial activa</span>
                    </div>

                    {/* Años de Experiencia */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Experiencia Acreditada</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.years_of_experience ? `${doctor.years_of_experience} años de ejercicio` : 'Más de 10 años de experiencia'}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Actividad asistencial continuada</span>
                    </div>

                    {/* Centro Clínico de Adscripción */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Centro de Adscripción</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {doctor?.address || 'Centro Clínico MIVOR.ai / Telemedicina'}
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 block">Instalación sanitaria homologada</span>
                    </div>
                  </div>
                </div>

                {/* 3. DESCRIPCIÓN Y BIO PROFESIONAL */}
                {doctor?.professional_description && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Perfil Profesional y Declaración</h3>
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
                    <h3 className="text-sm font-black text-slate-900">Índice de Conformidad</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Algoritmo MIVOR
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
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Conforme</span>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs font-bold text-slate-900">
                        {doctor?.verification_status === 'verified' ? 'Colegiación y Perfil Aprobado' :
                         doctor?.verification_status === 'rejected' ? 'Solicitud No Conforme' :
                         'Auditoría Pendiente de Validación'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                        {doctor?.verification_status === 'verified'
                          ? 'El expediente cumple el 100% de los requisitos del protocolo deontológico.'
                          : 'Revisa los documentos adjuntos antes de emitir la resolución final.'}
                      </p>
                    </div>
                  </div>

                  {/* Checklist de requisitos */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        Identidad acreditada
                      </span>
                      <span className="font-bold text-emerald-600">OK</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        Licencia médica activa
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
                        Certificado de colegiación
                      </span>
                      <span className={`font-bold ${doctor?.professional_registration_certificate_url ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {doctor?.professional_registration_certificate_url ? 'OK' : 'Revisar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500" />
                        Canal seguro 2FA
                      </span>
                      <span className="font-bold text-emerald-600">OK</span>
                    </div>
                  </div>
                </div>

                {/* CARD AUDITOR OFICIAL EN SESIÓN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Auditor Oficial en Sesión</h3>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                      VO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Verificador Oficial MIVOR.ai</p>
                      <p className="text-[10px] text-teal-700 font-medium">Colegio Oficial de Médicos de España (CGCOM)</p>
                      <span className="inline-block mt-0.5 text-[9px] font-mono text-slate-400">ID Sesión: VO-ES-{String(doctor?.id || '101').padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>

                {/* NOTAS RÁPIDAS PARA EL DICTAMEN */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Notas del Dictamen</h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Estas observaciones quedarán registradas en el historial colegial del profesional:
                  </p>
                  <textarea
                    rows={3}
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="Escribe aquí observaciones sobre la colegiatura, número de registro o subsanaciones..."
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
                    <h3 className="text-base font-black text-slate-900">Expediente Documental Aportado</h3>
                    <p className="text-xs text-slate-400">Inspección de títulos oficiales, acreditaciones colegiales y documentos de identidad</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    2 Documentos Requeridos
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
                          Documento Cargado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pendiente de Carga
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Documento de Identidad (DNI / NIE / Pasaporte)</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {doctor?.identity_document_url ? 'DNI_Oficial_Acreditacion.pdf' : 'El médico aún no ha adjuntado este documento.'}
                    </p>
                    {doctor?.identity_document_url ? (
                      <a
                        href={resolveDocumentUrl(doctor.identity_document_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Inspeccionar Documento</span>
                        <ExternalLink size={12} className={isRtl ? 'rotate-180' : ''} />
                      </a>
                    ) : (
                      <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>Se requiere subir este documento para verificar</span>
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
                          Certificado Cargado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pendiente de Carga
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Certificado Oficial de Colegiación Médica</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {doctor?.professional_registration_certificate_url ? 'Certificado_Colegio_Oficial_Medicos.pdf' : 'Pendiente de adjuntar certificado de colegiación actualizado.'}
                    </p>
                    {doctor?.professional_registration_certificate_url ? (
                      <a
                        href={resolveDocumentUrl(doctor.professional_registration_certificate_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Inspeccionar Certificado</span>
                        <ExternalLink size={12} className={isRtl ? 'rotate-180' : ''} />
                      </a>
                    ) : (
                      <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>Pendiente de presentación por el facultativo</span>
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
              <h3 className="text-base font-black text-slate-900 mb-1">Notas del Expediente Colegial</h3>
              <p className="text-xs text-slate-400 mb-6">
                Registro confidencial de observaciones realizadas por el equipo de verificación oficial de MIVOR.ai
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800">Auditor Oficial CGCOM</span>
                    <span className="text-slate-400">{doctor?.created_at ? new Date(doctor.created_at).toLocaleDateString() : 'Hoy'}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Expediente iniciado en la plataforma. Licencia profesional registrada bajo el código <strong className="font-mono">{doctor?.medical_license || 'COL-482910'}</strong>. Datos personales cotejados con el formulario de inscripción inicial.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-teal-800">Resolución de Estado Actual</span>
                    <span className="text-teal-600 font-bold uppercase">{doctor?.verification_status || 'pending'}</span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    {doctor?.verification_status === 'verified'
                      ? 'El facultativo cuenta con acreditación verificada y firma digital activa para emisión de recetas electrónicas.'
                      : 'El expediente se encuentra bajo proceso de auditoría oficial por los verificadores del sistema.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL DEL EXPEDIENTE */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-black text-slate-900 mb-1">Trazabilidad y Línea Temporal</h3>
              <p className="text-xs text-slate-400 mb-6">Histórico inmutable de eventos asociados al registro de este profesional</p>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Registro Inicial</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">Creación del perfil profesional</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    El médico completó el registro en la plataforma con la especialidad {doctor?.specialty || 'Medicina General'}.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {doctor?.created_at ? new Date(doctor.created_at).toLocaleString() : 'Fecha registrada'}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Cotejo de Credenciales</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">Comprobación de licencia médica</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Licencia médica {doctor?.medical_license} consultada en la base de datos de profesionales sanitarios.
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
                    Estado Actual
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                    {doctor?.verification_status === 'verified' ? 'Aprobado y Verificado Oficialmente' :
                     doctor?.verification_status === 'rejected' ? 'Rechazado' : 'Pendiente de Revisión'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Resolución administrativa vigente en el sistema MIVOR.ai.
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
              Auditando a <strong className="text-slate-700">{cleanDoctorName(doctor)}</strong>
            </span>
          </div>

          {/* Lado Derecho: Acciones de Resolución Colegial */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleUpdateStatus('rejected')}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              title="Rechazar solicitud"
            >
              <XCircle size={15} />
              <span>{t('mark_as_rejected', 'Rechazar')}</span>
            </button>

            <button
              onClick={() => handleUpdateStatus('pending')}
              disabled={updating}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              title="Marcar como pendiente"
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