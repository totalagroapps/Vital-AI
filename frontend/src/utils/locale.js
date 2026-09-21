// Detección de idioma y país del usuario.
//  · Idioma: el del sistema/navegador (navigator.languages). Si ninguno está soportado se usa el
//    idioma principal del país del usuario.
//  · País: ubicación real si el usuario ya concedió el permiso de geolocalización; si no, la zona
//    horaria del dispositivo y, por último, la región del idioma del sistema (es-CO -> CO).
//    Sirve para adaptar la IA (terminología, número de emergencias) y para elegir idioma de respaldo.

export const STATIC_LANGUAGES = ['es', 'en', 'fr', 'ar'];

// Idiomas que la IA puede usar y para los que la interfaz se traduce automáticamente (espejo de
// backend/services/language_service.py).
export const SUPPORTED_LANGUAGES = [
  'af', 'am', 'ar', 'az', 'be', 'bg', 'bn', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu',
  'fa', 'fi', 'fil', 'fr', 'ga', 'gl', 'gu', 'ha', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id', 'ig', 'is', 'it',
  'ja', 'ka', 'kk', 'km', 'kn', 'ko', 'ku', 'ky', 'lo', 'lt', 'lv', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'nb', 'ne', 'nl', 'no', 'pa', 'pl', 'ps', 'pt', 'qu', 'ro', 'ru', 'si', 'sk', 'sl', 'so', 'sq', 'sr', 'sv',
  'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'uk', 'ur', 'uz', 'vi', 'yo', 'zh', 'zu',
];

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv']);

const ALIASES = { iw: 'he', in: 'id', ji: 'yi', tl: 'fil', nn: 'nb' };

export const isRtlLanguage = (code) => RTL_LANGUAGES.has(primaryLanguage(code));

export function primaryLanguage(tag) {
  const p = String(tag || '').replace('_', '-').split('-')[0].toLowerCase();
  return ALIASES[p] || p;
}

export function regionOf(tag) {
  const parts = String(tag || '').replace('_', '-').split('-');
  const region = parts.slice(1).find((x) => /^[A-Za-z]{2}$/.test(x));
  return region ? region.toUpperCase() : '';
}

// Nombre del idioma en el propio idioma (Deutsch, 日本語…). Cae al código si el navegador no lo conoce.
export function languageDisplayName(code) {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    if (name && name.toLowerCase() !== code.toLowerCase()) return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch { /* navegador sin Intl.DisplayNames */ }
  return code.toUpperCase();
}

// Idioma principal por país (para cuando el sistema no indica un idioma soportado).
const COUNTRY_LANGUAGE = {
  ES: 'es', MX: 'es', CO: 'es', AR: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', UY: 'es', PY: 'es', BO: 'es',
  CR: 'es', PA: 'es', DO: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es', CU: 'es', PR: 'es',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', NG: 'en', KE: 'en', IN: 'en', SG: 'en', PH: 'en',
  FR: 'fr', BE: 'fr', CH: 'de', DE: 'de', AT: 'de', IT: 'it', PT: 'pt', BR: 'pt', NL: 'nl', SE: 'sv', NO: 'nb',
  DK: 'da', FI: 'fi', PL: 'pl', CZ: 'cs', GR: 'el', RO: 'ro', HU: 'hu', TR: 'tr', RU: 'ru', UA: 'uk',
  MA: 'ar', DZ: 'ar', TN: 'ar', EG: 'ar', SA: 'ar', AE: 'ar', QA: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar',
  IL: 'he', IR: 'fa', PK: 'ur', BD: 'bn', CN: 'zh', JP: 'ja', KR: 'ko', TH: 'th', VN: 'vi', ID: 'id', MY: 'ms',
};

