import React, { useState, useRef, useMemo } from 'react';
import { 
  X, ShieldAlert, Droplet, Phone, AlertTriangle, 
  Heart, Pill, QrCode, Download, Share2, Copy, 
  Check, ExternalLink, Smartphone, Printer, Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const EmergencyPassportModal = ({ isOpen, onClose, patientProfile, onExportPDF }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [generatingWallpaper, setGeneratingWallpaper] = useState(false);

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

  const emergencyUrl = patientProfile?.emergency_url || 
    `${window.location.origin}/emergencia/${encodeURIComponent(patientProfile?.user_id || 'me')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emergencyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-[32px] shadow-2xl overflow-hidden text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-inner">
              ✚
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Pasaporte QR & Chapa Militar
              </h3>
              <p className="text-xs text-white/80">Ficha médica táctica de emergencia</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Quick Notice */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-2xl p-4 flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>Acceso sin desbloquear:</strong> Cualquier persona o paramédico con un celular puede escanear tu código QR para ver tu tipo de sangre, alergias y contacto sin necesidad de tu PIN o huella digital.
            </p>
          </div>

          {/* Tactical Dog Tag Badge Card */}
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-5 border-2 border-slate-700 shadow-xl relative">
            
            {/* Dog Tag Notch / Rivet */}
            <div className="flex justify-center -mt-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-600 shadow-inner flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PACIENTE
                </span>
                <h4 className="text-lg font-black text-white">
                  {patientProfile?.full_name || 'Nombre no asignado'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {patientProfile?.date_of_birth || '--'} ({age} años) • {patientProfile?.gender || '--'}
                </p>
              </div>

              <div className="flex gap-2">
                <div className="bg-red-950/90 border-2 border-red-600 px-3.5 py-1 rounded-2xl text-center shadow-md">
                  <span className="text-[9px] uppercase font-bold text-red-400 block">SANGRE</span>
                  <span className="text-xl font-black text-white">{patientProfile?.blood_type || 'N/D'}</span>
                </div>
                <div className="bg-sky-950/90 border-2 border-sky-600 px-3 py-1 rounded-2xl text-center shadow-md">
                  <span className="text-[9px] uppercase font-bold text-sky-400 block">DONANTE</span>
                  <span className="text-xs font-black text-white mt-1 block">
                    {patientProfile?.organ_donor === 'Sí' ? '❤️ SÍ' : (patientProfile?.organ_donor || 'N/D')}
                  </span>
                </div>
              </div>
            </div>

            {/* Critical Medical Notes Alert (if present) */}
            {patientProfile?.medical_notes && (
              <div className="bg-rose-950/60 border-2 border-rose-500/80 rounded-xl p-3 mb-3 shadow-md">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
                  <ShieldAlert size={14} className="text-rose-500 animate-pulse" />
                  <span>ALERTA MÉDICA CRÍTICA / IMPLANTES:</span>
                </div>
                <p className="text-xs text-rose-100 font-black">
                  {patientProfile.medical_notes}
                </p>
              </div>
            )}

            {/* Critical Allergies Badge */}
            <div className="bg-red-950/50 border border-red-700/60 rounded-xl p-3 mb-3">
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold mb-1">
                <AlertTriangle size={14} />
                <span>ALERGIAS CRÍTICAS:</span>
              </div>
              <p className="text-xs text-red-100 font-semibold">
                {patientProfile?.allergies || 'Ninguna conocida'}
              </p>
            </div>

            {/* Emergency Contact */}
            <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-emerald-400" />
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Contacto Urgencias</span>
                  <span className="text-xs font-bold text-white">{patientProfile?.emergency_contact || 'No especificado'}</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold px-2 py-0.5 rounded-lg">
                Activo
              </span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-800/60 rounded-3xl p-5 border border-slate-700 flex flex-col items-center text-center">
            <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
              <QrCode size={18} className="text-brand-purple" />
              Código QR de Emergencia Médico
            </h4>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">
              Al escanear este código se abre directamente la ficha táctica pública en cualquier navegador.
            </p>

            <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
              {patientProfile?.qr_code_base64 ? (
                <img 
                  src={`data:image/png;base64,${patientProfile.qr_code_base64}`} 
                  alt="QR Code Emergencia"
                  className="w-44 h-44 rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <QrCode size={40} className="mb-2 text-slate-300" />
                  <span>Sin código generado</span>
                </div>
              )}
            </div>

            {/* Public URL with Copy button */}
            <div className="w-full flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 max-w-md">
              <span className="text-xs text-slate-400 truncate flex-1 font-mono text-left px-2">
                {emergencyUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{copied ? "¡Listo!" : "Copiar"}</span>
              </button>
              <a
                href={emergencyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-brand-purple/20 text-purple-300 hover:bg-brand-purple/30 rounded-lg transition-all"
                title="Probar vista en nueva pestaña"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Action Buttons: Wallpaper & PDF */}
          <div className="space-y-3 pt-2">
            
            {/* WhatsApp Direct Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <Share2 size={16} />
              <span>Compartir Ficha de Rescate por WhatsApp</span>
            </button>

            {/* Download Lockscreen Wallpaper Button */}
            <button
              onClick={handleDownloadLockscreenWallpaper}
              disabled={generatingWallpaper}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-red-950/60 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download size={18} />
              <span>
                {generatingWallpaper 
                  ? "Generando Fondo de Pantalla..." 
                  : "Descargar Tarjeta para Pantalla de Bloqueo"}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              💡 Pon esta imagen como fondo de pantalla de bloqueo en tu móvil para que los médicos la lean sin desbloquear el teléfono.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  onExportPDF?.();
                  onClose?.();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Printer size={15} />
                <span>Imprimir Ficha PDF</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default EmergencyPassportModal;
