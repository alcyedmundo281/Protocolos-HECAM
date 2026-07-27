'use strict';
const fs = require('fs');
const path = require('path');
const L = require('../../skill/lib/hecam-lib.js');
const {
  Packer, Paragraph, TextRun, PageBreak, AlignmentType,
  CW, sp, h1, h2, h3, bp, blt, nmb, blk, dvd, caption, note, who,
  mkT, rTable, semaforo, membrete, portada, tocItem, biblio,
  firmas, controlCambios, buildDoc, BLUE,
} = L;

const titulo    = 'Manejo de la Infección Urinaria Aguda Complicada en Adultos';
const codigo    = 'HECAM-MI-PR-002';
const version   = '1';
const fechaElab = 'Julio 2026';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. JUSTIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const s1 = [
  h1('1.  Justificación'),
  bp('La infección del tracto urinario (ITU) es de las infecciones bacterianas más frecuentes del mundo, con más de 400 millones de episodios anuales. Su forma complicada —factores anatómicos, funcionales, metabólicos o inmunológicos que elevan el riesgo de fracaso terapéutico y de progresión a formas graves[[1]]— es causa frecuente de ingreso desde emergencia y se asocia a una mortalidad del 5–20 % con bacteriemia[[2]]. Si genera disfunción orgánica se configura la urosepsis, definida por Sepsis-3 como un aumento agudo del SOFA ≥ 2 puntos, con mortalidad del 20–40 %[[3]].'),
  bp('En el Hospital de Especialidades Carlos Andrade Marín (HECAM), tercer nivel del Instituto Ecuatoriano de Seguridad Social (IESS), Emergencia y Medicina Interna concentran buena parte de estos pacientes, en una población afiliada donde la diabetes, la enfermedad renal crónica, la litiasis urinaria y los catéteres vesicales permanentes explican que muchos cursen de forma grave. El Informe Técnico SVPCS-DNVE-2026-02 (MSP/INSPI–CRN-RAM), sobre 58 hospitales centinela incluido el HECAM, confirma que __Escherichia coli__ es el microorganismo más prevalente del país (46–55 % de los aislamientos) y concentra su mayor carga de multirresistencia en las infecciones urinarias[[4]].'),
  bp('El desafío terapéutico lo define la Cartilla de Resistencia Antibiótica HECAM 2025[[5]]. __E. coli__ presenta una resistencia a ceftriaxona del 30 % en Emergencia ambulatoria y del 53 % en Medicina Interna, con una prevalencia de betalactamasas de espectro extendido superior al 50 % en el hospitalizado[[6]]; la resistencia a ciprofloxacino alcanza el 66 % en Emergencia y a trimetoprima/sulfametoxazol el 57–80 %, lo que excluye a ambos de la terapia empírica; y __Klebsiella pneumoniae__ supera el 65 % de resistencia a cefalosporinas de tercera y cuarta generación, con 42–76 % a carbapenémicos en muestras hospitalarias, lo que confirma circulación activa de carbapenemasas KPC[[7]].'),
  bp('A ello se suma la altitud de Quito (2.850 m.s.n.m.): la hipoxia hipobárica crónica puede enmascarar la taquipnea, la taquicardia y la alteración del estado de conciencia, y retrasar el reconocimiento de la urosepsis. Los valores de referencia se ajustan: SatO₂ basal 88–92 %, PaO₂ basal 65–70 mmHg —extrapolados desde población andina sana estudiada a 2.640 m— y fiebre en T > 37,5 °C axilar. La hipoxia crónica altera además la masa muscular y la estimación de la función renal, lo que condiciona el ajuste de nefrotóxicos[[8]].'),
  bp('El protocolo abandona los esquemas empíricos ajenos a la epidemiología institucional y estratifica la terapia por servicio de origen y por factores de riesgo para microorganismos BLEE o CRE. El uso restringido de ceftazidima/avibactam como rescate se sustenta en la actualización del Cuadro Nacional de Medicamentos Básicos impulsada por el MSP ante el Consejo Nacional de Salud[[9]]. Se dirige a los adultos (≥ 18 años) con ITU complicada admitidos por Medicina Interna desde Emergencia. Participan Emergencia, Medicina Interna e Infectología, Laboratorio de Bacteriología/PROA, Nefrología, Urología, Imagenología, Farmacia y Cuidados Intensivos. Se espera un diagnóstico estandarizado, antimicrobianos apropiados en menos de 60 minutos, menor mortalidad por urosepsis, menor estancia y mejor uso de los antibióticos de reserva.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OBJETIVOS
// ═══════════════════════════════════════════════════════════════════════════════
const s2 = [
  h1('2.  Objetivos'),
  h3('Objetivo General'),
  bp('Estandarizar el diagnóstico y el manejo de la infección urinaria aguda complicada en pacientes adultos que ingresan por Emergencia al Departamento de Medicina Interna del Hospital de Especialidades Carlos Andrade Marín, utilizando la Cartilla de Resistencia Antibiótica HECAM 2025 como herramienta principal de decisión terapéutica, para reducir la mortalidad, prevenir la progresión a urosepsis y garantizar el uso racional de antimicrobianos.'),
  h3('Objetivos Específicos'),
  nmb('Definir los criterios diagnósticos clínicos, de laboratorio e imagenológicos que permitan clasificar y estratificar la ITU complicada en sus formas: cistitis complicada, pielonefritis aguda complicada, ITU asociada a catéter, prostatitis bacteriana aguda y urosepsis[[1]].'),
  nmb('Establecer un algoritmo de terapia antimicrobiana empírica adaptado a la epidemiología microbiológica real del HECAM, estratificado por servicio de origen, microorganismo probable y factores de riesgo para BLEE y CRE, con una meta de inicio en menos de 60 minutos desde el diagnóstico[[5]].'),
  nmb('Implementar un programa estructurado de desescalada antimicrobiana a las 48–72 horas guiado por el urocultivo y el antibiograma, conforme a las directrices del PROA-HECAM[[10]], empleando únicamente medicamentos incluidos en el Cuadro Nacional de Medicamentos Básicos[[11]].'),
  nmb('Establecer indicadores de calidad que permitan monitorizar la adherencia al protocolo, la tasa de urosepsis y la mortalidad hospitalaria asociada a ITU complicada, con reporte periódico al equipo de Microbiología y a la Coordinación General de Control de Calidad.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GLOSARIO
// ═══════════════════════════════════════════════════════════════════════════════
const s3 = [
  h1('3.  Glosario de términos / Abreviaciones'),
  caption('Tabla 1. Términos clínicos'),
  mkT(
    [{ label: 'TÉRMINO', w: 2200 }, { label: 'DEFINICIÓN', w: 6606 }],
    [
      ['ITU complicada', 'Infección urinaria que ocurre en presencia de factores anatómicos, funcionales, metabólicos o inmunológicos que aumentan el riesgo de fracaso terapéutico, recurrencia o progresión. Incluye la ITU en varones, embarazadas, portadores de catéter, y pacientes con anomalías urológicas, diabetes, inmunocompromiso o enfermedad renal crónica.[[1]]'],
      ['Pielonefritis aguda complicada', 'Infección bacteriana del parénquima renal y del sistema colector en un paciente con factores de complicación. Se manifiesta por fiebre, dolor lumbar y síndrome miccional, con o sin bacteriemia asociada.[[2]]'],
      ['Urosepsis', 'Sepsis cuyo foco primario es urológico. Se define por disfunción orgánica (aumento agudo de SOFA ≥ 2 puntos sobre el basal) secundaria a una respuesta desregulada del huésped ante una ITU. Mortalidad estimada: 20–40 %.[[3]]'],
      ['Bacteriuria significativa', 'Presencia de ≥ 10⁵ UFC/mL de un único uropatógeno en urocultivo de chorro medio. En el paciente cateterizado el umbral desciende a ≥ 10³ UFC/mL. Ante un síndrome miccional florido, cualquier recuento puede ser clínicamente significativo.[[1]]'],
      ['Bacteriuria asintomática', 'Bacteriuria significativa en ausencia de síntomas urinarios o sistémicos. NO debe tratarse, salvo en el embarazo o previo a un procedimiento urológico invasivo, ya que su tratamiento incrementa la resistencia sin beneficio clínico.[[12]]'],
      ['ITU asociada a catéter (ITU-AC)', 'Infección urinaria en un paciente portador de sonda vesical permanente por más de 48 horas, o retirada en las 48 horas previas, que presenta síntomas sistémicos atribuibles. Requiere el retiro o recambio del catéter como parte del tratamiento.[[12]]'],
      ['BLEE', 'Betalactamasas de espectro extendido. Enzimas de tipo CTX-M, TEM o SHV producidas principalmente por __E. coli__ y __K. pneumoniae__, que hidrolizan penicilinas, cefalosporinas de 3.ª y 4.ª generación y aztreonam. Prevalencia en el HECAM 2025: > 50 % en __E. coli__ hospitalaria.[[6]]'],
      ['CRE', 'Enterobacterales resistentes a carbapenémicos. En el HECAM 2025, __K. pneumoniae__ presenta 42 % de resistencia a imipenem y 24 % a meropenem en Emergencia ambulatoria, y 56–76 % en bacteriemia hospitalaria. Mecanismo predominante: carbapenemasas de tipo KPC.[[7]]'],
      ['Desescalada antimicrobiana', 'Simplificación del régimen empírico inicial, de amplio a estrecho espectro, guiada por los resultados del urocultivo y el antibiograma, manteniendo la eficacia clínica y reduciendo la presión selectiva. Constituye una estrategia central del PROA-HECAM.[[10]]'],
      ['TFG', 'Tasa de filtración glomerular. Medida de la función renal utilizada para el ajuste de dosis de antimicrobianos. Debe estimarse mediante la ecuación CKD-EPI; en la altitud de Quito la creatinina puede subestimarse por la menor masa muscular relativa.[[13]]'],
      ['Cartilla de Resistencia HECAM 2025', 'Análisis acumulado de resistencia antibiótica institucional (18 tablas por servicio). Metodología de concentración mínima inhibitoria según CLSI M100/M39; base de datos WHONET; abril de 2026. Documento de referencia PRIMARIO para la selección empírica en el HECAM.[[5]]'],
      ['PROA', 'Programa de Optimización del Uso de Antimicrobianos. Equipo institucional responsable de la vigilancia microbiológica, la elaboración de las cartillas de resistencia, la auditoría del uso de antibióticos y la autorización de los agentes de reserva.[[10]]'],
      ['Zona de precaución', 'Categoría de la Cartilla HECAM correspondiente a una resistencia del 30–70 %. El antimicrobiano puede emplearse con cautela, idealmente con confirmación de sensibilidad o asociado a un segundo agente activo.[[5]]'],
      ['Red-RAM', 'Red nacional de vigilancia de la resistencia antimicrobiana, integrada por 58 establecimientos centinela y coordinada por el CRN-RAM del INSPI. El HECAM participa como nodo de la Zona 9 (Pichincha) y debe notificar los aislamientos CRE y XDR.[[14]]'],
    ]
  ),
  blk(),
  caption('Tabla 2. Abreviaciones'),
  mkT(
    [{ label: 'ABREVIACIÓN', w: 2200 }, { label: 'SIGNIFICADO', w: 6606 }],
    [
      ['HECAM', 'Hospital de Especialidades Carlos Andrade Marín'],
      ['IESS', 'Instituto Ecuatoriano de Seguridad Social'],
      ['ITU / ITU-AC', 'Infección del tracto urinario / Infección urinaria asociada a catéter'],
      ['BLEE', 'Betalactamasas de espectro extendido'],
      ['CRE', 'Enterobacterales resistentes a carbapenémicos'],
      ['KPC', '__Klebsiella pneumoniae carbapenemase__'],
      ['CNMB', 'Cuadro Nacional de Medicamentos Básicos'],
      ['ERC', 'Enfermedad renal crónica'],
      ['TFG', 'Tasa de filtración glomerular'],
      ['UFC', 'Unidades formadoras de colonias'],
      ['PCR / PCT', 'Proteína C reactiva / Procalcitonina'],
      ['PROA', 'Programa de Optimización del Uso de Antimicrobianos'],
      ['RAM', 'Resistencia antimicrobiana'],
      ['CRN-RAM', 'Centro de Referencia Nacional de Resistencia a los Antimicrobianos (INSPI)'],
      ['DUD', 'Dosis única diaria'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.1
// ═══════════════════════════════════════════════════════════════════════════════
const s41 = [
  h1('4.  Procedimiento (Plan de Acción / Actuación)'),
  h2('4.1.  Evaluación inicial del paciente'),
  ...who('Médico de Emergencia y personal de Enfermería de Triage.',
         'Inmediatamente al ingreso o dentro de los primeros 15 minutos de la evaluación.'),
  h3('Criterios de inclusión: factores que definen una ITU como complicada'),
  caption('Tabla 3. Factores de complicación de la infección urinaria'),
  mkT(
    [{ label: 'Categoría', w: 2200 }, { label: 'Factores de complicación', w: 6606 }],
    [
      ['Anatómicos y urológicos', 'Litiasis urinaria, obstrucción del tracto urinario, vejiga neurógena, reflujo vesicoureteral, anomalías congénitas, riñón trasplantado y catéter urinario permanente por más de 48 horas.'],
      ['Metabólicos y sistémicos', 'Diabetes mellitus de cualquier tipo, enfermedad renal crónica con TFG < 60 mL/min, embarazo y obesidad mórbida (IMC > 40).'],
      ['Inmunológicos', 'Infección por VIH con CD4 < 200 células/µL, tratamiento inmunosupresor (corticoesteroides ≥ 20 mg/día por más de 4 semanas, quimioterapia o terapia biológica) y trasplante de órgano sólido.'],
      ['Demográficos y asistenciales', 'Sexo masculino (cualquier ITU), paciente hospitalizado, procedimiento urológico en los últimos 30 días e infección urinaria recurrente (≥ 3 episodios al año).'],
      ['Microbiológicos', 'Antecedente de ITU por microorganismo BLEE o CRE, tratamiento antibiótico en los últimos 90 días y residencia en institución de larga estadía.'],
    ]
  ),
  blk(),
  h3('Criterios de exclusión del protocolo'),
  blt('Pacientes menores de 18 años, que deben ser derivados al Servicio de Pediatría.'),
  blt('ITU no complicada en mujer adulta sin factores de riesgo: manejo ambulatorio con fosfomicina trometamol 3 g en dosis única o nitrofurantoína 100 mg cada 12 horas durante 5 días, ambas incluidas en el CNMB[[11]]. La Cartilla HECAM 2025 registra para __E. coli__ de Emergencia una resistencia a fosfomicina del 8 % y a nitrofurantoína del 7 %, restringiendo su uso exclusivamente a la cistitis no complicada[[5]].'),
  blt('Bacteriuria asintomática en paciente no embarazada y sin procedimiento urológico programado: NO debe tratarse[[12]].'),
  h3('Anamnesis y examen físico dirigidos'),
  blt('Síntomas urinarios: disuria, polaquiuria, urgencia miccional, hematuria y orina turbia o de olor fétido.'),
  blt('Síntomas sistémicos: fiebre, escalofríos, malestar general, náuseas, vómitos y dolor lumbar o en flanco. **NOTA DE ALTITUD:** en Quito el umbral de fiebre se ajusta a T > 37,5 °C axilar[[8]].'),
  blt('Signos vitales completos incluida la saturación de oxígeno. La SatO₂ basal de referencia es de 88–92 %; debe alarmar un valor < 88 %. Es una cifra extrapolada desde 2.640 m que desciende con la edad, así que en el paciente mayor conviene contrastarla con la gasometría[[8]].'),
  blt('Exploración dirigida: puñopercusión lumbar, palpación abdominal en busca de globo vesical o masas, y valoración del meato y del sistema de drenaje si el paciente porta catéter urinario.'),
  blt('**Antecedente microbiológico clave:** antibióticos recibidos en los últimos 90 días, hospitalización reciente y urocultivos previos con microorganismos resistentes. Estos factores determinan la selección empírica (véase el numeral 4.3).'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.2
// ═══════════════════════════════════════════════════════════════════════════════
const s42 = [
  h2('4.2.  Diagnóstico / Identificación de problemas basados en las necesidades'),
  ...who('Médico tratante de Emergencia o Medicina Interna.',
         'Dentro de los primeros 30 minutos del ingreso, en paralelo con el inicio del tratamiento si existen signos de gravedad.'),
  h3('Secuencia diagnóstica'),
  nmb('Solicitar TIRA REACTIVA DE ORINA al ingreso, con resultado disponible en menos de 10 minutos. La positividad para nitritos o esterasa leucocitaria orienta a ITU; un resultado negativo no descarta la infección en el paciente inmunodeprimido[[1]].'),
  nmb('Solicitar SEDIMENTO URINARIO. Una piuria ≥ 10 leucocitos por campo confirma la inflamación urinaria; una hematuria ≥ 5 eritrocitos por campo orienta a litiasis o neoplasia.'),
  nmb('Tomar UROCULTIVO con antibiograma ANTES de iniciar el antimicrobiano en todos los pacientes con ITU complicada, sin excepción. Recolección por chorro medio en el paciente continente o mediante catéter recién colocado en el paciente cateterizado[[12]].'),
  nmb('Solicitar HEMOCULTIVOS en dos series si el paciente presenta temperatura ≥ 38,5 °C, escalofríos, hipotensión o sospecha de urosepsis: entre el 25 y el 30 % de las pielonefritis complicadas cursan con bacteriemia[[14]].'),
  nmb('Calcular la puntuación SOFA ante sospecha de disfunción orgánica. Un aumento agudo ≥ 2 puntos sobre el basal define UROSEPSIS y obliga a activar en paralelo el protocolo HECAM-MI-PR-001 de manejo de sepsis y shock séptico[[3]].'),
  blk(),
  caption('Tabla 4. Clasificación diagnóstica y destino del paciente'),
  mkT(
    [{ label: 'Diagnóstico', w: 2000 }, { label: 'Criterios clínicos', w: 3600 }, { label: 'Mortalidad', w: 1000, centered: true }, { label: 'Destino', w: 2206 }],
    [
      ['Cistitis complicada', 'Síndrome miccional sin fiebre ni dolor lumbar en un paciente con al menos un factor de complicación.', '< 2 %', 'Hospitalizar si existe riesgo de BLEE, fracaso a tratamiento previo o intolerancia oral.'],
      ['Pielonefritis aguda complicada', 'Dolor lumbar, fiebre y síndrome miccional, con o sin bacteriemia, en presencia de factores de complicación.', '2–10 %', 'Hospitalización en Medicina Interna.'],
      ['ITU asociada a catéter', 'Síntomas sistémicos con bacteriuria ≥ 10³ UFC/mL en paciente cateterizado. Sin síntomas corresponde a bacteriuria asintomática y NO debe tratarse.', '5–15 %', 'Hospitalización. Retiro o recambio del catéter en las primeras 24 horas.'],
      ['Prostatitis bacteriana aguda', 'Varón con fiebre, dolor perineal o prostático y urocultivo positivo. No debe realizarse masaje prostático.', '< 5 %', 'Hospitalización con interconsulta a Urología.'],
      ['Urosepsis', 'ITU complicada con aumento agudo de SOFA ≥ 2 puntos sobre el basal.', '20–40 %', 'UCI o sala con monitoreo continuo. Activar el protocolo HECAM-MI-PR-001.'],
    ]
  ),
  blk(),
  caption('Tabla 5. Exámenes complementarios por prioridad'),
  mkT(
    [{ label: 'Prioridad', w: 900, centered: true }, { label: 'Examen', w: 2500 }, { label: 'Objetivo / Nota HECAM', w: 5406 }],
    [
      ['1.ª', 'Tira reactiva y sedimento urinario', 'Diagnóstico presuntivo inmediato en el Servicio de Emergencia, disponible en menos de 10 minutos.'],
      ['1.ª', 'Urocultivo con antibiograma', 'OBLIGATORIO antes del antimicrobiano. No debe retrasarse el tratamiento esperando el resultado.'],
      ['1.ª', 'Biometría hemática, creatinina, urea y glucemia', 'Evaluación de la respuesta inflamatoria y de la función renal para el ajuste de dosis. Estimar la TFG mediante CKD-EPI[[13]].'],
      ['1.ª', 'PCR y procalcitonina', 'Biomarcadores de inflamación sistémica. Una PCT < 0,5 ng/mL orienta a la suspensión del antimicrobiano.'],
      ['2.ª', 'Hemocultivos × 2 si T ≥ 38,5 °C o sepsis', 'Bacteriemia presente en el 25–30 % de las pielonefritis complicadas. En el HECAM 2025, __K. pneumoniae__ de bacteriemia presenta 56 % de resistencia a meropenem[[5]].'],
      ['2.ª', 'Ecografía renal y vesical urgente', 'Descartar obstrucción, absceso perinéfrico, pionefrosis y litiasis. Debe realizarse dentro de las primeras 6 horas en la ITU complicada grave.'],
      ['3.ª', 'Tomografía de abdomen y pelvis con contraste', 'Indicada si la ecografía no es concluyente, si la fiebre persiste más de 72 horas o ante sospecha de absceso o pielonefritis enfisematosa. Verificar la TFG antes del contraste intravenoso.'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.3
// ═══════════════════════════════════════════════════════════════════════════════
const resistCols = [
  { label: 'Antibiótico', w: 1706 },
  { label: 'E. coli Emergencia (n=751)', w: 1200 },
  { label: 'E. coli Medicina Interna (n=162)', w: 1200 },
  { label: 'E. coli Urología (n=201)', w: 1150 },
  { label: 'K. pneumoniae Emergencia (n=158)', w: 1200 },
  { label: 'K. pneumoniae Med. Interna (n=73)', w: 1200 },
  { label: 'K. pneumoniae bacteriemia (n=48)', w: 1150 },
];
const resistRows = [
  ['Ceftriaxona',                 '30 %', '53 %', '63 %', '69 %', '78 %', '(-)'],
  ['Ceftazidima',                 '24 %', '50 %', '55 %', '65 %', '79 %', '75 %'],
  ['Cefepime',                    '27 %', '49 %', '55 %', '66 %', '79 %', '77 %'],
  ['Ampicilina/Sulbactam',        '47 %', '54 %', '57 %', '74 %', '87 %', '81 %'],
  ['Piperacilina/Tazobactam',     '7 %',  '(-)',  '(-)',  '71 %', '(-)',  '76 %'],
  ['Imipenem',                    '0 %',  '(-)',  '(-)',  '42 %', '(-)',  '76 %'],
  ['Meropenem',                   '0 %',  '(-)',  '(-)',  '24 %', '(-)',  '56 %'],
  ['Ceftazidima/Avibactam',       '(-)',  '1 %',  '1 %',  '(-)',  '49 %', '2 %'],
  ['Amikacina',                   '4 %',  '(-)',  '(-)',  '12 %', '(-)',  '35 %'],
  ['Gentamicina',                 '17 %', '6 %',  '8 %',  '43 %', '27 %', '0 %'],
  ['Ciprofloxacino',              '66 %', '22 %', '13 %', '75 %', '53 %', '79 %'],
  ['Trimetoprima/Sulfametoxazol', '57 %', '80 %', '80 %', '56 %', '84 %', '(-)'],
  ['Fosfomicina',                 '8 %',  '68 %', '62 %', '(-)',  '(-)',  '(-)'],
  ['Nitrofurantoína',             '7 %',  '12 %', '22 %', '72 %', '76 %', '(-)'],
];

const atbCols = [
  { label: 'Escenario clínico', w: 1800 },
  { label: 'Factores de riesgo', w: 1900 },
  { label: 'ATB empírico (CNMB)', w: 1900 },
  { label: 'Dosis / vía / frecuencia', w: 1800 },
  { label: 'Ajuste renal', w: 1406 },
];
const atbRows = [
  ['Cistitis complicada o pielonefritis aguda complicada SIN riesgo de BLEE',
   'Sin antibióticos previos en 90 días, sin hospitalización reciente y sin antecedente de resistencia. __E. coli__ probable.',
   'Piperacilina/tazobactam IV como primera opción (7 % R en __E. coli__ de Emergencia). Ceftriaxona IV solo si se excluye BLEE, con precaución por 30 % R.',
   'Piperacilina/tazobactam 4,5 g IV c/6 h. Ceftriaxona 1–2 g IV c/24 h.',
   'Piperacilina/tazobactam 2,25 g c/6 h si TFG < 20. Ceftriaxona sin ajuste.'],
  ['Cistitis complicada o pielonefritis aguda complicada CON riesgo de BLEE',
   'Antibióticos previos en 90 días, hospitalización reciente, diabetes, ERC o ITU recurrente. __E. coli__ con 50 % R a cefalosporinas en Medicina Interna[[6]].',
   'Ertapenem IV como carbapenémico de elección (0 % R en __E. coli__), preservando meropenem para las infecciones por CRE.',
   'Ertapenem 1 g IV c/24 h en infusión de 30 minutos.',
   '0,5 g c/24 h si la TFG es de 10–30 mL/min.'],
  ['Pielonefritis hospitalaria o ITU asociada a catéter sin riesgo de CRE',
   'Paciente de Medicina Interna o portador de catéter, sin antecedente de aislamiento CRE ni uso previo de carbapenémicos.',
   'Ertapenem IV como primera línea en el paciente hospitalizado. Retiro o recambio obligatorio del catéter.',
   'Ertapenem 1 g IV c/24 h.',
   '0,5 g c/24 h si la TFG es de 10–30 mL/min.'],
  ['Pielonefritis con RIESGO ALTO de CRE',
   'Antecedente de ITU por KPC o CRE, uso previo de carbapenémicos, catéter en UCI o fracaso a ertapenem. __K. pneumoniae__ con 42 % R a imipenem y 24 % a meropenem en Emergencia[[7]].',
   'Meropenem IV. Si el paciente proviene de UCI o cursa con bacteriemia, considerar ceftazidima/avibactam desde el inicio.',
   'Meropenem 1–2 g IV c/8 h en infusión prolongada de 3 horas si se sospecha XDR.',
   'Ajuste obligatorio por TFG según ficha técnica.'],
  ['CRE confirmado por K. pneumoniae productora de KPC',
   'Aislamiento con confirmación microbiológica. En bacteriemia hospitalaria del HECAM 2025 la ceftazidima/avibactam presenta solo 2 % de resistencia frente al 56 % del meropenem[[5]].',
   'Ceftazidima/avibactam IV como agente de rescate, con autorización del PROA e Infectología[[16]].',
   'Ceftazidima/avibactam 2 g/0,5 g IV c/8 h en infusión prolongada de 2 horas.',
   'Ajuste obligatorio por TFG según ficha técnica.'],
  ['Urosepsis o shock séptico de foco urinario',
   'Inestabilidad hemodinámica, SOFA ≥ 2 puntos o lactato > 2 mmol/L. No debe esperarse el cultivo para iniciar el tratamiento[[15]].',
   'Meropenem IV asociado a amikacina IV. Añadir ceftazidima/avibactam si el riesgo de CRE es alto.',
   'Meropenem 2 g IV c/8 h + amikacina 20 mg/kg/día IV en dosis única diaria.',
   'No administrar amikacina si la TFG es < 30. Meropenem requiere ajuste por TFG.'],
  ['Prostatitis bacteriana aguda',
   'Varón con fiebre, dolor prostático y urocultivo positivo. El ciprofloxacino presenta 66 % de resistencia en Emergencia, por lo que no es una opción empírica[[5]].',
   'Ceftriaxona IV durante la fase aguda, con transición a vía oral guiada por antibiograma. El ciprofloxacino oral solo se emplea con sensibilidad confirmada.',
   'Ceftriaxona 2 g IV c/24 h; posteriormente ciprofloxacino 500 mg VO c/12 h solo si es sensible.',
   'Ceftriaxona sin ajuste. Ciprofloxacino 250 mg c/12 h si TFG < 30.'],
];

const oralRows = [
  ['Ciprofloxacino 500 mg VO c/12 h', 'Resistencia del 22 % en __E. coli__ urinaria de Medicina Interna y del 13 % en Urología, pero del 66 % en Emergencia. Emplear ÚNICAMENTE con antibiograma que confirme sensibilidad; nunca de forma empírica.', 'TFG < 30: 250 mg c/12 h'],
  ['Trimetoprima/sulfametoxazol 160/800 mg VO c/12 h', 'Resistencia del 57–80 % según el servicio. NO apto para terapia empírica. Utilizar solo con sensibilidad confirmada.', 'Evitar o espaciar si TFG < 30'],
  ['Amoxicilina/ácido clavulánico 875/125 mg VO c/12 h', 'Alternativa oral para __E. coli__ no productora de BLEE con sensibilidad confirmada. No emplear si el aislamiento es resistente a ampicilina/sulbactam (47 % R en Emergencia).', 'Sin ajuste si TFG > 30'],
  ['Fosfomicina trometamol 3 g VO c/48–72 h', 'Resistencia del 8 % en __E. coli__ de Emergencia frente al 68 % en Medicina Interna. Reservada EXCLUSIVAMENTE para la cistitis no complicada ambulatoria.', 'No utilizar si TFG < 30'],
  ['Nitrofurantoína 100 mg VO c/12 h', 'Resistencia del 7 % en __E. coli__ de Emergencia. Indicada solo en cistitis no complicada. CONTRAINDICADA en ITU complicada y con TFG < 45 mL/min.', 'Contraindicada si TFG < 45'],
];

const s43 = [
  h2('4.3.  Plan Terapéutico / Intervenciones no farmacológicas'),
  ...who('Médico tratante, con el soporte de Farmacia (PROA-HECAM) y Microbiología.',
         'Inicio del antimicrobiano empírico en menos de 60 minutos desde el diagnóstico, y en menos de 30 minutos si existe urosepsis.'),
  h3('A. Intervenciones no farmacológicas'),
  blt('Hidratación: administrar 1.000–2.000 mL de cristaloides IV en las primeras 4 horas si la vía oral está comprometida. Ante urosepsis, aplicar el esquema de 30 mL/kg en 3 horas del protocolo HECAM-MI-PR-001[[15]].'),
  blt('**Retirar o recambiar el catéter urinario** siempre que sea clínicamente posible en la ITU asociada a catéter. Constituye la intervención no farmacológica de mayor impacto en estos pacientes[[12]].'),
  blt('**Control del foco urológico:** interconsulta urgente a Urología ante hidronefrosis, pionefrosis o absceso perinéfrico. El drenaje percutáneo o la nefrostomía deben realizarse dentro de las primeras 6–12 horas y forman parte del tratamiento, no constituyen una medida opcional.'),
  blt('Control glucémico con meta de 140–180 mg/dL en el paciente hospitalizado, dado que la hiperglucemia sostenida altera la función leucocitaria y perpetúa la infección.'),
  blt('Analgesia con metamizol 1 g IV c/8 h o paracetamol 1 g IV c/6 h. Evitar los antiinflamatorios no esteroideos si la TFG es < 60 mL/min por el riesgo de lesión renal aguda[[13]].'),
  blk(),
  h3('B. Perfil de resistencia local en infección urinaria (Cartilla HECAM 2025)'),
  bp('Los datos siguientes provienen de la Cartilla de Resistencia Antibiótica HECAM 2025 (tablas 1, 8 y 10; metodología de concentración mínima inhibitoria según CLSI M100/M39; base de datos WHONET) y expresan el porcentaje de resistencia por microorganismo y servicio[[5]].'),
  caption('Tabla 6. Porcentaje de resistencia antibiótica en uropatógenos por servicio (HECAM 2025)'),
  rTable(resistCols, resistRows),
  semaforo(),
  note('Fosfomicina y nitrofurantoína se recomiendan exclusivamente para la cistitis no complicada; la nitrofurantoína está contraindicada con TFG < 45 mL/min.'),
  blk(),
  h3('C. Hallazgos críticos aplicados a la infección urinaria'),
  blt('**__E. coli__ en Emergencia:** piperacilina/tazobactam (7 % R) y los carbapenémicos (0 % R) son las opciones más seguras. La ceftriaxona se sitúa en zona de precaución (30 % R). El ciprofloxacino y la trimetoprima/sulfametoxazol NO son aptos para terapia empírica.'),
  blt('**__E. coli__ hospitalaria:** el 50–53 % de resistencia a cefalosporinas indica una alta prevalencia de BLEE. El ertapenem es el carbapenémico de elección para preservar el meropenem frente a los aislamientos CRE[[6]].'),
  blt('**__K. pneumoniae__ — alerta crítica:** resistencia superior al 65 % frente a todas las cefalosporinas en todos los servicios; 42 % a imipenem y 24 % a meropenem en Emergencia, y 56–76 % en bacteriemia hospitalaria, lo que confirma la circulación de CRE. La ceftazidima/avibactam presenta solo 2 % de resistencia en bacteriemia y constituye el agente de rescate clave[[7]].'),
  blt('**Precaución con ceftazidima/avibactam en aislamientos urinarios de Medicina Interna:** la resistencia alcanza el 49 %, por lo que en la urosepsis por __K. pneumoniae__ debe considerarse su combinación con amikacina y confirmarse la sensibilidad.'),
  blt('**Piperacilina/tazobactam:** excelente frente a __E. coli__ (7 % R) pero inadecuada frente a __K. pneumoniae__ (71 % R en Emergencia). No debe emplearse como monoterapia si __K. pneumoniae__ es el patógeno probable.'),
  blt('**Ciprofloxacino en Urología:** presenta solo 13 % de resistencia en __E. coli__, el valor más bajo de todos los servicios. Puede utilizarse guiado por antibiograma en infecciones urológicas por __E. coli__, pero nunca de forma empírica generalizada.'),
  blk(),
  h3('D. Antibioticoterapia empírica estratificada'),
  bp('**INSTRUCCIÓN OPERATIVA:** identificar el escenario clínico del paciente en la tabla siguiente y consultar la Cartilla de Resistencia HECAM 2025 correspondiente a su servicio de origen. Todos los antimicrobianos indicados constan en el Cuadro Nacional de Medicamentos Básicos[[11]]. Las dosis asumen función renal normal y deben ajustarse según la TFG estimada por CKD-EPI.'),
  caption('Tabla 7. Antibioticoterapia empírica estratificada en infección urinaria complicada'),
  mkT(atbCols, atbRows),
  blk(),
  h3('E. Terapia secuencial oral guiada por antibiograma'),
  bp('La transición a la vía oral se inicia cuando la temperatura es < 37,8 °C durante al menos 24 horas, la frecuencia cardíaca es < 100 lpm, existe tolerancia oral adecuada y se dispone del urocultivo. NUNCA debe realizarse de forma empírica: la elevada resistencia local a quinolonas y a trimetoprima/sulfametoxazol hace peligroso el cambio sin antibiograma[[5]].'),
  caption('Tabla 8. Opciones de terapia secuencial oral'),
  mkT(
    [{ label: 'Antimicrobiano oral', w: 2500 }, { label: 'Resistencia HECAM 2025 e indicación', w: 4600 }, { label: 'Ajuste renal', w: 1706 }],
    oralRows
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.4
// ═══════════════════════════════════════════════════════════════════════════════
const s44 = [
  h2('4.4.  Clasificación de severidad / Manejo de complicaciones'),
  ...who('Médico especialista de Medicina Interna o UCI.',
         'Al completar la evaluación inicial y de forma continua durante la hospitalización.'),
  caption('Tabla 9. Clasificación de severidad de la infección urinaria complicada'),
  mkT(
    [{ label: 'Severidad', w: 1300 }, { label: 'Criterios', w: 4000 }, { label: 'Mortalidad', w: 1100, centered: true }, { label: 'Conducta inmediata', w: 2406 }],
    [
      ['LEVE', 'ITU complicada sin disfunción orgánica, hemodinámicamente estable y con tolerancia oral conservada.', '< 2 %', 'Hospitalización en sala general con antimicrobiano IV y transición a vía oral en 48–72 horas guiada por cultivo.'],
      ['MODERADA', 'Pielonefritis aguda complicada con fiebre ≥ 38,5 °C o bacteriemia documentada, sin hipotensión ni disfunción orgánica.', '2–10 %', 'Hospitalización con antimicrobiano IV, ecografía renal urgente y hemocultivos obligatorios.'],
      ['GRAVE', 'Urosepsis sin shock, con SOFA ≥ 2 puntos y sin hipotensión refractaria.', '10–20 %', 'UCI o sala con monitoreo continuo. Medición de lactato y evaluación del foco urológico. Considerar CRE.'],
      ['CRÍTICA', 'Shock séptico de origen urinario: SOFA ≥ 2 puntos con vasopresores para PAM ≥ 65 mmHg y lactato > 2 mmol/L.', '> 40 %', 'UCI inmediata. Activar el protocolo HECAM-MI-PR-001. Drenaje urológico urgente si existe obstrucción.'],
    ]
  ),
  blk(),
  h3('Manejo de complicaciones esperadas'),
  blt('**Absceso perinéfrico:** sospechar si la fiebre persiste más de 72 horas pese a un antimicrobiano adecuado. La tomografía confirma el diagnóstico. Requiere drenaje percutáneo o quirúrgico coordinado con Urología y Radiología Intervencionista.'),
  blt('**Pionefrosis:** constituye una emergencia urológica. Exige nefrostomía percutánea urgente asociada al antimicrobiano intravenoso, por el riesgo elevado de shock séptico si no se drena en horas.'),
  blt('**Pielonefritis enfisematosa:** infección necrotizante con gas en el parénquima renal, casi exclusiva del paciente diabético, con mortalidad superior al 40 %. La tomografía es diagnóstica y requiere interconsulta urgente a Urología.'),
  blt('**Necrosis papilar renal:** asociada a diabetes, uso de antiinflamatorios no esteroideos y enfermedad renal crónica. Manejo conservador con suspensión de nefrotóxicos.'),
  blt('**Lesión renal aguda:** ajustar los antimicrobianos a la TFG vigente, evitar los antiinflamatorios no esteroideos y los aminoglucósidos con TFG < 30 mL/min, y monitorizar la diuresis horaria con meta ≥ 0,5 mL/kg/h[[13]].'),
  blt('**Candiduria:** frecuente en pacientes cateterizados, diabéticos o con antimicrobianos prolongados. No debe tratarse si es asintomática; si es sintomática, administrar fluconazol 200 mg diarios durante 14 días cuando el aislamiento sea sensible[[11]].'),
  blt('**Progresión a urosepsis:** coordinar el traslado inmediato a UCI y aplicar el protocolo HECAM-MI-PR-001. Notificar los aislamientos CRE o XDR al PROA-HECAM y al CRN-RAM/INSPI conforme a la Norma Técnica del Sistema Integrado de Vigilancia Epidemiológica[[14]].'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.5
// ═══════════════════════════════════════════════════════════════════════════════
const s45 = [
  h2('4.5.  Plan de Egreso de la Unidad / Seguimiento / Evaluación integral'),
  ...who('Médico tratante de Medicina Interna con el farmacéutico del PROA-HECAM.',
         'Evaluación clínica diaria; revisión de cultivos a las 48–72 horas; aplicación de criterios de alta al alcanzar la estabilidad clínica.'),
  h3('Desescalada guiada por urocultivo (48–72 horas)'),
  blt('Revisar el urocultivo y el antibiograma a las 48–72 horas. Si el microorganismo es sensible a un antimicrobiano de espectro más estrecho, la desescalada es OBLIGATORIA[[10]].'),
  blt('__E. coli__ sensible a piperacilina/tazobactam: desescalar desde ertapenem o meropenem. __E. coli__ productora de BLEE sensible a ertapenem: desescalar desde meropenem[[6]].'),
  blt('__K. pneumoniae__ CRE sensible a ceftazidima/avibactam: mantener el esquema y consultar a Infectología para definir la duración total del tratamiento[[16]].'),
  blt('Emplear la procalcitonina como criterio complementario de suspensión, con meta < 0,5 ng/mL cuando esté disponible.'),
  blt('Realizar una reunión interdisciplinaria (internista, farmacéutico e infectólogo) para cada aislamiento CRE o de manejo difícil, conforme a las políticas de vigilancia nacional de la resistencia antimicrobiana[[17]].'),
  h3('Criterios de alta hospitalaria'),
  blt('Afebril durante al menos 48 horas, considerando el umbral de altitud de T < 37,5 °C axilar.'),
  blt('Tolerancia oral adecuada y disponibilidad de un antimicrobiano oral avalado por el antibiograma.'),
  blt('Función renal estable, con creatinina en su valor basal o con una nueva línea de base documentada.'),
  blt('El urocultivo de control no se requiere de forma rutinaria al alta, salvo en pacientes con aislamiento CRE, embarazadas, receptores de trasplante o ante persistencia de síntomas.'),
  blt('Plan de seguimiento ambulatorio confirmado a los 7 días, con control clínico y de laboratorio.'),
  blk(),
  caption('Tabla 10. Duración total recomendada del tratamiento antimicrobiano'),
  mkT(
    [{ label: 'Diagnóstico', w: 3400 }, { label: 'Duración total (intravenosa más oral)', w: 5406 }],
    [
      ['Cistitis complicada', '7 días'],
      ['Pielonefritis aguda complicada sin bacteriemia', '10–14 días'],
      ['Pielonefritis aguda complicada con bacteriemia', '14 días como mínimo'],
      ['ITU asociada a catéter con retiro del dispositivo en 24 horas', '7 días'],
      ['ITU asociada a catéter sin retiro del dispositivo', '14 días'],
      ['Urosepsis por K. pneumoniae CRE', '14–21 días según evolución y control microbiológico'],
      ['Prostatitis bacteriana aguda', '4–6 semanas, con antimicrobiano oral avalado por antibiograma'],
      ['Absceso renal o pionefrosis tras el drenaje', '21 días como mínimo, con seguimiento por imagen'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4.6
// ═══════════════════════════════════════════════════════════════════════════════
const s46 = [
  h2('4.6.  Nivel de evidencia y grado de recomendaciones'),
  bp('Las recomendaciones de este protocolo se catalogan según el sistema del __Oxford Centre for Evidence-Based Medicine__ (CEBM), versión de marzo de 2009.'),
  caption('Tabla 11. Nivel de evidencia y grado de recomendación'),
  mkT(
    [{ label: 'Área', w: 1400 }, { label: 'Recomendación', w: 5306 }, { label: 'NE', w: 1000, centered: true }, { label: 'GR', w: 1100, centered: true }],
    [
      ['Diagnóstico', 'Tomar urocultivo con antibiograma ANTES de iniciar el antimicrobiano en toda infección urinaria complicada[[1]].', '2a', 'B'],
      ['Diagnóstico', 'Obtener hemocultivos en dos series ante fiebre ≥ 38,5 °C, escalofríos o hipotensión en el paciente con ITU complicada[[14]].', '2a', 'B'],
      ['Diagnóstico', 'Realizar ecografía renal dentro de las primeras 6 horas ante sospecha de obstrucción, absceso o pionefrosis[[2]].', '1b', 'A'],
      ['Tratamiento', 'Iniciar el antimicrobiano intravenoso en menos de 60 minutos desde el diagnóstico, y en menos de 30 minutos ante urosepsis[[15]].', '1b', 'A'],
      ['Tratamiento', 'Seleccionar el antimicrobiano empírico según la Cartilla de Resistencia HECAM 2025 y los factores de riesgo individuales para BLEE y CRE[[5]].', '2a', 'B'],
      ['Tratamiento', 'No emplear ciprofloxacino ni trimetoprima/sulfametoxazol de forma empírica en la ITU complicada, dada la resistencia local superior al 50 %[[5]].', '2a', 'B'],
      ['Tratamiento', 'Utilizar ertapenem como carbapenémico preferente frente a microorganismos productores de BLEE, preservando el meropenem[[6]].', '1b', 'A'],
      ['Tratamiento', 'Reservar la ceftazidima/avibactam para los aislamientos CRE confirmados, con autorización del PROA e Infectología[[16]].', '1b', 'A'],
      ['Tratamiento', 'Retirar o recambiar el catéter urinario dentro de las primeras 24 horas en toda infección urinaria asociada a catéter[[12]].', '1b', 'A'],
      ['Desescalada', 'Desescalar o ajustar el antimicrobiano a las 48–72 horas según el urocultivo y el antibiograma[[10]].', '1b', 'A'],
      ['Vigilancia', 'Notificar los aislamientos CRE y XDR al PROA-HECAM y al CRN-RAM/INSPI conforme a la normativa nacional de vigilancia[[17]].', '5', 'D'],
      ['Altitud', 'Ajustar las metas de saturación de oxígeno, el umbral de fiebre y la estimación de la TFG al entorno de 2.850 m.s.n.m.[[8]].', '5', 'D'],
    ]
  ),
  note('__Leyenda Oxford CEBM:__ NE 1a = revisión sistemática de ensayos clínicos aleatorizados; 1b = ensayo clínico aleatorizado individual; 2a = revisión sistemática de estudios de cohorte; 2b = cohorte individual; 4 = serie de casos; 5 = opinión de expertos. GR A (nivel 1), B (niveles 2–3), C (nivel 4), D (nivel 5 o evidencia extrapolada).'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5 y 6
// ═══════════════════════════════════════════════════════════════════════════════
const s5 = [
  h1('5.  Algoritmo de actuación'),
  bp('Representar el diagrama de flujo o algoritmo descriptivo de las actividades enumeradas en el numeral anterior utilizando la herramienta Bizagi, el cual será realizado con el soporte de la Coordinación General de Control de Calidad.'),
];

const s6 = [
  h1('6.  Indicadores'),
  caption('Tabla 12. Indicadores de calidad del protocolo'),
  mkT(
    [
      { label: 'Nombre del indicador', w: 1900 },
      { label: 'Definición', w: 2400 },
      { label: 'Cálculo', w: 2100 },
      { label: 'Meta', w: 900, centered: true },
      { label: 'Periodo', w: 800, centered: true },
      { label: 'Responsable', w: 706 },
    ],
    [
      ['Urocultivo previo al antimicrobiano (diagnóstico)', 'Pacientes con ITU complicada a quienes se tomó urocultivo antes de la primera dosis de antimicrobiano.', '(N.º con urocultivo previo / total de ITU complicadas hospitalizadas) × 100', '≥ 95 %', 'Mensual', 'Microbiología, Emergencia'],
      ['Hemocultivos en urosepsis (diagnóstico)', 'Pacientes con urosepsis con dos series de hemocultivos tomadas antes del antimicrobiano.', '(N.º con hemocultivos previos / total de pacientes con urosepsis) × 100', '100 %', 'Mensual', 'UCI, Emergencia'],
      ['Ecografía renal en 6 horas (diagnóstico)', 'Pacientes con ITU complicada grave o urosepsis con ecografía renal realizada dentro de las 6 primeras horas.', '(N.º con ecografía ≤ 6 h / total de ITU grave o urosepsis) × 100', '≥ 80 %', 'Mensual', 'Imagenología, Emergencia'],
      ['Inicio del antimicrobiano en 60 minutos (tratamiento)', 'Pacientes con ITU complicada sin urosepsis que reciben antimicrobiano dentro de los 60 minutos del diagnóstico.', '(N.º con ATB ≤ 60 min / total de ITU complicadas admitidas) × 100', '≥ 85 %', 'Mensual', 'Farmacia, Emergencia'],
      ['Inicio del antimicrobiano en 30 minutos en urosepsis (tratamiento)', 'Pacientes con urosepsis que reciben antimicrobiano dentro de los 30 minutos del diagnóstico.', '(N.º con ATB ≤ 30 min / total de pacientes con urosepsis) × 100', '≥ 90 %', 'Mensual', 'UCI, Emergencia, Farmacia'],
      ['Adherencia a la terapia estratificada HECAM 2025 (tratamiento)', 'Pacientes con antimicrobiano empírico concordante con la estratificación de la Cartilla de Resistencia HECAM 2025.', '(N.º con ATB concordante / total de ITU complicadas hospitalizadas) × 100', '≥ 80 %', 'Mensual', 'PROA, Farmacia, Medicina Interna'],
      ['Desescalada guiada por urocultivo (tratamiento)', 'Pacientes en quienes se modificó el antimicrobiano empírico a las 48–72 horas según el resultado del urocultivo.', '(N.º con ATB ajustado por cultivo / total con urocultivo positivo) × 100', '≥ 80 %', 'Trimestral', 'PROA, Medicina Interna, Infectología'],
      ['Retiro del catéter en ITU asociada a catéter (seguimiento)', 'Pacientes con ITU asociada a catéter en quienes se retiró o recambió el dispositivo dentro de las primeras 24 horas.', '(N.º con catéter retirado ≤ 24 h / total de ITU asociadas a catéter) × 100', '≥ 90 %', 'Mensual', 'Enfermería, Medicina Interna'],
      ['Tasa de urosepsis secundaria (seguimiento)', 'Pacientes hospitalizados por ITU complicada que desarrollan urosepsis durante la hospitalización.', '(N.º con urosepsis secundaria / total de ITU complicadas hospitalizadas) × 100', '≤ 10 %', 'Trimestral', 'Control de Calidad, Medicina Interna'],
      ['Mortalidad hospitalaria por urosepsis (resultado)', 'Pacientes con urosepsis que fallecen durante la hospitalización.', '(N.º de fallecidos con urosepsis / total de pacientes con urosepsis) × 100', 'Reducción 5 % anual', 'Anual', 'Dirección Técnica, Control de Calidad'],
      ['Estancia hospitalaria por ITU complicada (resultado)', 'Mediana de días de hospitalización por ITU complicada, excluyendo los casos de urosepsis por CRE.', 'Mediana de días de hospitalización de la cohorte', 'Reducción 10 % anual', 'Trimestral', 'Medicina Interna, Control de Calidad'],
      ['Notificación de CRE al PROA y CRN-RAM (resultado)', 'Aislamientos CRE o XDR de origen urinario notificados al PROA-HECAM y al CRN-RAM/INSPI conforme a la Norma SIVE.', '(N.º de aislamientos notificados / total de CRE-XDR urinarios) × 100', '100 %', 'Mensual', 'PROA, Microbiología'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 7. BIBLIOGRAFÍA (orden de aparición)
// ═══════════════════════════════════════════════════════════════════════════════
const refs = [
  /* 1  */ 'Gupta K, Hooton TM, Naber KG, Wullt B, Colgan R, Miller LG, et al. International clinical practice guidelines for the treatment of acute uncomplicated cystitis and pyelonephritis in women: a 2010 update by the Infectious Diseases Society of America and the European Society for Microbiology and Infectious Diseases. Clin Infect Dis. 2011;52(5):e103–20. doi:10.1093/cid/ciq257',
  /* 2  */ 'European Association of Urology. EAU Guidelines on Urological Infections. Arnhem: European Association of Urology; 2023. ISBN 978-94-92671-19-6.',
  /* 3  */ 'Singer M, Deutschman CS, Seymour CW, Shankar-Hari M, Annane D, Bauer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801–10. doi:10.1001/jama.2016.0287',
  /* 4  */ 'Palacios Rodas R, Narváez M. Informe Técnico SVPCS-DNVE-2026-02: Situación de la Resistencia Antimicrobiana en Ecuador 2020–2024. Quito: Dirección Nacional de Vigilancia Epidemiológica, Ministerio de Salud Pública / INSPI–CRN-RAM; 15 de enero de 2026.',
  /* 5  */ 'Andrade Estévez AC, Gordón A, Cevallos C. Análisis Acumulado de Resistencia Antibiótica 2025. Cartillas de Resistencia 2025. Quito: Laboratorio de Bacteriología, Unidad Técnica de Patología Clínica, HECAM/IESS; abril de 2026.',
  /* 6  */ 'Pitout JD, Laupland KB. Extended-spectrum beta-lactamase-producing Enterobacteriaceae: an emerging public-health concern. Lancet Infect Dis. 2008;8(3):159–66. doi:10.1016/S1473-3099(08)70041-0',
  /* 7  */ 'Tamma PD, Aitken SL, Bonomo RA, Mathers AJ, van Duin D, Clancy CJ. Infectious Diseases Society of America 2022 guidance on the treatment of extended-spectrum β-lactamase producing Enterobacterales (ESBL-E), carbapenem-resistant Enterobacterales (CRE), and Pseudomonas aeruginosa with difficult-to-treat resistance (DTR-P. aeruginosa). Clin Infect Dis. 2022;75(2):187–212. doi:10.1093/cid/ciac268',
  /* 8  */ 'Gonzalez-Garcia M, Maldonado D, Barrero M, Casas A, Perez-Padilla R, Torres-Duque CA. Arterial blood gases and ventilation at rest by age and sex in an adult Andean population resident at high altitude. Eur J Appl Physiol. 2020;120(12):2729–36. doi:10.1007/s00421-020-04498-z',
  /* 9  */ 'Ministerio de Salud Pública del Ecuador. Oficio Nro. MSP-CGSSR-2026-0008-O. Traslado de información complementaria para la actualización del Cuadro Nacional de Medicamentos Básicos (Informe RAM 2020–2024). Quito: Coordinación General de Sostenibilidad del Sistema y Recursos, MSP; 11 de febrero de 2026.',
  /* 10 */ 'Barlam TF, Cosgrove SE, Abbo LM, MacDougall C, Schuetz AN, Septimus EJ, et al. Implementing an Antibiotic Stewardship Program: Guidelines by the Infectious Diseases Society of America and the Society for Healthcare Epidemiology of America. Clin Infect Dis. 2016;62(10):e51–77. doi:10.1093/cid/ciw118',
  /* 11 */ 'Ministerio de Salud Pública del Ecuador. Cuadro Nacional de Medicamentos Básicos, 10.ª revisión. Quito: MSP; 2022.',
  /* 12 */ 'Hooton TM, Bradley SF, Cardenas DD, Colgan R, Geerlings SE, Rice JC, et al. Diagnosis, prevention, and treatment of catheter-associated urinary tract infection in adults: 2009 International Clinical Practice Guidelines from the Infectious Diseases Society of America. Clin Infect Dis. 2010;50(5):625–63. doi:10.1086/650482',
  /* 13 */ 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int Suppl. 2013;3(1):1–150. doi:10.1038/kisup.2012.73',
  /* 14 */ 'Ministerio de Salud Pública del Ecuador. Acuerdo Ministerial Nro. 00001-2025. Norma Técnica del Sistema Integrado de Vigilancia Epidemiológica (SIVE). Registro Oficial Tercer Suplemento N.° 107; 21 de agosto de 2025.',
  /* 15 */ 'Evans L, Rhodes A, Alhazzani W, Antonelli M, Coopersmith CM, French C, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063–e1143. doi:10.1097/CCM.0000000000005337',
  /* 16 */ 'Carmeli Y, Armstrong J, Laud PJ, Newell P, Stone G, Wardman A, et al. Ceftazidime-avibactam or best available therapy in patients with ceftazidime-resistant Enterobacteriaceae and Pseudomonas aeruginosa complicated urinary tract infections or complicated intra-abdominal infections (REPRISE): a randomised, pathogen-directed, phase 3 study. Lancet Infect Dis. 2016;16(6):661–73. doi:10.1016/S1473-3099(16)30004-4',
  /* 17 */ 'World Health Organization. Global Antimicrobial Resistance and Use Surveillance System (GLASS) Report 2023. Geneva: WHO; 2023.',
  /* 18 */ 'Rodríguez-Baño J, Cisneros JM, Cobos-Trigueros N, Fresco G, Navarro-San Francisco C, Gudiol C, et al. Diagnosis and antimicrobial treatment of invasive infections due to multidrug-resistant Enterobacteriaceae. Enferm Infecc Microbiol Clin. 2015;33(5):337.e1–337.e21. doi:10.1016/j.eimc.2014.11.009',
];
const s7 = [h1('7.  Bibliografía'), ...biblio(refs)];

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ANEXOS
// ═══════════════════════════════════════════════════════════════════════════════
const s8 = [
  h1('8.  Anexos'),
  h2('Anexo 1. Cronograma de implementación'),
  mkT(
    [{ label: 'ID', w: 500, centered: true }, { label: 'Tarea', w: 2500 }, { label: 'Responsable', w: 1900 }, { label: 'Inicio', w: 800, centered: true }, { label: 'Fin', w: 800, centered: true }, { label: 'Recursos', w: 2306 }],
    [
      ['1', 'Aprobación formal por el Director Técnico del HECAM.', 'Dirección Técnica / Control de Calidad', 'Ago 2026', 'Ago 2026', 'Documento de aprobación firmado'],
      ['2', 'Registro en el sistema de gestión documental institucional.', 'Coordinación de Control de Calidad', 'Ago 2026', 'Sep 2026', 'Plataforma documental HECAM'],
      ['3', 'Socialización a médicos de Emergencia y residentes de Medicina Interna.', 'Coordinadores de Unidad', 'Sep 2026', 'Sep 2026', 'Cartilla de Resistencia HECAM 2025'],
      ['4', 'Taller sobre interpretación de la Cartilla 2025 y selección empírica estratificada.', 'PROA, Farmacia y Microbiología', 'Sep 2026', 'Oct 2026', 'Casos clínicos, CNMB, cartilla vigente'],
      ['5', 'Elaboración del diagrama de flujo en Bizagi.', 'Coordinación de Control de Calidad', 'Sep 2026', 'Oct 2026', 'Licencia Bizagi'],
      ['6', 'Implementación de la alerta electrónica de ITU complicada en el HIS-HECAM.', 'Tecnologías de la Información / PROA', 'Oct 2026', 'Nov 2026', 'HIS-HECAM, módulo PROA'],
      ['7', 'Implementación piloto en Emergencia y Medicina Interna durante 3 meses.', 'Jefes de Emergencia y Medicina Interna', 'Nov 2026', 'Ene 2027', 'Hoja de seguimiento de cultivos'],
      ['8', 'Recolección de indicadores de la fase piloto.', 'Control de Calidad / PROA', 'Dic 2026', 'Ene 2027', 'HIS-HECAM, registro de farmacia'],
      ['9', 'Evaluación de resultados del piloto y ajuste del protocolo.', 'Comité de ITU y PROA-HECAM', 'Feb 2027', 'Feb 2027', 'Informe piloto, Cartilla 2026'],
      ['10', 'Extensión a todas las unidades y revisión anual sincronizada con la Cartilla de Resistencia.', 'Dirección Técnica / Control de Calidad / PROA', 'Mar 2027', 'Dic 2027', 'Actualización anual de la Cartilla'],
    ]
  ),
  blk(),
  h2('Anexo 2. Factores de riesgo para BLEE y CRE: guía rápida de selección empírica'),
  bp('Esta tabla debe consultarse junto con la Cartilla de Resistencia vigente del Laboratorio de Bacteriología del HECAM. La selección final siempre debe adaptarse a los patrones locales actualizados[[5]].'),
  mkT(
    [{ label: 'Factor de riesgo', w: 2200 }, { label: 'Detalle', w: 3300 }, { label: 'Impacto en la selección antimicrobiana', w: 3306 }],
    [
      ['Antibióticos en los últimos 90 días', 'Cualquier antimicrobiano sistémico, especialmente cefalosporinas, fluoroquinolonas o cotrimoxazol.', 'Riesgo alto de BLEE: emplear ertapenem como terapia empírica.'],
      ['Hospitalización reciente', 'Internación de al menos 48 horas en cualquier servicio durante los últimos 90 días.', 'Riesgo de BLEE y CRE: ertapenem, o meropenem si el riesgo de CRE es alto.'],
      ['Aislamiento previo de BLEE o CRE', 'Urocultivo previo con betalactamasa de espectro extendido o carbapenemasa documentada.', 'Riesgo alto de CRE: meropenem con ceftazidima/avibactam según antibiograma.'],
      ['Diabetes mellitus descompensada', 'Glucemia superior a 250 mg/dL o hemoglobina glicosilada mayor al 9 %.', 'Mayor riesgo de infección por __Candida__, __Klebsiella__ y __E. coli__ productora de BLEE.'],
      ['Catéter vesical por más de 7 días', 'Sonda vesical permanente, especialmente en el paciente hospitalizado.', 'Riesgo alto de BLEE, __Pseudomonas__ y __Enterococcus__: ampliar la cobertura y retirar el catéter.'],
      ['Enfermedad renal crónica avanzada', 'TFG menor a 30 mL/min documentada previamente.', 'Ajustar dosis, evitar aminoglucósidos y nitrofurantoína; el ertapenem requiere ajuste bajo 30 mL/min.'],
      ['Procedimiento urológico reciente', 'Cistoscopia, resección transuretral, nefrostomía, litotricia o biopsia prostática en los últimos 30 días.', 'Riesgo de microorganismos hospitalarios resistentes; cubrir __Pseudomonas__ tras biopsia prostática.'],
      ['Inmunodepresión', 'CD4 menor a 200 células/µL, trasplante, corticoterapia prolongada o quimioterapia activa.', 'Ampliar la cobertura y descartar candiduria en el urocultivo.'],
    ]
  ),
  blk(),
  h2('Anexo 3. Perfil de resistencia consolidado: Ecuador 2020-2024 frente a HECAM 2025'),
  bp('Comparación entre los datos nacionales del Informe Técnico SVPCS-DNVE-2026-02[[4]] y los datos institucionales de la Cartilla de Resistencia HECAM 2025[[5]] para los uropatógenos prioritarios.'),
  L.rTable(
    [
      { label: 'Organismo / fuente', w: 2506 },
      { label: 'Ceftriaxona % R', w: 1050 },
      { label: 'Imipenem % R', w: 1050 },
      { label: 'Meropenem % R', w: 1050 },
      { label: 'Ciprofloxacino % R', w: 1050 },
      { label: 'TMP/SMX % R', w: 1050 },
      { label: 'Ceftaz/Avibactam % R', w: 1050 },
    ],
    [
      ['E. coli — Emergencia (n=751)', '30 %', '0 %', '0 %', '66 %', '57 %', '(-)'],
      ['E. coli — Medicina Interna (n=162)', '53 %', '(-)', '(-)', '22 %', '80 %', '1 %'],
      ['E. coli — Urología (n=201)', '63 %', '(-)', '(-)', '13 %', '80 %', '1 %'],
      ['K. pneumoniae — Emergencia (n=158)', '69 %', '42 %', '24 %', '75 %', '56 %', '(-)'],
      ['K. pneumoniae — Med. Interna (n=73)', '78 %', '(-)', '(-)', '53 %', '84 %', '49 %'],
      ['K. pneumoniae — bacteriemia (n=48)', '(-)', '76 %', '56 %', '79 %', '(-)', '2 %'],
      ['NACIONAL — E. coli (n=85.291)', '25 %', '1.1 %', '1.2 %', '28 %', '54 %', '2.6 %'],
      ['NACIONAL — K. pneumoniae (n=21.226)', '55 %', '31.4 %', '28.1 %', '59.5 %', '51.9 %', '14.2 %'],
    ]
  ),
  semaforo(),
  bp('**CONCLUSIÓN CLAVE:** en el HECAM, __E. coli__ presenta una resistencia a ciprofloxacino del 66 % en Emergencia frente al 28 % nacional, lo que descarta su uso empírico. La resistencia de __K. pneumoniae__ a carbapenémicos alcanza el 42–76 % en el hospital frente al 28–31 % nacional. La ceftazidima/avibactam mantiene alta actividad en __E. coli__ (1 % R) y en la bacteriemia por __K. pneumoniae__ (2 % R), aunque en aislamientos urinarios de Medicina Interna alcanza el 49 % de resistencia, lo que obliga a confirmar la sensibilidad antes de su uso prolongado[[18]].'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 9 y 10
// ═══════════════════════════════════════════════════════════════════════════════
const s9  = [h1('9.  Firmas de los involucrados'), firmas()];
const s10 = [h1('10.  Control de cambios'), controlCambios()];

// ═══════════════════════════════════════════════════════════════════════════════
// ENSAMBLE
// ═══════════════════════════════════════════════════════════════════════════════
const children = [
  ...portada(titulo, 'Unidad Técnica de Medicina Interna', 'Julio, 2026'),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(0, 200),
    children: [new TextRun({ text: 'CONTENIDO', font: 'Arial', size: 18, bold: true, color: '1C1C1C' })] }),
  tocItem('1',   'Justificación', 2),
  tocItem('2',   'Objetivos', 3),
  tocItem('3',   'Glosario de términos / Abreviaciones', 4),
  tocItem('4',   'Procedimiento (Plan de Acción/Actuación)', 5),
  tocItem('4.1', 'Evaluación inicial del paciente', 5, true),
  tocItem('4.2', 'Diagnóstico / Identificación de problemas basados en las necesidades', 6, true),
  tocItem('4.3', 'Plan Terapéutico / Intervenciones no farmacológicas', 8, true),
  tocItem('4.4', 'Clasificación de severidad / Manejo de complicaciones', 10, true),
  tocItem('4.5', 'Plan de Egreso de la Unidad / Seguimiento / Evaluación integral', 11, true),
  tocItem('4.6', 'Nivel de evidencia y grado de recomendaciones', 12, true),
  tocItem('5',   'Algoritmo de actuación', 12),
  tocItem('6',   'Indicadores', 13),
  tocItem('7',   'Bibliografía', 14),
  tocItem('8',   'Anexos', 15),
  tocItem('9',   'Firmas de los involucrados', 17),
  tocItem('10',  'Control de cambios', 17),
  new Paragraph({ children: [new PageBreak()] }),
  ...s1, blk(),
  ...s2, blk(),
  new Paragraph({ children: [new PageBreak()] }),
  ...s3,
  new Paragraph({ children: [new PageBreak()] }),
  ...s41, blk(),
  ...s42,
  new Paragraph({ children: [new PageBreak()] }),
  ...s43, blk(),
  ...s44, blk(),
  ...s45, blk(),
  ...s46,
  new Paragraph({ children: [new PageBreak()] }),
  ...s5, blk(),
  ...s6,
  new Paragraph({ children: [new PageBreak()] }),
  ...s7,
  new Paragraph({ children: [new PageBreak()] }),
  ...s8,
  new Paragraph({ children: [new PageBreak()] }),
  ...s9, blk(),
  ...s10,
];

L.escribir(buildDoc(titulo, codigo, version, children, fechaElab),
           path.join(__dirname, 'salida', 'HECAM-MI-PR-002_Manejo_ITU_Aguda_Complicada_Adultos.docx'))
  .then(() => console.log('OK — ITU generado'));
