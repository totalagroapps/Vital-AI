import React, { useState } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { Stethoscope, Lock, User, ArrowRight, HeartPulse, Activity, ChevronLeft } from 'lucide-react';

export default function Auth({ onLogin, apiUrl }) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState(null); // 'doctor' | 'patient' | null
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        // Register API call
        const res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, role: selectedRole })
        });
        const data = await res.json();
        
        if (res.ok) {
          // Immediately login after successful registration
          setIsRegistering(false);
          setError('¡Cuenta creada exitosamente! Iniciando sesión...');
          
          const formData = new URLSearchParams();
          formData.append('username', username);
          formData.append('password', password);
          const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            onLogin(loginData.access_token, selectedRole);
          }
        } else {
          setError(data.detail || 'Error al registrar la cuenta');
        }
      } else {
        // Login API call
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
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
        <LanguageSelector variant="floating" />
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-semantic-danger-bg/50 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

        <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 tracking-tight">VitalIA</h1>
            <p className="text-slate-600 mt-3 font-medium text-lg">Selecciona tu portal de acceso</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
            {/* Patient Card */}
            <button 
              onClick={() => setSelectedRole('patient')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:scale-[1.02] hover:border-brand/30 hover:shadow-md"
            >
              
              <div className="w-16 h-16 rounded-2xl bg-semantic-info-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"><HeartPulse className="w-8 h-8 text-semantic-info-text" /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t("i_am_patient")}</h2>
              <p className="text-slate-500 text-sm text-center">Accede a tu historial clínico, resultados y triaje inteligente.</p>
            </button>

            {/* Doctor Card */}
            <button 
              onClick={() => setSelectedRole('doctor')}
              className="group relative flex flex-col items-center justify-center p-10 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:scale-[1.02] hover:border-brand/30 hover:shadow-md"
            >
              
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"><Stethoscope className="w-8 h-8 text-brand" /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t("i_am_doctor")}</h2>
              <p className="text-slate-500 text-sm text-center">Gestiona tus pacientes, revisa expedientes y consulta a la IA.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Theme configuration based on role
  const isDoc = selectedRole === 'doctor';
  const theme = {
    bgGradient: '',
    iconBg: isDoc ? 'bg-brand/10 text-brand' : 'bg-semantic-info-bg text-semantic-info-text',
    shadow: 'shadow-sm',
    focusRing: 'focus:border-brand/50 focus:ring-brand/20',
    buttonClass: 'bg-brand text-white hover:bg-brand/90',
    title: isDoc ? t("doctor_login_title") : 'Portal Paciente',
    Icon: isDoc ? Stethoscope : HeartPulse
  };

  return (
    <div className={`flex h-screen w-full items-center justify-center bg-slate-100 ${theme.bgGradient} relative overflow-hidden transition-colors duration-1000`}>
      
      {/* Background decorations */}
      <div className={`absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isDoc ? 'bg-indigo-100/50' : 'bg-semantic-danger-bg/50'}`} />
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
          {isRegistering ? <p className="text-slate-600 mt-2 font-medium">Crea tu cuenta nueva</p> : <p className="text-slate-600 mt-2 font-medium">Bienvenido de nuevo</p>}
        </div>

        <div className="glass-card rounded-3xl p-8 border border-slate-200 shadow-sm shadow-2xl backdrop-blur-xl bg-white shadow-xl">
          {error && (
            <div className="p-3 rounded-xl mb-6 text-sm text-center border bg-semantic-danger-bg/50 border-semantic-danger-text/20/30 text-semantic-danger-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Usuario / Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 ${theme.focusRing}`}
                  placeholder={isDoc ? "ej. dr_perez" : "ej. paciente@mail.com"}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 ${theme.focusRing}`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-600" />
                  <input 
                    type="password" 
                    required={isRegistering}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 ${theme.focusRing}`}
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>
            )}

            <button type="submit" 
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 mt-4 ${theme.buttonClass}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Crear Cuenta' : 'Ingresar'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-center text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors mt-6"
          >
            {isRegistering ? "¿Ya tienes cuenta? Inicia sesión aquí" : "¿No tienes cuenta? Regístrate aquí"}
          </button>

        </div>
      </div>
    </div>
  );
}
