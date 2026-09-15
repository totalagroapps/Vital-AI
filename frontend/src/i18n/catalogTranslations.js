// Display-only translation for values coming from the database
// (specialties.name, languages.name). Project convention is the DB always
// stores English (see CLAUDE.md "Convenciones") — this never writes back,
// it only maps the string already returned by the backend to its Spanish
// equivalent when the selected language is "es" ("en" returns it as-is).
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

export function translateSpecialtyName(name, language) {
  if (language !== 'es') return name;
  return SPECIALTY_ES[name] || name;
}

export function translateLanguageName(code, name, language) {
  if (language !== 'es') return name;
  return LANGUAGE_ES[code] || name;
}
