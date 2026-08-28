import React from "react";
import { Home, Users, Calendar, MoreHorizontal, Sparkles } from "lucide-react";

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-6 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        
        <button 
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-brand-purple" : "text-gray-400"}`}
        >
          <Home size={24} className={activeTab === "home" ? "fill-brand-purple/20" : ""} />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange("patients")}
          className={`flex flex-col items-center gap-1 ${activeTab === "patients" ? "text-brand-purple" : "text-gray-400"}`}
        >
          <Users size={24} className={activeTab === "patients" ? "fill-brand-purple/20" : ""} />
          <span className="text-[10px] font-medium">Pacientes</span>
        </button>

        <div className="relative -top-6 flex justify-center w-16">
          <button 
            onClick={() => onTabChange("ai")}
            className="absolute bg-gradient-to-tr from-brand-purple to-brand-purpleLight text-white rounded-full p-4 shadow-glow flex items-center justify-center transform transition active:scale-95"
          >
            <Sparkles size={28} className="fill-white/20" />
          </button>
        </div>

        <button 
          onClick={() => onTabChange("agenda")}
          className={`flex flex-col items-center gap-1 ${activeTab === "agenda" ? "text-brand-purple" : "text-gray-400"}`}
        >
          <Calendar size={24} className={activeTab === "agenda" ? "fill-brand-purple/20" : ""} />
          <span className="text-[10px] font-medium">Agenda</span>
        </button>

        <button 
          onClick={() => onTabChange("more")}
          className={`flex flex-col items-center gap-1 ${activeTab === "more" ? "text-brand-purple" : "text-gray-400"}`}
        >
          <MoreHorizontal size={24} />
          <span className="text-[10px] font-medium">Más</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
