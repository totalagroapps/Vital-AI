import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { subscribeToPush } from '../utils/pushNotifications';

export default function PushNotificationToggle({ apiUrl, token }) {
  const [status, setStatus] = useState('default'); // 'default', 'granted', 'denied'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    setStatus(Notification.permission);
  }, []);

  const handleSubscribe = async () => {
    if (status === 'granted') {
      alert("Las notificaciones ya est\u00e1n activadas en este dispositivo.");
      return;
    }

    setLoading(true);
    const permission = await Notification.requestPermission();
    setStatus(permission);

    if (permission === 'granted') {
      const success = await subscribeToPush(apiUrl, token);
      if (success) {
        alert("¡Notificaciones activadas con \u00e9xito!");
      } else {
        alert("Error al suscribirse al servidor Push.");
      }
    } else {
      alert("Debes permitir las notificaciones en tu navegador.");
    }
    setLoading(false);
  };

  if (status === 'unsupported') return null;

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || status === 'granted'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        status === 'granted' 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default'
          : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'granted' ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {status === 'granted' ? 'Notificaciones On' : 'Activar Notificaciones'}
    </button>
  );
}