// Zona horaria IANA -> país (las más habituales; el resto se resuelve con la región del idioma).
const TIMEZONE_COUNTRY = {
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'America/Mexico_City': 'MX', 'America/Bogota': 'CO',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL', 'America/Lima': 'PE',
  'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/Montevideo': 'UY', 'America/Asuncion': 'PY',
  'America/La_Paz': 'BO', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA', 'America/Santo_Domingo': 'DO',
  'America/Guatemala': 'GT', 'America/Tegucigalpa': 'HN', 'America/El_Salvador': 'SV', 'America/Managua': 'NI',
  'America/Havana': 'CU', 'America/Puerto_Rico': 'PR', 'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA',
  'America/Sao_Paulo': 'BR', 'America/Manaus': 'BR', 'Europe/London': 'GB', 'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Lisbon': 'PT', 'Atlantic/Azores': 'PT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT',
  'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO',
  'Europe/Budapest': 'HU', 'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
  'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Cairo': 'EG',
  'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA', 'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE',
  'Asia/Qatar': 'QA', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Jerusalem': 'IL', 'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD',
  'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ',
};

// Número de emergencias por país (por defecto 112, válido en la UE y en las redes GSM de casi todo el mundo)
const EMERGENCY_NUMBERS = {
  ES: '112', MX: '911', CO: '123', AR: '107', CL: '131', PE: '106', VE: '171', EC: '911', UY: '911', PY: '911',
  BO: '110', CR: '911', PA: '911', DO: '911', GT: '128', HN: '911', SV: '911', NI: '118', CU: '104', PR: '911',
  US: '911', CA: '911', GB: '999', IE: '112', FR: '15', DE: '112', IT: '112', PT: '112', NL: '112', BE: '112',
  CH: '144', AT: '144', SE: '112', NO: '113', DK: '112', FI: '112', PL: '112', CZ: '112', GR: '112', RO: '112',
  HU: '112', TR: '112', RU: '103', UA: '103', MA: '150', DZ: '14', TN: '190', EG: '123', SA: '997', AE: '998',
  QA: '999', JO: '911', LB: '140', IL: '101', IR: '115', IQ: '122', IN: '112', PK: '1122', BD: '999', CN: '120',
  JP: '119', KR: '119', TH: '1669', VN: '115', ID: '118', PH: '911', MY: '999', SG: '995', AU: '000', NZ: '111',
  BR: '192', ZA: '10177', NG: '112', KE: '999',
};

export const emergencyNumber = (country) => EMERGENCY_NUMBERS[String(country || '').toUpperCase()] || '112';

const GEO_KEY = 'media_hub_country_geo';
const GEO_MAX_AGE_MS = 7 * 24 * 3600 * 1000;

function readGeoCountry() {
  try {
    const raw = JSON.parse(localStorage.getItem(GEO_KEY) || 'null');
    if (raw && /^[A-Z]{2}$/.test(raw.country) && Date.now() - raw.ts < GEO_MAX_AGE_MS) return raw.country;
  } catch { /* sin almacenamiento */ }
  return '';
}

export function systemLanguageTags() {
  if (typeof navigator === 'undefined') return [];
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  return list.filter(Boolean);
}

export function detectCountry() {
  const geo = readGeoCountry();
  if (geo) return geo;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];
  } catch { /* Intl no disponible */ }
  for (const tag of systemLanguageTags()) {
    const region = regionOf(tag);
    if (region) return region;
  }
  return '';
}

// Idioma por defecto: el primero del sistema que se pueda usar; si no hay ninguno, el del país.
export function detectLanguage(country = detectCountry()) {
  for (const tag of systemLanguageTags()) {
    const lang = primaryLanguage(tag);
    if (SUPPORTED_LANGUAGES.includes(lang)) return { language: lang, tag };
  }
  const byCountry = COUNTRY_LANGUAGE[country];
  if (byCountry) return { language: byCountry, tag: byCountry };
  return { language: 'es', tag: 'es' };
}

// Si el usuario ya concedió la geolocalización (p. ej. en "Cita presencial") se obtiene el país real.
// Nunca solicita el permiso por sí misma.
export async function refineCountryFromGeolocation() {
  try {
    if (readGeoCountry() || !navigator.geolocation || !navigator.permissions) return '';
    const status = await navigator.permissions.query({ name: 'geolocation' });
    if (status.state !== 'granted') return '';
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, maximumAge: 24 * 3600 * 1000 }));
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=3&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const country = String(data?.address?.country_code || '').toUpperCase();
    if (/^[A-Z]{2}$/.test(country)) {
      localStorage.setItem(GEO_KEY, JSON.stringify({ country, ts: Date.now() }));
      return country;
    }
  } catch { /* sin permiso, sin red o sin geolocalización */ }
  return '';
}
