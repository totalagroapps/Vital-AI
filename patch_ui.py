import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '                        <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.final_report}</div>'
new_block = '''                        <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.final_report}</div>
                        {t.recommended_specialty && (
                          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5" />
                                Derivación Inteligente
                              </p>
                              <p className="text-sm font-semibold text-indigo-900">Especialidad Recomendada: {t.recommended_specialty}</p>
                            </div>
                            <button 
                              onClick={() => {
                                setShowHistory(false);
                                setShowDoctors(true);
                              }}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors shadow-sm flex-shrink-0"
                            >
                              Ver Directorio Médico
                            </button>
                          </div>
                        )}'''

content = content.replace(old_block, new_block)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected Intelligent Referral UI")
