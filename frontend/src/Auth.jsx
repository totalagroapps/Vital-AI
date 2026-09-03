import React, { useState } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { Stethoscope, Lock, User, ArrowRight, HeartPulse, ChevronLeft, Sparkles, Activity } from 'lucide-react';

export default function Auth({ onLogin, apiUrl, onNavigateDoctorRegister }) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(null); // 'doctor' | 'patient' | null
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let res;
      if (isRegistering) {
        const payload = { username, password, role: selectedRole === 'doctor' ? 'doctor' : 'patient' };
        res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
      }
      
      const data = await res.json();

      if (res.ok) {
        const finalRole = (selectedRole === 'doctor' || selectedRole === 'patient') ? selectedRole : (data.role || 'patient');
        onLogin(data.token ? data.token : data.access_token, finalRole);
      } else {
        const errorMsg = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail[0]?.msg : t("auth_error"));
        setError(errorMsg || t("auth_error"));
      }
    } catch (e) {
      setError(t("server_connection_error"));
    }
    setIsLoading(false);
  };

  // 1. ROLE SELECTION SCREEN
  if (!selectedRole) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-base p-4 relative overflow-hidden font-sans">
        <LanguageSelector variant="floating" />
        
        {/* Modern Background Blur Bubbles */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-teal/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-4xl relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-soft flex items-center justify-center mb-6 relative">
              <Activity className="w-10 h-10 text-brand-purple" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-teal rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
              <span className="text-brand-blue">VITAL</span> AI
            </h1>
            <p className="text-gray-500 mt-3 font-medium text-lg">{t("portal_select")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl px-4">
            {/* Patient Card */}
            <button 
              onClick={() => setSelectedRole('patient')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-[32px] glass-card border border-white/60 bg-white/60 shadow-soft overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-brand-purple/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <HeartPulse className="w-10 h-10 text-brand-purple" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark mb-3">{t("i_am_patient")}</h2>
              <p className="text-gray-500 text-sm text-center max-w-[250px] leading-relaxed">
                {t("patient_desc")}
              </p>
            </button>

            {/* Doctor Card */}
            <button 
              onClick={() => setSelectedRole('doctor')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-[32px] glass-card border border-white/60 bg-white/60 shadow-soft overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-brand-blue/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-20 h-20 rounded-3xl bg-brand-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Stethoscope className="w-10 h-10 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark mb-3">{t("i_am_doctor")}</h2>
              <p className="text-gray-500 text-sm text-center max-w-[250px] leading-relaxed">
                {t("doctor_desc")}
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGIN / REGISTER SCREEN
  const isDoc = selectedRole === 'doctor';
  const theme = {
    bgGradient: isDoc ? 'bg-brand-blue/10' : 'bg-brand-purple/10',
    iconBg: isDoc ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-purple/10 text-brand-purple',
    iconGradient: isDoc ? 'from-brand-blue to-blue-500' : 'from-brand-purple to-brand-purpleLight',
    shadow: isDoc ? 'shadow-blue-500/30' : 'shadow-glow',
    focusRing: isDoc ? 'focus:border-brand-blue focus:ring-brand-blue/20' : 'focus:border-brand-purple focus:ring-brand-purple/20',
    buttonClass: isDoc ? 'bg-brand-blue hover:bg-blue-600 text-white' : 'bg-brand-purple hover:bg-purple-600 text-white',
    title: isDoc ? t("doctor_login_title") : t("patient_portal_title"),
    Icon: isDoc ? Stethoscope : HeartPulse
  };

  return (
    <div className={`flex min-h-screen w-full items-center justify-center bg-base relative overflow-hidden font-sans transition-colors duration-1000`}>
      
      {/* Background decorations */}
      <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3 ${theme.bgGradient}`} />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3 ${isDoc ? 'bg-brand-teal/10' : 'bg-brand-blue/10'}`} />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => {
            setSelectedRole(null);
            setError('');
          }}
          className="absolute -top-16 left-6 text-gray-500 hover:text-brand-dark flex items-center gap-1 text-sm font-bold transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> {t("returning")}
        </button>

        <div className="text-center mb-8">
          <div className={`w-24 h-24 mx-auto rounded-[32px] bg-gradient-to-tr ${theme.iconGradient} flex items-center justify-center shadow-xl ${theme.shadow} mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500`}>
            <theme.Icon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
            {theme.title}
          </h1>
          {isRegistering ? (
            <p className="text-gray-500 mt-2 font-medium">{t("create_new_account")}</p>
          ) : (
            <p className="text-gray-500 mt-2 font-medium">{t("welcome_back")}</p>
          )}
        </div>

        <div className="glass-card rounded-[32px] p-8 border border-white/60 bg-white/70 shadow-xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle reflection */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

          {error && (
            <div className="p-4 rounded-2xl mb-6 text-sm text-center border bg-red-50 border-red-200 text-red-600 font-medium relative z-10 animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">{t("username_email")}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full bg-white/80 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-brand-dark font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal shadow-inner ${theme.focusRing}`}
                  placeholder={isDoc ? t("doctor_placeholder") : t("patient_placeholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">{t("password")}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-white/80 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-brand-dark font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal shadow-inner ${theme.focusRing}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 ${theme.buttonClass} ${theme.shadow}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegistering ? t("create_account") : t("login")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center relative z-10">
            <button 
              type="button"
              onClick={() => {
                if (isDoc && !isRegistering) { onNavigateDoctorRegister(); } else { setIsRegistering(!isRegistering); setError(''); }
              }}
              className={`text-sm font-semibold transition-colors ${isDoc ? 'text-brand-blue hover:text-blue-700' : 'text-brand-purple hover:text-purple-700'}`}
            >
              {isRegistering 
                ? t("already_have_account")
                : t("no_account_register")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
