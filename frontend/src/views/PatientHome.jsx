import React from 'react';
import { Stethoscope, FileText, FolderHeart, UserSquare2, MessageSquareText, ShieldCheck, ArrowRight, Sparkles, LogOut } from 'lucide-react';

const PatientHome = ({ onNavigate, onLogout }) => {
  return (
    <div className="min-h-screen bg-base pb-24 font-sans relative overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-full h-[600px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/ai_patient_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/80 to-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-base via-base/80 to-transparent" />
      </div>

      <div className="relative z-10 px-6 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="text-brand-purple">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">VITAL <span className="text-brand-purple">IA</span></h1>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white/50 backdrop-blur">
              <ShieldCheck className="text-gray-600" size={20} />
            </button>
            <button onClick={onLogout} className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center bg-red-50 backdrop-blur" title="Cerrar sesión">
              <LogOut className="text-red-500" size={18} />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mt-8 mb-10 max-w-[70%]">
          <h2 className="text-[32px] leading-tight font-bold text-content-primary mb-4">
            Tu salud, <br />
            más fácil de <br />
            <span className="text-brand-purple">entender</span> y <br />
            <span className="text-brand-purple">gestionar.</span>
          </h2>
          <p className="text-content-secondary text-sm leading-relaxed mb-6">
            Vital IA utiliza inteligencia artificial avanzada para acompañarte en cada paso de tu salud.
          </p>
          
          <div className="glass-card rounded-2xl p-4 flex gap-3 items-center w-full max-w-sm">
            <div className="bg-brand-purple/10 p-2 rounded-xl text-brand-purple">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-content-primary">Tu información siempre está protegida</p>
              <p className="text-[10px] text-content-secondary mt-0.5">Cumplimos con los más altos estándares de privacidad.</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-6 mt-16">
          <h3 className="text-xl font-bold text-center">¿Qué te gustaría hacer hoy?</h3>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          {/* Card 1 */}
          <button onClick={() => onNavigate('triage')} className="bg-white rounded-3xl p-5 text-left border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-purple/5 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-colors" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-brand-purple/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-purple">
                <Stethoscope size={24} />
              </div>
              <span className="bg-brand-purple text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 relative z-10">Entiende tus síntomas</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-8 relative z-10">
              Cuéntanos qué te ocurre. Vital IA te hará preguntas y te orientará sobre los siguientes pasos.
            </p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-brand-purple rounded-full flex items-center justify-center text-white">
              <ArrowRight size={16} />
            </div>
          </button>

          {/* Card 2 */}
          <button onClick={() => onNavigate('documents')} className="bg-white rounded-3xl p-5 text-left border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-green/5 rounded-full blur-2xl group-hover:bg-brand-green/10 transition-colors" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-brand-green/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-green">
                <FileText size={24} />
              </div>
              <span className="bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 relative z-10">Analiza tus pruebas médicas</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-8 relative z-10">
              Sube analíticas, informes, radiografías, TAC y más. Obtén explicaciones claras y comprensibles.
            </p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-brand-green rounded-full flex items-center justify-center text-white">
              <ArrowRight size={16} />
            </div>
          </button>

          {/* Card 3 */}
          <button onClick={() => onNavigate('history')} className="bg-white rounded-3xl p-5 text-left border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl group-hover:bg-brand-blue/10 transition-colors" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-brand-blue/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-blue">
                <FolderHeart size={24} />
              </div>
              <span className="bg-brand-blue text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 relative z-10">Organiza tu historial de salud</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-8 relative z-10">
              Guarda y organiza todos tus documentos, medicación, alergias, enfermedades y mucho más en un solo lugar.
            </p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white">
              <ArrowRight size={16} />
            </div>
          </button>

          {/* Card 4 */}
          <button onClick={() => onNavigate('doctors')} className="bg-white rounded-3xl p-5 text-left border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl group-hover:bg-brand-orange/10 transition-colors" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-brand-orange/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-orange">
                <UserSquare2 size={24} />
              </div>
              <span className="bg-brand-orange text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-2 relative z-10">Conéctate con médicos especialistas</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-8 relative z-10">
              Encuentra al especialista adecuado, pide cita, realiza videollamadas y comparte tu información de forma segura.
            </p>
            <div className="absolute bottom-4 right-4 w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>

        {/* AI Banner Footer */}
        <div className="ai-card-gradient rounded-3xl p-5 flex items-center gap-4 text-white cursor-pointer relative overflow-hidden shadow-lg mb-4" onClick={() => onNavigate('triage')}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-purple/30 rounded-full blur-3xl" />
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm z-10">
            <Sparkles className="text-white" size={24} />
          </div>
          <div className="flex-1 z-10">
            <h5 className="font-bold text-sm mb-1">Y siempre puedes preguntar a Vital IA</h5>
            <p className="text-xs text-white/70">Tu asistente inteligente de salud, disponible 24/7.</p>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 z-10">
            <MessageSquareText size={20} className="text-brand-purpleLight" />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white rounded-2xl p-4 flex gap-3 items-center border border-gray-100 mb-8">
          <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs font-bold">i</div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Vital IA ofrece información y apoyo basado en inteligencia artificial y no sustituye la evaluación o diagnóstico de un profesional de la salud.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PatientHome;
