// Dónde vive el token de sesión (misma lógica en toda la app):
// - App Android: cifrado con el Android Keystore (plugin nativo SecureToken). Dura hasta que caduca (7 días).
// - Web: sessionStorage. Sobrevive a recargas, pero se borra al cerrar la pestaña/navegador,
//   para que nadie herede la sesión en un ordenador compartido.
// Nunca en localStorage: ahí quedaba en disco sin cifrar y entraba en las copias de seguridad.
import { Capacitor, registerPlugin } from '@capacitor/core';

const TOKEN_KEY = 'med_token';
const isNative = Capacitor.isNativePlatform();
const SecureToken = isNative ? registerPlugin('SecureToken') : null;

// Copia en memoria para lecturas síncronas (cabeceras de fetch) una vez cargada
let cachedToken = null;

function readSession(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function writeSession(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch { /* sin almacenamiento: la sesión queda solo en memoria */ }
}

/** Token de versiones anteriores guardado en localStorage: se lee una vez y se borra. */
function takeLegacyToken() {
  try {
    const legacy = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    return legacy;
  } catch {
    return null;
  }
}

/** En web el token se puede leer al instante; en Android hay que esperar a loadToken(). */
export const tokenAvailableSync = !isNative;

/** Lectura síncrona (web, o Android después de loadToken). */
export function getToken() {
  if (!isNative && cachedToken === null) {
    cachedToken = readSession(TOKEN_KEY);
    if (!cachedToken) {
      const legacy = takeLegacyToken();
      if (legacy) {
        cachedToken = legacy;
        writeSession(TOKEN_KEY, legacy);
      }
    }
  }
  return cachedToken;
}

/** Carga inicial del token (en Android lo descifra el Keystore). */
export async function loadToken() {
  if (!isNative) return getToken();
  try {
    const { value } = await SecureToken.get();
    cachedToken = value || null;
  } catch {
    cachedToken = null;
  }
  const legacy = takeLegacyToken();
  if (!cachedToken && legacy) {
    await saveToken(legacy);
  }
  return cachedToken;
}

export async function saveToken(token) {
  cachedToken = token || null;
  if (!token) return clearToken();
  if (isNative) {
    try {
      await SecureToken.set({ value: token });
    } catch (e) {
      // Si el Keystore falla, la sesión sigue en memoria hasta cerrar la app
      console.warn('No se pudo guardar la sesión cifrada:', e);
    }
  } else {
    writeSession(TOKEN_KEY, token);
  }
}

export async function clearToken() {
  cachedToken = null;
  takeLegacyToken();
  if (isNative) {
    try { await SecureToken.remove(); } catch { /* ya no había sesión guardada */ }
  } else {
    writeSession(TOKEN_KEY, null);
  }
}
