'use strict';
const fs = require('fs');
const L = require('../lib/hecam-lib.js');
const {
  Packer, Paragraph, TextRun, PageBreak, AlignmentType,
  CW, sp, h1, h2, h3, bp, blt, nmb, blk, dvd, caption, note, who,
  mkT, rTable, semaforo, membrete, portada, tocItem, biblio,
  firmas, controlCambios, buildDoc, BLUE,
} = L;

const titulo    = 'Manejo de la Sepsis y el Shock Séptico en Adultos';
const codigo    = 'HECAM-MI-PR-001';
const version   = '1';
const fechaElab = 'Julio 2026';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. JUSTIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const s1 = [
  h1('1.  Justificación'),
  bp('El Hospital de Especialidades Carlos Andrade Marín (HECAM), establecimiento de referencia de tercer nivel del Instituto Ecuatoriano de Seguridad Social (IESS) para la zona norte del Ecuador, atiende volúmenes significativos de pacientes con sepsis, uno de los mayores desafíos de la medicina moderna. La sepsis, definida por el Tercer Consenso Internacional para Sepsis y Shock Séptico (Sepsis-3, 2016) como una disfunción orgánica potencialmente mortal causada por una respuesta desregulada del huésped a la infección[[1]], causa cerca de 11 millones de muertes anuales a nivel mundial —una de cada cinco muertes registradas en el planeta—[[2]] y ha sido reconocida por la Asamblea Mundial de la Salud como una prioridad sanitaria que exige planes de acción nacionales[[3]]. En el Ecuador constituye una causa primaria de mortalidad intrahospitalaria, especialmente en las Unidades de Cuidados Intensivos.'),
  bp('Los datos nacionales del Informe Técnico SVPCS-DNVE-2026-02 sobre Resistencia Antimicrobiana en Ecuador 2020-2024 (MSP/INSPI–CRN-RAM), elaborado sobre 58 hospitales centinela incluido el HECAM y aproximadamente 172.000 aislamientos con antibiograma, identifican a __Escherichia coli__ (46–55 % del total anual), __Klebsiella pneumoniae__ (10–14 %) y __Staphylococcus aureus__ (8–10 %) como los microorganismos de mayor prevalencia en infecciones que progresan a sepsis, con una resistencia nacional de __K. pneumoniae__ a carbapenémicos del 28–31 %[[4]]. Sin embargo, la Cartilla de Resistencia Antibiótica HECAM 2025, elaborada por el Laboratorio de Bacteriología de la Unidad Técnica de Patología Clínica y aprobada por el Programa de Optimización del Uso de Antimicrobianos (PROA) institucional, documenta un hallazgo central que diferencia al hospital del promedio nacional: la resistencia de __K. pneumoniae__ a carbapenémicos en el HECAM es hasta 2,5 veces superior (meropenem 49–56 % R en UCI y bacteriemia; imipenem 50–76 % R), con ceftazidima/avibactam como única opción de alta actividad (0–2 % R)[[5]].'),
  bp('A ello se suma la altitud de Quito (2.850 m.s.n.m.), que genera un fenómeno de "hipoxia dual": la hipoxia celular sistémica inducida por la sepsis se superpone a la hipoxia hipobárica crónica de la altitud, activando vías inflamatorias compartidas mediadas por el Factor Inducible por Hipoxia 1 (HIF-1), exacerbando la respuesta inflamatoria desregulada y obligando a ajustar los valores de referencia diagnósticos (SatO₂ basal 88–92 %; PaO₂ basal 65–70 mmHg)[[6,7]]. Síntomas como taquipnea, taquicardia y alteración del estado mental, que a nivel del mar orientarían inequívocamente hacia sepsis, en Quito exigen una evaluación estructurada para evitar errores diagnósticos.'),
  bp('Este perfil epidemiológico y fisiopatológico obliga a rediseñar el esquema antimicrobiano empírico institucional, abandonando la ceftriaxona como primera línea universal y estratificando la terapia según foco infeccioso, servicio de origen y factores de riesgo para microorganismos productores de betalactamasas de espectro extendido (BLEE) o resistentes a carbapenémicos (CRE), en concordancia con las recomendaciones internacionales vigentes[[8]].'),
  bp('El presente protocolo está dirigido a todos los pacientes adultos (≥ 18 años) atendidos en cualquier unidad del HECAM con sospecha o diagnóstico de sepsis o shock séptico. Las Unidades Técnicas involucradas son: Servicio de Emergencia, Unidad de Cuidados Intensivos, Departamento de Medicina Interna y Subespecialidades, Servicios Quirúrgicos, Laboratorio de Bacteriología/PROA, Imagenología y Farmacia. Su alcance abarca la detección precoz, el diagnóstico conforme a Sepsis-3, la terapia empírica anclada a la Cartilla de Resistencia HECAM 2025, el soporte hemodinámico y ventilatorio adaptado a la altitud, y la desescalada antimicrobiana oportuna. Los resultados esperados son la reducción de la mortalidad hospitalaria por shock séptico, la disminución de los días de estancia en UCI, la mejora de la adherencia a las intervenciones de la primera hora y la generación de datos locales que retroalimenten la política institucional de calidad y seguridad del paciente.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OBJETIVOS
// ═══════════════════════════════════════════════════════════════════════════════
const s2 = [
  h1('2.  Objetivos'),
  h3('Objetivo General'),
  bp('Estandarizar el manejo de la sepsis y el shock séptico en pacientes adultos atendidos en el Hospital de Especialidades Carlos Andrade Marín, integrando la Cartilla de Resistencia Antibiótica HECAM 2025 y los datos nacionales de resistencia antimicrobiana 2020-2024 como pilares de la terapia empírica, para reducir la mortalidad y garantizar el uso racional de antimicrobianos.'),
  h3('Objetivos Específicos'),
  nmb('Implementar las definiciones del Tercer Consenso Internacional (Sepsis-3) en todas las unidades del HECAM, garantizando un diagnóstico preciso, una comunicación clínica uniforme y la eliminación del término obsoleto "sepsis severa" del léxico institucional[[1]].'),
  nmb('Establecer el paquete de intervenciones críticas "HECAM Hora-1" (hemocultivos, lactato sérico, antimicrobianos y resucitación con cristaloides), con terapia empírica estratificada según foco, servicio de origen y factores de riesgo para BLEE/CRE, conforme a la Cartilla de Resistencia HECAM 2025[[5]] y a las guías internacionales vigentes[[8]].'),
  nmb('Definir un plan de manejo hemodinámico y de soporte ventilatorio adaptado a las particularidades fisiopatológicas de la altitud de Quito (2.850 m.s.n.m.), considerando el fenómeno de hipoxia dual y sus implicaciones diagnósticas y terapéuticas[[6]].'),
  nmb('Promover el uso racional de antimicrobianos mediante el PROA-HECAM[[9]], empleando únicamente medicamentos incluidos en el Cuadro Nacional de Medicamentos Básicos[[10]] y estableciendo metas de desescalada a las 48–72 horas guiadas por cultivo y procalcitonina.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GLOSARIO
// ═══════════════════════════════════════════════════════════════════════════════
const s3 = [
  h1('3.  Glosario de términos / Abreviaciones'),
  caption('Tabla 1. Términos clínicos'),
  mkT(
    [{ label: 'TÉRMINO', w: 2000 }, { label: 'DEFINICIÓN', w: 6806 }],
    [
      ['Sepsis', 'Disfunción orgánica potencialmente mortal causada por una respuesta desregulada del huésped a la infección. Se identifica por un aumento agudo de la puntuación SOFA ≥ 2 puntos sobre el basal secundario a infección. Mortalidad hospitalaria > 10 %.[[1]]'],
      ['Shock séptico', 'Subconjunto de la sepsis con anomalías circulatorias, celulares y metabólicas que aumentan sustancialmente la mortalidad. Criterios: necesidad de vasopresores para mantener PAM ≥ 65 mmHg Y lactato > 2 mmol/L a pesar de resucitación adecuada. Mortalidad > 40 %.[[11]]'],
      ['Sepsis-3', 'Tercer Consenso Internacional para Sepsis y Shock Séptico (Singer et al., 2016). Sus definiciones operacionales son adoptadas formalmente en este protocolo.[[1]]'],
      ['Sepsis severa', 'Término OBSOLETO, eliminado por el grupo de trabajo Sepsis-3 por considerarlo redundante. Los pacientes antes clasificados bajo este rótulo cumplen la definición vigente de sepsis.[[1]]'],
      ['Hipoxia dual', 'Fenómeno fisiopatológico propio del HECAM: la hipoxia celular sistémica de la sepsis se superpone a la hipoxia hipobárica crónica de la altitud (2.850 m.s.n.m.), activando vías HIF-1 compartidas y exacerbando la respuesta inflamatoria.[[6,7]]'],
      ['CRE', 'Enterobacterales resistentes a carbapenémicos (__Carbapenem-Resistant Enterobacterales__). En el HECAM 2025: __K. pneumoniae__ con 50–76 % de resistencia a carbapenémicos en UCI y bacteriemia; mecanismo principal, carbapenemasas tipo KPC.[[5]] Promedio nacional: 28–31 %.[[4]]'],
      ['BLEE', 'Betalactamasas de espectro extendido. Enzimas que hidrolizan penicilinas y cefalosporinas de 3.ª y 4.ª generación. En el HECAM 2025, __E. coli__ hospitalaria presenta > 50 % de resistencia a cefalosporinas de 3.ª generación y __K. pneumoniae__ > 65 % en todos los servicios.[[12]]'],
      ['SOFA', '__Sequential Organ Failure Assessment__. Escala que evalúa seis sistemas orgánicos (0–4 puntos cada uno; máximo 24). Un aumento agudo ≥ 2 puntos sobre el basal define la disfunción orgánica de la sepsis. En el HECAM se ajusta el componente respiratorio por altitud.[[13]]'],
      ['qSOFA', '__Quick SOFA__. Herramienta de cribado de cabecera: alteración del estado mental (Glasgow < 15) + frecuencia respiratoria ≥ 22 rpm + presión arterial sistólica ≤ 100 mmHg. Un puntaje ≥ 2 indica riesgo alto de mal desenlace y obliga a activar el paquete HECAM Hora-1.[[14]]'],
      ['PAM', 'Presión arterial media. Meta terapéutica en shock séptico: ≥ 65 mmHg con soporte vasopresor. Se calcula como PAD + 1/3 (PAS − PAD).[[8]]'],
      ['Cartilla de Resistencia HECAM 2025', 'Análisis acumulado de resistencia antibiótica institucional (18 tablas por servicio). Metodología de concentración mínima inhibitoria según CLSI M100/M39; base de datos WHONET. Abril 2026. Documento de referencia PRIMARIO para la selección antimicrobiana empírica en el HECAM.[[5]]'],
      ['PROA', 'Programa de Optimización del Uso de Antimicrobianos. Equipo institucional responsable de la vigilancia microbiológica, la elaboración de las cartillas de resistencia y la auditoría del uso de antibióticos.[[9]]'],
      ['HIF-1', 'Factor Inducible por Hipoxia 1. Factor de transcripción activado tanto por la hipoxia hipobárica de la altitud como por la hipoxia celular de la sepsis, promoviendo una respuesta inflamatoria potencialmente exacerbada.[[7]]'],
    ]
  ),
  blk(),
  caption('Tabla 2. Abreviaciones'),
  mkT(
    [{ label: 'ABREVIACIÓN', w: 2000 }, { label: 'SIGNIFICADO', w: 6806 }],
    [
      ['HECAM', 'Hospital de Especialidades Carlos Andrade Marín'],
      ['IESS', 'Instituto Ecuatoriano de Seguridad Social'],
      ['UCI', 'Unidad de Cuidados Intensivos'],
      ['CNMB', 'Cuadro Nacional de Medicamentos Básicos'],
      ['ATB', 'Antibiótico / Antimicrobiano'],
      ['PCR / PCT', 'Proteína C reactiva / Procalcitonina'],
      ['CRE', 'Enterobacterales resistentes a carbapenémicos'],
      ['BLEE', 'Betalactamasas de espectro extendido'],
      ['RAM', 'Resistencia antimicrobiana'],
      ['MDR / XDR', 'Multirresistente / Resistencia extendida'],
      ['PROA', 'Programa de Optimización del Uso de Antimicrobianos'],
      ['SSC', '__Surviving Sepsis Campaign__'],
      ['TFG', 'Tasa de filtración glomerular'],
      ['DUD', 'Dosis única diaria'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PROCEDIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════
const s41 = [
  h1('4.  Procedimiento (Plan de Acción / Actuación)'),
  h2('4.1.  Evaluación inicial del paciente'),
  ...who('Personal de Enfermería y Médico de Triage / Emergencia.',
         'Inmediatamente al ingreso o ante la sospecha de infección en cualquier unidad del HECAM.'),
  h3('Criterios de inclusión y exclusión'),
  blt('__Inclusión:__ pacientes adultos (≥ 18 años) con sospecha o diagnóstico de infección que presenten signos de disfunción orgánica o inestabilidad hemodinámica.'),
  blt('__Exclusión:__ pacientes pediátricos (< 18 años); pacientes en cuidados paliativos exclusivos donde la intervención intensiva no sea el objetivo terapéutico; pacientes con directrices de no reanimación documentadas.'),
  h3('Anamnesis y examen físico dirigidos'),
  blt('Antecedentes de infección reciente, procedimientos invasivos, inmunosupresión, viajes y exposiciones ambientales. Identificar el foco probable: respiratorio, urinario, abdominal, piel y tejidos blandos, sistema nervioso central o dispositivos intravasculares.'),
  blt('Signos vitales completos: temperatura, frecuencia cardíaca, frecuencia respiratoria, presión arterial y saturación de oxígeno. **NOTA DE ALTITUD:** la SatO₂ basal normal en Quito es 88–92 %; alarmar si < 88 %. El umbral de fiebre se ajusta a T > 37,5 °C axilar.'),
  blt('Estado de conciencia: escala de Glasgow y orientación.'),
  blt('**Antecedente microbiológico clave:** ¿tratamiento antibiótico en los últimos 90 días?, ¿hospitalización reciente?, ¿infección previa por BLEE o CRE? Estos factores modifican la selección empírica (véase el numeral 4.3).'),
  h3('Escalas clínicas de cribado'),
  blt('qSOFA: alteración mental (Glasgow < 15) + FR ≥ 22 rpm + PAS ≤ 100 mmHg. Puntaje ≥ 2 → ALTO RIESGO → activar "HECAM Hora-1" de forma inmediata[[14]].'),
  blt('SOFA completo: solicitar los exámenes de laboratorio en paralelo para el diagnóstico definitivo (véase el numeral 4.2).'),
  blt('Si qSOFA ≥ 2 O existe sospecha clínica alta aunque el qSOFA sea < 2, activar el protocolo de forma inmediata: la sensibilidad del qSOFA es subóptima en el entorno de altitud.'),
];

const s42 = [
  h2('4.2.  Diagnóstico / Identificación de problemas basados en las necesidades'),
  ...who('Médico tratante (Emergencia, Medicina Interna o UCI).',
         'Dentro de los primeros 15 minutos de la evaluación inicial, en paralelo con el inicio del paquete HECAM Hora-1.'),
  h3('Criterios diagnósticos secuenciales (Sepsis-3)'),
  nmb('Confirmar la presencia o alta sospecha de infección (clínica, laboratorio, imagen).'),
  nmb('Calcular la puntuación SOFA basal. Si no se dispone del valor basal, asumir 0[[13]].'),
  nmb('Un aumento agudo de SOFA ≥ 2 puntos confirma el diagnóstico de SEPSIS (mortalidad estimada > 10 %). Ajustar el componente respiratorio por altitud: PaO₂ basal en Quito 65–70 mmHg; PaO₂/FiO₂ basal aproximado 300–320[[1]].'),
  nmb('Medir el lactato sérico. Si el lactato es > 2 mmol/L y persiste la necesidad de vasopresores para mantener PAM ≥ 65 mmHg pese a una resucitación adecuada, se confirma SHOCK SÉPTICO (mortalidad estimada > 40 %)[[11]].'),
  nmb('ELIMINAR el término "sepsis severa" del registro clínico: es obsoleto según Sepsis-3[[1]].'),
  blk(),
  caption('Tabla 3. Exámenes complementarios por prioridad'),
  mkT(
    [{ label: 'Prioridad', w: 900, centered: true }, { label: 'Examen', w: 2400 }, { label: 'Objetivo / Nota HECAM', w: 5506 }],
    [
      ['1.ª', 'Lactato sérico', 'Diagnóstico de shock séptico y evaluación de hipoperfusión tisular. Valores > 4 mmol/L obligan a resucitación agresiva independientemente de la presión arterial.'],
      ['1.ª', 'Hemocultivos × 2 (previos al ATB)', 'Identificar el agente etiológico y su sensibilidad. IMPRESCINDIBLE antes de administrar antibióticos. Tomar simultáneamente el cultivo del foco sospechado.'],
      ['1.ª', 'BHC, glucosa, creatinina, BUN', 'Cálculo del SOFA (coagulación y renal) y de la función renal para el ajuste de dosis antimicrobianas. Estimar TFG con CKD-EPI.'],
      ['1.ª', 'Bilirrubina total, TGO, TGP', 'Componente hepático del SOFA.'],
      ['1.ª', 'Plaquetas, TP, TTP', 'Componente de coagulación del SOFA; detección de coagulación intravascular diseminada.'],
      ['1.ª', 'Gasometría arterial, PaO₂/FiO₂', 'Componente respiratorio del SOFA. Ajustar por altitud: PaO₂ normal en Quito 65–70 mmHg; PaO₂/FiO₂ basal aproximado 310.'],
      ['2.ª', 'PCR y procalcitonina', 'Biomarcadores inflamatorios. Una PCT < 0,5 ng/mL orienta a la suspensión del antimicrobiano.'],
      ['2.ª', 'Urocultivo y cultivo del foco', 'Identificación del microorganismo y su sensibilidad local. Consultar la Cartilla de Resistencia HECAM 2025 al recibir el antibiograma[[5]].'],
      ['2.ª', 'Radiografía de tórax / ECO FAST / POCUS', 'Identificación del foco infeccioso, derrames, colecciones y evaluación de la función cardíaca.'],
      ['3.ª', 'TAC, RM u otras imágenes', 'Según el foco sospechado. No deben retrasar el inicio del antimicrobiano más de 30 minutos.'],
    ]
  ),
];

// ── 4.3 ────────────────────────────────────────────────────────────────────────
const resistCols = [
  { label: 'Antibiótico', w: 1500 },
  { label: 'E. coli UCI/CC orina', w: 1000 },
  { label: 'E. coli bacteriemia UCI', w: 1050 },
  { label: 'K. pneumoniae UCI', w: 1050 },
  { label: 'K. pneumoniae bacteriemia MI', w: 1100 },
  { label: 'S. aureus UCI', w: 1000 },
  { label: 'E. coli abdominal', w: 1050 },
  { label: 'K. pneumoniae abdominal', w: 1056 },
];
const resistRows = [
  ['Ceftriaxona',       '38 %', '(-)',  '54 %', '(-)',  '(-)',  '(-)',  '(-)'],
  ['Ceftazidima',       '27 %', '40 %', '63 %', '75 %', '(-)',  '36 %', '73 %'],
  ['Cefepime',          '31 %', '40 %', '63 %', '77 %', '(-)',  '40 %', '73 %'],
  ['Ampicilina/Sulbactam','46 %','63 %','65 %', '81 %', '(-)',  '46 %', '(-)'],
  ['Piperacilina/Tazobactam','(-)','(-)','65 %','76 %','(-)',   '46 %', '79 %'],
  ['Imipenem',          '(-)',  '10 %', '50 %', '76 %', '(-)',  '4 %',  '(-)'],
  ['Meropenem',         '(-)',  '0 %',  '49 %', '56 %', '(-)',  '4 %',  '53 %'],
  ['Ceftazidima/Avibactam','(-)','(-)', '0 %',  '2 %',  '(-)',  '3 %',  '53 %'],
  ['Colistina',         '(-)',  '(-)',  '25 %', '(-)',  '(-)',  '(-)',  '(-)'],
  ['Amikacina',         '0 %',  '0 %',  '15 %', '(-)',  '(-)',  '8 %',  '0 %'],
  ['Gentamicina',       '9 %',  '6 %',  '44 %', '0 %',  '(-)',  '0 %',  '0 %'],
  ['Ciprofloxacino',    '73 %', '76 %', '67 %', '79 %', '(-)',  '59 %', '73 %'],
  ['Trimetoprima/Sulfametoxazol','54 %','(-)','(-)','(-)','4 %','(-)',  '(-)'],
  ['Oxacilina',         '(-)',  '(-)',  '(-)',  '(-)',  '17 %', '(-)',  '(-)'],
  ['Linezolid',         '(-)',  '(-)',  '(-)',  '(-)',  '0 %',  '(-)',  '(-)'],
  ['Vancomicina',       '(-)',  '(-)',  '(-)',  '(-)',  '0 %',  '(-)',  '(-)'],
];

const atbCols = [
  { label: 'Foco probable', w: 1450 },
  { label: 'Riesgo BLEE / CRE', w: 1800 },
  { label: 'ATB empírico (CNMB)', w: 1900 },
  { label: 'Dosis / vía / frecuencia', w: 1900 },
  { label: 'Ajuste renal', w: 1756 },
];
const atbRows = [
  ['Desconocido, bajo riesgo (Emergencia)',
   'Sin ATB previos < 90 días ni hospitalización reciente. __E. coli__ probable (piperacilina/tazobactam 7 % R).',
   'Piperacilina/tazobactam IV. Si se sospecha __K. pneumoniae__ (71 % R), añadir amikacina.',
   'Piperacilina/tazobactam 4,5 g IV c/6 h + amikacina 20 mg/kg/día IV (DUD).',
   'Amikacina: no administrar si TFG < 30. Piperacilina/tazobactam: ajustar si TFG < 20.'],
  ['Desconocido, con riesgo BLEE (hospitalizado, Medicina Interna)',
   'ATB previos < 90 días, hospitalización reciente, diabetes o ERC. __E. coli__ > 50 % R a cefalosporinas[[12]].',
   'Ertapenem IV (carbapenémico de elección para BLEE; preserva meropenem para CRE).',
   'Ertapenem 1 g IV c/24 h (infusión de 30 min).',
   '0,5 g c/24 h si TFG 10–30. Si TFG < 10, interconsulta a Infectología.'],
  ['Desconocido, riesgo alto de CRE (UCI o bacteriemia por K. pneumoniae)',
   '__K. pneumoniae__ CRE probable. Meropenem 49–56 % R en el HECAM 2025[[5]].',
   'Meropenem IV ± ceftazidima/avibactam (0–2 % R en __K. pneumoniae__ de UCI y bacteriemia: única opción activa)[[17]].',
   'Meropenem 1–2 g IV c/8 h; ceftazidima/avibactam 2 g/0,5 g IV c/8 h en infusión de 2 h. Requiere autorización del PROA / Infectología.',
   'Ambos requieren ajuste obligatorio por TFG.'],
  ['Respiratorio comunitario',
   '__K. pneumoniae__ comunitaria. Ceftriaxona 54 % R en UCI-Neumología: precaución en monoterapia.',
   'Ceftriaxona IV + azitromicina IV (cobertura de atípicos y gramnegativos comunitarios sensibles).',
   'Ceftriaxona 2 g IV c/24 h + azitromicina 500 mg IV c/24 h. Alternativa: levofloxacino 750 mg IV c/24 h.',
   'Ceftriaxona: sin ajuste. Levofloxacino: ajustar si TFG < 50.'],
  ['Respiratorio hospitalario / UCI',
   '__K. pneumoniae__ de UCI: meropenem 49 % R. Ceftazidima/avibactam 0 % R, única activa frente a CRE[[5]].',
   'Meropenem IV + ceftazidima/avibactam IV si se confirma o sospecha CRE. Alternativa si se excluye CRE: piperacilina/tazobactam + amikacina.',
   'Meropenem 2 g IV c/8 h (infusión prolongada de 3 h si XDR); ceftazidima/avibactam 2 g/0,5 g IV c/8 h en infusión de 2 h.',
   'Ambos requieren ajuste por TFG.'],
  ['Abdominal / peritonitis',
   '__E. coli__ abdominal: imipenem y meropenem 4 % R (aptos). __K. pneumoniae__ abdominal: meropenem 53–70 % R → ceftazidima/avibactam como rescate.',
   'Meropenem IV ± metronidazol IV (añadir metronidazol si se requiere cobertura anaerobia adicional).',
   'Meropenem 1 g IV c/8 h + metronidazol 500 mg IV c/8 h.',
   'Meropenem: ajustar por TFG. Metronidazol: sin ajuste si TFG > 10.'],
  ['Urinario / urosepsis',
   'Véase el protocolo HECAM-MI-PR-002. __E. coli__ de Emergencia: piperacilina/tazobactam 7 % R; ertapenem 0 % R.',
   '__E. coli__: piperacilina/tazobactam o ertapenem. __K. pneumoniae__ o CRE: meropenem ± ceftazidima/avibactam.',
   'Véase el protocolo HECAM-MI-PR-002 para dosis detalladas.',
   'Véase el protocolo HECAM-MI-PR-002.'],
  ['Piel y tejidos blandos',
   '__S. aureus__. En UCI: oxacilina 17 % R (SARM aproximadamente 17 %); linezolid y vancomicina 0 % R[[5]].',
   'Cloxacilina IV si se presume SASM. Si se sospecha SARM o el paciente proviene de UCI: vancomicina IV.',
   'Cloxacilina 2 g IV c/6 h. Vancomicina 25–30 mg/kg/día IV (monitorización de niveles, meta 15–20 mg/L). Linezolid 600 mg IV c/12 h si hay intolerancia.',
   'Vancomicina: monitorización terapéutica y ajuste por TFG. Cloxacilina: sin ajuste.'],
  ['Meningitis bacteriana',
   '__S. pneumoniae__, __N. meningitidis__ y __L. monocytogenes__ en inmunocomprometidos.',
   'Ceftriaxona IV + dexametasona IV. Añadir ampicilina si se sospecha __Listeria__ (> 50 años o inmunocomprometidos).',
   'Ceftriaxona 4 g IV c/12 h; dexametasona 0,15 mg/kg c/6 h durante 4 días; ampicilina 2 g IV c/4 h.',
   'Ceftriaxona: sin ajuste. Ampicilina: ajustar si TFG < 30.'],
  ['Dispositivo intravascular (CRBSI)',
   '__S. epidermidis__ y __S. aureus__. Considerar gramnegativos si el paciente está inmunodeprimido.',
   'Vancomicina IV ± piperacilina/tazobactam IV (cobertura gramnegativa si el paciente está inmunodeprimido y se excluye __K. pneumoniae__).',
   'Vancomicina 25–30 mg/kg/día IV; piperacilina/tazobactam 4,5 g IV c/6 h.',
   'Vancomicina: monitorización terapéutica y ajuste por TFG.'],
];

const s43 = [
  h2('4.3.  Plan Terapéutico / Intervenciones no farmacológicas'),
  ...who('Equipo multidisciplinario (Médico, Enfermería, Laboratorio y Farmacia).',
         'El paquete completo debe ejecutarse dentro de la PRIMERA HORA del reconocimiento de sepsis o shock séptico.'),
  h3('A. Intervenciones no farmacológicas'),
  blt('Asegurar la vía aérea y el soporte ventilatorio. En Quito, ajustar la FiO₂ para lograr SatO₂ ≥ 92 %, evitando la hiperoxia (no perseguir SatO₂ > 96 %)[[6]].'),
  blt('Canalizar dos accesos venosos periféricos de calibre ≥ 18 G, o un acceso venoso central si el paciente no responde. Para ceftazidima/avibactam o meropenem en infusión prolongada se requiere una vía dedicada.'),
  blt('Tomar hemocultivos × 2 series (aerobio y anaerobio) y el cultivo del foco sospechado ANTES de administrar antibióticos. No retrasar el antimicrobiano más de 30–45 minutos esperando las muestras[[15]].'),
  blt('Medir el lactato sérico inicial. Si es > 2 mmol/L, repetir a las 2 horas (meta: descenso ≥ 10 %). Si es > 4 mmol/L, iniciar resucitación agresiva independientemente de la presión arterial[[16]].'),
  blt('Resucitación con cristaloides: administrar 30 mL/kg de solución salina al 0,9 % o lactato de Ringer en 3 horas si la PAM es < 65 mmHg o el lactato > 4 mmol/L. Reevaluar con cada 500 mL mediante POCUS o elevación pasiva de piernas[[8]].'),
  blk(),
  h3('B. Perfil de resistencia local — organismos relevantes para sepsis'),
  bp('Los datos siguientes provienen de la Cartilla de Resistencia Antibiótica HECAM 2025 (metodología de concentración mínima inhibitoria según CLSI M100; base de datos WHONET) y expresan el porcentaje de resistencia de cada microorganismo por servicio y tipo de muestra[[5]].'),
  caption('Tabla 4. Porcentaje de resistencia antibiótica en organismos relevantes para sepsis (HECAM 2025)'),
  rTable(resistCols, resistRows),
  semaforo(),
  blk(),
  h3('C. Hallazgos críticos de la Cartilla 2025 aplicados a la sepsis'),
  blt('**__E. coli__ y carbapenémicos:** 0–10 % de resistencia en todas las muestras (orina, sangre y abdominal). No constituye el principal impulsor de la resistencia a carbapenémicos, en concordancia con los datos nacionales (1–2 %)[[4]].'),
  blt('**__K. pneumoniae__ — alerta máxima:** meropenem 49 % R en UCI y 53–56 % R en abdomen y bacteriemia; imipenem 50–76 % R. La ceftazidima/avibactam es la ÚNICA opción con 0–2 % de resistencia. La colistina presenta 25 % R, por lo que debe emplearse con precaución.'),
  blt('**__S. aureus__ en UCI:** SARM estimado en 17 % (oxacilina 17 % R). El linezolid y la vancomicina mantienen 0 % de resistencia, confirmando su eficacia frente a SARM en el HECAM.'),
  blt('**Piperacilina/tazobactam:** excelente frente a __E. coli__ (7 % R en Emergencia), pero inadecuada frente a __K. pneumoniae__ (65–79 % R). Como monoterapia resulta insuficiente si __K. pneumoniae__ es el patógeno probable en sepsis grave.'),
  blt('**Ceftriaxona:** NO debe utilizarse como primera línea empírica en sepsis hospitalaria (__K. pneumoniae__ de UCI 54 % R; __E. coli__ de Medicina Interna 53 % R). Solo es aceptable en sepsis comunitaria de bajo riesgo de BLEE con foco respiratorio o urinario.'),
  blt('**Contraste nacional:** la resistencia nacional de __K. pneumoniae__ a carbapenémicos es del 28–31 % sobre 21.226 aislamientos; el HECAM duplica ese promedio en UCI y bacteriemia, lo que justifica un esquema empírico institucional propio[[4]].'),
  blk(),
  h3('D. Antibioticoterapia empírica estratificada'),
  bp('**INSTRUCCIÓN OPERATIVA:** seleccionar el escenario clínico que corresponde al paciente. Antes de prescribir, consultar la Cartilla de Resistencia HECAM 2025 correspondiente al servicio de origen. Todos los antimicrobianos indicados constan en el Cuadro Nacional de Medicamentos Básicos[[10]]. Las dosis asumen función renal normal; ajustar según la TFG estimada por CKD-EPI.'),
  caption('Tabla 5. Antibioticoterapia empírica estratificada por foco y riesgo de resistencia'),
  mkT(atbCols, atbRows),
  blk(),
  h3('E. Tratamiento farmacológico complementario: vasopresores e inotrópicos'),
  blt('**Norepinefrina:** vasopresor de primera línea. Iniciar a 0,1–0,2 mcg/kg/min IV en infusión continua y titular hasta lograr PAM ≥ 65 mmHg[[8]].'),
  blt('**Vasopresina:** añadir si la norepinefrina supera 0,25 mcg/kg/min. Dosis fija de 0,03 UI/min IV.'),
  blt('**Dobutamina:** considerar ante disfunción miocárdica confirmada por ecocardiografía. Dosis de 2–20 mcg/kg/min IV.'),
  blt('**Corticoesteroides:** hidrocortisona 200 mg/día IV en shock séptico refractario que persiste con requerimiento vasopresor creciente pese a resucitación adecuada[[8]].'),
];

const s44 = [
  h2('4.4.  Clasificación de severidad / Manejo de complicaciones'),
  ...who('Médico especialista (Medicina Interna, UCI o Subespecialidades).',
         'Al completar el paquete "HECAM Hora-1" y durante las primeras 6 horas; con reevaluación continua.'),
  caption('Tabla 6. Clasificación de severidad según Sepsis-3'),
  mkT(
    [{ label: 'Clasificación', w: 1500 }, { label: 'Criterios clínicos', w: 4100 }, { label: 'Mortalidad', w: 1100, centered: true }, { label: 'Destino', w: 2106 }],
    [
      ['SEPSIS', 'Aumento agudo de SOFA ≥ 2 puntos sobre el basal secundario a infección, sin requerimiento de vasopresores.', '> 10 %', 'Sala de hospitalización con monitoreo estrecho o UCI según evolución.'],
      ['SHOCK SÉPTICO', 'Sepsis más necesidad de vasopresores para mantener PAM ≥ 65 mmHg Y lactato > 2 mmol/L pese a resucitación adecuada.', '> 40 %', 'UCI de forma inmediata e impostergable.'],
    ]
  ),
  blk(),
  h3('Manejo de complicaciones esperadas'),
  blt('**Síndrome de distrés respiratorio agudo:** ventilación protectora con volumen corriente de 6 mL/kg de peso ideal, PEEP ≥ 5 cmH₂O y FiO₂ ajustada para SatO₂ de 92–95 % en Quito. Si fracasa: pronación, bloqueo neuromuscular u oxigenación por membrana extracorpórea[[8]].'),
  blt('**Lesión renal aguda:** optimizar la hemodinamia, suspender nefrotóxicos, ajustar las dosis de meropenem y ceftazidima/avibactam, y considerar terapia de reemplazo renal ante oligoanuria, acidosis severa o sobrecarga hídrica refractaria.'),
  blt('**Coagulopatía y coagulación intravascular diseminada:** plasma fresco congelado si TP/TTP > 1,5 veces el valor normal con sangrado activo; transfusión de plaquetas si el recuento es < 10.000/µL, o < 50.000/µL con sangrado o procedimiento invasivo.'),
  blt('**Disfunción miocárdica:** ecocardiografía para guiar la administración de fluidos y vasopresores; dobutamina si la fracción de eyección es < 40 % con signos de bajo gasto.'),
  blt('**Hipoxia dual asociada a la altitud:** mantener metas de SpO₂ de 92–95 %, evitar la hiperoxia y considerar que la PaO₂ basal en Quito es de 65–70 mmHg, valor que no debe compararse con los estándares de nivel del mar[[6]].'),
  blt('**Control del foco infeccioso:** drenaje de colecciones, retiro de dispositivos infectados o desbridamiento quirúrgico dentro de las primeras 6–12 horas cuando sea factible. En infecciones nosocomiales debe aplicarse la normativa nacional vigente[[18]].'),
  blt('**Sepsis refractaria por __K. pneumoniae__ CRE:** interconsulta inmediata a Infectología. Considerar la combinación de ceftazidima/avibactam con meropenem en infusión prolongada de 3 horas, o colistina como último recurso. Notificar el aislamiento al PROA-HECAM y al CRN-RAM/INSPI conforme a la Norma Técnica del Sistema Integrado de Vigilancia Epidemiológica[[19]].'),
];

const s45 = [
  h2('4.5.  Plan de Egreso de la Unidad / Seguimiento / Evaluación integral'),
  ...who('Equipo tratante de la unidad (UCI u Hospitalización) con el farmacéutico del PROA-HECAM.',
         'De forma continua; evaluación formal cada 6 horas y reevaluación antimicrobiana a las 48–72 horas con resultados de cultivos.'),
  h3('Parámetros de monitoreo'),
  blt('Signos vitales cada hora en shock séptico activo, o cada 4 horas en sepsis estabilizada. Umbral de alarma: SatO₂ < 88 % en Quito.'),
  blt('Lactato sérico a las 2 y 6 horas. Meta: descenso ≥ 10 % por medición o normalización por debajo de 2 mmol/L[[16]].'),
  blt('Diuresis horaria con meta ≥ 0,5 mL/kg/h. Instalar sonda vesical en todo paciente con shock séptico.'),
  blt('Cálculo diario del SOFA para evaluar la respuesta y detectar progresión de la disfunción orgánica[[13]].'),
  blt('Glucemia cada 2–4 horas si el paciente recibe insulinoterapia, con meta de 140–180 mg/dL.'),
  blt('Procalcitonina a las 48–72 horas. Un valor < 0,5 ng/mL orienta a la suspensión del antimicrobiano según criterio del PROA-HECAM[[9]].'),
  h3('Desescalada antimicrobiana a las 48–72 horas (PROA-HECAM)'),
  blt('Revisar hemocultivos y cultivo del foco. Si el microorganismo es sensible a un antimicrobiano de espectro más estrecho, la desescalada es OBLIGATORIA[[9]].'),
  blt('__K. pneumoniae__ sensible a ceftriaxona (situación infrecuente en el HECAM): desescalar. __K. pneumoniae__ CRE sensible a ceftazidima/avibactam: mantener el esquema y consultar a Infectología para definir la duración.'),
  blt('__E. coli__ sensible a piperacilina/tazobactam: desescalar desde meropenem o ertapenem. __E. coli__ BLEE sensible a ertapenem: desescalar desde meropenem[[12]].'),
  blt('__S. aureus__ meticilino sensible: desescalar de vancomicina a cloxacilina 2 g IV c/6 h, por su superioridad clínica frente a SASM.'),
  blt('Reunión interdisciplinaria (internista, farmacéutico e infectólogo) para cada aislamiento de __K. pneumoniae__ CRE, __A. baumannii__ o __P. aeruginosa__ XDR.'),
  h3('Criterios de egreso, alta y traslado'),
  blt('**Traslado de UCI a sala:** sin vasopresores durante ≥ 24 horas, FiO₂ < 0,4, SatO₂ ≥ 92 % en Quito, diuresis adecuada y función orgánica en recuperación.'),
  blt('**Alta hospitalaria:** afebril durante ≥ 48 horas (T < 37,5 °C axilar), tolerancia oral conservada, antimicrobiano oral avalado por antibiograma, función renal estable y seguimiento ambulatorio asegurado en 7 días.'),
  blt('**Interconsultas:** Nefrología ante lesión renal aguda, Infectología ante CRE o XDR, Cirugía para el drenaje del foco y Nutrición para el soporte nutricional en UCI.'),
];

const s46 = [
  h2('4.6.  Nivel de evidencia y grado de recomendaciones'),
  bp('Las recomendaciones de este protocolo se catalogan según el sistema del __Oxford Centre for Evidence-Based Medicine__ (CEBM), versión de marzo de 2009.'),
  caption('Tabla 7. Nivel de evidencia y grado de recomendación'),
  mkT(
    [{ label: 'Área', w: 1400 }, { label: 'Recomendación', w: 5306 }, { label: 'NE', w: 1000, centered: true }, { label: 'GR', w: 1100, centered: true }],
    [
      ['Diagnóstico', 'Adoptar las definiciones Sepsis-3: SOFA ≥ 2 puntos para sepsis, y vasopresores más lactato > 2 mmol/L para shock séptico[[1]].', '1a', 'A'],
      ['Cribado', 'Utilizar el qSOFA (≥ 2 puntos) como herramienta rápida de identificación de riesgo fuera de la UCI[[14]].', '2a', 'B'],
      ['Tratamiento', 'Administrar antimicrobianos de amplio espectro en menos de 60 minutos del reconocimiento de la sepsis, y en menos de 30 minutos en shock séptico[[8]].', '1b', 'A'],
      ['Tratamiento', 'Seleccionar el antimicrobiano empírico según la Cartilla de Resistencia HECAM 2025 y el riesgo de BLEE/CRE. No emplear ceftriaxona como primera línea universal en sepsis hospitalaria[[5]].', '2a', 'B'],
      ['Tratamiento', 'Reservar la ceftazidima/avibactam para __K. pneumoniae__ CRE con autorización del PROA e Infectología (0–2 % R en el HECAM 2025)[[17]].', '2a', 'B'],
      ['Resucitación', 'Administrar 30 mL/kg de cristaloides IV en 3 horas ante hipotensión o lactato > 4 mmol/L[[16]].', '1b', 'A'],
      ['Vasopresores', 'Emplear norepinefrina como vasopresor de primera línea para mantener PAM ≥ 65 mmHg[[8]].', '1b', 'A'],
      ['Cultivos', 'Obtener hemocultivos y cultivo del foco ANTES de iniciar el antimicrobiano, sin retrasarlo más de 30–45 minutos[[15]].', '2a', 'B'],
      ['Desescalada', 'Desescalar el antimicrobiano a las 48–72 horas con base en el cultivo y la procalcitonina (meta < 0,5 ng/mL)[[9]].', '1b', 'A'],
      ['Altitud', 'Ajustar las metas de SpO₂ (92–95 %), los umbrales de alarma y la interpretación del cociente PaO₂/FiO₂ al entorno de 2.850 m.s.n.m.[[6]].', '5', 'D'],
      ['Vigilancia', 'Notificar los aislamientos CRE y XDR al PROA-HECAM y al CRN-RAM/INSPI conforme a la Norma Técnica del SIVE[[19]].', '5', 'D'],
    ]
  ),
  note('__Leyenda Oxford CEBM:__ NE 1a = revisión sistemática de ensayos clínicos aleatorizados; 1b = ensayo clínico aleatorizado individual; 2a = revisión sistemática de estudios de cohorte; 2b = cohorte individual; 4 = serie de casos; 5 = opinión de expertos. GR A (nivel 1), B (niveles 2–3), C (nivel 4), D (nivel 5 o evidencia extrapolada).'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ALGORITMO
// ═══════════════════════════════════════════════════════════════════════════════
const s5 = [
  h1('5.  Algoritmo de actuación'),
  bp('Representar el diagrama de flujo o algoritmo descriptivo de las actividades enumeradas en el numeral anterior utilizando la herramienta Bizagi, el cual será realizado con el soporte de la Coordinación General de Control de Calidad.'),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 6. INDICADORES
// ═══════════════════════════════════════════════════════════════════════════════
const s6 = [
  h1('6.  Indicadores'),
  caption('Tabla 8. Indicadores de calidad del protocolo'),
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
      ['Medición inicial de lactato (diagnóstico)', 'Pacientes con sospecha de sepsis con lactato medido en ≤ 30 min del reconocimiento.', '(N.º con lactato en tiempo / total con sospecha de sepsis) × 100', '≥ 90 %', 'Mensual', 'Laboratorio, Emergencia, UCI'],
      ['Registro de SOFA inicial (diagnóstico)', 'Pacientes con sepsis con puntuación SOFA documentada en las primeras 2 horas.', '(N.º con SOFA documentado / total de pacientes con sepsis) × 100', '100 %', 'Mensual', 'Emergencia, UCI, Medicina Interna'],
      ['Cumplimiento del paquete HECAM Hora-1 (tratamiento)', 'Pacientes que reciben el paquete completo (hemocultivos, antimicrobiano y cristaloides) en ≤ 60 min.', '(N.º con paquete completo en 1 h / total sepsis y shock) × 100', '≥ 85 %', 'Mensual', 'Emergencia, UCI, Servicios Quirúrgicos'],
      ['Adherencia a la terapia estratificada HECAM 2025 (tratamiento)', 'Pacientes con antimicrobiano empírico acorde a la estratificación de la Cartilla de Resistencia HECAM 2025.', '(N.º con ATB concordante / total sepsis hospitalizadas) × 100', '≥ 80 %', 'Mensual', 'PROA, Farmacia, Medicina Interna'],
      ['Desescalada antimicrobiana (tratamiento)', 'Pacientes con antimicrobiano por más de 72 h en quienes se realizó desescalada a las 48–72 h según cultivos.', '(N.º con desescalada documentada / total con ATB > 72 h) × 100', '≥ 70 %', 'Trimestral', 'PROA, Medicina Interna, UCI'],
      ['Aclaramiento de lactato a las 6 horas (seguimiento)', 'Pacientes con lactato inicial > 2 mmol/L que logran un descenso ≥ 10 % a las 6 horas.', '(N.º con aclaramiento ≥ 10 % / total con lactato > 2 mmol/L) × 100', '≥ 80 %', 'Mensual', 'UCI, Emergencia'],
      ['Adherencia a la meta de PAM (seguimiento)', 'Pacientes en shock séptico que mantienen PAM ≥ 65 mmHg durante las primeras 6 horas.', '(N.º con PAM ≥ 65 mmHg / total en shock séptico) × 100', '≥ 95 %', 'Mensual', 'UCI, Emergencia'],
      ['Mortalidad por shock séptico (resultado)', 'Pacientes con shock séptico que fallecen durante la hospitalización.', '(N.º de fallecidos con shock séptico / total con shock séptico) × 100', 'Reducción 5 % anual', 'Anual', 'Dirección Técnica, Control de Calidad'],
      ['Readmisión a UCI en 72 horas (resultado)', 'Pacientes trasladados de UCI a sala que regresan a UCI dentro de las 72 horas.', '(N.º de readmisiones en 72 h / total de egresos de UCI por sepsis) × 100', '≤ 5 %', 'Trimestral', 'UCI, Medicina Interna'],
      ['Notificación de CRE al PROA y CRN-RAM (resultado)', 'Aislamientos CRE o XDR en sepsis notificados al PROA-HECAM y al CRN-RAM/INSPI conforme a la Norma SIVE.', '(N.º de aislamientos notificados / total CRE-XDR en sepsis) × 100', '100 %', 'Mensual', 'PROA, Microbiología'],
    ]
  ),
];

// ═══════════════════════════════════════════════════════════════════════════════
// 7. BIBLIOGRAFÍA (orden de aparición)
// ═══════════════════════════════════════════════════════════════════════════════
const refs = [
  /* 1  */ 'Singer M, Deutschman CS, Seymour CW, Shankar-Hari M, Annane D, Bauer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801–10. doi:10.1001/jama.2016.0287',
  /* 2  */ 'Rudd KE, Johnson SC, Agesa KM, Shackelford KA, Tsoi D, Kievlan DR, et al. Global, regional, and national sepsis incidence and mortality, 1990-2017: analysis for the Global Burden of Disease Study. Lancet. 2020;395(10219):200–11. doi:10.1016/S0140-6736(19)32989-7',
  /* 3  */ 'World Health Organization. Improving the prevention, diagnosis and clinical management of sepsis. Resolution WHA70.7. Geneva: WHO; 2017.',
  /* 4  */ 'Palacios Rodas R, Narváez M. Informe Técnico SVPCS-DNVE-2026-02: Situación de la Resistencia Antimicrobiana en Ecuador 2020–2024. Quito: Dirección Nacional de Vigilancia Epidemiológica, Ministerio de Salud Pública / INSPI–CRN-RAM; 15 de enero de 2026.',
  /* 5  */ 'Andrade Estévez AC, Gordón A, Cevallos C. Análisis Acumulado de Resistencia Antibiótica 2025. Cartillas de Resistencia 2025. Quito: Laboratorio de Bacteriología, Unidad Técnica de Patología Clínica, HECAM/IESS; abril de 2026.',
  /* 6  */ 'Gonzalez-Garcia M, Maldonado D, Barrero M, Casas A, Perez-Padilla R, Torres-Duque CA. Arterial blood gases and ventilation at rest by age and sex in an adult Andean population resident at high altitude. Eur J Appl Physiol. 2020;120(12):2729–36. doi:10.1007/s00421-020-04498-z',
  /* 7  */ 'Eltzschig HK, Carmeliet P. Hypoxia and inflammation. N Engl J Med. 2011;364(7):656–65. doi:10.1056/NEJMra0910283',
  /* 8  */ 'Evans L, Rhodes A, Alhazzani W, Antonelli M, Coopersmith CM, French C, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063–e1143. doi:10.1097/CCM.0000000000005337',
  /* 9  */ 'Barlam TF, Cosgrove SE, Abbo LM, MacDougall C, Schuetz AN, Septimus EJ, et al. Implementing an Antibiotic Stewardship Program: Guidelines by the Infectious Diseases Society of America and the Society for Healthcare Epidemiology of America. Clin Infect Dis. 2016;62(10):e51–77. doi:10.1093/cid/ciw118',
  /* 10 */ 'Ministerio de Salud Pública del Ecuador. Cuadro Nacional de Medicamentos Básicos, 10.ª revisión. Quito: MSP; 2022.',
  /* 11 */ 'Shankar-Hari M, Phillips GS, Levy ML, Seymour CW, Liu VX, Deutschman CS, et al. Developing a new definition and assessing new clinical criteria for septic shock. JAMA. 2016;315(8):775–87. doi:10.1001/jama.2016.0289',
  /* 12 */ 'Tamma PD, Aitken SL, Bonomo RA, Mathers AJ, van Duin D, Clancy CJ. Infectious Diseases Society of America 2022 guidance on the treatment of extended-spectrum β-lactamase producing Enterobacterales (ESBL-E), carbapenem-resistant Enterobacterales (CRE), and Pseudomonas aeruginosa with difficult-to-treat resistance (DTR-P. aeruginosa). Clin Infect Dis. 2022;75(2):187–212. doi:10.1093/cid/ciac268',
  /* 13 */ 'Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707–10. doi:10.1007/BF01709751',
  /* 14 */ 'Seymour CW, Liu VX, Iwashyna TJ, Brunkhorst FM, Rea TD, Scherag A, et al. Assessment of Clinical Criteria for Sepsis: for the Third International Consensus Definitions for Sepsis and Septic Shock. JAMA. 2016;315(8):762–74. doi:10.1001/jama.2016.0288',
  /* 15 */ 'Levy MM, Dellinger RP, Townsend SR, Linde-Zwirble WT, Marshall JC, Bion J, et al. The Surviving Sepsis Campaign: results of an international guideline-based performance improvement program targeting severe sepsis. Crit Care Med. 2010;38(2):367–74. doi:10.1097/CCM.0b013e3181cb0cdc',
  /* 16 */ 'Marik PE, Farkas JD. The Changing Paradigm of Sepsis: Early Diagnosis, Early Antibiotics, Early Pressors, and Early Adjuvant Treatment. Crit Care Med. 2018;46(10):1690–2. doi:10.1097/CCM.0000000000003310',
  /* 17 */ 'Ministerio de Salud Pública del Ecuador. Oficio Nro. MSP-CGSSR-2026-0008-O. Traslado de información complementaria para la actualización del Cuadro Nacional de Medicamentos Básicos (Informe RAM 2020–2024). Quito: Coordinación General de Sostenibilidad del Sistema y Recursos, MSP; 11 de febrero de 2026.',
  /* 18 */ 'Ministerio de Salud Pública del Ecuador. Acuerdo Ministerial 5316. Normas para el manejo de sepsis e infecciones nosocomiales. Quito: MSP; 2020.',
  /* 19 */ 'Ministerio de Salud Pública del Ecuador. Acuerdo Ministerial Nro. 00001-2025. Norma Técnica del Sistema Integrado de Vigilancia Epidemiológica (SIVE). Registro Oficial Tercer Suplemento N.° 107; 21 de agosto de 2025.',
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
      ['3', 'Socialización a jefes de Emergencia, UCI y Medicina Interna de la nueva tabla antimicrobiana.', 'Coordinadores de Unidad', 'Sep 2026', 'Sep 2026', 'Cartilla de Resistencia HECAM 2025'],
      ['4', 'Capacitación sobre estratificación empírica BLEE/CRE y uso de ceftazidima/avibactam.', 'Comité de Sepsis / PROA', 'Sep 2026', 'Oct 2026', 'Aulas de docencia, simuladores, Informe RAM'],
      ['5', 'Elaboración del diagrama de flujo en Bizagi.', 'Coordinación de Control de Calidad', 'Sep 2026', 'Oct 2026', 'Licencia Bizagi'],
      ['6', 'Alerta electrónica de sepsis en el HIS-HECAM con integración de la Cartilla 2025.', 'Tecnologías de la Información / PROA', 'Oct 2026', 'Nov 2026', 'HIS-HECAM, módulo PROA'],
      ['7', 'Implementación piloto en Emergencia y UCI durante 3 meses.', 'Jefes de Emergencia y UCI', 'Nov 2026', 'Ene 2027', 'Hoja de seguimiento antimicrobiano'],
      ['8', 'Recolección de indicadores de la fase piloto.', 'Control de Calidad / PROA', 'Dic 2026', 'Ene 2027', 'HIS-HECAM, registro de farmacia'],
      ['9', 'Evaluación de resultados del piloto y ajuste del protocolo.', 'Comité de Sepsis HECAM', 'Feb 2027', 'Feb 2027', 'Informe piloto, Cartilla 2026'],
      ['10', 'Extensión a todas las unidades y revisión anual sincronizada con la Cartilla de Resistencia.', 'Dirección Técnica / Control de Calidad / PROA', 'Mar 2027', 'Dic 2027', 'Actualización anual de la Cartilla'],
    ]
  ),
  blk(),
  h2('Anexo 2. Escala SOFA: tabla de puntuación ajustada para la altitud del HECAM'),
  bp('Un aumento agudo ≥ 2 puntos sobre el basal confirma el diagnóstico de sepsis según Sepsis-3[[13]]. **Ajuste HECAM:** la PaO₂ basal en Quito (2.850 m.s.n.m.) es de 65–70 mmHg, con un cociente PaO₂/FiO₂ basal aproximado de 310 en lugar de 400 al nivel del mar; por ello, un paciente con PaO₂/FiO₂ de 300 en Quito puede corresponder a la zona 0–1 de la escala.'),
  mkT(
    [{ label: 'Sistema', w: 2306 }, { label: '0', w: 1300, centered: true }, { label: '1', w: 1300, centered: true }, { label: '2', w: 1300, centered: true }, { label: '3', w: 1300, centered: true }, { label: '4', w: 1300, centered: true }],
    [
      ['Respiratorio (PaO₂/FiO₂)', '≥ 400', '< 400', '< 300', '< 200 con SR', '< 100 con SR'],
      ['Coagulación (plaquetas ×10³/µL)', '≥ 150', '< 150', '< 100', '< 50', '< 20'],
      ['Hepático (bilirrubina mg/dL)', '< 1,2', '1,2–1,9', '2,0–5,9', '6,0–11,9', '> 12,0'],
      ['Cardiovascular (PAM / vasopresores)', 'PAM ≥ 70', 'PAM < 70', 'Dopa ≤ 5 o Dobu', 'Dopa 5–15 o NE/Epi ≤ 0,1', 'Dopa > 15 o NE/Epi > 0,1'],
      ['Neurológico (Glasgow)', '15', '13–14', '10–12', '6–9', '< 6'],
      ['Renal (creatinina mg/dL o diuresis)', '< 1,2', '1,2–1,9', '2,0–3,4', '3,5–4,9 o < 500 mL/d', '> 5,0 o < 200 mL/d'],
    ]
  ),
  note('SR = soporte respiratorio (ventilación mecánica invasiva o no invasiva). Dopa = dopamina (mcg/kg/min). NE = norepinefrina. Epi = epinefrina. Dobu = dobutamina.'),
  blk(),
  h2('Anexo 3. Perfil de resistencia consolidado: Ecuador 2020-2024 frente a HECAM 2025'),
  bp('Comparación entre los datos nacionales del Informe Técnico SVPCS-DNVE-2026-02[[4]] y los datos institucionales de la Cartilla de Resistencia HECAM 2025[[5]] para los microorganismos prioritarios en sepsis.'),
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
      ['E. coli — orina UCI/CC (n=64)', '38 %', '10 %', '0 %', '73 %', '54 %', '2 %'],
      ['E. coli — bacteriemia UCI (n=30)', '(-)', '10 %', '0 %', '76 %', '(-)', '(-)'],
      ['K. pneumoniae — UCI resp./sangre (n=67)', '54 %', '50 %', '49 %', '67 %', '(-)', '0 %'],
      ['K. pneumoniae — bacteriemia MI (n=48)', '(-)', '76 %', '56 %', '79 %', '(-)', '2 %'],
      ['K. pneumoniae — Emergencia (n=158)', '69 %', '42 %', '24 %', '75 %', '(-)', '(-)'],
      ['NACIONAL — E. coli (n=85.291)', '25 %', '1.1 %', '1.2 %', '28 %', '54 %', '2.6 %'],
      ['NACIONAL — K. pneumoniae (n=21.226)', '55 %', '31.4 %', '28.1 %', '59.5 %', '51.9 %', '14.2 %'],
    ]
  ),
  semaforo(),
  bp('**CONCLUSIÓN CLAVE:** el HECAM presenta una resistencia de __K. pneumoniae__ a carbapenémicos entre 1,5 y 2,5 veces superior al promedio nacional (49–76 % frente a 28–31 %). La ceftazidima/avibactam es la única opción con alta actividad (0–2 % de resistencia) frente a __K. pneumoniae__ CRE en UCI y bacteriemia del HECAM, lo que sustenta su indicación restringida y auditada por el PROA institucional[[17]].'),
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
  tocItem('4.3', 'Plan Terapéutico / Intervenciones no farmacológicas', 7, true),
  tocItem('4.4', 'Clasificación de severidad / Manejo de complicaciones', 9, true),
  tocItem('4.5', 'Plan de Egreso de la Unidad / Seguimiento / Evaluación integral', 10, true),
  tocItem('4.6', 'Nivel de evidencia y grado de recomendaciones', 11, true),
  tocItem('5',   'Algoritmo de actuación', 11),
  tocItem('6',   'Indicadores', 12),
  tocItem('7',   'Bibliografía', 13),
  tocItem('8',   'Anexos', 14),
  tocItem('9',   'Firmas de los involucrados', 16),
  tocItem('10',  'Control de cambios', 16),
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

L.escribir(buildDoc(titulo, codigo, version, children, fechaElab), '../salida/HECAM-MI-PR-001_Manejo_Sepsis_Shock_Septico_Adultos.docx')
  .then(() => console.log('OK — Sepsis generado'));
