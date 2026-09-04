import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, ShieldCheck, MapPin, Calendar, Clock, 
  MessageCircle, Stethoscope, CheckCircle, Sparkles, 
  ChevronRight, Phone, Award, Globe, UserCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_SPECIALISTS = [
  {
    id: 101,
    user_id: 'doc-dr-carlos-mendoza',
    full_name: 'Dr. Carlos Mendoza',
    specialty: 'Cardiología',
    city: 'Madrid, España',
    location: 'Centro Médico Sanitas / Consulta Online',
    experience_years: 12,
    languages: 'Español, Inglés',
    bio: 'Cardiólogo clínico especializado en prevención cardiovascular, hipertensión y arritmias.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Lun, Mié, Vie', horario: '10:00 - 18:00' }
  },
  {
    id: 102,
    user_id: 'doc-dra-elena-rodriguez',
    full_name: 'Dra. Elena Rodríguez',
    specialty: 'Medicina General',
    city: 'Barcelona, España',
    location: 'Clínica Quirón / Telemedicina',
    experience_years: 9,
    languages: 'Español, Francés',
    bio: 'Médica de familia con enfoque en diagnóstico integral, seguimiento crónico y prevención.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1594824813629-9e793ac3d3e6?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Lun - Sáb', horario: '08:30 - 16:30' }
  },
  {
    id: 103,
    user_id: 'doc-dr-javier-torres',
    full_name: 'Dr. Javier Torres',
    specialty: 'Traumatología',
    city: 'Valencia, España',
    location: 'Hospital Universitario / Consulta Privada',
    experience_years: 15,
    languages: 'Español, Inglés',
    bio: 'Especialista en lesiones articulares, columna vertebral y rehabilitación física.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Mar, Jue', horario: '11:00 - 19:00' }
  },
  {
    id: 104,
    user_id: 'doc-dra-sofia-valencia',
    full_name: 'Dra. Sofía Valencia',
    specialty: 'Dermatología',
    city: 'Sevilla, España',
    location: 'Instituto Dermatológico Avanzado',
    experience_years: 8,
    languages: 'Español, Inglés',
    bio: 'Especialista en salud de la piel, control de lunares, alergias cutáneas y tratamientos estéticos médicos.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Lunes a Viernes', horario: '09:00 - 17:00' }
  },
  {
    id: 105,
    user_id: 'doc-dr-mateo-herrera',
    full_name: 'Dr. Mateo Herrera',
    specialty: 'Neurología',
    city: 'Bilbao, España',
    location: 'Hospital Clínico / Consulta Online',
    experience_years: 14,
    languages: 'Español, Inglés, Euskera',
    bio: 'Neurólogo especialista en cefaleas, migrañas complejas, trastornos del sueño y neurorehabilitación.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Lun, Mié, Jue', horario: '09:30 - 15:30' }
  },
  {
    id: 106,
    user_id: 'doc-dra-lucia-martinez',
    full_name: 'Dra. Lucía Martínez',
    specialty: 'Pediatría',
    city: 'Málaga, España',
    location: 'Policlínica Materno-Infantil',
    experience_years: 11,
    languages: 'Español, Francés',
    bio: 'Atención pediátrica integral, desarrollo infantil, nutrición y vacunación.',
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
    availability_schedule: { dias: 'Lun - Vie', horario: '10:00 - 19:00' }
  }
];

const SPECIALTIES_LIST = [
  'Todos',
  'Medicina General',
  'Cardiología',
  'Traumatología',
  'Dermatología',
  'Neurología',
  'Pediatría',
  'Ginecología',
  'Oftalmología',
  'Psiquiatría'
];

