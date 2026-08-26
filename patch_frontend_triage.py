import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The injection point is exactly before </div>\n            </div>\n          </div>\n        )}\n\n        {/* SETTINGS MODAL */}
injection = '''
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Mi Historial de Triajes
                </h3>
                {patientProfile.triages && patientProfile.triages.length > 0 ? (
                  <div className="space-y-3">
                    {patientProfile.triages.map(t => (
                      <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</span>
                          <span className={	ext-[10px] px-2 py-0.5 rounded-full uppercase font-bold border }>
                            {t.status === 'closed_red' ? 'Urgencia' : t.status === 'closed_yellow' ? 'Atención' : 'Normal'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.final_report}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No hay consultas previas de triaje.</p>
                )}
              </div>
'''

search_str = '''                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS MODAL */}'''

replace_str = f'''                </div>
              </div>
{injection}
            </div>
          </div>
        )}}

        {{/* SETTINGS MODAL */}}'''

if 'Mi Historial de Triajes' not in content:
    content = content.replace(search_str, replace_str)
    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched frontend UI")
else:
    print("Already patched frontend UI")
