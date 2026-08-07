// compilar_docx.js — Compila un protocolo.jsonld al .docx institucional.
//
//   node skill/scripts/compilar_docx.js produccion/X/protocolo.jsonld [-o salida.docx]
//
// Es la dirección que faltaba. Hasta ahora el generador .js era la fuente de
// verdad y la matriz se derivaba de él con armar_jsonld.py; con esto la matriz
// puede ser la fuente y el .docx el producto, que es lo que permite escribir un
// protocolo nuevo sin tocar JavaScript.
//
// El .docx resultante debe pasar los mismos verificadores que el compilado desde
// el .js: verificar_caratula.py, verificar_documento.py y check_citas.py.
'use strict';

const fs = require('fs');
const path = require('path');
const L = require(path.join(__dirname, '..', 'lib', 'hecam-lib.js'));

// ── argumentos ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith('-'));
const iSalida = args.indexOf('-o');
if (!entrada) {
  console.error('Uso: node compilar_docx.js <protocolo.jsonld> [-o salida.docx]');
  process.exit(2);
}

const doc = JSON.parse(fs.readFileSync(entrada, 'utf8'));

// ── utilidades ────────────────────────────────────────────────────────────────

// Lee una clave probando el alias corto y el prefijado, igual que build_jats.py.
function g(obj, clave, porDefecto) {
  if (!obj || typeof obj !== 'object') return porDefecto;
  for (const k of [clave, 'hecam:' + clave, 'schema:' + clave]) {
    if (k in obj) return obj[k];
  }
  return porDefecto;
}

function seccion(numeral) {
  return (doc.hasPart || []).find((s) => g(s, 'numeral') === numeral);
}

function columnas(bloque) {
  const labels = g(bloque, 'columnas', []) || [];
  const anchos = g(bloque, 'anchos', []) || [];
  const centrados = g(bloque, 'centrados', []) || [];
  return labels.map((label, i) => {
    const col = { label, w: anchos[i] || Math.floor(L.CW / labels.length) };
    if (centrados[i]) col.centered = true;
    return col;
  });
}

// ── numeración de listas ──────────────────────────────────────────────────────

// Cada lista numerada necesita su propia instancia; si comparten una, Word
// continúa la cuenta y la segunda lista del documento empieza donde acabó la
// primera. Es el error que la revisora marcó con «inicia en 5».
let instanciaLista = 0;
const nuevaLista = () => ++instanciaLista;

// ── bloques de contenido ──────────────────────────────────────────────────────

function bloque(b) {
  const tipo = g(b, 'type', '');
  const texto = g(b, 'text', '');

  switch (tipo) {
    case 'Subtitulo':   return [L.h3(texto)];
    case 'Parrafo':     return [L.bp(texto)];
    case 'Nota':        return [L.note(texto)];
    case 'Espacio':     return [L.blk()];
    case 'Semaforo':    return [L.semaforo()];
    case 'Divisor':     return [L.dvd()];
    // Una viñeta suelta: la usan las matrices escritas a mano, donde es más
    // natural que agrupar los ítems en un bloque Lista.
    case 'Vineta':      return [L.blt(texto, g(b, 'nivel', 0))];
    // Un «Numerada» suelto continúa la lista abierta; el corte lo decide
    // contenido(), que es quien ve dónde termina la serie.
    case 'Numerada':    return [L.nmb(texto, instanciaLista)];
    case 'Lista': {
      const items = g(b, 'itemListElement', []) || [];
      const numerada = g(b, 'estilo', 'vinetas') === 'numerada';
      if (!numerada) return items.map((t) => L.blt(t));
      const instancia = nuevaLista();
      return items.map((t) => L.nmb(t, instancia));
    }
    case 'Tabla':
    case 'TablaResistencia': {
      const salida = [];
      const titulo = g(b, 'titulo');
      if (titulo) salida.push(L.caption(titulo));
      const filas = g(b, 'filas', []) || [];
      salida.push(tipo === 'Tabla' ? L.mkT(columnas(b), filas)
                                   : L.rTable(columnas(b), filas));
      const fuente = g(b, 'fuente');
      if (fuente) salida.push(L.note('Fuente: ' + fuente));
      return salida;
    }
    default:
      // Un bloque desconocido se degrada a párrafo si trae texto, y se avisa;
      // perderlo en silencio sería peor que maquetarlo de forma imperfecta.
      if (texto) {
        console.error('  aviso: bloque de tipo ' + JSON.stringify(tipo) +
                      ' no reconocido; se maqueta como párrafo');
        return [L.bp(texto)];
      }
      console.error('  aviso: bloque de tipo ' + JSON.stringify(tipo) + ' ignorado');
      return [];
  }
}

