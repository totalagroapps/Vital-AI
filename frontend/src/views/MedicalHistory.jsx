import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, ShieldCheck, Activity, Edit3, QrCode, 
  Droplet, Heart, Scale, Ruler, Pill, AlertTriangle, 
  Calendar, Phone, Save, X, FileText
} from "lucide-react";

const MedicalHistory = ({
  patientProfile,
  setPatientProfile,
  savePatientProfile,
  onBack,
  sessions
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const triageSessions = sessions?.filter(s => s.type === "triage") || [];

  // Calculate age
  const age = useMemo(() => {
    if (!patientProfile.date_of_birth) return "--";
    const dob = new Date(patientProfile.date_of_birth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  }, [patientProfile.date_of_birth]);

  // Calculate BMI
  const bmiInfo = useMemo(() => {
    if (!patientProfile.weight || !patientProfile.height) return null;
    const w = parseFloat(patientProfile.weight);
    const h = parseFloat(patientProfile.height) / 100; // cm to m
    if (!w || !h) return null;
    const bmi = (w / (h * h)).toFixed(1);
    
    let status = "";
    let color = "";
    if (bmi < 18.5) { status = "Bajo peso"; color = "text-blue-500 bg-blue-50 border-blue-200"; }
    else if (bmi >= 18.5 && bmi < 24.9) { status = "Saludable"; color = "text-green-600 bg-green-50 border-green-200"; }
    else if (bmi >= 25 && bmi < 29.9) { status = "Sobrepeso"; color = "text-amber-600 bg-amber-50 border-amber-200"; }
    else { status = "Obesidad"; color = "text-red-600 bg-red-50 border-red-200"; }
    
    return { value: bmi, status, color };
  }, [patientProfile.weight, patientProfile.height]);

  const handleSave = async (e) => {
    e.preventDefault();
    await savePatientProfile(e);
    setIsEditing(false);
  };

  const renderTags = (text, icon, emptyText, colorClass) => {
    if (!text || text.trim() === "") return <p className="text-xs text-gray-400 italic">{emptyText}</p>;
    const tags = text.split(',').map(t => t.trim()).filter(t => t);
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, i) => (
          <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${colorClass}`}>
            {icon} {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between z-20 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="text-gray-700" size={24} />
        </button>
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          Mi Perfil Médico
        </h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isEditing ? 'bg-red-50 text-red-500' : 'bg-brand-blue/10 text-brand-blue'}`}
        >
          {isEditing ? <X size={20} /> : <Edit3 size={20} />}
        </button>
      </div>

      <div className="p-5 space-y-6">
        
        {/* QR Passport - Shows in both modes */}
        <div className="bg-gradient-to-br from-brand-blue to-blue-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <ShieldCheck size={20} />
              Identidad Médica
            </h3>
            <p className="text-xs text-white/80 mb-1">{patientProfile.full_name || 'Paciente'}</p>
            <p className="text-[10px] text-white/60 mb-4">Escanea en caso de emergencia</p>
            
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Droplet size={14} className="text-red-300" /> {patientProfile.blood_type || '--'}
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-200" /> {age} años
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {patientProfile.qr_code_base64 ? (
              <div className="bg-white p-2 rounded-2xl shadow-inner">
                <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-24 h-24 rounded-xl" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-white/50 border border-white/30 border-dashed p-4">
                <QrCode size={24} className="mb-1" />
                <span className="text-[9px] text-center">Faltan datos</span>
              </div>
            )}
          </div>
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <div className="space-y-6">
            
            {/* Quick Vitals / Biometrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Scale size={20} className="text-purple-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Peso</span>
                <span className="text-lg font-bold text-gray-900">{patientProfile.weight || '--'} <span className="text-xs font-medium text-gray-500">kg</span></span>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Ruler size={20} className="text-teal-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Altura</span>
                <span className="text-lg font-bold text-gray-900">{patientProfile.height || '--'} <span className="text-xs font-medium text-gray-500">cm</span></span>
              </div>
              <div className={`rounded-2xl p-4 shadow-sm border flex flex-col items-center text-center ${bmiInfo ? bmiInfo.color : 'bg-white border-gray-100'}`}>
                <Activity size={20} className="mb-2 opacity-75" />
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">IMC</span>
                <span className="text-lg font-bold">{bmiInfo ? bmiInfo.value : '--'}</span>
                {bmiInfo && <span className="text-[9px] font-bold mt-0.5">{bmiInfo.status}</span>}
              </div>
            </div>

            {/* Clinical Data */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-orange-500" /> Alergias Conocidas
                </h3>
                {renderTags(patientProfile.allergies, <AlertTriangle size={12}/>, "No registra alergias", "bg-orange-50 text-orange-700 border border-orange-100")}
              </div>
              
              <div className="p-5 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <Heart size={16} className="text-red-500" /> Enfermedades Crónicas
                </h3>
                {renderTags(patientProfile.chronic_conditions, <Activity size={12}/>, "No registra enfermedades crónicas", "bg-red-50 text-red-700 border border-red-100")}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                  <Pill size={16} className="text-brand-blue" /> Medicación Actual
                </h3>
                {renderTags(patientProfile.current_medications, <Pill size={12}/>, "No toma medicamentos actualmente", "bg-blue-50 text-blue-700 border border-blue-100")}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <Phone size={14} /> Contacto de Emergencia
                </h3>
                <p className="text-sm font-medium text-indigo-700">{patientProfile.emergency_contact || 'No especificado'}</p>
              </div>
              {patientProfile.emergency_contact && (
                <a href={`tel:${patientProfile.emergency_contact.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center">
                  <Phone size={16} />
                </a>
              )}
            </div>

            {/* Triages Previos */}
            {triageSessions.length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                  <FileText size={18} className="text-brand-green" />
                  Consultas Previas
                </h3>
                <div className="space-y-3">
                  {triageSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[200px]">
                          {(session.payload?.title || session.title || 'Consulta de Triage')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar size={10}/>
                          {new Date(session.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric'})}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        (session.payload?.severity || session.severity) === "ROJO" ? "bg-red-100 text-red-700" :
                        (session.payload?.severity || session.severity) === "NARANJA" ? "bg-orange-100 text-orange-700" :
                        (session.payload?.severity || session.severity) === "AMARILLO" ? "bg-yellow-100 text-yellow-700" :
                        (session.payload?.severity || session.severity) === "VERDE" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {(session.payload?.severity || session.severity) || "INFO"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 animate-fade-in">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-sm">
              <Edit3 size={18} className="text-brand-blue" />
              Editar Información
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre Completo</label>
                  <input type="text" required value={patientProfile.full_name || ""} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">F. de Nacimiento</label>
                  <input type="date" required value={patientProfile.date_of_birth || ""} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Género</label>
                  <select value={patientProfile.gender || ""} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue">
                    <option value="">Seleccione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sangre</label>
                  <select value={patientProfile.blood_type || ""} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue px-1">
                    <option value="">--</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alt (cm)</label>
                  <input type="number" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="175" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Peso (kg)</label>
                  <input type="number" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="70" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alergias Conocidas (separadas por coma)</label>
                <textarea value={patientProfile.allergies || ""} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Penicilina, polen..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Enfermedades Crónicas (separadas por coma)</label>
                <textarea value={patientProfile.chronic_conditions || ""} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Hipertensión, asma..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Medicamentos Actuales (separados por coma)</label>
                <textarea value={patientProfile.current_medications || ""} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" rows={2} placeholder="Losartán 50mg, Ibuprofeno..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Contacto de Emergencia</label>
                <input type="text" value={patientProfile.emergency_contact || ""} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:ring-1 focus:ring-brand-blue" placeholder="Nombre y teléfono" />
              </div>

              <button type="submit" className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-glow transition-transform active:scale-95 mt-4 flex items-center justify-center gap-2">
                <Save size={18} /> Guardar Perfil
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicalHistory;

