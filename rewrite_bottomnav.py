import os

file_path = 'frontend/src/components/BottomNav.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const BottomNav = ({ activeTab, onTabChange }) => {", "const BottomNav = ({ activeTab, onTabChange, isDoctor }) => {\n  const activeColor = isDoctor ? 'text-brand-blue' : 'text-brand-purple';\n  const activeFill = isDoctor ? 'fill-brand-blue/20' : 'fill-brand-purple/20';")

content = content.replace("text-brand-purple", "")
content = content.replace("fill-brand-purple/20", "")
content = content.replace("from-brand-purple to-brand-purpleLight", "")
content = content.replace("className={lex flex-col", "className={lex flex-col") # just a marker

# Oh, since we're injecting JS template literals, we need to make sure we don't break existing ones
# Instead of a complex replace, let's just rewrite the file fully for safety

full_code = '''import React from "react";
import { Home, Users, Calendar, MoreHorizontal, Sparkles } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange, isDoctor }) => {
  const activeColor = isDoctor ? "text-brand-blue" : "text-brand-purple";
  const activeFill = isDoctor ? "fill-brand-blue/20" : "fill-brand-purple/20";
  const glowShadow = isDoctor ? "shadow-blue-500/50" : "shadow-glow";
  const gradient = isDoctor ? "from-brand-blue to-blue-500" : "from-brand-purple to-brand-purpleLight";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-6 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        
        <button 
          onClick={() => onTabChange("home")}
          className={lex flex-col items-center gap-1 }
        >
          <Home size={24} className={activeTab === "home" ? activeFill : ""} />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange("patients")}
          className={lex flex-col items-center gap-1 }
        >
          <Users size={24} className={activeTab === "patients" ? activeFill : ""} />
          <span className="text-[10px] font-medium">Pacientes</span>
        </button>

        <div className="relative -top-6 flex justify-center w-16">
          <button 
            onClick={() => onTabChange("ai")}
            className={bsolute bg-gradient-to-tr  text-white rounded-full p-4 shadow-lg  flex items-center justify-center transform transition active:scale-95}
          >
            <Sparkles size={28} className="fill-white/20" />
          </button>
        </div>

        <button 
          onClick={() => onTabChange("agenda")}
          className={lex flex-col items-center gap-1 }
        >
          <Calendar size={24} className={activeTab === "agenda" ? activeFill : ""} />
          <span className="text-[10px] font-medium">Agenda</span>
        </button>

        <button 
          onClick={() => onTabChange("more")}
          className={lex flex-col items-center gap-1 }
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium">Más</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;'''

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(full_code)

print("BottomNav rewritten for isDoctor prop!")