function contenido(sec) {
  const bloques = g(sec, 'contenido', []) || [];
  const salida = [];
  let previoNumerado = false;
  for (const b of bloques) {
    const esNumerado = g(b, 'type', '') === 'Numerada';
    // una serie de «Numerada» seguidos es una lista; cualquier otro bloque la
    // cierra, y el siguiente número vuelve a empezar en 1
    if (esNumerado && !previoNumerado) nuevaLista();
    previoNumerado = esNumerado;
    salida.push(...bloque(b));
  }
  return salida;
}

// ── secciones ─────────────────────────────────────────────────────────────────

function seccion1() {
  const s = seccion('1');
  return [L.h1('1.  ' + g(s, 'name', 'Justificación')), ...contenido(s)];
}

function seccion2() {
  const s = seccion('2');
  const especificos = g(s, 'objetivosEspecificos', []) || [];
  return [
    L.h1('2.  ' + g(s, 'name', 'Objetivos')),
    L.h3('Objetivo General'),
    L.bp(g(s, 'objetivoGeneral', '')),
    L.h3('Objetivos Específicos'),
    ...(() => { const i = nuevaLista(); return especificos.map((t) => L.nmb(t, i)); })(),
  ];
}

function seccion3() {
  const s = seccion('3');
  const gl = g(s, 'glosario', []) || [];
  const ab = g(s, 'abreviaciones', []) || [];
  const out = [L.h1('3.  ' + g(s, 'name', 'Glosario de términos / Abreviaciones'))];
  // Toda tabla declara su fuente, también las que compone el compilador y que
  // por tanto no están descritas en la matriz. Sin esto se colaban tres por
  // protocolo sin atribución.
  if (gl.length) {
    out.push(L.caption('Tabla 1. Términos clínicos'));
    out.push(L.mkT([{ label: 'TÉRMINO', w: 2200 }, { label: 'DEFINICIÓN', w: L.CW - 2200 }],
                   gl.map((x) => [g(x, 'termino', ''), g(x, 'definicion', '')])));
    out.push(L.note('Fuente: ' + g(s, 'fuenteGlosario', 'Elaboración propia.')));
  }
  if (ab.length) {
    out.push(L.blk());
    out.push(L.caption('Tabla 2. Abreviaciones'));
    out.push(L.mkT([{ label: 'ABREVIACIÓN', w: 2200 }, { label: 'SIGNIFICADO', w: L.CW - 2200 }],
                   ab.map((x) => [g(x, 'sigla', ''), g(x, 'significado', '')])));
    out.push(L.note('Fuente: ' + g(s, 'fuenteAbreviaciones', 'Elaboración propia.')));
  }
  return out;
}

function seccion4() {
  const s = seccion('4');
  const out = [L.h1('4.  ' + g(s, 'name', 'Procedimiento (Plan de Acción/Actuación)'))];
  for (const sub of g(s, 'hasPart', []) || []) {
    out.push(L.h2(g(sub, 'numeral', '') + '.  ' + g(sub, 'name', '')));
    const quien = g(sub, 'quienLoHace');
    const cuando = g(sub, 'cuando');
    if (quien && cuando) out.push(...L.who(quien, cuando));
    out.push(...contenido(sub));
  }
  return out;
}

