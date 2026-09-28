import React, { useState, useEffect } from 'react';
import { User, Users, Loader2 } from 'lucide-react';

export default function ProfileSelector({ apiUrl, authHeaders, onProfileSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/auth/profiles`, { headers: authHeaders });
        if (!res.ok) throw new Error(`Error fetching profiles (${res.status})`);
        const data = await res.json();
        const list = data.profiles || [];
        if (cancelled) return;
        // Con un solo perfil (el propio) no hace falta mostrar el selector.
        if (list.length <= 1) {
          onProfileSelect(null);
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a1128] flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a1128] text-white flex flex-col items-center justify-center animate-in fade-in duration-500 font-sans p-6">
      
      <div className="mb-12 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-2">
          MIVOR<span className="text-blue-500">.ai</span>
        </h1>
        <h2 className="text-lg md:text-xl font-medium text-slate-300">
          ¿Quién está usando MIVOR hoy?
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 max-w-4xl mx-auto">
        {profiles.map((profile) => (
          <div 
            key={profile.user_id}
            onClick={() => onProfileSelect(profile.is_self ? null : profile.user_id)}
            className="group flex flex-col items-center cursor-pointer transition-transform active:scale-95"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl sm:rounded-[2.5rem] bg-slate-800 border-4 border-transparent group-hover:border-blue-500 overflow-hidden mb-4 shadow-xl transition-colors flex items-center justify-center relative">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-slate-500" />
              )}
              {/* Badge for relationships */}
              {!profile.is_self && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-center py-1 uppercase tracking-wider text-blue-200">
                  {profile.relationship}
                </div>
              )}
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-200 group-hover:text-white text-center line-clamp-1 max-w-[120px] sm:max-w-[140px]">
              {(profile.full_name || '').split(' ')[0] || profile.relationship}
            </h3>
          </div>
        ))}
      </div>
      
      {/* Optional Manage Profiles button for later */}
      <div className="mt-16 sm:mt-24">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-bold">
          <Users size={16} /> Administrar Perfiles
        </button>
      </div>
      
    </div>
  );
}
