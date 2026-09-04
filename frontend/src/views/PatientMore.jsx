import React from 'react';
import { 
  FileText, Activity, Users, Apple, AlertCircle, 
  Shield, Settings, Moon, Type, Download, LogOut, ChevronRight
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const PatientMore = ({ onNavigate, onLogout }) => {
  const { t } = useLanguage();

  const handleFeature = (feature) => {
    alert(t('feature_in_development', { feature }));
  };

  const sections = [
    {
      title: t('my_health'),
      items: [
        { icon: <FileText size={20} />, title: t('exam_vault'), desc: t('upload_medical_results'), action: () => handleFeature(t('exam_vault')), color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: <Activity size={20} />, title: t('wearables_and_watches'), desc: t('connect_health_apps'), action: () => handleFeature(t('wearables')), color: 'text-green-500', bg: 'bg-green-50' },
        { icon: <Apple size={20} />, title: t('nutrition_ai'), desc: t('personalized_diets_advice'), action: () => handleFeature(t('nutrition_ai')), color: 'text-orange-500', bg: 'bg-orange-50' }
      ]
    },
    {
      title: t('security_and_family'),
      items: [
        { icon: <AlertCircle size={20} />, title: t('sos_button'), desc: t('configure_emergency_alerts'), action: () => handleFeature(t('sos_button')), color: 'text-red-500', bg: 'bg-red-50' },
        { icon: <Users size={20} />, title: t('family_network'), desc: t('add_caregivers'), action: () => handleFeature(t('family_network')), color: 'text-brand-purple', bg: 'bg-purple-50' },
        { icon: <Shield size={20} />, title: t('medical_insurance'), desc: t('manage_policy_coverage'), action: () => handleFeature(t('medical_insurance')), color: 'text-indigo-500', bg: 'bg-indigo-50' }
      ]
    },
    {
      title: t('preferences'),
      items: [
        { icon: <Type size={20} />, title: t('accessibility'), desc: t('font_size_contrast'), action: () => handleFeature(t('accessibility')), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Moon size={20} />, title: t('dark_mode'), desc: t('change_visual_theme'), action: () => handleFeature(t('visual_theme')), color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: <Download size={20} />, title: t('my_data'), desc: t('download_delete_info'), action: () => handleFeature(t('privacy')), color: 'text-slate-600', bg: 'bg-slate-100' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans selection:bg-brand-purple/20">
      <div className="relative z-10 px-6 pt-12 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[28px] leading-tight font-bold text-gray-900 mb-2">
              {t('more_options')} <span className="text-brand-purple">{t('options')}</span>
            </h2>
            <p className="text-sm text-gray-500">
              {t('configure_personalize_experience')}
            </p>
          </div>
          <LanguageSelector />
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
