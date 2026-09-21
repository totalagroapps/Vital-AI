// URL base de la API (misma lógica en toda la app)
export const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '8000' ? window.location.origin : 'http://127.0.0.1:8000')
    : (typeof window !== 'undefined' && !window.location.origin.startsWith('capacitor://')
        ? window.location.origin
        : 'https://vitalai.up.railway.app')
);
