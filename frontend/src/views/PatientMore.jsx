import React from 'react';
import { 
  FileText, Activity, Users, Apple, AlertCircle, 
  Shield, Settings, Moon, Type, Download, LogOut, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const PatientMore = ({ onNavigate, onLogout }) => {
  const handleFeature = (feature) => {
    alert(`Módulo '${feature}' en desarrollo. ¡Próximamente en VitalAI!`);
  };

  const sections = [
    {
      title: 'Mi Salud',
      items: [
        { icon: <FileText size={20} />, title: 'Bóveda de Exámenes', desc: 'Sube tus resultados médicos', action: () => handleFeature('Bóveda de Exámenes'), color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: <Activity size={20} />, title: 'Wearables y Relojes', desc: 'Conecta Apple Health o Google Fit', action: () => handleFeature('Wearables'), color: 'text-green-500', bg: 'bg-green-50' },
        { icon: <Apple size={20} />, title: 'Nutrición IA', desc: 'Dietas y consejos personalizados', action: () => handleFeature('Nutrición IA'), color: 'text-orange-500', bg: 'bg-orange-50' }
      ]
    },
    {
      title: 'Seguridad y Familia',
      items: [
        { icon: <AlertCircle size={20} />, title: 'Botón S.O.S', desc: 'Configura tus alertas de emergencia', action: () => handleFeature('Botón S.O.S'), color: 'text-red-500', bg: 'bg-red-50' },
        { icon: <Users size={20} />, title: 'Red Familiar', desc: 'Añade cuidadores a tu cuenta', action: () => handleFeature('Red Familiar'), color: 'text-brand-purple', bg: 'bg-purple-50' },
        { icon: <Shield size={20} />, title: 'Seguro Médico', desc: 'Gestiona tu póliza y cobertura', action: () => handleFeature('Seguro Médico'), color: 'text-indigo-500', bg: 'bg-indigo-50' }
      ]
    },
    {
      title: 'Preferencias',
      items: [
        { icon: <Type size={20} />, title: 'Accesibilidad', desc: 'Tamaño de letra y contraste', action: () => handleFeature('Accesibilidad'), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Moon size={20} />, title: 'Modo Oscuro', desc: 'Cambia el tema visual', action: () => handleFeature('Tema Visual'), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Download size={20} />, title: 'Mis Datos', desc: 'Descarga o elimina tu información', action: () => handleFeature('Privacidad'), color: 'text-slate-600', bg: 'bg-slate-100' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans selection:bg-brand-purple/20">
      <div className="relative z-10 px-6 pt-12 flex-1">
        <div className="mb-6">
          <h2 className="text-[28px] leading-tight font-bold text-gray-900 mb-2">
            Más <span className="text-brand-purple">Opciones</span>
          </h2>
          <p className="text-sm text-gray-500">
            Configura y personaliza tu experiencia en VitalAI.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">{section.title}</h3>
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
                {section.items.map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${i !== section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <div className="pt-4">
            <button 
              onClick={onLogout}
              className="w-full bg-white border border-red-100 rounded-3xl p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors font-bold shadow-soft"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        </div>

      </div>
      <BottomNav activeTab="more" onTabChange={(tab) => onNavigate(tab)} />
    </div>
  );
};

export default PatientMore;
