import React from "react";
import { ArrowLeft, ShieldCheck, Activity, Edit3, QrCode } from "lucide-react";

const MedicalHistory = ({
  patientProfile,
  setPatientProfile,
  savePatientProfile,
  onBack,
  sessions
}) => {
  const triageSessions = sessions?.filter(s => s.type === "triage") || [];

  return (
    <div className="flex flex-col min-h-screen bg-base font-sans relative pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between z-20 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="text-gray-700" size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          Historial Médico
        </h2>
        <div className="w-10 h-10 flex items-center justify-center text-brand-blue">
          <ShieldCheck size={20} />
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Pasaporte QR Card */}
        <div className="bg-gradient-to-br from-brand-blue to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <QrCode size={20} />
              Pasaporte Médico QR
            </h3>
            <p className="text-xs text-white/80 mb-6">Escanea en caso de emergencia</p>
            
            {patientProfile.qr_code_base64 ? (
              <div className="bg-white p-3 rounded-2xl shadow-inner">
                <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-32 h-32" />
              </div>
            ) : (
              <div className="w-32 h-32 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-white/50 border border-white/30 border-dashed p-4">
                <QrCode size={32} className="mb-2" />
                <span className="text-[10px]">Guarda tus datos</span>
              </div>
            )}
          </div>
        </div>

        {/* Datos Personales */}
        <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Edit3 size={18} className="text-brand-blue" />
            Datos Personales
          </h3>
          
          <form onSubmit={savePatientProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre Completo</label>
                <input type="text" required value={patientProfile.full_name || ""} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Nacimiento</label>
                <input type="date" required value={patientProfile.date_of_birth || ""} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Género</label>
                <select value={patientProfile.gender || ""} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue">
                  <option value="">Seleccione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Grupo Sanguíneo</label>
                <select value={patientProfile.blood_type || ""} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue">
                  <option value="">Seleccione</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Altura (cm)</label>
                <input type="text" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="175" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Peso (kg)</label>
                <input type="text" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="70" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alergias Conocidas</label>
              <textarea value={patientProfile.allergies || ""} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Penicilina, polen..."></textarea>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Enfermedades Crónicas</label>
              <textarea value={patientProfile.chronic_conditions || ""} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Hipertensión, asma..."></textarea>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Medicamentos Actuales</label>
              <textarea value={patientProfile.current_medications || ""} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Losartán 50mg..."></textarea>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">Contacto de Emergencia</label>
              <input type="text" value={patientProfile.emergency_contact || ""} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="Nombre y teléfono" />
            </div>

            <button type="submit" className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-glow transition-transform active:scale-95 mt-4">
              Guardar Historial
            </button>
          </form>
        </div>

        {/* Triages Previos */}
        {triageSessions.length > 0 && (
          <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-brand-orange" />
              Historial de Triajes
            </h3>
            <div className="space-y-3">
              {triageSessions.map(session => (
                <div key={session.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{session.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{new Date(session.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    session.severity === "ROJO" ? "bg-red-100 text-red-700" :
                    session.severity === "NARANJA" ? "bg-orange-100 text-orange-700" :
                    session.severity === "AMARILLO" ? "bg-yellow-100 text-yellow-700" :
                    session.severity === "VERDE" ? "bg-green-100 text-green-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {session.severity || "INFO"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicalHistory;
