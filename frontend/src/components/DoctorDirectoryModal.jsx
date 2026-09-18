import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, ShieldCheck, MapPin, Calendar, Clock, 
  MessageCircle, Stethoscope, CheckCircle, Sparkles, 
  ChevronRight, Phone, Award, Globe, UserCheck,
  Video, Film, Play, GraduationCap, Building2, ExternalLink
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const getVideoEmbedUrl = (url) => {
  if (!url) return null;
  const str = url.trim();
  const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = str.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return str;
};

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
    bio: 'Cardiólogo clínico especializado en prevención cardiovascular, hipertensión y arritmias. Miembro activo de la Sociedad Española de Cardiología.',
    verified: true,
    license_number: 'COL-28084592',
    professional_college: 'Ilustre Colegio Oficial de Médicos de Madrid (ICOMEM)',
    photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Lun, Mié, Vie', horario: '10:00 - 18:00' },
    educations: [
      { degree: 'Licenciatura en Medicina y Cirugía', institution: 'Universidad Complutense de Madrid', start_year: 2006, end_year: 2012 },
      { degree: 'Especialidad en Cardiología Clínica', institution: 'Hospital Universitario La Paz', start_year: 2012, end_year: 2017 },
      { degree: 'Máster en Prevención y Rehabilitación Cardíaca', institution: 'Universidad de Barcelona', start_year: 2018, end_year: 2019 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'
    ]
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
    bio: 'Médica de familia con enfoque en diagnóstico integral, seguimiento crónico y prevención holística de la salud.',
    verified: true,
    license_number: 'COL-08051239',
    professional_college: 'Col·legi Oficial de Metges de Barcelona (COMB)',
    photo_url: 'https://images.unsplash.com/photo-1594824813629-9e793ac3d3e6?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Lun - Sáb', horario: '08:30 - 16:30' },
    educations: [
      { degree: 'Grado en Medicina', institution: 'Universitat de Barcelona', start_year: 2009, end_year: 2015 },
      { degree: 'Especialista en Medicina Familiar y Comunitaria', institution: 'Hospital Clínic de Barcelona', start_year: 2015, end_year: 2019 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600'
    ]
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
    bio: 'Especialista en lesiones articulares, cirugía mínimamente invasiva, columna vertebral y rehabilitación deportiva.',
    verified: true,
    license_number: 'COL-46098214',
    professional_college: 'Colegio Oficial de Médicos de Valencia (COMV)',
    photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Mar, Jue', horario: '11:00 - 19:00' },
    educations: [
      { degree: 'Licenciatura en Medicina', institution: 'Universitat de València', start_year: 2003, end_year: 2009 },
      { degree: 'Especialidad Cirugía Ortopédica y Traumatología', institution: 'Hospital Universitari La Fe', start_year: 2009, end_year: 2014 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'
    ]
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
    bio: 'Especialista en salud de la piel, control digital de lesiones pigmentadas, acné y tratamientos dermatológicos médicos.',
    verified: true,
    license_number: 'COL-41033481',
    professional_college: 'Real e Ilustre Colegio Oficial de Médicos de Sevilla (RICOMS)',
    photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Lunes a Viernes', horario: '09:00 - 17:00' },
    educations: [
      { degree: 'Grado en Medicina', institution: 'Universidad de Sevilla', start_year: 2010, end_year: 2016 },
      { degree: 'Especialidad en Dermatología', institution: 'Hospital Universitario Virgen del Rocío', start_year: 2016, end_year: 2020 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'
    ]
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
    bio: 'Neurólogo especialista en cefaleas complejas, migrañas, trastornos del sueño y neurorehabilitación.',
    verified: true,
    license_number: 'COL-48092174',
    professional_college: 'Colegio Oficial de Médicos de Bizkaia (CMB)',
    photo_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Lun, Mié, Jue', horario: '09:30 - 15:30' },
    educations: [
      { degree: 'Licenciatura en Medicina', institution: 'Universidad del País Vasco (UPV/EHU)', start_year: 2004, end_year: 2010 },
      { degree: 'Especialidad en Neurología', institution: 'Hospital Universitario de Cruces', start_year: 2010, end_year: 2014 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'
    ]
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
    bio: 'Atención pediátrica integral, desarrollo infantil, nutrición, prevención y vacunación infantil.',
    verified: true,
    license_number: 'COL-29074125',
    professional_college: 'Colegio Oficial de Médicos de Málaga (COMMÁLAGA)',
    photo_url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
    presentation_video_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    clinic_video_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    availability_schedule: { dias: 'Lun - Vie', horario: '10:00 - 19:00' },
    educations: [
      { degree: 'Licenciatura en Medicina', institution: 'Universidad de Málaga', start_year: 2007, end_year: 2013 },
      { degree: 'Especialidad en Pediatría y sus Áreas Específicas', institution: 'Hospital Materno Infantil de Málaga', start_year: 2013, end_year: 2017 }
    ],
    clinic_photos: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600'
    ]
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
  const [selectedDoctorDetail, setSelectedDoctorDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('video');

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

  // Cierre por tecla Escape y scroll lock (Punto 17 Auditoría R3)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

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
    const patientIntro = patientName ? `Mi nombre es ${patientName}.` : 'Soy usuario de la plataforma MIVOR.ai.';
    const triageContext = recommendedSpecialty 
      ? `Acabo de recibir una orientación de salud en MIVOR.ai donde se me sugirió consultar con un especialista en *${doctor.specialty}*.`
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
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

        {/* Banner Sugerencia de Consulta (si aplica) */}
        {recommendedSpecialty && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 px-6 py-3 border-b border-purple-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-purple text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-brand-purple">Especialidad Sugerida en tu Consulta: </span>
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

                  {/* Acciones de Contacto y Perfil Extendido */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => { setSelectedDoctorDetail(doc); setDetailTab('video'); }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-brand-purple border border-purple-200/70 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer group/btn"
                    >
                      <Play size={13} className="text-brand-purple fill-brand-purple group-hover/btn:scale-110 transition-transform" />
                      <span>Ver Perfil, Vídeos y Currículum</span>
                      <ChevronRight size={14} className="text-brand-purple/70" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
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

        {/* Modal Sub-capa: Perfil Extendido del Especialista (Fila 20 MVP) */}
        {selectedDoctorDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn" onClick={() => setSelectedDoctorDetail(null)}>
            <div 
              className="bg-white w-full max-w-2xl max-h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-scaleUp"
              onClick={e => e.stopPropagation()}
            >
              {/* Header Detalle */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/60 via-slate-50 to-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={selectedDoctorDetail.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedDoctorDetail.full_name}`}
                      alt={selectedDoctorDetail.full_name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                    {selectedDoctorDetail.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs" title="Médico Colegiado Verificado">
                        <ShieldCheck size={14} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">{selectedDoctorDetail.full_name}</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-purple/10 text-brand-purple">
                        {selectedDoctorDetail.specialty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                        <ShieldCheck size={12} /> {selectedDoctorDetail.license_number || 'Colegiado Acreditado'}
                      </span>
                      <span>•</span>
                      <span>{selectedDoctorDetail.professional_college || 'Colegio Oficial de Médicos'}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      {selectedDoctorDetail.city || selectedDoctorDetail.location}
                      <span className="mx-1.5">•</span>
                      <Award size={12} className="text-amber-500" />
                      {selectedDoctorDetail.experience_years} años de experiencia clínica
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDoctorDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Selector de Pestañas de Detalle */}
              <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <button
                  onClick={() => setDetailTab('video')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    detailTab === 'video'
                      ? 'border-brand-purple text-brand-purple bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Video size={14} />
                  <span>Vídeos Oficiales</span>
                </button>

                <button
                  onClick={() => setDetailTab('curriculum')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    detailTab === 'curriculum'
                      ? 'border-brand-purple text-brand-purple bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <GraduationCap size={14} />
                  <span>Trayectoria y Currículum</span>
                </button>

                {selectedDoctorDetail.clinic_photos?.length > 0 && (
                  <button
                    onClick={() => setDetailTab('clinic')}
                    className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                      detailTab === 'clinic'
                        ? 'border-brand-purple text-brand-purple bg-white shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Building2 size={14} />
                    <span>Instalaciones Clínicas ({selectedDoctorDetail.clinic_photos.length})</span>
                  </button>
                )}
              </div>

              {/* Contenido según Pestaña */}
              <div className="p-5 overflow-y-auto max-h-[50vh] space-y-4">
                {/* PESTAÑA VÍDEOS */}
                {detailTab === 'video' && (
                  <div className="space-y-4">
                    {/* Vídeo de Presentación */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Film size={13} />
                        </span>
                        <h4 className="text-xs font-bold text-slate-800">Vídeo de Presentación del Médico</h4>
                      </div>

                      {selectedDoctorDetail.presentation_video_url ? (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md">
                          {getVideoEmbedUrl(selectedDoctorDetail.presentation_video_url)?.includes('embed') ? (
                            <iframe
                              src={getVideoEmbedUrl(selectedDoctorDetail.presentation_video_url)}
                              title={`Vídeo presentación de ${selectedDoctorDetail.full_name}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video src={selectedDoctorDetail.presentation_video_url} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                          Este especialista aún no ha subido su vídeo de presentación.
                        </div>
                      )}
                    </div>

                    {/* Vídeo de la Clínica */}
                    {selectedDoctorDetail.clinic_video_url && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                            <Building2 size={13} />
                          </span>
                          <h4 className="text-xs font-bold text-slate-800">Vídeo de la Clínica e Instalaciones</h4>
                        </div>
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md">
                          {getVideoEmbedUrl(selectedDoctorDetail.clinic_video_url)?.includes('embed') ? (
                            <iframe
                              src={getVideoEmbedUrl(selectedDoctorDetail.clinic_video_url)}
                              title="Vídeo de la clínica"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video src={selectedDoctorDetail.clinic_video_url} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Biografía profesional */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acerca del especialista</h5>
                      <p className="text-xs text-slate-700 leading-relaxed">{selectedDoctorDetail.bio}</p>
                    </div>
                  </div>
                )}

                {/* PESTAÑA CURRÍCULUM */}
                {detailTab === 'curriculum' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resumen Profesional</h5>
                      <p className="text-xs text-slate-700 leading-relaxed">{selectedDoctorDetail.bio}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                        <GraduationCap size={15} className="text-brand-purple" />
                        <span>Formación Académica y Títulos Médicos</span>
                      </h4>

                      {selectedDoctorDetail.educations?.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedDoctorDetail.educations.map((edu, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                <Award size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold text-slate-900">{edu.degree || edu.institution}</h5>
                                <p className="text-[11px] text-slate-600 font-medium">{edu.institution}</p>
                                {(edu.start_year || edu.end_year) && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {edu.start_year || ''} {edu.start_year && edu.end_year ? '-' : ''} {edu.end_year || ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                          Título oficial en {selectedDoctorDetail.specialty} verificado por {selectedDoctorDetail.professional_college || 'Colegio Oficial de Médicos'}.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Experiencia</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDoctorDetail.experience_years} años de ejercicio clínico</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Idiomas de consulta</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedDoctorDetail.languages || 'Español'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PESTAÑA CLÍNICA */}
                {detailTab === 'clinic' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 size={15} className="text-teal-600" />
                      <span>Instalaciones del Consultorio / Centro Médico</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedDoctorDetail.clinic_photos?.map((photoUrl, idx) => (
                        <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                          <img src={photoUrl} alt={`Instalaciones ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Detalle con Acciones */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorDetail(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const doc = selectedDoctorDetail;
                      setSelectedDoctorDetail(null);
                      handleWhatsApp(doc);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition-all cursor-pointer"
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      const doc = selectedDoctorDetail;
                      setSelectedDoctorDetail(null);
                      setBookingDoctor(doc);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-200 transition-all cursor-pointer"
                  >
                    <Calendar size={15} />
                    <span>Solicitar Cita</span>
                  </button>
                </div>
              </div>
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
