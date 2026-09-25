// Display-only translation for values coming from the database
// (specialties.name, languages.name). Project convention is the DB always
// stores English (see CLAUDE.md "Convenciones") — this never writes back,
// it only maps the string already returned by the backend to its Spanish
// equivalent when the selected language is "es" ("en" returns it as-is); other languages use
// i18n keys (specialties) or Intl.DisplayNames (languages).
// An unmapped catalog value falls back to the English name rather than
// breaking the screen.

// name (English, as returned by GET /api/specialties) -> Spanish name.
// Official Spanish medical specialty nomenclature (MIR).
const SPECIALTY_ES = {
  'Allergology': 'Alergología',
  'Anesthesiology and Resuscitation': 'Anestesiología y Reanimación',
  'Gastroenterology': 'Aparato Digestivo',
  'Cardiology': 'Cardiología',
  'Endocrinology and Nutrition': 'Endocrinología y Nutrición',
  'Clinical Pharmacology': 'Farmacología Clínica',
  'Geriatrics': 'Geriatría',
  'Hematology and Hemotherapy': 'Hematología y Hemoterapia',
  'Immunology': 'Inmunología',
  'Family and Community Medicine': 'Medicina Familiar y Comunitaria',
  'Physical Medicine and Rehabilitation': 'Medicina Física y Rehabilitación',
  'Intensive Care Medicine': 'Medicina Intensiva',
  'Internal Medicine': 'Medicina Interna',
  'Legal and Forensic Medicine': 'Medicina Legal y Forense',
  'Nuclear Medicine': 'Medicina Nuclear',
  'Preventive Medicine and Public Health': 'Medicina Preventiva y Salud Pública',
  'Occupational Medicine': 'Medicina del Trabajo',
  'Microbiology and Parasitology': 'Microbiología y Parasitología',
  'Nephrology': 'Nefrología',
  'Pulmonology': 'Neumología',
  'Neurology': 'Neurología',
  'Clinical Neurophysiology': 'Neurofisiología Clínica',
  'Medical Oncology': 'Oncología Médica',
  'Radiation Oncology': 'Oncología Radioterápica',
  'Psychiatry': 'Psiquiatría',
  'Child and Adolescent Psychiatry': 'Psiquiatría Infantil y de la Adolescencia',
  'Rheumatology': 'Reumatología',
  'Diagnostic Radiology': 'Radiodiagnóstico',
  'Clinical Laboratory': 'Análisis Clínicos',
  'Pathology': 'Anatomía Patológica',
  'Emergency Medicine': 'Medicina de Urgencias y Emergencias',
  'Angiology and Vascular Surgery': 'Angiología y Cirugía Vascular',
  'Cardiovascular Surgery': 'Cirugía Cardiovascular',
  'General and Digestive Surgery': 'Cirugía General y del Aparato Digestivo',
  'Oral and Maxillofacial Surgery': 'Cirugía Oral y Maxilofacial',
  'Orthopedic Surgery and Traumatology': 'Cirugía Ortopédica y Traumatología',
  'Pediatric Surgery': 'Cirugía Pediátrica',
  'Plastic, Aesthetic and Reconstructive Surgery': 'Cirugía Plástica, Estética y Reparadora',
  'Thoracic Surgery': 'Cirugía Torácica',
  'Dermatology and Venereology': 'Dermatología Médico-Quirúrgica y Venereología',
  'Obstetrics and Gynecology': 'Obstetricia y Ginecología',
  'Ophthalmology': 'Oftalmología',
  'Otorhinolaryngology': 'Otorrinolaringología',
  'Urology': 'Urología',
  'Pediatrics': 'Pediatría',
  'Neurosurgery': 'Neurocirugía',
};

// code (ISO 639-1, as returned by GET /api/languages) -> Spanish name.
// Translated by `code`, not `name`, so it doesn't depend on the English
// name being written exactly the same way.
const LANGUAGE_ES = {
  es: 'Español', en: 'Inglés', fr: 'Francés', de: 'Alemán', it: 'Italiano',
  pt: 'Portugués', ca: 'Catalán', ar: 'Árabe', zh: 'Chino', ru: 'Ruso',
  ja: 'Japonés', ko: 'Coreano', nl: 'Neerlandés', pl: 'Polaco', ro: 'Rumano',
  bg: 'Búlgaro', el: 'Griego', tr: 'Turco', uk: 'Ucraniano', hi: 'Hindi',
};

// Nombres de especialidad en español que llegan como texto libre (perfiles antiguos, respuestas de la
// IA, listas del directorio) -> nombre de catálogo en inglés.
const SPECIALTY_ALIASES_ES = {
  'Medicina General': 'General Medicine',
  'Atención Primaria': 'Family and Community Medicine',
  'Traumatología': 'Orthopedic Surgery and Traumatology',
  'Dermatología': 'Dermatology and Venereology',
  'Ginecología': 'Obstetrics and Gynecology',
  'Endocrinología': 'Endocrinology and Nutrition',
  'Gastroenterología': 'Gastroenterology',
  'Digestivo': 'Gastroenterology',
  'Oncología': 'Medical Oncology',
  'Urgencias': 'Emergency Medicine',
};
const SPECIALTY_EN_EXTRA = { 'General Medicine': 'Medicina General' };

const ES_TO_EN = Object.fromEntries(Object.entries(SPECIALTY_ES).map(([en, es]) => [es, en]));
Object.assign(ES_TO_EN, SPECIALTY_ALIASES_ES);
const ES_TO_EN_LOWER = Object.fromEntries(Object.entries(ES_TO_EN).map(([es, en]) => [es.toLowerCase(), en]));

const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Clave i18n de una especialidad del catálogo (es/en en los diccionarios; el resto lo traduce la IA).
export const specialtyKey = (englishName) => `catalog_specialty_${slugify(englishName)}`;

// Todas las especialidades conocidas: { clave: [es, en] }. La usa scripts/sync-catalog-i18n.
export const SPECIALTY_I18N = Object.fromEntries(
  [...Object.entries(SPECIALTY_ES), ...Object.entries(SPECIALTY_EN_EXTRA)].map(([en, es]) => [specialtyKey(en), [es, en]]),
);

// Acepta el nombre en inglés (catálogo de la BD) o en español (texto libre) y lo muestra en el idioma
// de la interfaz. Sin `t`, los idiomas distintos de es/en caen al inglés.
export function translateSpecialtyName(name, language, t) {
  if (!name) return name;
  const trimmed = String(name).trim();
  const en = ES_TO_EN[trimmed] || ES_TO_EN_LOWER[trimmed.toLowerCase()] || trimmed;
  if (language === 'es') return SPECIALTY_ES[en] || SPECIALTY_EN_EXTRA[en] || trimmed;
  if (language === 'en' || typeof t !== 'function') return en;
  const key = specialtyKey(en);
  const translated = t(key);
  return translated && translated !== key ? translated : en;
}

// Nombre del idioma en el idioma de la interfaz (Intl lo conoce para casi todos los idiomas).
export function translateLanguageName(code, name, language) {
  if (language === 'es' && LANGUAGE_ES[code]) return LANGUAGE_ES[code];
  if (language === 'en' || !code) return name;
  try {
    return new Intl.DisplayNames([language], { type: 'language' }).of(code) || name;
  } catch {
    return name;
  }
}
