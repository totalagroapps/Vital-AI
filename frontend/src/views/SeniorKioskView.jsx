import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  AlertTriangle, 
  Pill, 
  Brain, 
  Image as ImageIcon, 
  MessageCircle, 
  LogOut, 
  ChevronRight, 
  Heart, 
  Sparkles, 
  X, 
  Send, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  UploadCloud,
  Loader2,
  Camera
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SeniorKioskView({ 
  onExitKiosk, 
  onNavigate, 
  apiUrl, 
  authHeaders, 
  userProfile, 
  username,
  onOpenCalculators,
  onOpenGames
}) {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [config, setConfig] = useState(null);
  const [photos, setPhotos] = useState([]);
  
  // Modales dentro del Kiosko
  const [kioskSubView, setKioskSubView] = useState(null); // null | 'contacts' | 'photos' | 'sos_modal' | 'upload_photo'
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [sosResult, setSosResult] = useState(null);

  // Subir foto familiar
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadSender, setUploadSender] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar configuración de cuidador y fotos
  useEffect(() => {
    fetchConfig();
    fetchPhotos();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/caregiver/config`, {
        headers: authHeaders || {}
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn("Error cargando config de cuidador:", e);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/caregiver/photos`, {
        headers: authHeaders || {}
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (e) {
      console.warn("Error cargando fotos familiares:", e);
    }
  };

  const handleTriggerSos = async () => {
    setIsSendingSos(true);
    try {
      // Intentar obtener geolocalización
      let lat = null;
      let lon = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (geoErr) {
          console.warn("No se pudo obtener GPS:", geoErr);
        }
      }

      const res = await fetch(`${apiUrl}/api/caregiver/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders || {}) },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          battery_level: 85
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSosResult(data);
      }
    } catch (e) {
      console.error("Error disparando alerta SOS:", e);
    } finally {
      setIsSendingSos(false);
    }
  };

  const handleUploadPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('caption', uploadCaption || '¡Un abrazo para ti!');
      formData.append('sender_name', uploadSender || 'Familia');

      const res = await fetch(`${apiUrl}/api/caregiver/photos/upload`, {
        method: 'POST',
        headers: { ...(authHeaders || {}) },
        body: formData
      });
      if (res.ok) {
        setUploadCaption('');
        setUploadSender('');
        setUploadFile(null);
        setKioskSubView('photos');
        fetchPhotos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const timeStr = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  const patientDisplayName = userProfile?.full_name || username || 'Familiar';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 font-sans flex flex-col justify-between p-4 md:p-8 select-none overflow-hidden">
      
      {/* 1. BARRA SUPERIOR: RELOJ GIGANTE Y SALUDO */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl md:text-6xl font-black tracking-tight text-white font-mono">
              {timeStr}
            </span>
            <span className="text-sm md:text-lg font-bold text-teal-400 capitalize">
              {capitalizedDate}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-300 mt-1">
            Hola, <strong className="text-white">{patientDisplayName}</strong>
          </h2>
        </div>

        {/* BOTÓN SALIR DEL MODO KIOSKO */}
        <button
          onClick={() => {
            if (window.confirm("¿Deseas volver a la pantalla principal habitual de MIVOR?")) {
              onExitKiosk();
            }
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 flex items-center gap-2 transition"
          title="Salir del Modo Kiosko / Fácil"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir de Modo Fácil</span>
        </button>
      </header>

      {/* 2. BOTÓN DE ASISTENCIA / SOS DE EMERGENCIA (GIGANTE) */}
      <div className="my-3 shrink-0">
        <button
          onClick={() => {
            setKioskSubView('sos_modal');
            handleTriggerSos();
          }}
          className="w-full bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white rounded-3xl p-4 md:p-5 shadow-lg shadow-rose-900/40 flex items-center justify-between border-2 border-rose-400 active:scale-98 transition group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black text-2xl shadow-md group-hover:scale-110 transition">
              <AlertTriangle size={32} strokeWidth={2.6} />
            </div>
            <div className="text-left">
              <span className="text-xs uppercase font-black tracking-widest text-rose-200 block">
                Asistencia Inmediata
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                BOTÓN SOS DE EMERGENCIA
              </h3>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold bg-rose-800/80 px-4 py-2 rounded-2xl border border-rose-400/40">
            <span>Avisa a la familia & Emergencias</span>
            <ChevronRight size={18} />
          </div>
        </button>
      </div>

      {/* 3. BOTONERA DE 6 ACCIONES GIGANTES TÁCTILES */}
      <main className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 flex-1 min-h-0 items-stretch">

        {/* 1. LLAMAR A LA FAMILIA */}
        <button
          onClick={() => setKioskSubView('contacts')}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-emerald-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Phone size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Llamar a la Familia</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Fotos y números directos de tus seres queridos
            </p>
          </div>
        </button>

        {/* 2. GRUPO FAMILIAR WHATSAPP */}
        <button
          onClick={() => {
            const url = config?.whatsapp_group_url || "https://web.whatsapp.com/";
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-teal-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <MessageCircle size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Grupo de WhatsApp</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Chat y llamadas con toda la familia reunida
            </p>
          </div>
        </button>

        {/* 3. MI PASTILLERO */}
        <button
          onClick={() => onNavigate('treatments')}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-sky-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Pill size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Mi Pastillero</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Revisar y marcar las medicinas de hoy
            </p>
          </div>
        </button>

        {/* 4. MENTE ACTIVA */}
        <button
          onClick={onOpenGames}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-violet-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Brain size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Mente Activa</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Juegos diarios para entrenar la memoria y el cálculo
            </p>
          </div>
        </button>

        {/* 5. FOTOS DE LA FAMILIA */}
        <button
          onClick={() => setKioskSubView('photos')}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-amber-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <ImageIcon size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Fotos Familiares</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Recuerdos y fotos compartidas por tus hijos y nietos
            </p>
          </div>
        </button>

        {/* 6. CONSULTAR CON MIVOR */}
        <button
          onClick={() => onNavigate('general_chat')}
          className="bg-slate-800/90 hover:bg-slate-700/90 border-2 border-slate-700/80 hover:border-indigo-400/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between text-left transition active:scale-98 cursor-pointer group shadow-md"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Sparkles size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-lg md:text-2xl font-black text-white leading-tight">Hablar con MIVOR</h4>
            <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">
              Haz cualquier pregunta de salud por voz o texto
            </p>
          </div>
        </button>

      </main>

      {/* ======================================================== */}
      {/* SUB-MODAL 1: CONTACTOS FAMILIARES (LLAMADO FÁCIL)        */}
      {/* ======================================================== */}
      {kioskSubView === 'contacts' && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setKioskSubView(null)}
        >
          <div 
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Phone size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Contactos Rápidos de Familia</h3>
                  <p className="text-xs text-slate-400">Toca para llamar directamente o abrir WhatsApp</p>
                </div>
              </div>
              <button 
                onClick={() => setKioskSubView(null)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[60dvh] pr-1">
              {config?.contacts?.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={c.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                      alt={c.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-600 shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-white truncate">{c.name}</h4>
                      <p className="text-xs text-emerald-400 font-semibold">{c.relationship}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* LLAMADA TELEFÓNICA DIRECTA */}
                    <a
                      href={`tel:${c.phone}`}
                      className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition"
                    >
                      <Phone size={18} />
                      <span className="hidden sm:inline">Llamar</span>
                    </a>

                    {/* WHATSAPP */}
                    {c.whatsapp_enabled && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-MODAL 2: FOTOS FAMILIARES (ÁLBUM FÁCIL)              */}
      {/* ======================================================== */}
      {kioskSubView === 'photos' && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setKioskSubView(null)}
        >
          <div 
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ImageIcon size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Fotos de la Familia</h3>
                  <p className="text-xs text-slate-400">Foto {selectedPhotoIndex + 1} de {Math.max(photos.length, 1)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKioskSubView('upload_photo')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Camera size={14} />
                  <span>Subir Foto</span>
                </button>

                <button 
                  onClick={() => setKioskSubView(null)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* VISOR PRINCIPAL */}
            {photos.length > 0 ? (
              <div className="space-y-3 flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-h-[50dvh] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-700 shadow-lg">
                  <img 
                    src={photos[selectedPhotoIndex]?.url} 
                    alt="Foto familiar" 
                    className="w-full h-full object-contain max-h-[50dvh]" 
                  />
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl w-full text-center">
                  <p className="text-base md:text-lg font-bold text-white">
                    "{photos[selectedPhotoIndex]?.caption}"
                  </p>
                  <p className="text-xs text-amber-400 font-semibold mt-1">
                    Enviada con cariño por: {photos[selectedPhotoIndex]?.sender_name} • {photos[selectedPhotoIndex]?.uploaded_at}
                  </p>
                </div>

                {/* BOTONES ANTERIOR / SIGUIENTE */}
                <div className="flex items-center justify-center gap-4 w-full pt-1">
                  <button
                    onClick={() => setSelectedPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm border border-slate-700 active:scale-95"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setSelectedPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl text-sm shadow-md active:scale-95"
                  >
                    Siguiente Foto
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                No hay fotos familiares todavía. ¡Sube una con el botón superior!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-MODAL 3: SUBIR FOTO FAMILIAR                         */}
      {/* ======================================================== */}
      {kioskSubView === 'upload_photo' && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setKioskSubView(null)}
        >
          <form 
            onSubmit={handleUploadPhotoSubmit}
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera size={18} className="text-amber-400" />
                <span>Compartir Foto con la Familia</span>
              </h3>
              <button 
                type="button"
                onClick={() => setKioskSubView('photos')}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Selecciona una imagen</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mensaje o Dedicatoria</label>
              <input
                type="text"
                placeholder="Ej. ¡Un beso enorme de los nietos!"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tu Nombre</label>
              <input
                type="text"
                placeholder="Ej. Carlos / Laura"
                value={uploadSender}
                onChange={(e) => setUploadSender(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setKioskSubView('photos')}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploadingPhoto || !uploadFile}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                <span>{isUploadingPhoto ? 'Subiendo...' : 'Publicar Foto'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-MODAL 4: ALERTA SOS DISPARADA                        */}
      {/* ======================================================== */}
      {kioskSubView === 'sos_modal' && (
        <div 
          className="fixed inset-0 z-50 bg-rose-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setKioskSubView(null)}
        >
          <div 
            className="bg-slate-900 border-3 border-rose-500 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-500 border-2 border-rose-500 mx-auto flex items-center justify-center animate-pulse">
              <AlertTriangle size={42} strokeWidth={2.8} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">ALERTA SOS ACTIVADA</h3>
              <p className="text-xs text-rose-300 font-semibold mt-1">
                {isSendingSos ? 'Registrando ubicación GPS y preparando alerta...' : 'Alerta registrada con éxito'}
              </p>
            </div>

            {sosResult && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-300 bg-slate-800 p-3 rounded-2xl border border-slate-700 leading-relaxed">
                  {sosResult.message}
                </p>

                <div className="space-y-2">
                  {/* LLAMAR AL 112 DIRECTO */}
                  <a
                    href={sosResult.emergency_call_url}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                  >
                    <Phone size={22} />
                    <span>LLAMAR A URGENCIAS ({config?.emergency_number || '112'})</span>
                  </a>

                  {/* NOTIFICAR A LA FAMILIA POR WHATSAPP */}
                  {sosResult.whatsapp_alert_url && (
                    <a
                      href={sosResult.whatsapp_alert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                    >
                      <MessageCircle size={20} />
                      <span>ENVIAR ALERTA CON GPS POR WHATSAPP</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setKioskSubView(null)}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl text-xs transition"
            >
              Cerrar Alerta
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
