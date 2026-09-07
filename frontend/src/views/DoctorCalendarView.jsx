import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, Phone, Video, 
  MapPin, CheckCircle2, AlertCircle, AlertTriangle, ChevronLeft, 
  ChevronRight, Plus, Search, Filter, Stethoscope, ArrowLeft,
  MessageCircle, ExternalLink, RefreshCw, Eye
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function DoctorCalendarView({ 
  onNavigate, 
  onSelectPatient, 
  apiUrl, 
  authHeaders,
  doctorProfile 
}) {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDayFilter, setActiveDayFilter] = useState('today'); // 'today', 'tomorrow', 'week', 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'presencial', 'teleconsulta'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'confirmada', 'en_espera', 'completada'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal para nueva cita
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [newType, setNewType] = useState('presencial');
  const [newReason, setNewReason] = useState('');
  const [newTriage, setNewTriage] = useState('Verde');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fechas de referencia
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/doctor/appointments`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error("Error al cargar citas:", err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Actualizar estado de una cita
  const handleUpdateStatus = async (appointmentId, nextStatus) => {
    try {
      const res = await fetch(`${apiUrl}/api/doctor/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: nextStatus } : a));
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  // Crear nueva cita
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newReason.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/doctor/appointments`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: `patient-${Date.now()}`,
          patient_name: newPatientName.trim(),
          appointment_date: newDate,
          appointment_time: newTime,
          duration_minutes: 30,
          reason: newReason.trim(),
          appointment_type: newType,
          status: 'confirmada',
          triage_category: newTriage
        })
      });

      if (res.ok) {
        setShowNewModal(false);
        setNewPatientName('');
        setNewReason('');
        await fetchAppointments();
      }
    } catch (err) {
      console.error("Error creando cita:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de citas
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Filtro por fecha
      if (activeDayFilter === 'today' && a.appointment_date !== todayStr) return false;
      if (activeDayFilter === 'tomorrow' && a.appointment_date !== tomorrowStr) return false;
      
      // Filtro por modalidad
      if (typeFilter !== 'all' && a.appointment_type !== typeFilter) return false;

      // Filtro por estado
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;

      // Filtro por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = a.patient_name?.toLowerCase().includes(query);
        const matchReason = a.reason?.toLowerCase().includes(query);
        if (!matchName && !matchReason) return false;
      }

      return true;
    });
  }, [appointments, activeDayFilter, typeFilter, statusFilter, searchQuery, todayStr, tomorrowStr]);

  // Contadores de estadísticas
  const stats = useMemo(() => {
    const todayAppts = appointments.filter(a => a.appointment_date === todayStr);
    return {
      totalToday: todayAppts.length,
      waiting: todayAppts.filter(a => a.status === 'en_espera').length,
      telemed: todayAppts.filter(a => a.appointment_type === 'teleconsulta').length,
      completed: todayAppts.filter(a => a.status === 'completada').length
    };
  }, [appointments, todayStr]);

  // Render badge de triaje
  const renderTriageBadge = (category) => {
    const cat = (category || 'verde').toLowerCase();
    if (cat.includes('rojo') || cat.includes('emergencia')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={12} className="text-rose-600" />
          Rojo (Urgente)
        </span>
      );
    }
    if (cat.includes('amarillo') || cat.includes('urgencia')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle size={12} className="text-amber-600" />
          Amarillo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} className="text-emerald-600" />
        Verde
      </span>
    );
  };

  // Render selector de estado
  const renderStatusButton = (appt) => {
    const nextStates = {
      'confirmada': 'en_espera',
      'en_espera': 'completada',
      'completada': 'confirmada',
      'cancelada': 'confirmada'
    };

    const statusConfig = {
      'confirmada': { label: 'Confirmada', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      'en_espera': { label: 'En Sala de Espera', bg: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' },
      'completada': { label: 'Completada', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      'cancelada': { label: 'Cancelada', bg: 'bg-gray-100 text-gray-600 border-gray-200' }
    };

    const current = statusConfig[appt.status] || statusConfig['confirmada'];

    return (
      <button
        type="button"
        onClick={() => handleUpdateStatus(appt.id, nextStates[appt.status] || 'confirmada')}
        title="Toca para cambiar estado"
        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-xs ${current.bg}`}
      >
        {current.label}
      </button>
    );
  };

  return (
    <div className="flex-1 w-full relative min-h-screen pb-28 font-sans bg-slate-50">
      
      {/* HEADER PRINCIPAL */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              title="Volver al Inicio"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <CalendarIcon size={19} className="text-teal-600" />
                <span>Mi Agenda Médica</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-500">
                {doctorProfile?.full_name || 'Dr. Alejandro Ruiz'} · MIVOR.ai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAppointments()}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-teal-50 text-gray-600 hover:text-teal-700 flex items-center justify-center transition-colors"
              title="Actualizar agenda"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        
        {/* TARJETAS DE ESTADÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-800 leading-none">{stats.totalToday}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">Citas Hoy</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-800 leading-none">{stats.waiting}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">En Sala</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Video size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-800 leading-none">{stats.telemed}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">Teleconsulta</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-800 leading-none">{stats.completed}</div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">Atendidos</div>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-xs space-y-3">
          
          {/* Selector de días */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveDayFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${activeDayFilter === 'today' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Hoy ({appointments.filter(a => a.appointment_date === todayStr).length})
            </button>
            <button
              onClick={() => setActiveDayFilter('tomorrow')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${activeDayFilter === 'tomorrow' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Mañana ({appointments.filter(a => a.appointment_date === tomorrowStr).length})
            </button>
            <button
              onClick={() => setActiveDayFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${activeDayFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todas ({appointments.length})
            </button>
          </div>

          {/* Filtros secundarios y buscador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-gray-100">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente o motivo..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">Modalidad: Todas</option>
                <option value="presencial">Presencial</option>
                <option value="teleconsulta">Teleconsulta</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value="all">Estado: Todos</option>
                <option value="confirmada">Confirmada</option>
                <option value="en_espera">En Sala de Espera</option>
                <option value="completada">Completada</option>
              </select>
            </div>
          </div>

        </div>

        {/* LISTADO DE CITAS */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="animate-spin mx-auto mb-2 text-teal-600" size={24} />
              <p className="text-xs font-medium">Cargando agenda de citas...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-soft">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <CalendarIcon size={26} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">No hay citas en este filtro</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Puedes cambiar el filtro de fecha o agregar una nueva cita a tu agenda.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={15} />
                <span>Agendar Cita Ahora</span>
              </button>
            </div>
          ) : (
            filteredAppointments.map((appt) => {
              const isTelemed = appt.appointment_type === 'teleconsulta';
              return (
                <div 
                  key={appt.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-soft hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Bloque Izquierdo: Horario y Paciente */}
                  <div className="flex items-start gap-3.5">
                    
                    {/* Horario */}
                    <div className="w-16 shrink-0 text-center py-2 px-1 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center">
                      <Clock size={14} className="text-slate-400 mb-0.5" />
                      <span className="text-xs font-black text-slate-800">{appt.appointment_time}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{appt.duration_minutes || 30}m</span>
                    </div>

                    {/* Info Paciente */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{appt.patient_name}</span>
                        {renderTriageBadge(appt.triage_category)}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isTelemed ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'}`}>
                          {isTelemed ? <Video size={10} /> : <MapPin size={10} />}
                          {isTelemed ? 'Teleconsulta' : 'Presencial'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        <span className="font-semibold text-slate-700">Motivo:</span> {appt.reason}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        {appt.patient_age && <span>{appt.patient_age} años</span>}
                        {appt.patient_gender && <span>· {appt.patient_gender}</span>}
                        {appt.blood_type && <span className="text-rose-600 font-bold">· {appt.blood_type}</span>}
                        <span>· Fecha: {appt.appointment_date}</span>
                      </div>
                    </div>

                  </div>

                  {/* Bloque Derecho: Acciones y Estado */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    
                    {/* Estado clickeable */}
                    {renderStatusButton(appt)}

                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => {
                        const msg = encodeURIComponent(`Estimado(a) ${appt.patient_name}, le recordamos su cita médica en MIVOR.ai el día ${appt.appointment_date} a las ${appt.appointment_time} (${appt.appointment_type}). Le esperamos puntualmente.`);
                        window.open(`https://wa.me/?text=${msg}`, '_blank');
                      }}
                      className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </button>

                    {/* Botón Ver Expediente Clínico */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPatient) {
                          onSelectPatient({
                            user_id: appt.patient_id,
                            full_name: appt.patient_name
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                    >
                      <Eye size={13} />
                      <span>Expediente</span>
                    </button>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL NUEVA CITA */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CalendarIcon size={18} className="text-teal-600" />
                <span>Agendar Nueva Cita</span>
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Paciente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Delgado Morales"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="teleconsulta">Teleconsulta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad Triaje</label>
                  <select
                    value={newTriage}
                    onChange={(e) => setNewTriage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                  >
                    <option value="Verde">Verde (Normal)</option>
                    <option value="Amarillo">Amarillo (Urgente)</option>
                    <option value="Rojo">Rojo (Emergencia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo Clínico</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej. Revisión post-analítica de glucemia y control de tensión arterial..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/30 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR PARA DOCTOR */}
      <BottomNav 
        activeTab="agenda" 
        onTabChange={(tab) => {
          if (tab === 'home') onNavigate('home');
          else if (tab === 'patients') onNavigate('patients');
          else if (tab === 'ai') onNavigate('copilot');
          else if (tab === 'more') onNavigate('more');
        }} 
        isDoctor={true} 
      />

    </div>
  );
}
