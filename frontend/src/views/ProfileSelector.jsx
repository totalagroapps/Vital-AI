import React, { useState, useEffect } from 'react';
import { User, Users, Loader2, Plus, X, Check } from 'lucide-react';

// Primer nombre del perfil; si solo hay correo (cuenta sin perfil médico), la parte antes de la @.
export const profileDisplayName = (profile) =>
  ((profile?.full_name || '').trim().split(' ')[0] || '').split('@')[0] || profile?.relationship || '';

const RELATIONSHIPS = ['Padre', 'Madre', 'Abuelo', 'Abuela', 'Hijo', 'Hija', 'Pareja', 'Hermano', 'Hermana', 'Familiar'];

// startInManageMode: se abre directamente en «Administrar Perfiles» (desde la pantalla Más),
// incluso si la cuenta todavía no tiene familiares vinculados.
export default function ProfileSelector({ apiUrl, authHeaders, onProfileSelect, startInManageMode = false }) {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(startInManageMode);
  const [showAddForm, setShowAddForm] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');

  const loadProfiles = async () => {
    const res = await fetch(`${apiUrl}/api/auth/profiles`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Error fetching profiles (${res.status})`);
    const data = await res.json();
    return data.profiles || [];
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await loadProfiles();
        if (cancelled) return;
        // Con un solo perfil (el propio) no hace falta mostrar el selector.
        if (list.length <= 1 && !startInManageMode) {
          onProfileSelect(null, list.length);
          return;
        }
        setProfiles(list);
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        // Fallback: si falla, entra con su propio perfil
        if (!cancelled) onProfileSelect(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    try {
      setProfiles(await loadProfiles());
    } catch (e) {
      console.error(e);
    }
  };

  const removeProfile = async (profile) => {
    const name = profileDisplayName(profile);
    if (!window.confirm(`¿Dejar de administrar el perfil de ${name}? Su cuenta y sus datos no se borran.`)) return;
    setRemovingId(profile.user_id);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/profiles/${encodeURIComponent(profile.user_id)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo quitar el perfil');
      }
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1128] flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-10 h-10" />
      </div>
    );
  }

  const selfProfile = profiles.find((p) => p.is_self);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a1128] text-white flex flex-col items-center justify-center animate-in fade-in duration-500 font-sans p-6 overflow-y-auto">

      <div className="mb-12 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-2">
          MIVOR<span className="text-blue-500">.ai</span>
        </h1>
        <h2 className="text-lg md:text-xl font-medium text-slate-300">
          {isManaging ? 'Administrar perfiles' : '¿Quién está usando MIVOR hoy?'}
        </h2>
        {isManaging && (
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            Agrega a tus familiares para ver y gestionar su salud desde tu cuenta.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10 max-w-4xl mx-auto">
        {profiles.map((profile) => {
          const canRemove = isManaging && !profile.is_self;
          return (
            <div
              key={profile.user_id}
              onClick={() => { if (!isManaging) onProfileSelect(profile, profiles.length); }}
              className={`group flex flex-col items-center transition-transform ${isManaging ? '' : 'cursor-pointer active:scale-95'}`}
            >
              <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[2.5rem] bg-slate-800 border-4 border-transparent ${isManaging ? '' : 'group-hover:border-blue-500'} overflow-hidden mb-4 shadow-xl transition-colors flex items-center justify-center relative`}>
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-500" />
                )}
                {!isManaging && profile.pending_medications > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                    {profile.pending_medications} {profile.pending_medications === 1 ? 'toma pendiente' : 'tomas pendientes'}
                  </div>
                )}
                {/* Badge for relationships */}
                {!profile.is_self && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-center py-1 uppercase tracking-wider text-blue-200">
                    {profile.relationship}
                  </div>
                )}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeProfile(profile)}
                    disabled={removingId === profile.user_id}
                    aria-label="Quitar perfil"
                    className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 text-red-300 hover:text-red-200 hover:bg-black/65 transition-colors"
                  >
                    {removingId === profile.user_id ? <Loader2 size={28} className="animate-spin" /> : <X size={32} />}
                    <span className="text-[11px] font-bold">Quitar</span>
                  </button>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-200 group-hover:text-white text-center line-clamp-1 max-w-[120px] sm:max-w-[140px]">
                {profileDisplayName(profile)}
              </h3>
            </div>
          );
        })}

        {isManaging && (
          <button
            type="button"
            onClick={() => { setError(''); setShowAddForm(true); }}
            className="group flex flex-col items-center active:scale-95 transition-transform"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[2.5rem] border-4 border-dashed border-slate-600 group-hover:border-blue-500 mb-4 flex items-center justify-center transition-colors">
              <Plus size={44} className="text-slate-500 group-hover:text-blue-400" />
            </div>
            <span className="text-base sm:text-lg font-bold text-slate-400 group-hover:text-white">Agregar familiar</span>
          </button>
        )}
      </div>

      {error && <p className="mt-6 text-sm text-red-300 text-center">{error}</p>}

      <div className="mt-16 sm:mt-24">
        {isManaging ? (
          <button
            type="button"
            onClick={() => {
              if (profiles.length > 1) setIsManaging(false);
              else onProfileSelect(selfProfile || null, profiles.length);
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#0a1128] hover:bg-slate-200 transition-colors text-sm font-bold"
          >
            <Check size={16} /> Listo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsManaging(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-bold"
          >
            <Users size={16} /> Administrar Perfiles
          </button>
        )}
      </div>

      {showAddForm && (
        <AddFamilyForm
          apiUrl={apiUrl}
          authHeaders={authHeaders}
          onCancel={() => setShowAddForm(false)}
          onLinked={async () => { setShowAddForm(false); await refresh(); }}
        />
      )}
    </div>
  );
}

function AddFamilyForm({ apiUrl, authHeaders, onCancel, onLinked }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [relationship, setRelationship] = useState('Padre');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/profiles/link`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, relationship }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo vincular al familiar');
      await onLinked();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#111a36] border border-slate-700 rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-black">Agregar familiar</h3>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="text-slate-400 hover:text-white">
            <X size={22} />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Ingresa el correo y la contraseña de la cuenta MIVOR de tu familiar. Así confirmamos que te autoriza a administrar su salud.
        </p>

        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo del familiar</label>
        <input
          type="email"
          required
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="correo@ejemplo.com"
          className={`${inputClass} mb-4`}
        />

        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña del familiar</label>
        <input
          type="password"
          required
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Parentesco</label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={`${inputClass} mb-5`}
        >
          {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-3 font-bold transition-colors"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Vincular familiar
        </button>
      </form>
    </div>
  );
}
