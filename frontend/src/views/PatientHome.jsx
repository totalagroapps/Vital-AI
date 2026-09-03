import React from 'react';
import PatientHomeDesktop from './PatientHomeDesktop';
import { Stethoscope, BookOpen, FileText, FolderHeart, UserSquare2, MessageSquareText, ShieldCheck, ArrowRight, Sparkles, LogOut, Bell, Search, Mic } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const PatientHome = ({ onNavigate, onLogout }) => {
  const { t } = useLanguage();
  return (
    <>
    <div className="block lg:hidden flex-1 w-full relative min-h-screen pb-24 font-sans bg-base overflow-x-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-[80%] md:w-[60%] lg:w-[50%] h-[400px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top opacity-90 mix-blend-multiply"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, transparent 20%, black 70%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 20%, black 70%)' }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-base to-transparent" />
      </div>

      <div className="relative z-10 px-4 pt-2">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="text-brand-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  <path d="M12 21.5V13" className="text-brand-blue" strokeWidth="2" />
                  <path d="M8 13h8" className="text-brand-blue" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-brand-dark">VITAL <span className="text-brand-purple">AI</span></span>
            </div>
            <span className="text-[11px] text-content-secondary font-medium ml-8 -mt-1 tracking-wide">{t("your_health_understood_by_ai")}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center text-brand-purple shadow-sm hover:shadow-md transition-shadow">
                <Bell size={12} />
              </button>
              <div className="absolute top-0 right-0 w-3 h-3 bg-brand-purple rounded-full border-2 border-white"></div>
            </div>
            <button onClick={onLogout} className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative mt-4 mb-6 max-w-full md:max-w-[70%] animate-fade-in-left opacity-0" style={{ animationDelay: '100ms' }}>
          <div className="absolute -inset-4 bg-gradient-to-r from-base via-base/80 to-transparent blur-md z-[-1] pointer-events-none"></div>
          <h2 className="relative z-10 text-[22px] leading-tight font-bold text-content-primary mb-1.5">
            {t("welcome")},<br/>
            <span className="text-brand-purple drop-shadow-sm">{t("we_are_here_to_care_for_your_health")}</span>
          </h2>
          <p className="relative z-10 text-content-secondary text-[11px] leading-snug max-w-[90%] font-medium">
            {t("access_all_tools_of_vitalai_to_understand_manage_and_improve_your_wellbeing")}
          </p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          
          {/* Card 1 */}
          <button onClick={() => onNavigate('triage')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-3 bg-brand-purple/5">
                <Stethoscope size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>{t("understand_your_symptoms")}</h4>
            <p className="text-[9px] md:text-[11px] leading-tight mb-4 flex-1 pr-1" style={{ color: "#64748B" }}>
              {t("describe_what_you_feel_and_get_possible_causes_explanations_and_advice")}
            </p>
            <div className="absolute bottom-2 right-2 w-5 h-5 md:w-7 md:h-7 bg-brand-purple rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={12} />
            </div>
          </button>

          {/* Card 2 */}
          <button onClick={() => onNavigate('documents')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-blue/20 flex items-center justify-center text-brand-blue mb-3 bg-brand-blue/5">
                <FileText size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>{t("analyze_your_medical_tests")}</h4>
            <p className="text-[9px] md:text-[11px] leading-tight mb-4 flex-1 pr-1" style={{ color: "#64748B" }}>
              {t("upload_your_reports_xrays_and_analytics_the_ai_analyzes_them_for_you")}
            </p>
            <div className="absolute bottom-2 right-2 w-5 h-5 md:w-7 md:h-7 bg-brand-blue rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={12} />
            </div>
          </button>

          {/* Card 3 */}
          <button onClick={() => onNavigate('history')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-green/20 flex items-center justify-center text-brand-green mb-3 bg-brand-green/5">
                <FolderHeart size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>{t("organize_your_health_history")}</h4>
            <p className="text-[9px] md:text-[11px] leading-tight mb-4 flex-1 pr-1" style={{ color: "#64748B" }}>
              {t("centralize_your_medical_information_and_have_everything_at_hand")}
            </p>
            <div className="absolute bottom-2 right-2 w-5 h-5 md:w-7 md:h-7 bg-brand-green rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={12} />
            </div>
          </button>

          {/* Card 4 */}
          <button onClick={() => onNavigate('search')} className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full">
            <div className="mb-1.5">
              <div className="w-6 h-6 rounded-full border border-brand-orange/20 flex items-center justify-center text-brand-orange mb-3 bg-brand-orange/5">
                <BookOpen size={12} />
              </div>
            </div>
            <h4 className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2" style={{ color: "#1E293B" }}>{t("medical_library_rag")}</h4>
            <p className="text-[9px] md:text-[11px] leading-tight mb-4 flex-1 pr-1" style={{ color: "#64748B" }}>
              {t("search_in_clinical_studies_and_scientific_literature_with_ai")}
            </p>
            <div className="absolute bottom-2 right-2 w-5 h-5 md:w-7 md:h-7 bg-brand-orange rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
              <ArrowRight size={12} />
            </div>
          </button>
        </div>

        {/* AI Banner Footer */}
        <div className="bg-white/90 backdrop-blur-xl border border-brand-purple/10 rounded-2xl p-2.5 md:p-5 shadow-sm mb-2 hover:shadow-md transition-shadow duration-300" style={{ animationDelay: "550ms" }}>
          <div className="flex items-start gap-2 mb-2">
            <div className="bg-brand-purple/5 p-2 rounded-full text-brand-purple">
              <Sparkles size={12} />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-brand-dark text-[12px] mb-0.5">{t("ask_vitalai")}</h5>
              <p className="text-[11px] text-content-secondary leading-relaxed pr-2">
                {t("ask_about_your_health_or_discover_the_latest_medical_and_scientific_advancements_on_any_disease")}
              </p>
            </div>
          </div>
          
          <div className="relative cursor-text" onClick={() => onNavigate('general_chat')}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-secondary/70">
              <Search size={12} />
            </div>
            <div className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-8 pr-10 text-[10px] text-content-secondary/70 font-medium shadow-inner">
              {t("example_why_do_i_have_a_headache")}
            </div>
            <div 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem('autoStartMic', 'true');
                onNavigate('triage');
              }}
            >
              <Mic size={12} />
            </div>
          </div>
        </div>

      </div>
    </div>
    
    <div className="hidden lg:block">
      <PatientHomeDesktop onNavigate={onNavigate} onLogout={onLogout} />
    </div>
    </>
  );
};

export default PatientHome;