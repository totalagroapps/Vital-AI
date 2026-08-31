import os

file_path = 'frontend/src/views/PatientHomeDesktop.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the floating cards block
target = '''         {/* Floating Cards */}
         <div className="absolute top-[15%] left-[5%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('triage')}>
             <div className="text-brand-purple bg-brand-purple/10 p-2 rounded-full"><Stethoscope size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Analiza tus<br/>síntomas</span>
         </div>
         <div className="absolute top-[45%] left-0 bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float-delayed w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('documents')}>
             <div className="text-brand-green bg-brand-green/10 p-2 rounded-full"><FileText size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Entiende tus<br/>pruebas e informes</span>
         </div>
         <div className="absolute top-[10%] right-[15%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('history')}>
             <div className="text-brand-blue bg-brand-blue/10 p-2 rounded-full"><FolderHeart size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Organiza todo<br/>tu historial</span>
         </div>
         <div className="absolute top-[35%] right-[5%] bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/60 animate-float-delayed w-max z-10 hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => onNavigate('doctors')}>
             <div className="text-brand-orange bg-brand-orange/10 p-2 rounded-full"><UserSquare2 size={20}/></div>
             <span className="font-semibold text-xs text-gray-800 leading-tight">Conéctate con<br/>los mejores médicos</span>
         </div>
         <div className="absolute bottom-[20%] left-[40%] bg-white/95 backdrop-blur rounded-full px-6 py-3 shadow-xl border border-white/60 flex items-center justify-center text-center w-max z-10">
            <span className="text-sm text-gray-700 font-medium leading-relaxed">Inteligencia Artificial avanzada<br/>al servicio de <strong className="text-brand-purple font-bold">tu salud</strong></span>
         </div>'''

repl = '''         {/* Floating Cards */}
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
         </div>'''

if target in content:
    content = content.replace(target, repl)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated floating cards successfully")
else:
    print("Target block not found. Looking at snippet:")
    print(content[500:1500])
