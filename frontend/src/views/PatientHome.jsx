import React from 'react';
import { Stethoscope, FileText, FolderHeart, UserSquare2, MessageSquareText, ShieldCheck, ArrowRight, Sparkles, LogOut, Bell, Search, Mic } from 'lucide-react';

const PatientHome = ({ onNavigate, onLogout }) => {
  return (
    <div className="flex-1 w-full relative min-h-screen pb-24 font-sans bg-base overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[45%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow">
        <img 
          src="/images/brain_robot_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top md:object-right-top"
        />
        <div className="absolute inset-0 w-full bg-gradient-to-r from-base via-base/70 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-base to-transparent" />
      </div>

      <div className="relative z-10 px-5 pt-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="text-brand-purple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2" />
                  <path d="M8 13h8" className="text-brand-blue" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">IA</span></span>
            </div>
            <span className="text-[11px] text-gray-500 font-medium ml-9 -mt-1 tracking-wide">Tu salud, entendida por IA</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-brand-purple shadow-sm hover:shadow-md transition-shadow">
                <Bell size={18} />
              </button>
              <div className="absolute top-0 right-0 w-3 h-3 bg-brand-purple rounded-full border-2 border-white"></div>
            </div>
            <button onClick={onLogout} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mt-4 mb-6 max-w-full md:max-w-[70%] animate-fade-in-left opacity-0" style={{ animationDelay: '100ms' }}>
          <h2 className="text-3xl leading-tight font-bold text-content-primary mb-3">
            Bienvenido,<br/>
            <span className="text-brand-purple">estamos aqu&#237; para<br/>
            cuidar de tu salud.</span>
          </h2>
          <p className="text-content-secondary text-sm leading-relaxed max-w-[85%] md:max-w-full font-medium">
            Accede a todas las herramientas de Vital IA para entender, gestionar y mejorar tu bienestar.
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          
          {/* Card 1 */}
          <button onClick={() => onNavigate('triage')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out animate-fade-in-up opacity-0 flex flex-col h-full" style={{ animationDelay: "150ms" }}>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-full border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-3 bg-brand-purple/5">
                <Stethoscope size={20} />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-[13px] md:text-base leading-snug mb-2 pr-2">Entiende tus s&#237;ntomas</h4>
            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed mb-6 flex-1 pr-1">
              Describe lo que sientes y obt&#233;n posibles causas, explicaciones y consejos.
            </p>
            <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand-purple rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 2 */}
          <button onClick={() => onNavigate('documents')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out animate-fade-in-up opacity-0 flex flex-col h-full" style={{ animationDelay: "250ms" }}>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-full border border-brand-blue/20 flex items-center justify-center text-brand-blue mb-3 bg-brand-blue/5">
                <FileText size={20} />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-[13px] md:text-base leading-snug mb-2 pr-2">Analiza tus pruebas m&#233;dicas</h4>
            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed mb-6 flex-1 pr-1">
              Sube tus informes, radiograf&#237;as y anal&#237;ticas. La IA los analiza por ti.
            </p>
            <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand-blue rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 3 */}
          <button onClick={() => onNavigate('history')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out animate-fade-in-up opacity-0 flex flex-col h-full" style={{ animationDelay: "350ms" }}>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-full border border-brand-green/20 flex items-center justify-center text-brand-green mb-3 bg-brand-green/5">
                <FolderHeart size={20} />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-[13px] md:text-base leading-snug mb-2 pr-2">Organiza tu historial de salud</h4>
            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed mb-6 flex-1 pr-1">
              Centraliza tu informaci&#243;n m&#233;dica y ten todo siempre a mano.
            </p>
            <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand-green rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Card 4 */}
          <button onClick={() => onNavigate('doctors')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out animate-fade-in-up opacity-0 flex flex-col h-full" style={{ animationDelay: "450ms" }}>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-full border border-brand-orange/20 flex items-center justify-center text-brand-orange mb-3 bg-brand-orange/5">
                <UserSquare2 size={20} />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-[13px] md:text-base leading-snug mb-2 pr-2">Con&#233;ctate con m&#233;dicos especialistas</h4>
            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed mb-6 flex-1 pr-1">
              Encuentra al especialista adecuado y realiza videoconsultas seguras.
            </p>
            <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={14} />
            </div>
          </button>
        </div>

        {/* AI Banner Footer */}
        <div className="bg-white/80 backdrop-blur-xl border border-brand-purple/10 rounded-3xl p-4 md:p-5 shadow-sm mb-4 animate-fade-in-up opacity-0 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: "550ms" }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-brand-purple/5 p-2 rounded-full text-brand-purple">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-brand-dark text-[15px] mb-1">Pregunta a Vital IA</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed pr-2">
                Consulta sobre tu salud o descubre los <span className="text-brand-purple font-medium">&#250;ltimos avances m&#233;dicos y cient&#237;ficos</span> sobre cualquier enfermedad.
              </p>
            </div>
          </div>
          
          <div className="relative cursor-text" onClick={() => onNavigate('triage')}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </div>
            <div className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-9 pr-12 text-[12px] text-gray-400 font-medium shadow-inner">
              Ej.: &#191;por qu&#233; tengo dolor de cabeza?
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <Mic size={14} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientHome;
