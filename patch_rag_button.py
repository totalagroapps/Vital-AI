import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add BookOpen to imports if missing
if 'BookOpen,' not in content:
    content = content.replace("} from 'lucide-react';", "    BookOpen,\n} from 'lucide-react';")

# 2. Update the grid and add the 4th button
grid_pattern = r'className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4"'
new_grid = 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-4"'
content = re.sub(grid_pattern, new_grid, content)

# 3. Add the 4th button next to the Triage button
triage_button_pattern = re.compile(r'(<div className="font-semibold text-xs text-slate-800">Iniciar Triaje Clínico</div>\s*<div className="text-\[11px\] text-slate-600 mt-1">Evaluación de síntomas paso a paso por IA\.</div>\s*</button>)', re.DOTALL)

rag_button = '''
              <button
                onClick={() => {
                  alert('Funcionalidad RAG de consulta de artículos en desarrollo por tu compañera.');
                }}
                className="p-3.5 glass-card rounded-xl border border-slate-200 shadow-sm hover:border-cyan-500/40 text-left transition-all hover:scale-[1.02] group"
              >
                <BookOpen className="w-5 h-5 text-fuchsia-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-xs text-slate-800">Consulta Artículos Médicos</div>
                <div className="text-[11px] text-slate-600 mt-1">Consulta nuestra base de conocimientos (RAG).</div>
              </button>'''

if 'Consulta Artículos Médicos' not in content:
    content = triage_button_pattern.sub(r'\1' + rag_button, content)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added RAG button and updated grid.")
