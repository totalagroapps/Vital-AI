// Plantillas de informe predeterminadas de MIVOR Scribe (estilo MedAlly).
// Cada multi-opción empieza en su primera opción (hallazgo normal): el médico solo cambia lo que difiere
// y completa los pocos [campos] que quedan. Sintaxis en utils/noteTemplate.js.

export const TEMPLATE_SPECIALTIES = [
  { id: 'general', label: 'Medicina General' },
  { id: 'cardiology', label: 'Cardiología' },
  { id: 'pediatrics', label: 'Pediatría' },
  { id: 'geriatrics', label: 'Geriatría' },
  { id: 'digestive', label: 'Digestivo' },
  { id: 'gynecology', label: 'Ginecología' },
  { id: 'dermatology', label: 'Dermatología' },
  { id: 'psychiatry', label: 'Psiquiatría' },
  { id: 'traumatology', label: 'Traumatología' },
  { id: 'endocrinology', label: 'Endocrinología' },
  { id: 'neurology', label: 'Neurología' },
  { id: 'respiratory', label: 'Neumología' },
  { id: 'ent', label: 'Otorrino' },
];

export const NOTE_TEMPLATE_CATALOG = [
  // --- MEDICINA GENERAL ---
  {
    id: 'cat-consulta-general',
    specialty: 'general',
    name: 'Consulta general',
    shortcut: 'cg',
    body: `MOTIVO DE CONSULTA: [motivo de consulta].

ANAMNESIS: [síntomas y tiempo de evolución]. ((Antecedentes, alergias y medicación habitual))
Antecedentes relevantes: {sin antecedentes de interés|[antecedentes]}.
Alergias medicamentosas: {no conocidas|[alergias]}.

EXPLORACIÓN FÍSICA: Buen estado general, {consciente y orientado|somnoliento|desorientado}, {normocoloreado e hidratado|palidez cutánea|deshidratación leve}. TA [TA] mmHg, FC [FC] lpm, T.ª [temperatura] ºC.
[hallazgos exploratorios relevantes]

IMPRESIÓN DIAGNÓSTICA: [diagnóstico].

PLAN: [tratamiento y recomendaciones]. {Control según evolución|Control en [tiempo]}. Se explican signos de alarma para reconsultar.`,
  },
  {
    id: 'cat-itu',
    specialty: 'general',
    name: 'Infección urinaria',
    shortcut: 'itu',
    body: `MOTIVO DE CONSULTA: Síndrome miccional de [días de evolución] de evolución.

ANAMNESIS: Refiere disuria y polaquiuria{| con tenesmo vesical| con hematuria}. {Sin fiebre ni dolor lumbar|Con fiebre|Con dolor lumbar}. {Sin episodios previos|Episodios previos: [número y fecha]}. ((Descartar embarazo en mujer en edad fértil))

EXPLORACIÓN FÍSICA: Buen estado general. T.ª [temperatura] ºC. Puñopercusión renal {negativa bilateral|positiva [lado]}. Abdomen {no doloroso|doloroso en hipogastrio}.
Tira reactiva de orina: {leucocitos y nitritos positivos|leucocitos positivos, nitritos negativos|negativa|no realizada}.

IMPRESIÓN DIAGNÓSTICA: {Cistitis aguda no complicada|Infección urinaria complicada|Pielonefritis aguda}.

PLAN: [antibiótico, dosis y duración]. Abundante ingesta de líquidos. {Sin urocultivo|Se solicita urocultivo}. Reconsultar si fiebre, dolor lumbar o persistencia de síntomas a las 72 h.`,
  },

  // --- CARDIOLOGÍA ---
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

  // --- PEDIATRÍA ---
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

ANAMNESIS: Fiebre máxima de [temperatura máxima] ºC{| con buena respuesta a antitérmicos| con mala respuesta a antitérmicos}. Síntomas asociados: {ninguno|tos y mocos|vómitos|diarrea|dolor de oído|exantema}. {Buen estado general entre picos|Decaído entre picos}. Vacunación al día. ((Menores de 3 meses con fiebre: valoración hospitalaria))

EXPLORACIÓN FÍSICA: Peso [peso] kg, T.ª [temperatura] ºC. Buen estado general, {activo y reactivo|irritable|decaído}, bien hidratado y perfundido. Sin exantemas ni petequias. Orofaringe {normal|hiperémica}. Otoscopia {normal|hiperemia timpánica}. Auscultación cardiopulmonar normal. Sin signos meníngeos.

IMPRESIÓN DIAGNÓSTICA: {Síndrome febril sin foco|[diagnóstico]}.

PLAN: Antitérmico según peso: [antitérmico y dosis]. Hidratación abundante. Se explican signos de alarma (decaimiento, manchas en la piel, dificultad respiratoria, vómitos persistentes). Control si fiebre más de 48-72 h.`,
  },

  // --- GERIATRÍA ---
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

  // --- DIGESTIVO ---
  {
    id: 'cat-gastro',
    specialty: 'digestive',
    name: 'Gastroenteritis aguda',
    shortcut: 'gea',
    body: `MOTIVO DE CONSULTA: Diarrea de [tiempo de evolución] de evolución.

ANAMNESIS: Deposiciones líquidas, [número] al día. {Sin productos patológicos|Con moco|Con sangre}. Acompañado de {sin otros síntomas|náuseas y vómitos|dolor abdominal tipo cólico|fiebre de [grados] ºC}. Tolerancia oral {buena|regular|nula}. Diuresis {conservada|disminuida}. Entorno familiar con síntomas: {no|sí}.

EXPLORACIÓN FÍSICA: Estado general conservado. Signos de deshidratación: {ausentes|pliegue positivo, mucosas secas}. Auscultación abdominal: {ruidos hidroaéreos aumentados|normales}. Abdomen blando, depresible, {no doloroso|doloroso de forma difusa}, sin signos de irritación peritoneal.

IMPRESIÓN DIAGNÓSTICA: Gastroenteritis aguda {sin signos de deshidratación|con deshidratación leve}.

PLAN: Rehidratación oral con suero de rehidratación, dieta astringente progresiva. {Sin tratamiento antibiótico|[tratamiento]}. Reconsultar si sangre en heces, fiebre alta, vómitos persistentes o signos de deshidratación.`,
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

  // --- GINECOLOGÍA ---
  {
    id: 'cat-control-prenatal',
    specialty: 'gynecology',
    name: 'Control prenatal',
    shortcut: 'emb',
    body: `MOTIVO DE CONSULTA: Control de embarazo de [semanas] semanas de gestación.

ANAMNESIS: Embarazo {normoevolutivo|con complicaciones previas: [complicaciones]}. Percibe movimientos fetales: {sí|no}. Síntomas: {asintomática|náuseas leves|reflujo|edema leve de miembros inferiores}. Ausencia de sangrado vaginal, pérdida de líquido o contracciones regulares. Tolerancia oral adecuada.

EXPLORACIÓN FÍSICA: TA [TA] mmHg, Peso [peso] kg. Altura uterina [altura] cm. Frecuencia cardiaca fetal (FCF) [latidos] lpm. Movimientos fetales presentes. {Sin edemas patológicos|Edemas en MMII}. 

IMPRESIÓN DIAGNÓSTICA: Gestación de [semanas] semanas de evolución normal.

PLAN: Mantener suplementación con [suplementos]. Recomendaciones nutricionales y signos de alarma (sangrado, disminución de movimientos fetales, contracciones, cefalea o visión borrosa). Cita para próximo control en [tiempo] y solicitud de [estudios o ecos pendientes].`,
  },
  {
    id: 'cat-infeccion-vaginal',
    specialty: 'gynecology',
    name: 'Vaginitis / Vaginosis',
    shortcut: 'vag',
    body: `MOTIVO DE CONSULTA: Flujo vaginal alterado y/o prurito de [días] días de evolución.

ANAMNESIS: Refiere aumento de flujo vaginal de características {blanco grumoso|grisáceo maloliente|amarillo-verdoso espumoso}. Prurito vulvar {ausente|leve|intenso}. Dispareunia {no|sí}. Disuria {no|sí}. Pareja estable: {sí|no}. Uso de antibióticos recientes: {no|sí}.

EXPLORACIÓN FÍSICA: Genitales externos: {sin alteraciones|eritema vulvar y excoriaciones}. Especuloscopia: flujo {blanco adherente (sospecha cándida)|grisáceo homogéneo (sospecha vaginosis)|burbujeante (sospecha tricomonas)}. Cérvix {sano|eritematoso}. 

IMPRESIÓN DIAGNÓSTICA: {Vulvovaginitis candidiásica|Vaginosis bacteriana|Tricomoniasis vaginal}.

PLAN: Tratamiento con [medicamento y pauta]. Recomendaciones de higiene íntima. {Tratamiento a pareja no indicado|Tratamiento empírico a pareja}. Reconsultar si no mejoría.`,
  },

  // --- DERMATOLOGÍA ---
  {
    id: 'cat-lesion-cutanea',
    specialty: 'dermatology',
    name: 'Lesión cutánea / Rash',
    shortcut: 'piel',
    body: `MOTIVO DE CONSULTA: Aparición de lesión cutánea de [tiempo de evolución] de evolución.

ANAMNESIS: Lesión localizada en [ubicación anatómica]. Evolución {estable|progresiva|en brotes}. Síntomas asociados: {asintomática|prurito|dolor|escozor}. Contacto previo con alérgenos/irritantes: {no|sí: [sustancia]}. Antecedentes personales de atopia: {no|sí}. 

EXPLORACIÓN FÍSICA: En [ubicación anatómica] se observa {placa eritemato-descamativa|pápulas eritematosas|vesículas agrupadas sobre base eritematosa|mácula hiperpigmentada asimétrica}. Bordes {regulares|irregulares}. Resto del tegumento sin alteraciones.

IMPRESIÓN DIAGNÓSTICA: {Dermatitis atópica / eccema|Dermatitis de contacto|Sospecha de tiña|Infección herpética|Lesión pigmentada a filiar}.

PLAN: {Corticoides tópicos: [pauta]|Antifúngico tópico: [pauta]|Antihistamínicos orales|Biopsia diferida}. Medidas de hidratación cutánea. Control en [tiempo].`,
  },
  {
    id: 'cat-acne',
    specialty: 'dermatology',
    name: 'Control de Acné',
    shortcut: 'acne',
    body: `MOTIVO DE CONSULTA: Evaluación de acné.

ANAMNESIS: Evolución de las lesiones de [meses/años]. Tratamientos previos: {ninguno|tópicos: [tópicos]|orales: [orales]}. Impacto psicosocial {leve|moderado|severo}. Ciclos menstruales {regulares|irregulares}. 

EXPLORACIÓN FÍSICA: Fototipo [I-VI]. Predominio de lesiones en {zona T facial|mejillas y mentón|tórax y espalda}. Tipo de lesiones: {comedones abiertos y cerrados|pápulas y pústulas|nódulos y quistes}. {Sin cicatrices|Cicatrices atróficas/hipertróficas post-acné}.

IMPRESIÓN DIAGNÓSTICA: Acné {comedoniano leve|papulopustuloso moderado|noduloquístico severo}.

PLAN: {Retinoide tópico nocturno|Peróxido de benzoilo matutino|Antibiótico oral tipo doxiciclina|Derivación para isotretinoína}. Fotoprotección diaria obligatoria (oil-free). Cita de seguimiento en [tiempo].`,
  },

  // --- PSIQUIATRÍA ---
  {
    id: 'cat-ansiedad',
    specialty: 'psychiatry',
    name: 'Síndrome Ansioso-Depresivo',
    shortcut: 'ans',
    body: `MOTIVO DE CONSULTA: Síntomas afectivos y ansiosos de [tiempo de evolución] de evolución.

ANAMNESIS: Refiere estado de ánimo {triste|ansioso|fluctuante}, anhedonia {no|sí}, apatía {no|sí}. Alteraciones del sueño: {no|insomnio de conciliación|insomnio de mantenimiento|despertar precoz}. Apetito {conservado|aumentado|disminuido}. Sensación de ahogo, taquicardia o crisis de pánico: {ausentes|presentes: [frecuencia]}. Ideación autolítica: {ausente|presente estructurada|presente no estructurada}. Estresor psicosocial reciente: {ninguno|[describir estresor]}.

EXPLORACIÓN PSICOPATOLÓGICA: Consciente, orientado. Abordaje colaborativo. Contacto visual {mantenido|evitativo}. Discurso {fluido, coherente|bradipsíquico|acelerado}. Afecto {eutímico|hipotímico|ansioso}, congruente. Sin alteraciones sensoperceptivas. Juicio de realidad conservado.

IMPRESIÓN DIAGNÓSTICA: {Trastorno de ansiedad generalizada|Episodio depresivo moderado|Trastorno mixto ansioso-depresivo|Reacción a estrés agudo}.

PLAN: Inicio de tratamiento con {ISRS: [fármaco y dosis]|Benzodiacepinas de apoyo a corto plazo: [pauta]|Psicoterapia cognitivo-conductual}. Explicar latencia de respuesta de los antidepresivos (2-4 semanas). Control en [tiempo].`,
  },

  // --- TRAUMATOLOGÍA ---
  {
    id: 'cat-lumbalgia',
    specialty: 'traumatology',
    name: 'Lumbalgia aguda / mecánica',
    shortcut: 'lumb',
    body: `MOTIVO DE CONSULTA: Dolor lumbar de [días] días de evolución.

ANAMNESIS: Dolor de inicio {súbito tras esfuerzo|insidioso}, localizado en región lumbar {sin irradiación|con irradiación ciática hasta [zona de irradiación]}. Carácter {mecánico (alivia en reposo)|inflamatorio (empeora en reposo/nocturno)}. Banderas rojas (pérdida de peso, fiebre, trauma previo, incontinencia): {negativas|positivas: [describir]}.

EXPLORACIÓN FÍSICA: Marcha {normal|antiálgica}. Columna alineada. Tono muscular paravertebral {normal|con contractura manifiesta}. Dolor a la palpación de apófisis espinosas {no|sí}. Maniobra de Lasègue {negativa bilateral|positiva a [grados] grados en pierna [izquierda/derecha]}. Maniobra de Bragard {negativa|positiva}. Fuerza y sensibilidad de MMII conservadas. Reflejos osteotendinosos normales.

IMPRESIÓN DIAGNÓSTICA: {Lumbalgia mecánica aguda|Lumbociatalgia aguda}.

PLAN: Reposo relativo (evitar cargas de peso), calor local. Analgesia/AINE: [pauta de medicación]. Relajante muscular: [pauta]. Ejercicios de fortalecimiento del core cuando ceda la fase aguda. Reconsultar si aparece déficit motor, retención urinaria o anestesia en silla de montar.`,
  },
  {
    id: 'cat-esguince-tobillo',
    specialty: 'traumatology',
    name: 'Esguince de tobillo',
    shortcut: 'tobi',
    body: `MOTIVO DE CONSULTA: Traumatismo en tobillo [derecho/izquierdo] hace [tiempo].

ANAMNESIS: Mecanismo de lesión: {inversión forzada|eversión forzada|trauma directo}. Capacidad de carga tras el impacto: {capaz de caminar|incapacidad para dar 4 pasos (criterios de Ottawa)}. Dolor localizado en cara {lateral|medial} del tobillo. 

EXPLORACIÓN FÍSICA: Tobillo con {leve edema|edema importante y hematoma}. Dolor a la palpación sobre {ligamento peroneoastragalino anterior|maléolo externo|maléolo interno|base del 5º metatarsiano}. Movilidad activa y pasiva {limitada por dolor|conservada}. Pulsos distales y sensibilidad conservados.
Pruebas de imagen: {Radiografía no indicada (Ottawa negativos)|Rx tobillo: sin evidencia de fractura aguda|Rx tobillo: fractura de [hueso]}.

IMPRESIÓN DIAGNÓSTICA: Esguince de tobillo grado {I (leve)|II (moderado)|III (grave)}.

PLAN: Protocolo RICE (Reposo, Hielo, Compresión, Elevación). Inmovilización con {vendaje funcional|tobillera estabilizadora|férula}. AINEs: [pauta]. Deambulación con carga según tolerancia. Fisioterapia de rehabilitación en [días] días.`,
  },

  // --- ENDOCRINOLOGÍA ---
  {
    id: 'cat-diabetes',
    specialty: 'endocrinology',
    name: 'Control de Diabetes Mellitus',
    shortcut: 'dm',
    body: `MOTIVO DE CONSULTA: Control de Diabetes Mellitus tipo {2|1}.

ANAMNESIS: Paciente con DM de [años] años de evolución. Adherencia al tratamiento {buena|regular|mala}. Dieta y ejercicio {adecuados|inadecuados}. Episodios de hipoglucemia: {no refiere|sí: [frecuencia y síntomas]}. Síntomas de hiperglucemia (poliuria, polidipsia): {ausentes|presentes}. 

EXPLORACIÓN FÍSICA: Peso [peso] kg, IMC [IMC]. TA [TA] mmHg. Exploración de pies: pulsos pedios {presentes|disminuidos}, sensibilidad (monofilamento) {conservada|alterada}. Sin lesiones tróficas.

EXÁMENES COMPLEMENTARIOS: 
- HbA1c reciente: [valor HbA1c] % (Fecha: [fecha]).
- Glucemia capilar basal media: [valor] mg/dL.
- Función renal / Microalbuminuria: {normal|alterada: [valor]}.

IMPRESIÓN DIAGNÓSTICA: Diabetes Mellitus {bien controlada|con control subóptimo}.

PLAN: Mantenimiento de medidas higiénico-dietéticas. Tratamiento farmacológico: {continuar pauta actual|ajustar: [nuevo esquema de antidiabéticos/insulina]}. Derivación a oftalmología para fondo de ojo (anual). Próximo control clínico en [tiempo].`,
  },

  // --- NEUROLOGÍA ---
  {
    id: 'cat-cefalea',
    specialty: 'neurology',
    name: 'Cefalea',
    shortcut: 'cef',
    body: `MOTIVO DE CONSULTA: Cefalea de [días/meses] de evolución.

ANAMNESIS: Dolor de tipo {pulsátil|opresivo en banda|punzante}, localizado en región {hemicraneal [lado]|bifrontal|occipital}, de intensidad [1-10]/10. Frecuencia: [número] episodios al mes. Síntomas acompañantes: {fonofobia y fotofobia|náuseas o vómitos|auras visuales|lagrimeo y rinorrea|sin síntomas acompañantes}. 
Banderas rojas (inicio explosivo, empeora con valsalva, fiebre, inicio >50 años): {negativas|positivas: [describir]}. Abuso de analgésicos: {no|sí}.

EXPLORACIÓN FÍSICA: Constantes normales. Exploración neurológica completa: pupilas isocóricas y normorreactivas, pares craneales normales, fuerza y sensibilidad en extremidades conservadas. Maniobras meníngeas negativas. Fondo de ojo (si realizado): {normal|papiledema}.

IMPRESIÓN DIAGNÓSTICA: {Migraña episódica|Migraña crónica|Cefalea tensional|Cefalea en racimos|Sospecha de cefalea secundaria}.

PLAN: Tratamiento sintomático de crisis: [pauta (AINE/Triptanes)]. Tratamiento preventivo: {no indicado|iniciar [fármaco preventivo]}. Diario de cefaleas. Reconsultar si cambios en el patrón del dolor o signos de alarma.`,
  },

  // --- RESPIRATORIO / NEUMOLOGÍA ---
  {
    id: 'cat-ira',
    specialty: 'respiratory',
    name: 'Infección Respiratoria Alta / Faringitis',
    shortcut: 'ira',
    body: `MOTIVO DE CONSULTA: Odinofagia y síntomas catarrales de [días] días de evolución.

ANAMNESIS: Refiere dolor de garganta intenso, acompañado de {tos seca|tos productiva}, congestión nasal y rinorrea. Fiebre: {sin fiebre|febrícula|fiebre de [grados] ºC}. Expectoración: {clara|mucopurulenta}. Sin disnea ni dolor pleurítico. Contactos enfermos: {no|sí}. 
Criterios de Centor para faringoamigdalitis estreptocócica: {0-1 (probabilidad baja)|2-3 (probabilidad intermedia)|4 (probabilidad alta)}.

EXPLORACIÓN FÍSICA: Buen estado general. Orofaringe: {hiperémica sin exudados|hipertrofia amigdalar con exudados pultáceos}. Adenopatías cervicales {no palpables|palpables dolorosas}. Otoscopia {bilateral normal|timpano eritematoso [lado]}. Auscultación pulmonar: murmullo vesicular conservado, sin ruidos sobreañadidos.

IMPRESIÓN DIAGNÓSTICA: {Rinofaringitis aguda (catarro común)|Faringoamigdalitis aguda (sospecha viral)|Faringoamigdalitis aguda (sospecha bacteriana)|Gripe}.

PLAN: Tratamiento sintomático: hidratación, [pauta analgésica/antitérmica]. Lavados nasales. {No se prescribe antibiótico|Se prescribe antibiótico: [pauta antibiótica]}. Signos de alarma: dificultad para tragar líquidos, disnea o fiebre mantenida >3 días.`,
  },
  {
    id: 'cat-asma',
    specialty: 'respiratory',
    name: 'Control de Asma / EPOC',
    shortcut: 'asma',
    body: `MOTIVO DE CONSULTA: Control de enfermedad respiratoria crónica ({Asma|EPOC}).

ANAMNESIS: Uso de medicación de rescate en el último mes: {[número] veces a la semana}. Despertares nocturnos por tos/disnea: {ninguno|[número] al mes}. Limitación para actividad física: {ninguna|leve|moderada}. Exacerbaciones recientes: {no|sí: [fecha y manejo]}. Tabaquismo: {no fumador|exfumador|fumador activo: [paquetes/año]}.

EXPLORACIÓN FÍSICA: SatO2 basal [SatO2] %. Auscultación pulmonar: {ventilación bilateral normal|espiración alargada con sibilancias|hipoventilación global|roncus dispersos}. Frecuencia respiratoria normal, sin uso de musculatura accesoria.

EXÁMENES COMPLEMENTARIOS (opcional):
- Espirometría (si procede): [resultados FEV1/FVC].

IMPRESIÓN DIAGNÓSTICA: {Asma bien controlada|Asma parcialmente controlada|Asma no controlada|EPOC estable}.

PLAN: Ajuste de tratamiento inhalador: {mantener pauta actual|escalar tratamiento: [nueva pauta]}. Revisar técnica de inhalación. Consejos para cese tabáquico (si aplica). Próximo control clínico en [tiempo].`,
  }
];
