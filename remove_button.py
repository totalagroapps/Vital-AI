import os

file_path = 'frontend/src/views/PatientHomeDesktop.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''               <button onClick={() => onNavigate('triage')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg px-20 py-3 rounded-full shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-3 mb-4 hover:scale-105">
                 Comenzar <ArrowRight size={20}/>
               </button>'''

if target in content:
    content = content.replace(target, '')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Removed Comenzar button")
else:
    print("Target block not found")
