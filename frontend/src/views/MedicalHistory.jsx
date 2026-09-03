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
    else if (bmi >= 18.5 && bmi < 24.9) { status = "Saludable"; color = "text-brand-green bg-brand-green/10 border-brand-green/20"; }
    else if (bmi >= 25 && bmi < 29.9) { status = "Sobrepeso"; color = "text-amber-600 bg-amber-50 border-amber-200"; }
    else { status = "Obesidad"; color = "text-red-600 bg-red-50 border-red-200"; }
    
    return { value: bmi, status, color };
  }, [patientProfile.weight, patientProfile.height]);

  
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Pasaporte Médico - ${patientProfile.full_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #8250DF; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #8250DF; margin: 0; font-size: 28px; }
            .header p { color: #64748b; margin: 5px 0 0 0; }
            h2 { color: #0f172a; margin-top: 30px; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .label { color: #64748b; font-size: 0.85em; text-transform: uppercase; font-weight: 600; }
            .value { font-weight: 700; font-size: 16px; color: #1e293b; }
            .badge { display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border-radius: 12px; font-size: 14px; margin-right: 5px; margin-bottom: 5px; font-weight: 500; }
            .alert-badge { background-color: #fee2e2; color: #b91c1c; }
            .med-badge { background-color: #e0e7ff; color: #4338ca; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VitalAI - Pasaporte Médico</h1>
            <p>Documento de Información Vital para Emergencias</p>
          </div>
          
          <div class="grid">
            <div><div class="label">Nombre del Paciente</div><div class="value">${patientProfile.full_name || 'No especificado'}</div></div>
            <div><div class="label">Contacto de Emergencia</div><div class="value">${patientProfile.emergency_contact || 'No especificado'}</div></div>
          </div>

          <h2>Datos Biométricos y Signos Vitales</h2>
          <div class="grid">
            <div><div class="label">Fecha de Nacimiento</div><div class="value">${patientProfile.date_of_birth || 'No especificada'} (${age} años)</div></div>
            <div><div class="label">Género</div><div class="value">${patientProfile.gender || 'No especificado'}</div></div>
            <div><div class="label">Tipo de Sangre</div><div class="value" style="color: #e11d48; font-size: 20px;">${patientProfile.blood_type || 'No especificado'}</div></div>
            <div>
              <div class="label">Índice de Masa Corporal (IMC)</div>
              <div class="value">
                ${bmiInfo ? `\${bmiInfo.value} (\${bmiInfo.status})` : 'Datos insuficientes'}
              </div>
            </div>
          </div>
          
          <h2>Antecedentes Clínicos</h2>
          <div style="margin-bottom: 20px;">
            <div class="label" style="margin-bottom: 8px;">Alergias Conocidas</div>
            <div>
              ${patientProfile.allergies ? patientProfile.allergies.split(',').map(a => `<span class="badge alert-badge">\${a.trim()}</span>`).join('') : 'Ninguna registrada'}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div class="label" style="margin-bottom: 8px;">Enfermedades Crónicas</div>
            <div>
              ${patientProfile.chronic_conditions ? patientProfile.chronic_conditions.split(',').map(a => `<span class="badge">\${a.trim()}</span>`).join('') : 'Ninguna registrada'}
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div class="label" style="margin-bottom: 8px;">Medicamentos Actuales</div>
            <div>
              ${patientProfile.current_medications ? patientProfile.current_medications.split(',').map(a => `<span class="badge med-badge">\${a.trim()}</span>`).join('') : 'Ninguna registrada'}
            </div>
          </div>
          
          <div class="footer">
            Generado automáticamente por el paciente a través de VitalAI el ${new Date().toLocaleString()}<br/>
            Este documento es un resumen informativo y debe ser validado por un profesional de la salud.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
    <div className="flex flex-col min-h-screen bg-base font-sans relative pb-28 overflow-x-hidden">
      
      {/* Background graphic (matches PatientHome and DocumentAnalyzer) */}
      <div className="absolute top-0 right-0 w-[85%] md:w-[60%] h-[400px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="" 
          className="absolute top-0 right-0 w-full h-full object-cover opacity-80"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
      </div>

      <div className="relative z-10 px-6 pt-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            Perfil Médico
          </h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isEditing ? 'bg-red-50 text-red-500' : 'bg-brand-purple/10 text-brand-purple'}`}
          >
            {isEditing ? <X size={20} /> : <Edit3 size={20} />}
          </button>
        </div>

        {/* Hero Title */}
        <div className="mb-6">
          <h2 className="text-[30px] leading-tight font-bold text-gray-900 mb-3 max-w-[80%]">
            Tu información <br />
            <span className="text-brand-purple">clínica centralizada</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-[85%]">
            Mantén tus datos actualizados para recibir recomendaciones médicas más precisas por parte de VitalAI.
          </p>
        </div>

        {/* QR Passport - Refined Glass Card */}
        <div className="bg-brand-purple text-white rounded-[28px] p-6 shadow-glow relative overflow-hidden flex items-center justify-between mb-6">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <ShieldCheck size={20} />
              Identidad Médica
            </h3>
            <p className="text-xs text-white/90 font-medium mb-1">{patientProfile.full_name || 'Paciente'}</p>
            <p className="text-[10px] text-white/70 mb-4">Escanea en emergencias</p>
            
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Droplet size={14} className="text-white" /> {patientProfile.blood_type || '--'}
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-white" /> {age} años
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button onClick={handleExportPDF} className="w-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider bg-white text-brand-purple hover:bg-gray-50 backdrop-blur-sm px-4 py-2.5 rounded-xl transition-all shadow-sm">
                <FileText size={16} /> Exportar Pasaporte (PDF)
              </button>
            </div>
          </div>

          <div className="relative z-10">
            {patientProfile.qr_code_base64 ? (
              <div className="bg-white p-2 rounded-2xl shadow-inner">
                <img src={`data:image/png;base64,${patientProfile.qr_code_base64}`} alt="QR Code" className="w-20 h-20 rounded-xl" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-black/20 rounded-2xl flex flex-col items-center justify-center text-white/50 border border-white/30 border-dashed p-3">
                <QrCode size={20} className="mb-1" />
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
              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex flex-col items-center text-center">
                <Scale size={20} className="text-purple-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Peso</span>
                <span className="text-lg font-bold text-gray-900 mt-1">{patientProfile.weight || '--'} <span className="text-xs font-medium text-gray-500">kg</span></span>
              </div>
              <div className="bg-white rounded-[24px] p-4 shadow-soft border border-gray-100 flex flex-col items-center text-center">
                <Ruler size={20} className="text-teal-500 mb-2" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Altura</span>
                <span className="text-lg font-bold text-gray-900 mt-1">{patientProfile.height || '--'} <span className="text-xs font-medium text-gray-500">cm</span></span>
              </div>
              <div className={`rounded-[24px] p-4 shadow-soft border flex flex-col items-center text-center ${bmiInfo ? bmiInfo.color : 'bg-white border-gray-100'}`}>
                <Activity size={20} className="mb-2 opacity-80" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">IMC</span>
                <span className="text-lg font-bold mt-1">{bmiInfo ? bmiInfo.value : '--'}</span>
                {bmiInfo && <span className="text-[9px] font-bold mt-0.5">{bmiInfo.status}</span>}
              </div>
            </div>

            {/* Clinical Data */}
            <div className="bg-white rounded-[28px] shadow-soft border border-gray-100 overflow-hidden">
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
                  <Pill size={16} className="text-brand-purple" /> Medicación Actual
                </h3>
                {renderTags(patientProfile.current_medications, <Pill size={12}/>, "No toma medicamentos actualmente", "bg-brand-purple/10 text-brand-purple border border-brand-purple/20")}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-blue-50 rounded-[24px] p-5 border border-blue-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <Phone size={14} /> Contacto de Emergencia
                </h3>
                <p className="text-sm font-bold text-blue-700">{patientProfile.emergency_contact || 'No especificado'}</p>
              </div>
              {patientProfile.emergency_contact && (
                <a href={`tel:${patientProfile.emergency_contact.replace(/[^0-9+]/g, '')}`} className="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
                  <Phone size={16} />
                </a>
              )}
            </div>

            {/* Triages Previos */}
            {triageSessions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1">Consultas Previas</h3>
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-soft overflow-hidden">
                  {triageSessions.slice(0, 5).map((session, idx) => (
                    <div key={session.id} className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${idx < (triageSessions.length > 5 ? 4 : triageSessions.length - 1) ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-brand-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {(session.payload?.title || session.title || 'Consulta de Triage')}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={10}/>
                          {new Date(session.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric'})}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        (session.payload?.severity || session.severity) === "ROJO" ? "bg-red-50 text-red-600 border border-red-200" :
                        (session.payload?.severity || session.severity) === "NARANJA" ? "bg-orange-50 text-orange-600 border border-orange-200" :
                        (session.payload?.severity || session.severity) === "AMARILLO" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                        (session.payload?.severity || session.severity) === "VERDE" ? "bg-brand-green/10 text-brand-green border border-brand-green/20" :
                        "bg-brand-purple/10 text-brand-purple border border-brand-purple/20"
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
              <Edit3 size={18} className="text-brand-purple" />
              Editar Información
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Nombre Completo</label>
                  <input type="text" required value={patientProfile.full_name || ""} onChange={e => setPatientProfile({...patientProfile, full_name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">F. de Nacimiento</label>
                  <input type="date" required value={patientProfile.date_of_birth || ""} onChange={e => setPatientProfile({...patientProfile, date_of_birth: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Género</label>
                  <select value={patientProfile.gender || ""} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50">
                    <option value="">Seleccione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Sangre</label>
                  <select value={patientProfile.blood_type || ""} onChange={e => setPatientProfile({...patientProfile, blood_type: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 px-1">
                    <option value="">--</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Alt (cm)</label>
                  <input type="number" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="175" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Peso (kg)</label>
                  <input type="number" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="70" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Alergias Conocidas (separadas por coma)</label>
                <textarea value={patientProfile.allergies || ""} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Penicilina, polen..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Enfermedades Crónicas (separadas por coma)</label>
                <textarea value={patientProfile.chronic_conditions || ""} onChange={e => setPatientProfile({...patientProfile, chronic_conditions: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Hipertensión, asma..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Medicamentos Actuales (separados por coma)</label>
                <textarea value={patientProfile.current_medications || ""} onChange={e => setPatientProfile({...patientProfile, current_medications: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" rows={2} placeholder="Losartán 50mg, Ibuprofeno..."></textarea>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">Contacto de Emergencia</label>
                <input type="text" value={patientProfile.emergency_contact || ""} onChange={e => setPatientProfile({...patientProfile, emergency_contact: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-purple/50" placeholder="Nombre y teléfono" />
              </div>

              <button type="submit" className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-4 rounded-2xl shadow-glow transition-transform active:scale-95 mt-4 flex items-center justify-center gap-2">
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


