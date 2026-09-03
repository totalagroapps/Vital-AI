import os

file_path = 'frontend/src/views/PatientHomeDesktop.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const PatientHomeDesktop = ({ onNavigate }) => {', 'const PatientHomeDesktop = ({ onNavigate, onLogout }) => {')
content = content.replace("import { Stethoscope, FileText, FolderHeart, UserSquare2, Brain, Activity, Folder, User, ArrowRight, Lock, Info } from 'lucide-react';", "import { Stethoscope, FileText, FolderHeart, UserSquare2, Brain, Activity, Folder, User, ArrowRight, Lock, Info, Bell } from 'lucide-react';")

target_header = '''        <div>
            {/* Header Logo */}
            <div className="flex items-center gap-2 mb-8">
               <div className="text-brand-purple">
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                   <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2" />
                   <path d="M8 13h8" className="text-brand-blue" strokeWidth="2" />
                 </svg>
               </div>
               <span className="font-bold text-xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">IA</span></span>
            </div>'''

repl_header = '''        <div>
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
                 <span className="font-bold text-xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">IA</span></span>
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
            </div>'''

if target_header in content:
    content = content.replace(target_header, repl_header)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added logout and profile to PatientHomeDesktop")
else:
    print("Target block not found")
