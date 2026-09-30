// Los resúmenes de orientación anteriores al 18/09/2026 se guardaron con el título
// "Informe de Prediagnóstico y Triaje". Se re-etiquetan al mostrarlos al paciente para
// mantener el lenguaje informativo (no diagnóstico) en toda la app.
const LEGACY_TITLES = [
  [/Informe de Prediagn[óo]stico y Triaje/gi, 'Resumen Explicativo de Orientación'],
  [/Informe de Prediagn[óo]stico/gi, 'Resumen Explicativo de Orientación'],
  [/Prediagn[óo]stico y Triaje/gi, 'Orientación de salud'],
  [/Prediagn[óo]stico/gi, 'Orientación'],
];

export const relabelLegacyReport = (text) => {
  if (typeof text !== 'string') return text;
  return LEGACY_TITLES.reduce((acc, [pattern, label]) => acc.replace(pattern, label), text);
};
