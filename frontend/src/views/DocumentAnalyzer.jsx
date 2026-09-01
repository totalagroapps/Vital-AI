import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MoreHorizontal, ShieldCheck, CloudUpload, FileText, Image as ImageIcon, Activity, Beaker, Sparkles, MessageSquareText, File, Clock, ChevronRight } from 'lucide-react';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.bmp,.gif';
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/bmp', 'image/gif'];

const DocumentAnalyzer = ({ onBack, onUpload, isUploading, apiUrl, authHeaders, onNavigateToChat }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch real documents from backend
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/me/documents`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (e) {
        console.error('Error fetching documents:', e);
      } finally {
        setLoadingDocs(false);
      }
    };
    if (apiUrl && authHeaders) fetchDocs();
    else setLoadingDocs(false);
  }, [apiUrl, authHeaders]);

  const handleFileSelected = (file) => {
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|bmp|gif)$/i)) {
      alert(`Formato no soportado: ${file.type || file.name}.\n\nFormatos aceptados: PDF, JPG, PNG, WEBP, HEIC, BMP, GIF.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El límite es 50 MB.');
      return;
    }
    onUpload(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
  };

  // Drag & Drop handlers
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }, []);

  const docTypeLabel = (type) => {
    if (!type) return 'Documento';
    if (type === 'medical_image') return 'Imagen médica';
    if (type === 'pdf_report') return 'Informe PDF';
    return type.replace(/_/g, ' ');
  };

  const docTypeIcon = (type) => {
    if (type === 'medical_image') return <ImageIcon size={18} className="text-blue-500" />;
    return <FileText size={18} className="text-brand-green" />;
  };

  return (
    <div className="min-h-screen bg-base font-sans relative overflow-x-hidden pb-28">

      {/* Background */}
      <div className="absolute top-0 right-0 w-full h-[500px] z-0 overflow-hidden pointer-events-none">
        <img
          src="/images/abstract_woman_bg.jpg"
          alt="AI Hologram"
          className="absolute top-0 right-0 w-[85%] md:w-[60%] lg:w-[50%] h-[400px] md:h-full object-cover opacity-90"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/60 to-base" />
      </div>

      <div className="relative z-10 px-6 pt-12">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-gray-900" size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Analiza tus pruebas médicas</h2>
          <div className="w-10 h-10" /> {/* spacer */}
        </div>

        {/* Hero */}
        <div className="mb-6 relative">
          <div className="absolute right-0 top-0 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded-md">IA</div>
          <h2 className="text-[32px] leading-tight font-bold text-gray-900 mb-4 max-w-[80%]">
            Sube tus pruebas <br />
            y obtén respuestas <br />
            <span className="text-brand-green">claras y comprensibles</span>
          </h2>
          <p className="text-sm text-gray-600 max-w-[70%]">
            VitalAI analiza tus informes, radiografías, recetas y analíticas para explicarte qué significan.
          </p>
        </div>

        {/* Security Badge */}
        <div className="glass-card rounded-2xl p-4 flex gap-3 items-center w-full max-w-sm mb-8">
          <div className="bg-brand-green/10 p-2 rounded-xl text-brand-green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Tu información está protegida</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Cumplimos con los más altos estándares de privacidad.</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`bg-white rounded-[32px] p-6 shadow-soft border-2 border-dashed mb-8 transition-all flex flex-col items-center text-center ${
            isDragging ? 'border-brand-green bg-brand-green/5 scale-[1.01]' : 'border-gray-200'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-brand-green text-white' : 'bg-brand-green/10 text-brand-green'}`}>
            <CloudUpload size={32} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">
            {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra y suelta tus archivos aquí'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">O selecciona desde tu dispositivo</p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={ACCEPTED_TYPES}
          />

          <button
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
            className="bg-brand-green hover:bg-brand-green/90 text-white font-bold py-3 px-8 rounded-full w-full mb-4 transition-colors disabled:opacity-50"
          >
            {isUploading ? '⏳ Procesando...' : 'Seleccionar archivos'}
          </button>

          <p className="text-[11px] text-gray-400">
            Formatos: PDF, JPG, PNG, WEBP, HEIC<br />
            Tamaño máximo: 50 MB por archivo
          </p>
        </div>

        {/* Supported Types */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4">¿Qué tipos de pruebas puedes subir?</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { icon: <FileText className="text-brand-green mb-2" size={24} />, label: 'Informes', sub: 'PDF' },
              { icon: <ImageIcon className="text-blue-500 mb-2" size={24} />, label: 'Radiografías', sub: 'JPG, PNG' },
              { icon: <Activity className="text-purple-500 mb-2" size={24} />, label: 'Recetas', sub: 'PDF, Foto' },
              { icon: <Beaker className="text-amber-500 mb-2" size={24} />, label: 'Analíticas', sub: 'PDF' },
              { icon: <File className="text-gray-500 mb-2" size={24} />, label: 'Incapacidades', sub: 'PDF, Foto' },
            ].map((item) => (
              <div key={item.label} className="min-w-[100px] bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center flex-shrink-0">
                {item.icon}
                <span className="text-[11px] font-bold text-gray-900">{item.label}</span>
                <span className="text-[9px] text-gray-400">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real Document History */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900">Últimos análisis realizados</h3>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingDocs ? (
              <div className="p-6 text-center text-sm text-gray-400">Cargando historial...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                  <CloudUpload size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Aún no has subido documentos</p>
                <p className="text-xs text-gray-400">Sube tu primera prueba médica y VitalAI te la explicará al instante.</p>
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${idx < documents.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {docTypeIcon(doc.document_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{doc.filename || 'Documento sin nombre'}</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={9} />
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      {' • '}
                      {docTypeLabel(doc.document_type)}
                    </p>
                  </div>
                  <div className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0">Analizado</div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ask AI Banner */}
        <div
          onClick={onNavigateToChat}
          className="bg-brand-purple/5 rounded-2xl p-4 flex items-center justify-between border border-brand-purple/10 cursor-pointer hover:bg-brand-purple/10 transition-colors mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-purple shadow-sm flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">¿Tienes dudas sobre tus pruebas?</h4>
              <p className="text-[10px] text-gray-500">Pregúntale a VitalAI y recibe respuestas claras.</p>
            </div>
          </div>
          <button className="bg-white text-brand-purple border border-brand-purple/20 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm flex-shrink-0">
            Preguntar ahora <MessageSquareText size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DocumentAnalyzer;
