import React, { useState, useMemo } from 'react';
import { 
  X, ShieldAlert, Droplet, Phone, AlertTriangle, 
  Heart, Pill, QrCode, Download, Share2, Copy, 
  Check, ExternalLink, Printer, Sparkles, Loader2, Info, ChevronRight, ChevronDown, Lightbulb
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EmergencyPassportModal = ({ isOpen, onClose, patientProfile, onExportPDF }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [generatingWallpaper, setGeneratingWallpaper] = useState(false);
  const [showMedicalDetails, setShowMedicalDetails] = useState(false);

  // Validación de UUID del paciente para evitar enlaces rotos o malformados
  const isUserIdValid = Boolean(patientProfile?.user_id && UUID_REGEX.test(patientProfile.user_id));
  const emergencyUrl = isUserIdValid 
    ? (patientProfile?.emergency_url || `${window.location.origin}/emergencia/${patientProfile.user_id}`)
    : (patientProfile?.emergency_url || `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.full_name || 'paciente')}`);

  // Fallback age calculation
  const age = useMemo(() => {
    if (!patientProfile?.date_of_birth) return "--";
    try {
      const dob = new Date(patientProfile.date_of_birth);
      if (isNaN(dob.getTime())) return "--";
      const diffMs = Date.now() - dob.getTime();
      const ageDt = new Date(diffMs);
      return Math.abs(ageDt.getUTCFullYear() - 1970);
    } catch {
      return "--";
    }
  }, [patientProfile?.date_of_birth]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!emergencyUrl) return;
    navigator.clipboard.writeText(emergencyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!emergencyUrl) return;
    const text = `🚨 *Ficha Médica de Emergencia MIVOR.ai*\n` +
      `👤 *Paciente:* ${patientProfile?.full_name || 'Paciente'}\n` +
      `🩸 *Grupo Sanguíneo:* ${patientProfile?.blood_type || 'N/D'}\n` +
      `❤️ *Donante:* ${patientProfile?.organ_donor || 'No especificado'}\n` +
      `⚠️ *Alergias:* ${patientProfile?.allergies || 'Sin alergias conocidas'}\n` +
      (patientProfile?.medical_notes ? `⚡ *Alerta Médica:* ${patientProfile.medical_notes}\n` : '') +
      `📞 *Contacto Urgencias:* ${patientProfile?.emergency_contact || 'No especificado'}\n\n` +
      `🔗 *Ficha Táctica en vivo (sin clave):*\n${emergencyUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  /**
   * Generates a high-contrast 1080x1920 mobile Lock Screen Wallpaper using HTML5 Canvas.
   * Enables first responders / emergency staff to scan without unlocking the phone!
   */
  const handleDownloadLockscreenWallpaper = async () => {
    setGeneratingWallpaper(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1920;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Dark Tactical Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#020617'); // slate-950
      bgGrad.addColorStop(0.5, '#0f172a'); // slate-900
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Red emergency header banner
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.fillRect(0, 0, width, 180);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✚  FICHA MÉDICA DE EMERGENCIA  ✚', width / 2, 85);

      ctx.font = '600 28px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fecaca'; // red-200
      ctx.fillText('ESCANEAR CON LA CÁMARA SIN DESBLOQUEAR EL MÓVIL', width / 2, 135);

      // 3. Patient Name & Hero Metrics
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('PACIENTE / TITULAR', width / 2, 260);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px system-ui, -apple-system, sans-serif';
      const patientName = (patientProfile?.full_name || 'PACIENTE MIVOR.AI').toUpperCase();
      ctx.fillText(patientName, width / 2, 330);

      // Blood Type Badge (Left) & Organ Donor Badge (Right)
      const blood = patientProfile?.blood_type || 'N/D';
      const donor = (patientProfile?.organ_donor || 'No especificado').toUpperCase();
      
      // Blood Box (Left)
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(80, 365, 430, 130, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('GRUPO SANGUÍNEO', 295, 410);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px system-ui, -apple-system, sans-serif';
      ctx.fillText(`🩸  ${blood}`, 295, 470);

      // Donor Box (Right)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(570, 365, 430, 130, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('DONANTE DE ÓRGANOS', 785, 410);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px system-ui, -apple-system, sans-serif';
      const donorShort = donor.includes('SÍ') ? '❤️  DONANTE: SÍ' : (donor.includes('NO') ? 'NO REGISTRADO' : '❤️  ' + donor);
      ctx.fillText(donorShort, 785, 470);

      // 4. Center QR Code Container
      const qrBoxSize = 510;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 525;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(qrBoxX - 16, qrBoxY - 16, qrBoxSize + 32, qrBoxSize + 32, 32);
      ctx.fill();
      ctx.stroke();

      // Draw QR Code Image if available
      if (patientProfile?.qr_code_base64) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
            resolve();
          };
          img.onerror = resolve;
          img.src = `data:image/png;base64,${patientProfile.qr_code_base64}`;
        });
      } else {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('ESCANEAR QR', width / 2, qrBoxY + qrBoxSize / 2);
      }

      // 5. Dynamic Alert / Notes Box (if present)
      let currentY = 1095;
      if (patientProfile?.medical_notes) {
        ctx.fillStyle = '#7f1d1d'; // dark ruby
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(80, currentY, width - 160, 130, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fecdd3';
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('⚡  ALERTA MÉDICA / CONDICIÓN CRÍTICA', width / 2, currentY + 42);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        const noteText = patientProfile.medical_notes.length > 55 
          ? patientProfile.medical_notes.substring(0, 52) + '...' 
          : patientProfile.medical_notes;
        ctx.fillText(noteText.toUpperCase(), width / 2, currentY + 95);

        currentY += 150;
      }

      // 6. Critical Allergies Box
      const allergies = patientProfile?.allergies || 'Ninguna conocida';
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(80, currentY, width - 160, 135, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('⚠️  ALERGIAS SEVERAS / CONTRAINDICACIONES', width / 2, currentY + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      const allergyText = allergies.length > 48 ? allergies.substring(0, 45) + '...' : allergies;
      ctx.fillText(allergyText.toUpperCase(), width / 2, currentY + 98);
      currentY += 155;

      // 7. Emergency Contact Box
      ctx.fillStyle = '#064e3b'; // dark green
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(80, currentY, width - 160, 135, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('📞  CONTACTO DE EMERGENCIA', width / 2, currentY + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px system-ui, -apple-system, sans-serif';
      const contactText = patientProfile?.emergency_contact || 'No especificado';
      ctx.fillText(contactText, width / 2, currentY + 98);

      // 8. Footer Instructions
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText('MIVOR.AI MEDICAL PASSPORT  •  HISTORIAL DIGITAL PROTEGIDO', width / 2, 1780);
      ctx.font = 'normal 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('Los datos médicos de este código QR son públicos para uso de paramédicos y salvamento.', width / 2, 1820);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `chapa_militar_pantalla_bloqueo_${(patientProfile?.full_name || 'paciente').replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error generating lockscreen wallpaper:", e);
      alert("No se pudo generar el fondo de pantalla. Intenta nuevamente.");
    } finally {
      setGeneratingWallpaper(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden text-slate-900 my-6 border border-slate-200">
        
        {/* Modal Header: Red Emergency Banner matching Image 4 */}
        <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-2xl shadow-inner">
              ✚
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                PASAPORTE QR & CHAPA MILITAR
              </h3>
              <p className="text-xs text-white/90 font-medium">Ficha médica táctica de emergencia</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto bg-[#f8fafd]">

          {/* 1. Contacto Urgencias Card */}
          <div className="bg-[#eaf8f0] border border-[#a7f3d0] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#cbf3de] text-[#059669] flex items-center justify-center shrink-0">
                <Phone size={20} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CONTACTO URGENCIAS
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                  {patientProfile?.emergency_contact || 'Viviana Giraldo – 3185552217'}
                </span>
              </div>
            </div>
            <span className="bg-[#059669] text-white text-[11px] font-bold px-3 py-1 rounded-full shrink-0 shadow-xs">
              Activo
            </span>
          </div>

          {/* 2. Código QR Section Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <QrCode size={18} className="text-purple-600" />
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                Código QR de Emergencia Médico
              </h4>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              Al escanear este código se abre directamente la ficha táctica pública en cualquier navegador.
            </p>

            {/* QR Card container */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4 flex items-center justify-center">
              {!isUserIdValid && !emergencyUrl ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-2">
                  <Loader2 size={32} className="animate-spin text-purple-600" />
                  <span>Cargando identificador seguro...</span>
                </div>
              ) : patientProfile?.qr_code_base64 ? (
                <img 
                  src={`data:image/png;base64,${patientProfile.qr_code_base64}`} 
                  alt="QR Code Emergencia"
                  className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <QrCode size={48} className="mb-2 text-slate-300" />
                  <span>Generando código QR...</span>
                </div>
              )}
            </div>

            {/* Truncated Link Bar with Copy & Open button */}
            <div className="w-full bg-[#f1f5f9] border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-600 truncate text-left flex-1">
                {emergencyUrl || "https://vitalai.up.railway.app/emergencia/..."}
              </span>
              <button
                onClick={handleCopyLink}
                disabled={!emergencyUrl}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
              {emergencyUrl ? (
                <a
                  href={emergencyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                  title="Abrir en navegador"
                >
                  <ExternalLink size={16} />
                </a>
              ) : (
                <span className="p-1 text-slate-400 cursor-not-allowed shrink-0">
                  <ExternalLink size={16} />
                </span>
              )}
            </div>
          </div>

          {/* 3. Action Buttons */}
          <div className="space-y-2.5">
            {/* WhatsApp Direct Share Button */}
            <button
              onClick={handleShareWhatsApp}
              disabled={!emergencyUrl}
              className="w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Share2 size={18} />
              <span>Compartir Ficha de Rescate por WhatsApp</span>
            </button>

            {/* Download Lockscreen Wallpaper Button */}
            <button
              onClick={handleDownloadLockscreenWallpaper}
              disabled={generatingWallpaper}
              className="w-full py-3.5 px-4 bg-[#dc2626] hover:bg-[#b91c1c] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={18} />
              <span>
                {generatingWallpaper 
                  ? "Generando Fondo de Pantalla..." 
                  : "Descargar Tarjeta para Pantalla de Bloqueo"}
              </span>
            </button>
          </div>

          {/* 4. "Más información médica" Accordion */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowMedicalDetails(!showMedicalDetails)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Info size={16} />
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  Más información médica
                </span>
              </div>
              {showMedicalDetails ? (
                <ChevronDown size={18} className="text-slate-400" />
              ) : (
                <ChevronRight size={18} className="text-slate-400" />
              )}
            </button>

            {showMedicalDetails && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-3 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sangre</span>
                    <span className="text-xs font-black text-red-600">{patientProfile?.blood_type || 'N/D'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Donante</span>
                    <span className="text-xs font-black text-slate-800">{patientProfile?.organ_donor || 'No especificado'}</span>
                  </div>
                </div>

                {patientProfile?.allergies && (
                  <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-orange-700 uppercase block">Alergias</span>
                    <span className="text-xs font-bold text-orange-950">{patientProfile.allergies}</span>
                  </div>
                )}

                {patientProfile?.medical_notes && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl">
                    <span className="text-[10px] font-bold text-red-700 uppercase block">Alerta Médica</span>
                    <span className="text-xs font-bold text-red-950">{patientProfile.medical_notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Tip Banner */}
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-start gap-3 text-left">
            <span className="text-lg shrink-0 mt-0.5">💡</span>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Pon esta imagen como fondo de pantalla de bloqueo en tu móvil para que los médicos la lean sin desbloquear el teléfono.
            </p>
          </div>

          {/* 6. Bottom Action Buttons: Imprimir PDF & Cerrar */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                onExportPDF?.();
                onClose?.();
              }}
              className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir Ficha PDF</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Cerrar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EmergencyPassportModal;