function seccionSimple(numeral, titulo) {
  const s = seccion(numeral);
  if (!s) return [];
  return [L.h1(numeral + '.  ' + g(s, 'name', titulo)), ...contenido(s)];
}

function seccion6() {
  const s = seccion('6');
  const inds = g(s, 'indicadores', []) || [];
  // Encabezados literales del HECAM-CC-FR-012 y de docs/matriz-editorial.md.
  // No son intercambiables por sinónimos: la revisora los comprueba uno a uno.
  const cols = [
    { label: 'Nombre Indicador', w: 1700 },
    { label: 'Definición', w: 1900 },
    { label: 'Cálculo', w: 2200 },
    { label: 'Meta', w: 900, centered: true },
    { label: 'Periodo', w: 900, centered: true },
    { label: 'Responsable', w: L.CW - 7600 },
  ];
  const filas = inds.map((x) => {
    const tipo = g(x, 'tipoIndicador', '');
    const nombre = g(x, 'name', '') + (tipo ? ' (' + tipo + ')' : '');
    return [nombre, g(x, 'definicionIndicador', ''), g(x, 'calculo', ''),
            g(x, 'meta', ''), g(x, 'periodo', ''), g(x, 'responsable', '')];
  });
  const out = [L.h1('6.  ' + g(s, 'name', 'Indicadores'))];
  out.push(...contenido(s));
  if (filas.length) {
    out.push(L.caption(g(s, 'tituloTabla', 'Indicadores de calidad del protocolo')));
    out.push(L.mkT(cols, filas));
    out.push(L.note('Fuente: ' + g(s, 'fuenteTabla', 'Elaboración propia.')));
  }
  return out;
}

function seccion7() {
  const s = seccion('7');
  const refs = (doc.citation || []).map((c) => g(c, 'vancouver', g(c, 'name', '')));
  return [L.h1('7.  ' + g(s, 'name', 'Bibliografía')), ...L.biblio(refs)];
}

function seccion8() {
  const s = seccion('8');
  const out = [L.h1('8.  ' + g(s, 'name', 'Anexos'))];
  const anexos = g(s, 'anexos', []) || [];
  anexos.forEach((a, i) => {
    if (i) out.push(L.blk());
    out.push(L.h2('Anexo ' + g(a, 'position', i + 1) + '. ' + g(a, 'name', '')));
    const cuerpo = g(a, 'contenido', []) || [];
    out.push(...cuerpo.flatMap(bloque));
    // columnas/filas al margen del contenido son un reflejo de la tabla que ya
    // está dentro; solo se maquetan si el anexo no trae cuerpo.
    const yaHayTabla = cuerpo.some((b) => String(g(b, 'type', '')).startsWith('Tabla'));
    const filas = g(a, 'filas');
    if (!yaHayTabla && filas && filas.length) {
      out.push(L.mkT(columnas(a), filas));
      // La fuente del anexo se maqueta también por esta vía; olvidarla dejaba
      // la tabla sin atribución y, si la fuente llevaba una cita, rompía el
      // orden correlativo de la bibliografía.
      const fuente = g(a, 'fuente');
      if (fuente) out.push(L.note('Fuente: ' + fuente));
    }
  });
  return out;
}

function seccion9() {
  const s = seccion('9');
  const rol = (doc.author || [])[0] || {};
  const persona = g(rol, 'author', {});
  const autor = {
    nombre: [g(persona, 'honorificPrefix', ''), g(persona, 'name', '')]
      .filter(Boolean).join(' '),
    cargo: g(persona, 'jobTitle', ''),
    unidad: g(g(persona, 'memberOf', {}), 'name', ''),
  };
  const out = [L.h1('9.  ' + g(s, 'name', 'Firmas de los involucrados'))];
  out.push(autor.nombre ? L.firmas(autor) : L.firmas());
  out.push(...contenido(s));
  return out;
}

