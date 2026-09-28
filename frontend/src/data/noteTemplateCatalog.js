// Plantillas de informe predeterminadas de MIVOR Scribe (estilo MedAlly).
// Cada multi-opción empieza en su primera opción (hallazgo normal): el médico solo cambia lo que difiere
// y completa los pocos [campos] que quedan. Sintaxis en utils/noteTemplate.js.

export const TEMPLATE_SPECIALTIES = [
  { id: 'general', label: 'Medicina General' },
  { id: 'cardiology', label: 'Cardiología' },
  { id: 'pediatrics', label: 'Pediatría' },
  { id: 'geriatrics', label: 'Geriatría' },
  { id: 'digestive', label: 'Digestivo' },
];

export const NOTE_TEMPLATE_CATALOG = [
  {
    id: 'cat-consulta-general',
    specialty: 'general',
    name: 'Consulta general',
    shortcut: 'cg',
    body: `MOTIVO DE CONSULTA: [motivo de consulta].

ANAMNESIS: [síntomas y tiempo de evolución]. ((Antecedentes, alergias y medicación habitual))
Antecedentes relevantes: {sin antecedentes de interés|[antecedentes]}.
Alergias medicamentosas: {no conocidas|[alergias]}.

EXPLORACIÓN FÍSICA: Buen estado general, {consciente y orientado|somnoliento|desorientado}, {normocoloreado e hidratado|palidez cutánea|deshidratación leve}. TA [TA] mmHg, FC [FC] lpm, T.ª [temperatura] °C.
[hallazgos exploratorios relevantes]

IMPRESIÓN DIAGNÓSTICA: [diagnóstico].

PLAN: [tratamiento y recomendaciones]. {Control según evolución|Control en [tiempo]}. Se explican signos de alarma para reconsultar.`,
  },
  {
    id: 'cat-infeccion-respiratoria',
    specialty: 'general',
    name: 'Infección respiratoria alta',
    shortcut: 'iras',
    body: `MOTIVO DE CONSULTA: Cuadro catarral de [días de evolución] de evolución.

ANAMNESIS: Refiere {rinorrea y odinofagia|tos seca|tos productiva|odinofagia intensa|otalgia}{| con fiebre de hasta [temperatura máxima] °C| sin fiebre}. {Sin disnea|Refiere disnea leve}. ((Preguntar contacto con casos y vacunación antigripal))

EXPLORACIÓN FÍSICA: Buen estado general. T.ª [temperatura] °C, SatO2 [SatO2] %. Orofaringe {hiperémica sin exudados|hiperémica con exudado amigdalar|normal}. Otoscopia {normal|hiperemia timpánica}. Auscultación pulmonar {murmullo vesicular conservado sin ruidos sobreañadidos|roncus dispersos|crepitantes en [localización]}.

IMPRESIÓN DIAGNÓSTICA: {Infección respiratoria de vías altas de probable origen viral|Faringoamigdalitis aguda|Otitis media aguda}.

PLAN: {Tratamiento sintomático con analgésicos/antipiréticos, hidratación y lavados nasales|[tratamiento antibiótico]}. Reconsultar si fiebre más de 72 h, dificultad respiratoria o empeoramiento. ((Criterios de Centor si faringoamigdalitis))`,
  },
  {
    id: 'cat-lumbalgia',
    specialty: 'general',
    name: 'Lumbalgia',
    shortcut: 'lumbalgia',
    body: `MOTIVO DE CONSULTA: Dolor lumbar de [tiempo de evolución] de evolución.

ANAMNESIS: Dolor {mecánico|inflamatorio (nocturno, rigidez matutina)}{| tras esfuerzo físico| sin desencadenante claro}. {No irradiado|Irradiado a miembro inferior [lado]}. Sin fiebre, pérdida de peso ni alteración de esfínteres. ((Descartar banderas rojas: edad >50, cáncer previo, fiebre, déficit neurológico, traumatismo))

EXPLORACIÓN FÍSICA: Marcha normal. Dolor a la palpación de musculatura paravertebral {lumbar bilateral|lumbar derecha|lumbar izquierda}. Lasègue {negativo bilateral|positivo [lado] a [grados] grados}. Fuerza, sensibilidad y reflejos osteotendinosos {conservados y simétricos|alterados: [hallazgo]}.

IMPRESIÓN DIAGNÓSTICA: {Lumbalgia mecánica aguda|Lumbociática|Lumbalgia crónica}.

PLAN: [analgesia pautada]. Mantener actividad física moderada evitando reposo absoluto, calor local. Control en [tiempo] si no mejora.`,
  },
  {
    id: 'cat-gastroenteritis',
    specialty: 'general',
    name: 'Gastroenteritis aguda',
    shortcut: 'gea',
    body: `MOTIVO DE CONSULTA: Diarrea de [días de evolución] de evolución.

ANAMNESIS: [número de deposiciones] deposiciones al día, {líquidas sin productos patológicos|con moco|con sangre}{| acompañadas de vómitos| sin vómitos}. {Sin fiebre|Fiebre de hasta [temperatura máxima] °C}. {Tolera la vía oral|No tolera la vía oral}. ((Preguntar ingesta sospechosa y convivientes afectados))

EXPLORACIÓN FÍSICA: {Buen estado general, normohidratado|Signos de deshidratación leve}. T.ª [temperatura] °C. Abdomen blando, depresible, {no doloroso|doloroso de forma difusa}, sin signos de irritación peritoneal. Ruidos hidroaéreos {aumentados|conservados}.

IMPRESIÓN DIAGNÓSTICA: Gastroenteritis aguda {sin deshidratación|con deshidratación leve}.

PLAN: Rehidratación oral con suero de rehidratación, dieta astringente progresiva. {Sin tratamiento antibiótico|[tratamiento]}. Reconsultar si sangre en heces, fiebre alta, vómitos persistentes o signos de deshidratación.`,
  },
  {
    id: 'cat-itu',
    specialty: 'general',
    name: 'Infección urinaria',
    shortcut: 'itu',
    body: `MOTIVO DE CONSULTA: Síndrome miccional de [días de evolución] de evolución.

ANAMNESIS: Refiere disuria y polaquiuria{| con tenesmo vesical| con hematuria}. {Sin fiebre ni dolor lumbar|Con fiebre|Con dolor lumbar}. {Sin episodios previos|Episodios previos: [número y fecha]}. ((Descartar embarazo en mujer en edad fértil))

EXPLORACIÓN FÍSICA: Buen estado general. T.ª [temperatura] °C. Puñopercusión renal {negativa bilateral|positiva [lado]}. Abdomen {no doloroso|doloroso en hipogastrio}.
Tira reactiva de orina: {leucocitos y nitritos positivos|leucocitos positivos, nitritos negativos|negativa|no realizada}.

IMPRESIÓN DIAGNÓSTICA: {Cistitis aguda no complicada|Infección urinaria complicada|Pielonefritis aguda}.

PLAN: [antibiótico, dosis y duración]. Abundante ingesta de líquidos. {Sin urocultivo|Se solicita urocultivo}. Reconsultar si fiebre, dolor lumbar o persistencia de síntomas a las 72 h.`,
  },
  {
    id: 'cat-hta',
    specialty: 'cardiology',
    name: 'Control de hipertensión',
    shortcut: 'hta',
    body: `MOTIVO DE CONSULTA: Control de hipertensión arterial.

ANAMNESIS: Paciente {asintomático|refiere cefalea|refiere mareos|refiere palpitaciones|refiere disnea}. Adherencia al tratamiento {buena|irregular|mala}. Tratamiento actual: [tratamiento antihipertensivo]. ((Preguntar efectos adversos: tos con IECA, edemas con calcioantagonistas))
Automedidas domiciliarias: {no aporta|en rango|elevadas: [cifras domiciliarias]}.

EXPLORACIÓN FÍSICA: TA [TA] mmHg, FC [FC] lpm, peso [peso] kg. Auscultación cardiaca {rítmica, sin soplos|arrítmica|con soplo sistólico}. {Sin edemas en miembros inferiores|Edemas maleolares bilaterales}.

IMPRESIÓN DIAGNÓSTICA: Hipertensión arterial {controlada|no controlada}.

PLAN: {Se mantiene el tratamiento actual|Se ajusta el tratamiento: [cambio de tratamiento]}. Dieta baja en sal y ejercicio aeróbico regular. Control en [tiempo hasta el próximo control]. ((Analítica anual con función renal, perfil lipídico y cociente albúmina/creatinina))`,
  },
  {
    id: 'cat-dolor-toracico',
    specialty: 'cardiology',
    name: 'Dolor torácico',
    shortcut: 'dt',
    body: `MOTIVO DE CONSULTA: Dolor torácico de [tiempo de evolución] de evolución.

ANAMNESIS: Dolor {opresivo retroesternal|punzante|urente|que aumenta con la palpación o los movimientos}{| irradiado a [irradiación]}, {en reposo|con el esfuerzo}, de [duración] de duración. {Sin cortejo vegetativo|Con sudoración y náuseas}. {Sin disnea|Con disnea}. Factores de riesgo cardiovascular: [factores de riesgo]. ((Ante sospecha de síndrome coronario agudo: ECG en menos de 10 minutos y derivación urgente))

EXPLORACIÓN FÍSICA: TA [TA] mmHg, FC [FC] lpm, SatO2 [SatO2] %. Auscultación cardiaca {rítmica, sin soplos|arrítmica|con soplo}. Auscultación pulmonar {normal|patológica: [hallazgo]}. {Dolor no reproducible a la palpación|Dolor reproducible a la palpación}.
ECG: {ritmo sinusal sin alteraciones de la repolarización|[hallazgos ECG]}.

IMPRESIÓN DIAGNÓSTICA: {Dolor torácico de características mecánicas|Dolor torácico atípico|Sospecha de síndrome coronario agudo}.

PLAN: {Analgesia y control ambulatorio|Derivación a urgencias hospitalarias}. [indicaciones adicionales].`,
  },
  {
    id: 'cat-nino-sano',
    specialty: 'pediatrics',
    name: 'Control de niño sano',
    shortcut: 'ns',
    body: `MOTIVO DE CONSULTA: Control de niño sano de [edad].

ANAMNESIS: Alimentación {lactancia materna exclusiva|lactancia mixta|fórmula|alimentación complementaria|dieta familiar}. Sueño {adecuado|con despertares frecuentes}. Deposiciones {normales|estreñimiento}. Sin problemas de salud desde el último control.

EXPLORACIÓN FÍSICA: Peso [peso] kg (P[percentil de peso]), talla [talla] cm (P[percentil de talla]){|, perímetro cefálico [perímetro cefálico] cm}. Exploración por aparatos normal.
Desarrollo psicomotor {adecuado para la edad|con retraso en [área]}.

VACUNACIÓN: {Al día|Pendiente: [vacunas pendientes]}.

PLAN: Consejos de alimentación, sueño seguro y prevención de accidentes según edad. Próximo control a los [edad del próximo control]. ((Revisar calendario vacunal y cribados según edad))`,
  },
  {
    id: 'cat-fiebre-nino',
    specialty: 'pediatrics',
    name: 'Fiebre en el niño',
    shortcut: 'fiebre',
    body: `MOTIVO DE CONSULTA: Fiebre de [horas de evolución] de evolución.

ANAMNESIS: Fiebre máxima de [temperatura máxima] °C{| con buena respuesta a antitérmicos| con mala respuesta a antitérmicos}. Síntomas asociados: {ninguno|tos y mocos|vómitos|diarrea|dolor de oído|exantema}. {Buen estado general entre picos|Decaído entre picos}. Vacunación al día. ((Menores de 3 meses con fiebre: valoración hospitalaria))

EXPLORACIÓN FÍSICA: Peso [peso] kg, T.ª [temperatura] °C. Buen estado general, {activo y reactivo|irritable|decaído}, bien hidratado y perfundido. Sin exantemas ni petequias. Orofaringe {normal|hiperémica}. Otoscopia {normal|hiperemia timpánica}. Auscultación cardiopulmonar normal. Sin signos meníngeos.

IMPRESIÓN DIAGNÓSTICA: {Síndrome febril sin foco|[diagnóstico]}.

PLAN: Antitérmico según peso: [antitérmico y dosis]. Hidratación abundante. Se explican signos de alarma (decaimiento, manchas en la piel, dificultad respiratoria, vómitos persistentes). Control si fiebre más de 48-72 h.`,
  },
  {
    id: 'cat-vgi',
    specialty: 'geriatrics',
    name: 'Valoración geriátrica',
    shortcut: 'vgi',
    body: `MOTIVO DE CONSULTA: Valoración geriátrica integral.

SITUACIÓN FUNCIONAL: Índice de Barthel [puntuación Barthel]/100 ({independiente|dependencia leve|dependencia moderada|dependencia grave}). {Deambula sin ayuda|Deambula con bastón|Deambula con andador|No deambula}. Caídas en el último año: {ninguna|[número de caídas]}.

SITUACIÓN COGNITIVA: {Sin quejas cognitivas|Quejas de memoria}. Pfeiffer [errores Pfeiffer] errores. ((Si 3 o más errores, completar con MMSE o MoCA))

SITUACIÓN SOCIAL: Vive {acompañado|solo|en residencia}. Cuidador principal: {no precisa|[cuidador principal]}.

POLIFARMACIA: [número de fármacos] fármacos. {Sin interacciones relevantes|Revisar: [fármacos a revisar]}. ((Criterios STOPP/START))

EXPLORACIÓN: TA [TA] mmHg, peso [peso] kg. Timed Up and Go [segundos TUG] s.

PLAN: [plan de cuidados]. {Sin cambios en la medicación|Ajuste de medicación: [cambios]}. Control en [tiempo].`,
  },
  {
    id: 'cat-dispepsia',
    specialty: 'digestive',
    name: 'Dispepsia / reflujo',
    shortcut: 'erge',
    body: `MOTIVO DE CONSULTA: Molestias digestivas de [tiempo de evolución] de evolución.

ANAMNESIS: Refiere {pirosis y regurgitación|epigastralgia|plenitud posprandial|náuseas}{| relacionada con las comidas| de predominio nocturno}. Sin disfagia, vómitos, pérdida de peso ni signos de sangrado digestivo. Consumo de AINE: {no|sí, [AINE]}. ((Signos de alarma que obligan a endoscopia: disfagia, pérdida de peso, anemia, sangrado, edad >55 con síntomas nuevos))

EXPLORACIÓN FÍSICA: Abdomen blando, depresible, {no doloroso|doloroso en epigastrio}, sin masas ni megalias. Peso [peso] kg.

IMPRESIÓN DIAGNÓSTICA: {Enfermedad por reflujo gastroesofágico|Dispepsia funcional}.

PLAN: [tratamiento] durante [duración]. Medidas higiénico-dietéticas: cenar 2-3 h antes de acostarse, elevar el cabecero de la cama, evitar comidas copiosas, alcohol y tabaco. {Sin estudio de H. pylori|Test de aliento para H. pylori}. Control en [tiempo].`,
  },
];
