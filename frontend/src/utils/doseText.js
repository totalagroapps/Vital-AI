// Traduce abreviaturas latinas de posología (BID, TID, q8h, PRN…) a lenguaje claro para
// personas mayores. Se aplica al mostrar, así que también corrige tratamientos ya guardados.
// Cada patrón admite puntos y mayúsculas/minúsculas: "BID", "b.i.d.", "bid".
const dotted = (letters) => letters.split('').map((c) => `${c}\\.?`).join('');
const token = (letters) => new RegExp(`(^|[^\\p{L}])${dotted(letters)}(?![\\p{L}])`, 'giu');

const ABBREVIATIONS = [
  // Orden: las más largas primero para que "qid" no se lea como "qd"
  ['qhs', 'dose_at_bedtime'],
  ['qod', 'dose_every_other_day'],
  ['qid', 'dose_four_times_daily'],
  ['qds', 'dose_four_times_daily'],
  ['tid', 'dose_three_times_daily'],
  ['tds', 'dose_three_times_daily'],
  ['bid', 'dose_twice_daily'],
  ['bd', 'dose_twice_daily'],
  ['qam', 'dose_in_the_morning'],
  ['qpm', 'dose_in_the_evening'],
  ['qd', 'dose_once_daily'],
  ['prn', 'dose_as_needed'],
  ['ac', 'dose_before_meals'],
  ['pc', 'dose_after_meals'],
];

// q8h, q 8 h, c/8h, c/ 8 hrs, cada 12 hs → "cada 8 horas".
// "OD" y "hs" sueltos no se traducen: significan "ojo derecho" y "horas" según el contexto.
const EVERY_HOURS = /(^|[^\p{L}])(?:q|c\/|cada)\s*(\d{1,2})\s*(?:horas?|hrs|hr|hs|h)\.?(?![\p{L}])/giu;

export function plainFrequency(text, t) {
  if (!text || typeof text !== 'string') return text;
  let out = text.replace(EVERY_HOURS, (_, pre, hours) => `${pre}${t('dose_every_n_hours', { hours })}`);
  for (const [letters, key] of ABBREVIATIONS) {
    out = out.replace(token(letters), (_, pre) => `${pre}${t(key)}`);
  }
  return out;
}