function seccion10() {
  const s = seccion('10');
  return [L.h1('10.  ' + g(s, 'name', 'Control de cambios')), L.controlCambios()];
}

// ── índice ────────────────────────────────────────────────────────────────────

function indice() {
  const entradas = doc.indice;
  if (!entradas || !entradas.length) {
    console.error('  aviso: la matriz no trae «indice»; el contenido sale sin ' +
                  'números de página. Dependen de cómo pagine Word y no se ' +
                  'pueden deducir del texto.');
    return (doc.hasPart || []).map((s) =>
      L.tocItem(g(s, 'numeral', ''), g(s, 'name', ''), ''));
  }
  // El nombre lo manda la sección, no el índice: del índice solo se toma la
  // página, que es lo único que no se puede deducir. Así el contenido no puede
  // divergir de los encabezados, que es una de las cosas que la revisora mira.
  const porNumeral = {};
  for (const s of doc.hasPart || []) {
    porNumeral[g(s, 'numeral', '')] = g(s, 'name', '');
    for (const sub of g(s, 'hasPart', []) || []) {
      porNumeral[g(sub, 'numeral', '')] = g(sub, 'name', '');
    }
  }
  return entradas.map((e) => {
    const num = g(e, 'numeral', '');
    return L.tocItem(num, porNumeral[num] || g(e, 'name', ''),
                     g(e, 'pagina', ''), g(e, 'subseccion', false));
  });
}

// ── ensamble ──────────────────────────────────────────────────────────────────

const titulo = g(doc, 'name', '');
const codigo = g(doc, 'identifier', '');
const version = String(g(doc, 'version', '1'));
const mesAnio = g(doc, 'mesAnioPortada', '');
const unidad = g(doc, 'unidadTecnica', '');
const subtitulo = /^Unidad/.test(unidad) ? unidad : 'Unidad Técnica de ' + unidad;
const fechaElab = g(doc, 'fechaElaboracionTexto', mesAnio.replace(',', ''));

const children = [
  ...L.portada(titulo, subtitulo, mesAnio),
  new L.Paragraph({ children: [new L.PageBreak()] }),
  new L.Paragraph({
    alignment: L.AlignmentType.CENTER, spacing: L.sp(0, 200),
    children: [new L.TextRun({ text: 'CONTENIDO', font: 'Arial', size: 18,
                               bold: true, color: '1C1C1C' })] }),
  ...indice(),
  new L.Paragraph({ children: [new L.PageBreak()] }),
  ...seccion1(),
  ...seccion2(),
  ...seccion3(),
  ...seccion4(),
  ...seccionSimple('5', 'Algoritmo de actuación'),
  ...seccion6(),
  ...seccion7(),
  ...seccion8(),
  ...seccion9(),
  ...seccion10(),
];

// El nombre del archivo es una decisión editorial: los protocolos existentes van
// sin tildes y abreviados. Se respeta el declarado en la matriz; solo si falta se
// deriva del título, y entonces se quitan las tildes para no introducirlas ahora.
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const nombrePorDefecto = codigo + '_' +
  sinTildes(titulo).replace(/[^\w]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) + '.docx';

const destino = iSalida >= 0 && args[iSalida + 1]
  ? path.resolve(args[iSalida + 1])
  : path.join(path.dirname(path.resolve(entrada)), 'salida',
              g(doc, 'nombreArchivo', nombrePorDefecto));

L.escribir(L.buildDoc(titulo, codigo, version, children, fechaElab), destino)
  .then(() => {
    const n = (doc.hasPart || []).length;
    console.log('Compilado ' + destino);
    console.log('  secciones: ' + n + ' | referencias: ' + (doc.citation || []).length);
  })
  .catch((e) => { console.error(e); process.exit(1); });