export default function DoctorDirectoryModal({
  isOpen,
  onClose,
  recommendedSpecialty = '',
  apiUrl = '',
  patientName = '',
  triageReport = ''
}) {
  const { t, language } = useLanguage();
  const [specialists, setSpecialists] = useState(DEFAULT_SPECIALISTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingShift, setBookingShift] = useState('morning');
  const [bookingType, setBookingType] = useState('online');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Inicializar especialidad cuando se abre con una recomendada
  useEffect(() => {
    if (recommendedSpecialty) {
      // Buscar coincidencia cercana
      const match = SPECIALTIES_LIST.find(s => 
        s.toLowerCase().includes(recommendedSpecialty.toLowerCase()) ||
        recommendedSpecialty.toLowerCase().includes(s.toLowerCase())
      );
      if (match) {
        setSelectedSpecialty(match);
      } else {
        setSelectedSpecialty(recommendedSpecialty);
      }
    } else {
      setSelectedSpecialty('Todos');
    }
  }, [recommendedSpecialty, isOpen]);

  // Cargar especialistas reales de la base de datos
  useEffect(() => {
    if (!isOpen) return;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const base = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        const res = await fetch(`${base}/api/specialists`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSpecialists(data);
          }
        }
      } catch (err) {
        console.warn('Usando directorio de especialistas local de respaldo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [isOpen, apiUrl]);

  // Filtrado reactivo
  const filteredSpecialists = useMemo(() => {
    return specialists.filter(doc => {
      const matchSpecialty = selectedSpecialty === 'Todos' || 
        doc.specialty?.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
        selectedSpecialty.toLowerCase().includes(doc.specialty?.toLowerCase());

      const query = searchTerm.toLowerCase().trim();
      if (!query) return matchSpecialty;

      const matchSearch = 
        doc.full_name?.toLowerCase().includes(query) ||
        doc.specialty?.toLowerCase().includes(query) ||
        doc.location?.toLowerCase().includes(query) ||
        doc.city?.toLowerCase().includes(query) ||
        doc.bio?.toLowerCase().includes(query) ||
        doc.languages?.toLowerCase().includes(query);

      return matchSpecialty && matchSearch;
    });
  }, [specialists, selectedSpecialty, searchTerm]);

  if (!isOpen) return null;

  const handleWhatsApp = (doctor) => {
    const patientIntro = patientName ? `Mi nombre es ${patientName}.` : 'Soy usuario de la plataforma VitalAI.';
    const triageContext = recommendedSpecialty 
      ? `Acabo de realizar un triaje médico digital donde se me orientó consultar con un especialista en *${doctor.specialty}*.`
      : `Le contacto porque me gustaría agendar una consulta médica en su especialidad (*${doctor.specialty}*).`;

    const text = `Hola ${doctor.full_name}, ${patientIntro}\n\n${triageContext}\n\n¿Tendría disponibilidad para una consulta presencial u online?\n\nMuchas gracias por su atención.`;
    
    // Abrir enlace oficial de WhatsApp
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingDoctor) return;

    setBookingSuccess({
      doctor: bookingDoctor,
      date: bookingDate || 'Próxima fecha disponible',
      shift: bookingShift === 'morning' ? 'Turno Mañana (09:00 - 13:00)' : 'Turno Tarde (14:00 - 19:00)',
      type: bookingType === 'online' ? 'Videoconsulta Online' : 'Consulta Presencial'
    });
    setBookingDoctor(null);
    setBookingNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shadow-sm">
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">
                  Directorio de Especialistas
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={12} /> Verificados
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Conéctate al instante con médicos especialistas colegiados y certificados
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner Recomendación de Triaje (si aplica) */}
        {recommendedSpecialty && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 px-6 py-3 border-b border-purple-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-purple text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-brand-purple">Especialidad Recomendada por Triaje: </span>
                <span className="font-semibold text-slate-700">{recommendedSpecialty}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedSpecialty(recommendedSpecialty)}
              className="text-[11px] font-bold text-brand-purple hover:underline flex-shrink-0"
            >
              Filtrar recomendados
            </button>
          </div>
        )}

        {/* Buscador y Filtros */}
        <div className="p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, especialidad, ciudad o clínica..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 rounded-xl text-sm text-slate-800 transition-all outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Chips de Especialidades */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {SPECIALTIES_LIST.map((spec) => {
              const isSelected = selectedSpecialty.toLowerCase() === spec.toLowerCase();
              const isRecommended = recommendedSpecialty && spec.toLowerCase().includes(recommendedSpecialty.toLowerCase());
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                    isSelected 
                      ? 'bg-brand-purple text-white shadow-sm shadow-purple-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  } ${isRecommended && !isSelected ? 'ring-2 ring-purple-300' : ''}`}
                >
                  {spec}
                  {isRecommended && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notificación de Reserva Exitosa */}
        {bookingSuccess && (
          <div className="m-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  ¡Solicitud de Cita Confirmada!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Hemos enviado tu solicitud al consultorio de <strong>{bookingSuccess.doctor.full_name}</strong> ({bookingSuccess.doctor.specialty}).
                </p>
                <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-white/80 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-2 border border-emerald-200">
                  <span>📅 {bookingSuccess.date}</span>
                  <span>•</span>
                  <span>⏰ {bookingSuccess.shift}</span>
                  <span>•</span>
                  <span>📍 {bookingSuccess.type}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setBookingSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Lista de Médicos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredSpecialists.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <Stethoscope size={48} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No encontramos especialistas con ese criterio</p>
              <p className="text-xs text-slate-400 mt-1">Intenta buscar con otra especialidad o eliminar los filtros</p>
              <button 
                onClick={() => { setSelectedSpecialty('Todos'); setSearchTerm(''); }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Ver todos los médicos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSpecialists.map((doc) => (
                <div 
                  key={doc.id || doc.user_id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-brand-purple/40 hover:shadow-lg transition-all p-4 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Tarjeta */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <img 
                          src={doc.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.full_name}`} 
                          alt={doc.full_name} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${doc.full_name}`;
                          }}
                        />
                        {doc.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs" title="Verificado">
                            <ShieldCheck size={12} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-brand-purple transition-colors">
                            {doc.full_name}
                          </h3>
                        </div>

                        <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-md text-[11px] font-bold bg-brand-purple/10 text-brand-purple">
                          {doc.specialty}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Award size={13} className="text-amber-500" />
                            {doc.experience_years} años exp.
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={13} className="text-slate-400" />
                            {doc.city || doc.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Biografía */}
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>

                    {/* Idiomas y Horarios */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <Globe size={12} className="text-slate-400" />
                        {doc.languages || 'Español'}
                      </span>
                      {doc.availability_schedule && (
                        <span className="flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                          <Clock size={11} className="text-slate-400" />
                          {typeof doc.availability_schedule === 'object' 
                            ? `${doc.availability_schedule.dias || 'Lun-Vie'}`
                            : String(doc.availability_schedule)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Contacto */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWhatsApp(doc)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200 transition-all cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setBookingDoctor(doc)}
                      className="w-full py-2 px-3 rounded-xl bg-brand-purple hover:bg-brand-purple/90 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-purple-200 transition-all cursor-pointer"
                    >
                      <Calendar size={15} />
                      <span>Solicitar Cita</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Sub-capa: Solicitar Cita */}
        {bookingDoctor && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 animate-scaleUp">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Solicitar Cita Médica</h3>
                    <p className="text-xs text-slate-500">{bookingDoctor.full_name} ({bookingDoctor.specialty})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBookingDoctor(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha deseada
                  </label>
                  <input 
                    type="date"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turno de preferencia
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingShift('morning')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        bookingShift === 'morning'
                          ? 'border-brand-purple bg-purple-50 text-brand-purple'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Clock size={13} />
                      Mañana (09:00 - 13:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingShift('afternoon')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        bookingShift === 'afternoon'
                          ? 'border-brand-purple bg-purple-50 text-brand-purple'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Clock size={13} />
                      Tarde (14:00 - 19:00)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidad de consulta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingType('online')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        bookingType === 'online'
                          ? 'border-brand-purple bg-purple-50 text-brand-purple'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      💻 Videoconsulta
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('in_person')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        bookingType === 'in_person'
                          ? 'border-brand-purple bg-purple-50 text-brand-purple'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🏥 Presencial
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo o notas para el especialista (opcional)
                  </label>
                  <textarea 
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    rows={2}
                    placeholder="Describe brevemente tus síntomas o si cuentas con análisis previos..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-brand-purple text-white font-bold text-xs hover:bg-brand-purple/90 shadow-md shadow-purple-200"
                  >
                    Confirmar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredSpecialists.length} especialistas encontrados</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
          >
            Cerrar Directorio
          </button>
        </div>
      </div>
    </div>
  );
}
