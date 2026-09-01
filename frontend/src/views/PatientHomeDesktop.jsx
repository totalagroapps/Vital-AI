import React from 'react';
import { Stethoscope, FileText, FolderHeart, UserSquare2, Brain, Activity, Folder, User, ArrowRight, Lock, Info, Bell } from 'lucide-react';

const PatientHomeDesktop = ({ onNavigate, onLogout }) => {
  return (
    <div className="h-[100dvh] bg-white relative overflow-hidden font-sans flex flex-col justify-center">
      {/* Background image on the right */}
      <div className="absolute top-0 right-0 w-[55%] h-full z-0">
         <img 
            src="/images/abstract_woman_bg.jpg" 
            alt="AI Hologram" 
            className="w-full h-full object-cover opacity-90 object-center" 
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 80%, transparent 100%)' }} 
         />
         
         {/* Floating Cards */}
         <div className="absolute top-[12%] left-[20%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('triage')}>
             <div className="text-brand-purple bg-brand-purple/10 p-2 rounded-full"><Stethoscope size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Analiza tus<br/>síntomas</span>
         </div>
         <div className="absolute top-[35%] left-[25%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float-delayed w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('documents')}>
             <div className="text-brand-green bg-brand-green/10 p-2 rounded-full"><FileText size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Entiende tus<br/>pruebas e informes</span>
         </div>
         <div className="absolute top-[10%] right-[10%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('history')}>
             <div className="text-brand-blue bg-brand-blue/10 p-2 rounded-full"><FolderHeart size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Organiza todo<br/>tu historial</span>
         </div>
         <div className="absolute top-[32%] right-[5%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float-delayed w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('doctors')}>
             <div className="text-brand-orange bg-brand-orange/10 p-2 rounded-full"><UserSquare2 size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Conéctate con<br/>los mejores médicos</span>
         </div>
         <div className="absolute bottom-[35%] left-[55%] -translate-x-1/2 bg-white/95 backdrop-blur rounded-full px-6 py-3 shadow-xl border border-white/60 flex items-center justify-center text-center w-max z-10">
            <span className="text-sm text-gray-700 font-medium leading-relaxed">Inteligencia Artificial avanzada<br/>al servicio de <strong className="text-brand-purple font-bold">tu salud</strong></span>
         </div>
         <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 lg:px-12 flex flex-col h-full py-8 justify-between">
        
        <div>
            {/* Header Logo & User Actions */}
            <div className="flex items-center justify-between mb-8 pr-12 relative z-50">
               <div className="flex items-center gap-2">
                 <div className="text-brand-purple">
                   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                     <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2" />
                     <path d="M8 13h8" className="text-brand-blue" strokeWidth="2" />
                   </svg>
                 </div>
                 <span className="font-bold text-xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">AI</span></span>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="relative">
                   <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-brand-purple shadow-sm hover:shadow-md transition-shadow">
                     <Bell size={18} />
                   </button>
                   <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-brand-purple rounded-full border-2 border-white"></div>
                 </div>
                 <button onClick={onLogout} className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group" title="Cerrar Sesión">
                   <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                     <span className="text-white text-[10px] font-bold">Salir</span>
                   </div>
                 </button>
               </div>
            </div>

            {/* Hero text */}
            <div className="max-w-[45%] mb-8 animate-fade-in-left">
               <h2 className="text-sm font-bold tracking-widest text-gray-800 mb-1 uppercase">BIENVENIDO A</h2>
               <h1 className="text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-blue-600 to-brand-purple bg-clip-text text-transparent">VITALAI</h1>
               
               <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Tu salud, más fácil de entender y gestionar.</h3>
               <p className="text-gray-600 mb-2 leading-relaxed text-xs lg:text-sm">
                 VitalAI te ayuda a comprender tus síntomas, analizar tus pruebas e informes médicos, organizar tu historial de salud y seguir tu evolución con inteligencia artificial.
               </p>
               <p className="text-gray-600 leading-relaxed text-xs lg:text-sm">
                 Toda tu información de salud en un mismo lugar, explicada de forma sencilla y disponible cuando la necesites.
               </p>
            </div>
        </div>

        <div>
            {/* Section Title */}
            <h3 className="text-center text-lg lg:text-xl font-bold text-gray-900 mb-6">¿Qué puedes hacer con VitalAI?</h3>

            {/* 5 Cards Row */}
            <div className="grid grid-cols-5 gap-3 lg:gap-5 mb-8">
              
              <div onClick={() => onNavigate('general_chat')} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-brand-purple text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Brain size={20}/></div>
                <h4 className="font-bold text-[11px] lg:text-sm text-brand-purple mb-1.5">Pregunta a VitalAI</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 mb-4 flex-1">Resuelve tus dudas sobre salud de forma clara y confiable.</p>
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-brand-purple text-white flex items-center justify-center group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
              </div>

              <div onClick={() => onNavigate('documents')} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-brand-green text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                <h4 className="font-bold text-[11px] lg:text-sm text-brand-green mb-1.5">Analiza tus pruebas e informes</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 mb-4 flex-1">Sube analíticas, radiografías, TAC, informes y recibe una explicación sencilla.</p>
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-brand-green text-white flex items-center justify-center group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
              </div>

              <div onClick={() => {}} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Activity size={20}/></div>
                <h4 className="font-bold text-[11px] lg:text-sm text-blue-500 mb-1.5">Sigue tu salud</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 mb-4 flex-1">Health Score, evolución de tus valores y recomendaciones personalizadas.</p>
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
              </div>

              <div onClick={() => onNavigate('history')} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-brand-orange text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Folder size={20}/></div>
                <h4 className="font-bold text-[11px] lg:text-sm text-brand-orange mb-1.5">Todo tu historial en un solo lugar</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 mb-4 flex-1">Medicamentos, alergias, enfermedades, consultas y más.</p>
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-brand-orange text-white flex items-center justify-center group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
              </div>

              <div onClick={() => onNavigate('doctors')} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col group">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><User size={20}/></div>
                <h4 className="font-bold text-[11px] lg:text-sm text-purple-600 mb-1.5">Encuentra y consulta a un médico</h4>
                <p className="text-[10px] lg:text-xs text-gray-500 mb-4 flex-1">Videoconsulta, citas presenciales y comparte tu información.</p>
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-purple-600 text-white flex items-center justify-center group-hover:translate-x-2 transition-transform"><ArrowRight size={14}/></div>
              </div>

            </div>

            {/* Comenzar Button & Footer */}
            <div className="flex flex-col items-center">

               <div className="flex items-center gap-4 mb-3">
                   <p className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs"><Lock size={14}/> Tu información siempre protegida</p>
                   <span className="text-gray-300">|</span>
                   <p className="text-[10px] text-gray-400">Cumplimos con los más altos estándares de privacidad.</p>
               </div>
               
               <div className="bg-[#f8f9fc] border border-blue-100 text-gray-500 text-[10px] px-4 py-2 rounded-xl flex items-center gap-2 max-w-2xl text-center">
                 <div className="text-blue-500 flex-shrink-0"><Info size={14}/></div>
                 <span>VitalAI ofrece información y apoyo basado en inteligencia artificial, no sustituye la evaluación o diagnóstico de un profesional de la salud.</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHomeDesktop;
