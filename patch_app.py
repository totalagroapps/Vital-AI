import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to insert the helper function before the 'return' in App.jsx (e.g., above the fetchDocuments method, or inside App component)
helper_func = '''
  const renderExtractedInsights = (extracted_text) => {
    if (!extracted_text) return null;
    
    let data = null;
    try {
      let cleanText = extracted_text.replace(/\\\json/g, '').replace(/\\\/g, '').trim();
      data = JSON.parse(cleanText);
    } catch (e) {
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-500" /> Resumen IA
          </div>
          <p className="whitespace-pre-wrap">{extracted_text}</p>
        </div>
      );
    }

    const severityColors = {
      'verde': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'amarillo': 'bg-amber-100 text-amber-700 border-amber-200',
      'rojo': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    const badgeColor = severityColors[data.severidad?.toLowerCase()] || severityColors['amarillo'];

    return (
      <div className="mt-3 p-3 bg-cyan-50/50 border border-cyan-100 rounded-lg text-xs text-slate-600 space-y-2 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-cyan-800">
            <Sparkles className="w-4 h-4 text-cyan-500" /> Resumen Clínico
          </div>
          {data.severidad && (
            <span className={\px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-wider \\}>
              {data.severidad}
            </span>
          )}
        </div>
        
        {data.resumen && <p className="text-slate-700 font-medium">{data.resumen}</p>}
        
        {data.diagnosticos && data.diagnosticos.length > 0 && (
          <div>
            <strong className="text-slate-700">Diagnósticos:</strong>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
              {data.diagnosticos.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>
        )}
        
        {data.anomalias && data.anomalias.length > 0 && (
          <div>
            <strong className="text-amber-700">Anomalías / Alertas:</strong>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
              {data.anomalias.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
        
        {data.preguntas_sugeridas && data.preguntas_sugeridas.length > 0 && (
          <div className="pt-2 border-t border-cyan-100 mt-2">
            <strong className="text-cyan-800 flex items-center gap-1">Preguntas sugeridas para tu médico:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600">
              {data.preguntas_sugeridas.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  };
'''

content = content.replace("const fetchDocuments = async () => {", helper_func + "\n  const fetchDocuments = async () => {")


old_map_inner = '''                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100 group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-800 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium uppercase text-[10px] tracking-wider border border-slate-200">
                                    {doc.document_type.replace('_', ' ')}
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                                {doc.notes && (
                                  <p className="text-xs text-slate-400 mt-1 truncate max-w-sm" title={doc.notes}>{doc.notes}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-3">
                              <a 
                                href={doc.download_url} 
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-transparent hover:border-cyan-100"
                                title="Descargar/Ver PDF"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                              <button 
                                onClick={() => deleteDocument(doc.id)}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="Eliminar documento"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>'''

new_map_inner = '''                            <div className="flex flex-col w-full">
                              <div className="flex items-start justify-between w-full">
                                <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100 group-hover:scale-105 transition-transform">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800 truncate" title={doc.original_filename}>{doc.original_filename}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium uppercase text-[10px] tracking-wider border border-slate-200">
                                        {doc.document_type.replace('_', ' ')}
                                      </span>
                                      <span>•</span>
                                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                    {doc.notes && (
                                      <p className="text-xs text-slate-400 mt-1 truncate max-w-sm" title={doc.notes}>{doc.notes}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 shrink-0 ml-3">
                                  <a 
                                    href={doc.download_url} 
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-transparent hover:border-cyan-100"
                                    title="Descargar/Ver PDF"
                                  >
                                    <Download className="w-5 h-5" />
                                  </a>
                                  <button 
                                    onClick={() => deleteDocument(doc.id)}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                    title="Eliminar documento"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* RENDER AI SUMMARY */}
                              {renderExtractedInsights(doc.extracted_text)}
                            </div>'''

content = content.replace(old_map_inner, new_map_inner)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
