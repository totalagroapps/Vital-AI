import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Droplet, Phone, AlertTriangle, Heart, Activity, 
  Pill, User, Calendar, Ruler, Scale, Share2, ArrowLeft, 
  ExternalLink, Check, Copy, Ambulance, ShieldCheck
} from 'lucide-react';

const EmergencyPassportView = ({ apiUrl, onNavigateLogin }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Extract patientId from URL pathname: /emergencia/:patientId
  const patientId = window.location.pathname.replace(/^\/emergencia\/?/, '').trim();

  useEffect(() => {
    if (!patientId) {
      setError("Identificador de paciente no proporcionado en la URL.");
      setLoading(false);
      return;
    }

    const fetchEmergencyProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/public/emergency/${encodeURIComponent(patientId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("No se encontró la ficha médica de emergencia para este identificador.");
          }
          throw new Error(`Error del servidor (${res.status}) al cargar la ficha médica.`);
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error loading emergency profile:", err);
        setError(err.message || "Error al cargar la información de emergencia.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyProfile();
  }, [apiUrl, patientId]);

  const calculateAge = (dob) => {
    if (!dob) return "--";
    try {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return "--";
      const diffMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "--";
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha Médica de Emergencia - ${profile?.full_name || 'Paciente'}`,
          text: `Datos de emergencia y grupo sanguíneo (${profile?.blood_type || 'N/D'}) de ${profile?.full_name || 'paciente'}.`,
          url: url,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Extract phone number from emergency contact string
  const getCleanPhoneNumber = (contactStr) => {
    if (!contactStr) return null;
    const match = contactStr.match(/(\+?\d[\d\s\-()]{6,}\d)/);
    return match ? match[0].replace(/[\s\-()]/g, '') : null;
  };

  const emergencyPhone = getCleanPhoneNumber(profile?.emergency_contact);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8 relative overflow-x-hidden font-sans">
      
      {/* Background Ambience Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Emergency Status Banner */}
      <header className="w-full max-w-lg mb-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/50 animate-pulse">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                PROTOCOLO DE URGENCIA
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-300">MIVOR.ai Emergency Response</h1>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-xs text-slate-300 transition-all active:scale-95 shadow-md"
          title="Compartir o Copiar enlace"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
          <span>{copied ? "¡Copiado!" : "Compartir"}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg z-10 flex flex-col gap-6">

        {loading && (
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-10 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-base font-semibold text-slate-200">Accediendo a Ficha Médica Segura...</p>
            <p className="text-xs text-slate-500 mt-1">Cifrado de datos en tránsito activo</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-950/40 border-2 border-red-800/80 rounded-3xl p-6 text-center shadow-xl">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-300 mb-1">No se pudo cargar la ficha</h2>
            <p className="text-sm text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => onNavigateLogin?.()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all"
            >
              Ir a Inicio de Sesión
            </button>
          </div>
        )}

        {profile && !loading && (
          <>
            {/* ======================================================== */}
            {/* CHAPA MILITAR / MEDICAL DOG TAG CARD                      */}
            {/* ======================================================== */}
            <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-[32px] p-6 border-2 border-slate-700/80 shadow-2xl overflow-hidden">
              
              {/* Dog Tag Metallic Chain Hole Effect */}
              <div className="flex justify-center -mt-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-600 shadow-inner flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-500" />
                </div>
              </div>

              {/* Red Cross Ribbon Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-900/40">
                    ✚
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      IDENTIFICACIÓN MÉDICA
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase">Ficha Táctica de Emergencia</p>
                  </div>
                </div>

                {/* Blood Type Highlight */}
                <div className="flex items-center gap-2 bg-red-950/80 border-2 border-red-600/80 px-3.5 py-1.5 rounded-2xl shadow-lg shadow-red-950/60">
                  <Droplet className="w-5 h-5 text-red-500 fill-red-500" />
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-red-400 block leading-none">GRUPO</span>
                    <span className="text-xl font-black text-white leading-tight tracking-wider">
                      {profile.blood_type || 'N/D'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Main Identity */}
              <div className="mb-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  PACIENTE / TITULAR
                </span>
                <h3 className="text-2xl font-black text-white tracking-wide mt-0.5">
                  {profile.full_name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-300">
                  <span className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-400" />
                    {profile.date_of_birth || '--'} ({calculateAge(profile.date_of_birth)} años)
                  </span>
                  <span className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    {profile.gender || 'No especificado'}
                  </span>
                  {profile.weight && (
                    <span className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Scale size={13} className="text-slate-400" />
                      {profile.weight} kg
                    </span>
                  )}
                  {profile.height && (
                    <span className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Ruler size={13} className="text-slate-400" />
                      {profile.height} cm
                    </span>
                  )}
                </div>
              </div>

              {/* CRITICAL ALLERGIES (Highest Priority Alert) */}
              <div className="mb-5 bg-red-950/40 border-2 border-red-600/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <AlertTriangle size={18} className="text-red-500 animate-bounce" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    ALERGIAS SEVERAS / REACCIONES ADVERSAS
                  </h4>
                </div>
                <div className="text-sm font-bold text-red-200">
                  {profile.allergies && profile.allergies.toLowerCase() !== 'ninguna' ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.allergies.split(',').map((alg, i) => (
                        <span 
                          key={i} 
                          className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm tracking-wide uppercase"
                        >
                          ⚠️ {alg.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg inline-block">
                      ✓ Sin alergias conocidas reportadas
                    </span>
                  )}
                </div>
              </div>

              {/* CHRONIC CONDITIONS & PATHOLOGIES */}
              <div className="mb-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <Heart size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Condiciones Crónicas / Patologías
                  </h4>
                </div>
                <div className="text-sm text-slate-200">
                  {profile.chronic_conditions && profile.chronic_conditions.toLowerCase() !== 'ninguna' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.chronic_conditions.split(',').map((cond, i) => (
                        <span key={i} className="bg-amber-950/60 border border-amber-700/60 text-amber-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                          {cond.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No se registran patologías crónicas</p>
                  )}
                </div>
              </div>

              {/* CURRENT MEDICATIONS */}
              <div className="mb-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <Pill size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Medicación Activa
                  </h4>
                </div>
                <div className="text-sm text-slate-200">
                  {profile.current_medications && profile.current_medications.toLowerCase() !== 'ninguna' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.current_medications.split(',').map((med, i) => (
                        <span key={i} className="bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                          {med.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No se registra medicación regular</p>
                  )}
                </div>
              </div>

              {/* EMERGENCY CONTACT WITH 1-TAP DIAL */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    CONTACTO DE EMERGENCIA
                  </span>
                  <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    Llamada Directa
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">
                        {profile.emergency_contact || 'No especificado'}
                      </p>
                      <p className="text-[11px] text-slate-400">Familiar / Tutor designado</p>
                    </div>
                  </div>

                  {emergencyPhone && (
                    <a 
                      href={`tel:${emergencyPhone}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all active:scale-95"
                    >
                      <Phone size={15} />
                      <span>Llamar</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Verification watermark */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Historial verificado por MIVOR.ai</span>
                </div>
                <span>Actualizado: {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Reciente'}</span>
              </div>
            </div>

            {/* Quick Action Buttons for Emergency First Responders */}
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="tel:911" 
                className="flex items-center justify-center gap-2 p-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-red-950/60 transition-all active:scale-95"
              >
                <Ambulance size={18} />
                <span>Llamar al 911</span>
              </a>

              <a 
                href="tel:112" 
                className="flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition-all active:scale-95"
              >
                <Phone size={18} />
                <span>Llamar al 112</span>
              </a>
            </div>

            {/* Bottom Footer & Login navigation */}
            <footer className="pt-4 text-center border-t border-slate-800/60 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 max-w-xs">
                Esta ficha médica táctica se muestra bajo autorización del paciente para uso exclusivo en rescates y urgencias.
              </p>
              
              <button 
                onClick={() => onNavigateLogin?.()}
                className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                <ExternalLink size={14} />
                <span>¿Eres el paciente? Iniciar sesión en MIVOR.ai</span>
              </button>
            </footer>
          </>
        )}

      </main>

    </div>
  );
};

export default EmergencyPassportView;
