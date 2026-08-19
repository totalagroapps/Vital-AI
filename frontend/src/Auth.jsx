import React, { useState } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { Stethoscope, Lock, User, ArrowRight, HeartPulse, Activity, ChevronLeft } from 'lucide-react';

export default function Auth({ onLogin, apiUrl }) {
  const [selectedRole, setSelectedRole] = useState(null); // 'doctor' | 'patient' | null
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.access_token, selectedRole);
      } else {
        setError(data.detail || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/50 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 tracking-tight">MedIA Hub</h1>
            <p className="text-slate-600 mt-3 font-medium text-lg">Selecciona tu portal de acceso</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
            {/* Patient Card */}
            <button 
              onClick={() => setSelectedRole('patient')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-rose-500/20 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-rose-500/50 hover:bg-white/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">
                <HeartPulse className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-rose-100 mb-2">{t("i_am_patient")}</h2>
              <p className="text-rose-200/60 text-sm text-center">Accede a tu historial clínico, resultados y triaje inteligente.</p>
            </button>

            {/* Doctor Card */}
            <button 
              onClick={() => setSelectedRole('doctor')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-indigo-500/20 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-indigo-500/50 hover:bg-white/80"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Stethoscope className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-indigo-100 mb-2">{t("i_am_doctor")}</h2>
              <p className="text-indigo-200/60 text-sm text-center">Gestiona tus pacientes, revisa expedientes y consulta a la IA.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Theme configuration based on role
  const isDoc = selectedRole === 'doctor';
  const theme = {
    bgGradient: isDoc ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))]' : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(244,63,94,0.15),rgba(255,255,255,0))]',
    iconGradient: isDoc ? 'from-indigo-600 to-blue-400' : 'from-rose-500 to-pink-400',
    shadow: isDoc ? 'shadow-indigo-500/20' : 'shadow-rose-500/20',
    textGradient: isDoc ? 'from-indigo-300 to-blue-300' : 'from-rose-300 to-pink-300',
    focusRing: isDoc ? 'focus:border-indigo-500 focus:ring-indigo-500' : 'focus:border-rose-500 focus:ring-rose-500',
    buttonBg: isDoc ? 'from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-indigo-500/20' : 'from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 shadow-rose-500/20',
    title: isDoc ? t("doctor_login_title") : 'Portal Paciente',
    Icon: isDoc ? Stethoscope : HeartPulse
  };

  return (
    <div className={`flex h-screen w-full items-center justify-center bg-slate-50 ${theme.bgGradient} relative overflow-hidden transition-colors duration-1000`}>
      
      {/* Background decorations */}
      <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isDoc ? 'bg-indigo-100/50' : 'bg-rose-100/50'}`} />
      <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isDoc ? 'bg-blue-100/50' : 'bg-pink-100/50'}`} />

      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedRole(null)}
          className="absolute -top-12 left-8 text-slate-600 hover:text-slate-800 flex items-center gap-1 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> {t("returning")}
        </button>

        <div className="text-center mb-10">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${theme.iconGradient} flex items-center justify-center shadow-2xl ${theme.shadow} mb-6`}>
            <theme.Icon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 tracking-tight">
            {theme.title}
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Bienvenido de nuevo</p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-slate-200 shadow-sm shadow-2xl backdrop-blur-xl bg-white/80">
          {error && (
            <div className="p-3 rounded-xl mb-6 text-sm text-center border bg-rose-100/50 border-rose-500/30 text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Usuario / Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-400 ${theme.focusRing}`}
                  placeholder={isDoc ? "ej. dr_perez" : "ej. paciente@mail.com"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-400 ${theme.focusRing}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r ${theme.buttonBg} text-white font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 mt-4`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">Modo Demo: Ingresa cualquier usuario y contraseña para acceder.</p>
        </div>
      </div>
    </div>
  );
}
