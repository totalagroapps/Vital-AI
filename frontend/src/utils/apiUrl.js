// URL base de la API (misma lógica en toda la app)
import { Capacitor } from '@capacitor/core';

const PRODUCTION_API_URL = 'https://med-ai-hub-v2-production.up.railway.app';

// En la app Android la web se sirve desde https://localhost: no es un entorno de desarrollo,
// así que sin VITE_API_URL hay que ir a la API de producción (antes acababa en 127.0.0.1:8000
// y la app mostraba "Error de conexión con el servidor").
const isNativeApp = Capacitor.isNativePlatform();

export const API_URL = import.meta.env.VITE_API_URL || (
  isNativeApp
    ? PRODUCTION_API_URL
    : typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? (window.location.port === '8000' ? window.location.origin : 'http://127.0.0.1:8000')
      : (typeof window !== 'undefined' ? window.location.origin : PRODUCTION_API_URL)
);
