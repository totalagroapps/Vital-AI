import React from 'react';
import { HeartHandshake, RefreshCw } from 'lucide-react';

// Aviso persistente del «Modo Cuidador»: recuerda en qué perfil familiar se está actuando.
export default function CaregiverBanner({ name, relationship, onSwitchProfile }) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[70] max-w-[calc(100%-1.5rem)]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}
      role="status"
    >
      <div className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-violet-600 text-white shadow-lg text-xs font-bold">
        <HeartHandshake size={14} className="shrink-0" />
        <span className="truncate">
          Administrando a {name}{relationship ? ` (${relationship})` : ''}
        </span>
        <button
          type="button"
          onClick={onSwitchProfile}
          className="flex items-center gap-1 shrink-0 rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-1 transition-colors"
        >
          <RefreshCw size={12} /> Cambiar
        </button>
      </div>
    </div>
  );
}
