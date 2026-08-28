import React, { useRef } from 'react';
import { ArrowLeft, MoreHorizontal, ShieldCheck, CloudUpload, FileText, Image as ImageIcon, Activity, Beaker, FileSearch, Sparkles, MessageSquareText } from 'lucide-react';

const DocumentAnalyzer = ({ onBack, onUpload, isUploading, onAskQuestion }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-base font-sans relative overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-full h-[500px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/ai_patient_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover opacity-90 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
      </div>

      <div className="relative z-10 px-6 pt-12 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Analiza tus pruebas médicas</h2>
          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white/50 backdrop-blur">
            <MoreHorizontal className="text-gray-600" size={20} />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 -z-10" />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center text-[10px] font-bold">1</div>
            <span className="text-[10px] font-semibold text-brand-green">Sube</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">2</div>
            <span className="text-[10px] text-gray-400">Procesando</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">3</div>
            <span className="text-[10px] text-gray-400">Análisis IA</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-[10px] font-bold">4</div>
            <span className="text-[10px] text-gray-400">Resultados</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="mb-6 relative">
          <div className="absolute right-0 top-0 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</div>
          <h2 className="text-[32px] leading-tight font-bold text-gray-900 mb-4 max-w-[80%]">
            Sube tus pruebas <br />
            y obtén respuestas <br />
            <span className="text-brand-green">claras y comprensibles</span>
          </h2>
          <p className="text-sm text-gray-600 max-w-[70%]">
            Nuestra IA analiza tus informes, radiografías, analíticas, TAC y mucho más para explicarte qué significan y qué puedes hacer.
          </p>
        </div>

        {/* Security Badge */}
        <div className="glass-card rounded-2xl p-4 flex gap-3 items-center w-full max-w-sm mb-8 relative z-20">
          <div className="bg-brand-green/10 p-2 rounded-xl text-brand-green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Tu información está protegida</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Cumplimos con los más altos estándares de privacidad y seguridad.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 mb-8 relative z-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-4">
            <CloudUpload size={32} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Arrastra y suelta tus archivos aquí</h3>
          <p className="text-sm text-gray-400 mb-6">O selecciona desde tu dispositivo</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif" 
          />
          
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="bg-brand-green hover:bg-brand-green/90 text-white font-bold py-3 px-8 rounded-full w-full mb-4 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Procesando...' : 'Seleccionar archivos'}
          </button>
          
          <p className="text-[11px] text-gray-400">
            Formatos compatibles: PDF, JPG, PNG, DICOM, XLS, DOC<br/>
            Tamaño máximo por archivo: 50 MB
          </p>
        </div>

        {/* Supported Formats Carousel */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4">¿Qué tipos de pruebas puedes subir?</h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            
            <div className="min-w-[100px] bg-white border border-brand-green/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <FileText className="text-brand-green mb-2" size={24} />
              <span className="text-[11px] font-bold text-gray-900">Informes</span>
              <span className="text-[9px] text-gray-400">PDF, DOC</span>
            </div>
            
            <div className="min-w-[100px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <ImageIcon className="text-gray-500 mb-2" size={24} />
              <span className="text-[11px] font-bold text-gray-900">Radiografías</span>
              <span className="text-[9px] text-gray-400">JPG, PNG</span>
            </div>
            
            <div className="min-w-[100px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Activity className="text-gray-500 mb-2" size={24} />
              <span className="text-[11px] font-bold text-gray-900">TAC / RMN</span>
              <span className="text-[9px] text-gray-400">DICOM</span>
            </div>

            <div className="min-w-[100px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Beaker className="text-gray-500 mb-2" size={24} />
              <span className="text-[11px] font-bold text-gray-900">Analíticas</span>
              <span className="text-[9px] text-gray-400">PDF, XLS</span>
            </div>
            
            <div className="min-w-[100px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <MoreHorizontal className="text-gray-500 mb-2" size={24} />
              <span className="text-[11px] font-bold text-gray-900">Y más</span>
              <span className="text-[9px] text-gray-400">Otros formatos</span>
            </div>
          </div>
        </div>

        {/* History List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900">Últimos análisis realizados</h3>
            <button className="text-xs text-brand-green font-semibold flex items-center gap-1">Ver historial <ArrowRight size={12} /></button>
          </div>

          <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm">
            {/* Item 1 */}
            <div className="flex items-center gap-4 p-3 border-b border-gray-50 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-green flex-shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900">Analítica completa</h4>
                <p className="text-[10px] text-gray-400">12 de mayo, 2024 • 3 archivos</p>
              </div>
              <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">Completado</div>
              <ArrowRight size={16} className="text-gray-300" />
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 p-3 border-b border-gray-50 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-green flex-shrink-0">
                <ImageIcon size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900">Radiografía de tórax</h4>
                <p className="text-[10px] text-gray-400">8 de mayo, 2024 • 1 archivo</p>
              </div>
              <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">Completado</div>
              <ArrowRight size={16} className="text-gray-300" />
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 p-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-green flex-shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-900">Resonancia lumbar</h4>
                <p className="text-[10px] text-gray-400">2 de mayo, 2024 • 5 archivos</p>
              </div>
              <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">Completado</div>
              <ArrowRight size={16} className="text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="bg-brand-purple/5 rounded-2xl p-4 flex items-center justify-between border border-brand-purple/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-purple shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">¿Tienes dudas sobre tus pruebas?</h4>
              <p className="text-[10px] text-gray-500">Pregúntale a Vital IA y recibe respuestas claras.</p>
            </div>
          </div>
          <button 
            onClick={onAskQuestion}
            className="bg-white text-brand-purple border border-brand-purple/20 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm"
          >
            Preguntar ahora <MessageSquareText size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
