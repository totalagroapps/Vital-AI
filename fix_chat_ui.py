import os
import re

file_path = 'frontend/src/views/PatientChat.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add new imports
new_imports = "import { ArrowLeft, Send, Mic, Paperclip, ImageIcon, FileText, Bot, Shield, AlertCircle, Activity, Stethoscope } from 'lucide-react';"
content = re.sub(r'import \{ ArrowLeft.*?\} from \'lucide-react\';', new_imports, content, flags=re.DOTALL)

# Add props
props_pattern = r'const PatientChat = \(\{([^}]*)\}\) => \{'
new_props = r'const PatientChat = ({\1, patientProfile, sessions}) => {'
content = re.sub(props_pattern, new_props, content)

# Change outer layout
outer_pattern = r'<div className="flex flex-col h-\[100dvh\] bg-base font-sans overflow-hidden relative">'
new_outer = """<div className="flex h-[100dvh] bg-base font-sans overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full relative border-r border-gray-200">"""
content = content.replace(outer_pattern, new_outer)

# Inject sidebar at the bottom before last closing div
sidebar = """
      </div>
      
      {/* Medical Context Sidebar - desktop only */}
      {patientProfile && (
        <div className="hidden lg:flex lg:flex-col w-80 bg-white shadow-xl z-20 overflow-y-auto shrink-0">
           <div className="p-5 border-b border-gray-100 bg-slate-50/50">
             <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-4">
               <Shield size={14} className="text-brand-purple" /> Contexto Clínico Activo
             </h3>
             
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple font-bold">
                 {patientProfile.full_name?.charAt(0) || 'P'}
               </div>
               <div>
                 <p className="font-bold text-sm text-gray-900 truncate max-w-[180px]">{patientProfile.full_name || 'Paciente'}</p>
                 <p className="text-[10px] text-gray-500 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Identidad Verificada
                 </p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-2 text-xs">
               <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                 <p className="text-gray-400 mb-0.5 text-[10px]">Tipo de Sangre</p>
                 <p className="font-bold text-red-500">{patientProfile.blood_type || '--'}</p>
               </div>
               <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                 <p className="text-gray-400 mb-0.5 text-[10px]">Edad</p>
                 <p className="font-bold text-gray-800">{patientProfile.date_of_birth ? new Date().getFullYear() - new Date(patientProfile.date_of_birth).getFullYear() : '--'} años</p>
               </div>
             </div>
           </div>

           <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><AlertCircle size={14} className="text-brand-orange"/> Alergias Registradas</h4>
                <p className="text-xs text-gray-600 bg-orange-50 p-2.5 rounded-lg border border-orange-100">{patientProfile.allergies || 'Ninguna registrada'}</p>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Activity size={14} className="text-blue-500"/> Enf. Crónicas</h4>
                <p className="text-xs text-gray-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100">{patientProfile.chronic_conditions || 'Ninguna registrada'}</p>
              </div>
              
              <div>
                <h4 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Stethoscope size={14} className="text-brand-green"/> Medicación Actual</h4>
                <p className="text-xs text-gray-600 bg-green-50 p-2.5 rounded-lg border border-green-100">{patientProfile.current_medications || 'Ninguna registrada'}</p>
              </div>
           </div>
           
           {sessions && sessions.length > 0 && (
             <div className="p-5 border-t border-gray-100">
               <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Historial Reciente</h4>
               <div className="space-y-2">
                 {sessions.slice(0, 2).map((s, i) => (
                   <div key={i} className="text-[10px] p-2 bg-slate-50 rounded border border-slate-100 text-slate-600 truncate">
                     {new Date(s.created_at).toLocaleDateString()} - Triaje Médico
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n};", sidebar + "    </div>\n  );\n};")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PatientChat.jsx with medical sidebar")
