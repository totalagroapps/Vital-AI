import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { subscribeToPush } from '../utils/pushNotifications';
import { useLanguage } from '../contexts/LanguageContext';

// Estados: 'unsupported' | 'idle' (sin activar) | 'denied' (bloqueado en el navegador) | 'subscribed'
// "Activado" significa que existe la suscripción y el servidor la ha guardado, no solo que
// el navegador tenga el permiso concedido.
// compact: solo el icono (barra superior); el estado se ve por el color y el texto va en el tooltip
export default function PushNotificationToggle({ apiUrl, token, compact = false }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    // Con el permiso ya concedido, (re)registra la suscripción en silencio en cada sesión:
    // el navegador puede haberla perdido o el servidor no haberla guardado nunca.
    if (Notification.permission === 'granted' && token) {
      let cancelled = false;
      subscribeToPush(apiUrl, token).then((ok) => {
        if (!cancelled) setStatus(ok ? 'subscribed' : 'idle');
      });
      return () => { cancelled = true; };
    }
    return undefined;
  }, [apiUrl, token]);

  const handleSubscribe = async () => {
    setLoading(true);
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission === 'granted') {
      const ok = await subscribeToPush(apiUrl, token);
      setStatus(ok ? 'subscribed' : 'idle');
      if (!ok) alert(t('push_error'));
    } else {
      setStatus(permission === 'denied' ? 'denied' : 'idle');
      alert(t('push_permission_needed'));
    }
    setLoading(false);
  };

  if (status === 'unsupported') return null;

  const subscribed = status === 'subscribed';
  const denied = status === 'denied';
  const label = subscribed ? t('push_on') : denied ? t('push_blocked') : t('push_activate');

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || subscribed || denied}
      title={denied ? t('push_blocked_hint') : label}
      aria-label={label}
      className={`flex items-center gap-2 ${compact ? 'p-2' : 'px-3 py-1.5'} rounded-full text-xs font-medium border transition-colors ${
        subscribed
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
          : denied
            ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-help'
            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {!compact && label}
    </button>
  );
}
