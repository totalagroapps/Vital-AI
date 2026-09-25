import React from 'react';
import { 
  FileText, Activity, Users, Apple, AlertCircle, 
  Shield, Moon, Type, Download, LogOut, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientMore = ({ onNavigate, onLogout }) => {
  const { t } = useLanguage();

  // Cada opción lleva a una pantalla real; las que aún no existen se muestran como «Próximamente»
  // (antes abrían un alert de «en desarrollo» y parecían botones rotos).
  const sections = [
    {
      title: t('my_health'),
      items: [
        { icon: <FileText size={20} />, title: t('exam_vault'), desc: t('upload_medical_results'), screen: 'documents', color: 'text-brand', bg: 'bg-mivor-blueSoft' },
        { icon: <Activity size={20} />, title: t('wearables_and_watches'), desc: t('connect_health_apps'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { icon: <Apple size={20} />, title: t('nutrition_ai'), desc: t('personalized_diets_advice'), color: 'text-orange-500', bg: 'bg-orange-50' }
      ]
    },
    {
      title: t('security_and_family'),
      items: [
        { icon: <AlertCircle size={20} />, title: t('sos_button'), desc: t('configure_emergency_alerts'), color: 'text-red-500', bg: 'bg-red-50' },
        { icon: <Users size={20} />, title: t('family_network'), desc: t('add_caregivers'), color: 'text-violet-600', bg: 'bg-violet-50' },
        { icon: <Shield size={20} />, title: t('medical_insurance'), desc: t('manage_policy_coverage'), screen: 'history', color: 'text-brand', bg: 'bg-mivor-blueSoft' }
      ]
    },
    {
      title: t('preferences'),
      items: [
        { icon: <Type size={20} />, title: t('accessibility'), desc: t('font_size_contrast'), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Moon size={20} />, title: t('dark_mode'), desc: t('change_visual_theme'), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Download size={20} />, title: t('my_data'), desc: t('download_delete_info'), color: 'text-slate-600', bg: 'bg-slate-100' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-base flex flex-col pb-24 font-sans selection:bg-brand/20">
      <div className="relative z-10 px-6 pt-12 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[28px] leading-tight font-black text-mivor-navy tracking-tight mb-2">
              {t('more_options')} <span className="text-brand">{t('options')}</span>
            </h2>
            <p className="text-sm text-slate-500">
              {t('configure_personalize_experience')}
            </p>
          </div>
          <LanguageSelector />
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">{section.title}</h3>
              <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={item.screen ? () => onNavigate(item.screen) : undefined}
                    disabled={!item.screen}
                    aria-disabled={!item.screen}
                    className={`w-full flex items-center justify-between p-4 transition-colors text-left ${item.screen ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'} ${i !== section.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className={`flex items-center gap-4 ${item.screen ? '' : 'opacity-60'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.bg} ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-mivor-navy">{item.title}</h4>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    {item.screen ? (
                      <ChevronRight size={18} className="text-slate-300" />
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded-full shrink-0">{t('coming_soon_badge')}</span>
                    )}
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
              {t('logout')}
            </button>
          </div>
        </div>

      </div>
      <BottomNav activeTab="more" onTabChange={(tab) => onNavigate(tab)} />
    </div>
  );
};

export default PatientMore;
