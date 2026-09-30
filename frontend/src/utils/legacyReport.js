// Los resúmenes de orientación anteriores al 18/09/2026 se generaron como "Informe de
// Prediagnóstico y Triaje" y nombran posibles diagnósticos ("Posible Hemorragia Cerebral…").
// Al paciente ya no se le muestra ese texto: solo el nivel de atención y la especialidad,
// que se siguen extrayendo del original. El médico los sigue viendo completos en su panel.
const LEGACY_MARKERS = /prediagn[óo]stico|posibles orientaciones cl[íi]nicas/i;

export const isLegacyReport = (text) => typeof text === 'string' && LEGACY_MARKERS.test(text);

// Texto que sustituye al informe antiguo en el historial y en el chat
export const legacyReportNotice = (t) => t('legacy_report_hidden');
