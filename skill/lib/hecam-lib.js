'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// LIBRERÍA COMÚN — Formato institucional HECAM (revisión 16 julio 2026)
// Incluye: parser de citas en superíndice [[n]], membrete, tablas, estilos.
// ═══════════════════════════════════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ImageRun,
  TabStopType, TabStopPosition, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LeaderType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType
} = require('docx');

// ── Logotipos institucionales ─────────────────────────────────────────────────
// Fuente única: assets/logo-header.png (encabezado) y assets/logo-up.png (portada).
// NO reemplazar por otras versiones sin autorización de Comunicación/Imagen HECAM.
const LOGO_DIR = [path.join(__dirname, 'assets'), path.join(__dirname, '..', 'assets')]
  .find((d) => fs.existsSync(d)) || path.join(__dirname, 'assets');
const LOGO_HEADER  = path.join(LOGO_DIR, 'logo-header.png'); // 372 x 115 px
const LOGO_PORTADA = path.join(LOGO_DIR, 'logo-up.png');     // 1180 x 347 px

function logo(archivo, alturaPx) {
  const ratio = archivo === LOGO_HEADER ? 372 / 115 : 1180 / 347;
  return new ImageRun({
    type: 'png',
    data: fs.readFileSync(archivo),
    transformation: { width: Math.round(alturaPx * ratio), height: alturaPx },
  });
}

// ── Colores ───────────────────────────────────────────────────────────────────
const BLUE      = '003366';
const BLUE_LITE = 'E8EFF7';
const GRAY_BG   = 'F2F2F2';
const WHITE     = 'FFFFFF';
const TEXT      = '1C1C1C';
const GREEN_BG  = 'D6EAD8';
const AMBER_BG  = 'FFF2CC';
const RED_BG    = 'FDDCDC';

// ── Dimensiones ───────────────────────────────────────────────────────────────
const PAGE_W = 11906;
const ML = 1700;
const MR = 1400;
const CW = PAGE_W - ML - MR; // 8806

// ── Bordes ────────────────────────────────────────────────────────────────────
const hdrB  = { style: BorderStyle.SINGLE, size: 6, color: BLUE };
const cellB = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
const allHdr  = { top: hdrB,  bottom: hdrB,  left: hdrB,  right: hdrB  };
const allCell = { top: cellB, bottom: cellB, left: cellB, right: cellB };

const sp = (b, a) => ({ before: b, after: a });

// ═══════════════════════════════════════════════════════════════════════════════
// PARSER DE CITAS EN SUPERÍNDICE
// Sintaxis: texto normal [[1]] · negrita **texto** · cursiva __texto__
// ═══════════════════════════════════════════════════════════════════════════════
function parseRuns(text, opts = {}) {
  const base = { font: 'Arial', size: 20, color: TEXT, ...opts };
  const out = [];
  // Divide por marcas: [[n]] , **bold** , __italic__
  const re = /(\[\[[\d,\s\u2013-]+\]\])|(\*\*[^*]+\*\*)|(__[^_]+__)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ ...base, text: text.slice(last, m.index) }));
    if (m[1]) {
      const n = m[1].slice(2, -2).trim();
      out.push(new TextRun({ ...base, text: n, superScript: true, bold: false }));
    } else if (m[2]) {
      out.push(new TextRun({ ...base, text: m[2].slice(2, -2), bold: true }));
    } else if (m[3]) {
      out.push(new TextRun({ ...base, text: m[3].slice(2, -2), italics: true }));
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(new TextRun({ ...base, text: text.slice(last) }));
  return out.length ? out : [new TextRun({ ...base, text: '' })];
}

// ── Párrafos ──────────────────────────────────────────────────────────────────
function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: sp(280, 140),
    children: [new TextRun({ text: t, font: 'Arial', size: 24, bold: true, color: WHITE })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: sp(200, 100),
    children: [new TextRun({ text: t, font: 'Arial', size: 22, bold: true, color: BLUE })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: sp(140, 70),
    children: [new TextRun({ text: t, font: 'Arial', size: 20, bold: true, color: TEXT })] });
}
function bp(t) {
  return new Paragraph({ children: parseRuns(t), spacing: sp(60, 60),
    alignment: AlignmentType.JUSTIFIED });
}
function blt(t, lvl = 0) {
  return new Paragraph({ numbering: { reference: 'bullets', level: lvl },
    children: parseRuns(t), spacing: sp(40, 40),
    indent: lvl === 0 ? { left: 700, hanging: 350 } : { left: 1060, hanging: 350 } });
}
// `instancia` separa listas: sin ella todas comparten el mismo contador y cada
// lista continúa la numeración de la anterior, de modo que la segunda del
// documento empieza en 5 en vez de en 1. Quien compone debe pasar una instancia
// distinta por cada lista lógica.
function nmb(t, instancia = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0, instance: instancia },
    children: parseRuns(t), spacing: sp(40, 40), indent: { left: 700, hanging: 350 } });
}
function blk() { return new Paragraph({ children: [new TextRun({ text: '', font: 'Arial', size: 20 })], spacing: sp(40, 40) }); }
function dvd() {
  return new Paragraph({ children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    spacing: sp(80, 80) });
}
function caption(t) {
  return new Paragraph({ spacing: sp(100, 60),
    children: [new TextRun({ text: t, font: 'Arial', size: 18, bold: true, color: BLUE })] });
}
function note(t) {
  return new Paragraph({ spacing: sp(40, 80), alignment: AlignmentType.JUSTIFIED,
    children: parseRuns(t, { size: 17, italics: true }) });
}
function who(quien, cuando) {
  return [
    new Paragraph({ spacing: sp(60, 20), children: [
      new TextRun({ text: 'Quién lo hace: ', bold: true, font: 'Arial', size: 20, color: TEXT }),
      ...parseRuns(quien) ] }),
    new Paragraph({ spacing: sp(20, 60), children: [
      new TextRun({ text: 'Cuándo: ', bold: true, font: 'Arial', size: 20, color: TEXT }),
      ...parseRuns(cuando) ] }),
  ];
}

// ── Celdas / Tablas ───────────────────────────────────────────────────────────
function hC(t, w) {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders: allHdr,
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: t, bold: true, color: WHITE, font: 'Arial', size: 17 })] })] });
}
function dC(t, w, shade = WHITE, centered = false) {
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders: allCell,
    shading: { fill: shade, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    children: [new Paragraph({ alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: parseRuns(t, { size: 17 }) })] });
}
function mkT(cols, rows) {
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: cols.map(c => c.w),
    rows: [
      new TableRow({ tableHeader: true, children: cols.map(c => hC(c.label, c.w)) }),
      ...rows.map((r, i) => new TableRow({ children: r.map((cell, j) =>
        dC(cell, cols[j].w, i % 2 === 0 ? BLUE_LITE : WHITE, cols[j].centered)) })),
    ] });
}

// ── Celda con semáforo de resistencia ─────────────────────────────────────────
function rC(pct, w) {
  const n = parseFloat(pct);
  let bg = WHITE;
  if (!isNaN(n)) bg = n < 30 ? GREEN_BG : n <= 70 ? AMBER_BG : RED_BG;
  return new TableCell({ width: { size: w, type: WidthType.DXA }, borders: allCell,
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: pct, font: 'Arial', size: 16, bold: !isNaN(n) && n > 70 })] })] });
}
function rTable(cols, rows) {
  const w = cols.map(c => c.w);
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: w,
    rows: [
      new TableRow({ tableHeader: true, children: cols.map(c => new TableCell({
        width: { size: c.w, type: WidthType.DXA }, borders: allHdr,
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 70, bottom: 70, left: 60, right: 60 }, verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: c.label, bold: true, color: WHITE, font: 'Arial', size: 15 })] })] })) }),
      ...rows.map((row, i) => new TableRow({ children: [
        new TableCell({ width: { size: w[0], type: WidthType.DXA }, borders: allCell,
          shading: { fill: i % 2 === 0 ? BLUE_LITE : WHITE, type: ShadingType.CLEAR },
          margins: { top: 50, bottom: 50, left: 90, right: 60 },
          children: [new Paragraph({ children: [new TextRun({ text: row[0], font: 'Arial', size: 16, bold: true })] })] }),
        ...row.slice(1).map((v, k) => rC(v, w[k + 1])),
      ]})),
    ] });
}
function semaforo() {
  return new Paragraph({ spacing: sp(50, 60), children: [
    new TextRun({ text: '■ ', font: 'Arial', size: 18, color: '2E7D32' }),
    new TextRun({ text: '< 30 % R: apto para terapia empírica   ', font: 'Arial', size: 16 }),
    new TextRun({ text: '■ ', font: 'Arial', size: 18, color: 'F57F17' }),
    new TextRun({ text: '30–70 % R: precaución   ', font: 'Arial', size: 16 }),
    new TextRun({ text: '■ ', font: 'Arial', size: 18, color: 'C62828' }),
    new TextRun({ text: '> 70 % R: NO apto   ', font: 'Arial', size: 16 }),
    new TextRun({ text: '(-): no evaluado.', font: 'Arial', size: 16, italics: true }),
  ]});
}

// ── Membrete institucional (formato revisado) ─────────────────────────────────
function membrete(titulo, codigo, version, fechaElab) {
  const c1 = 2960, c2 = 4286, c3 = 2960;   // 18 cm: el membrete sobresale del cuerpo
  const bLine = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const bx = { top: bLine, bottom: bLine, left: bLine, right: bLine };
  const mini = (runs) => new TableCell({ width: { size: c3, type: WidthType.DXA }, borders: bx,
    margins: { top: 40, bottom: 40, left: 80, right: 80 }, verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: runs })] });
  const txt = (t, b) => new TextRun({ text: t, font: 'Arial', size: 14, bold: !!b, color: TEXT });
  return new Table({ width: { size: c1 + c2 + c3, type: WidthType.DXA }, columnWidths: [c1, c2, c3],
    indent: { size: -850, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: c1, type: WidthType.DXA }, borders: bx, rowSpan: 4,
          margins: { top: 60, bottom: 60, left: 80, right: 80 }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [logo(LOGO_HEADER, 42)] })] }),
        new TableCell({ width: { size: c2, type: WidthType.DXA }, borders: bx, rowSpan: 4,
          margins: { top: 60, bottom: 60, left: 100, right: 100 }, verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [txt('Protocolo:', true)] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [txt(titulo, true)] }),
          ] }),
        mini([txt('Código: ' + codigo)]),
      ]}),
      new TableRow({ children: [mini([txt('Versión: ' + version)])] }),
      new TableRow({ children: [mini([txt('Fecha elaboración: ' + fechaElab)])] }),
      new TableRow({ children: [mini([
        txt('Página: '),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 14, color: TEXT }),
        txt(' de '),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 14, color: TEXT }),
      ])] }),
    ] });
}

// ── Portada ───────────────────────────────────────────────────────────────────
const AZUL_INST = '154291';
const MARCO = path.join(LOGO_DIR, 'marco-caratula.png');

// El marco de la carátula es una FIGURA de Word (rectángulo redondeado), no una imagen.
// Se marca aquí y se inyecta como forma nativa en escribir().
function marcoCaratula() {
  return new TextRun({ text: '@@MARCO@@', size: 2 });
}

const MARCO_XML = `<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing>` +
`<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="2" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">` +
`<wp:simplePos x="0" y="0"/>` +
`<wp:positionH relativeFrom="page"><wp:posOffset>540000</wp:posOffset></wp:positionH>` +
`<wp:positionV relativeFrom="page"><wp:posOffset>648000</wp:posOffset></wp:positionV>` +
`<wp:extent cx="6480000" cy="9612000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>` +
`<wp:docPr id="900" name="Rectángulo: esquinas redondeadas 900"/><wp:cNvGraphicFramePr/>` +
`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
`<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr bwMode="auto">` +
`<a:xfrm><a:off x="0" y="0"/><a:ext cx="6480000" cy="9612000"/></a:xfrm>` +
`<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 9444"/></a:avLst></a:prstGeom>` +
`<a:noFill/><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="154291"/></a:solidFill><a:prstDash val="solid"/><a:round/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:ln>` +
`</wps:spPr><wps:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" vert="horz" wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" numCol="1" spcCol="0" rtlCol="0" fromWordArt="0" anchor="ctr" anchorCtr="0" forceAA="0" compatLnSpc="1"><a:prstTxWarp prst="textNoShape"><a:avLst/></a:prstTxWarp><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></mc:Choice>` +
`<mc:Fallback><w:pict><v:roundrect style="position:absolute;margin-left:42.5pt;margin-top:51pt;width:510.2pt;height:756.9pt;z-index:-2;mso-position-horizontal-relative:page;mso-position-vertical-relative:page" arcsize="3095f" filled="f" strokecolor="#154291" strokeweight="1pt"/></w:pict></mc:Fallback>` +
`</mc:AlternateContent></w:r>`;


// Barra vertical de la carátula: archivo original barra.png (11 x 357 px),
// colocado como imagen flotante anclada a la página.
const BARRA_IMG = path.join(LOGO_DIR, 'barra.png');

function barraTitulo() {
  return new ImageRun({
    type: 'png', data: fs.readFileSync(BARRA_IMG),
    transformation: { width: 5.69, height: 184.7 }, // 0,150 x 4,89 cm
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 939600 },
      verticalPosition:   { relative: VerticalPositionRelativeFrom.PAGE,   offset: 4667040 },
      behindDocument: false, wrap: { type: TextWrappingType.NONE },
    },
  });
}

// Empaqueta el .docx e inserta las figuras nativas en lugar del marcador
async function escribir(doc, ruta) {
  const buf = await Packer.toBuffer(doc);
  const JSZip = require(require.resolve('jszip', { paths: [path.dirname(require.resolve('docx'))] }));
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');
  for (const [marca, figura] of [['@@MARCO@@', MARCO_XML], ['@@PIE@@', PIE_XML]]) {
    const re = new RegExp('<w:r>(?:(?!<\\/w:r>)[\\s\\S])*?' + marca + '[\\s\\S]*?<\\/w:r>');
    if (!re.test(xml)) throw new Error('No se encontró el marcador ' + marca);
    xml = xml.replace(re, figura);
  }
  zip.file('word/document.xml', xml);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

let PIE_XML = '';
const esc = (t) => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Bloque inferior (unidad y fecha): cuadro de texto anclado a la página.
// Va anclado, no en el flujo, para que no pueda empujar contenido a otra hoja.
function pieXml(subtitulo, fechaTexto) {
  const linea = (t) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="exact"/>` +
    `<w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:i/>` +
    `<w:color w:val="${TEXT}"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`;
  const cuerpo = linea(subtitulo) + linea(fechaTexto);
  return `<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing>` +
`<wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="4" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">` +
`<wp:simplePos x="0" y="0"/>` +
`<wp:positionH relativeFrom="page"><wp:posOffset>2880000</wp:posOffset></wp:positionH>` +
`<wp:positionV relativeFrom="page"><wp:posOffset>9129600</wp:posOffset></wp:positionV>` +
`<wp:extent cx="3790800" cy="468000"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>` +
`<wp:docPr id="902" name="Cuadro de texto 902"/><wp:cNvGraphicFramePr/>` +
`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
`<a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">` +
`<wps:wsp><wps:cNvSpPr txBox="1"/><wps:spPr bwMode="auto">` +
`<a:xfrm><a:off x="0" y="0"/><a:ext cx="3790800" cy="468000"/></a:xfrm>` +
`<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="0"><a:noFill/></a:ln></wps:spPr>` +
`<wps:txbx><w:txbxContent>${cuerpo}</w:txbxContent></wps:txbx>` +
`<wps:bodyPr rot="0" vert="horz" wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t" anchorCtr="0"><a:noAutofit/></wps:bodyPr>` +
`</wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></mc:Choice>` +
`<mc:Fallback><w:pict><v:shape style="position:absolute;margin-left:226.8pt;margin-top:722.8pt;width:298.5pt;height:36.9pt;z-index:4;mso-position-horizontal-relative:page;mso-position-vertical-relative:page" filled="f" stroked="f">` +
`<v:textbox inset="0,0,0,0"><w:txbxContent>${cuerpo}</w:txbxContent></v:textbox></v:shape></w:pict></mc:Fallback>` +
`</mc:AlternateContent></w:r>`;
}

function portada(titulo, subtitulo, fechaTexto) {
  PIE_XML = pieXml(subtitulo, fechaTexto);
  const vacio = (twips) => new Paragraph({ children: [],
    spacing: { before: 0, after: 0, line: twips, lineRule: 'exact' } });
  return [
    vacio(787),                                     // hasta el logotipo: 1,39 cm
    new Paragraph({ alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 2205, lineRule: 'atLeast' },
      children: [marcoCaratula(), logo(LOGO_PORTADA, 147)] }),
    vacio(1219),                                    // hasta PROTOCOLO
    new Paragraph({ alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 1050, lineRule: 'exact' },
      children: [new TextRun({ text: 'PROTOCOLO', font: 'Arial', size: 88, bold: true, color: AZUL_INST })] }),
    vacio(1575),                                    // hasta el título
    new Paragraph({ alignment: AlignmentType.CENTER, indent: { left: 220 },
      spacing: { before: 0, after: 0, line: 400, lineRule: 'exact' },
      children: [barraTitulo(), pieCaratula(),
        new TextRun({ text: titulo.toUpperCase(), font: 'Arial', size: 32, bold: true, color: AZUL_INST })] }),
  ];
}

function pieCaratula() { return new TextRun({ text: '@@PIE@@', size: 2 }); }

// ── Índice ────────────────────────────────────────────────────────────────────
function tocItem(n, l, p, sub) {
  const t = (txt) => new TextRun({ text: txt, font: 'Arial', size: 16, color: TEXT });
  return new Paragraph({
    tabStops: [
      { type: TabStopType.LEFT,  position: 640 },
      { type: TabStopType.RIGHT, position: CW, leader: LeaderType.DOT },
    ],
    spacing: sp(0, 0),
    children: [t(n + '.'), t('\t' + l), t('\t' + p)],
  });
}

// ── Bibliografía ──────────────────────────────────────────────────────────────
function biblio(refs) {
  return refs.map((r, i) => new Paragraph({
    spacing: sp(40, 60), alignment: AlignmentType.JUSTIFIED,
    indent: { left: 500, hanging: 500 },
    children: [
      new TextRun({ text: `${i + 1}. `, bold: true, font: 'Arial', size: 18, color: BLUE }),
      new TextRun({ text: r, font: 'Arial', size: 18, color: TEXT }),
    ] }));
}

// ── Firmas (lista oficial revisada) ───────────────────────────────────────────
// Autor por defecto de los protocolos de la Unidad Técnica de Medicina Interna.
// Se puede sobrescribir por protocolo: firmas({ nombre: '…', unidad: '…' }),
// para que el pipeline siga sirviendo a otras unidades y otros autores.
const AUTOR_POR_DEFECTO = {
  nombre: 'Dr. Alcy Edmundo Torres Guerrero',
  cargo: 'Médico Internista (Tratante)',
  unidad: 'Unidad Técnica de Medicina Interna',
};

function firmas(autor = AUTOR_POR_DEFECTO) {
  const L = 4200, R = CW - L;
  const cL = (lines) => new TableCell({ width: { size: L, type: WidthType.DXA }, borders: allCell,
    shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
    margins: { top: 110, bottom: 110, left: 140, right: 140 },
    children: lines.map((l, i) => new Paragraph({ spacing: sp(i === 0 ? 0 : 40, 40),
      children: [new TextRun({ text: l, font: 'Arial', size: 18, bold: i === 0, color: i === 0 ? BLUE : TEXT })] })) });
  const cR = (n) => new TableCell({ width: { size: R, type: WidthType.DXA }, borders: allCell,
    shading: { fill: WHITE, type: ShadingType.CLEAR },
    margins: { top: 110, bottom: 110, left: 140, right: 140 },
    children: Array.from({ length: n }, () => new Paragraph({ spacing: sp(90, 90),
      children: [new TextRun({ text: '_________________________', font: 'Arial', size: 18 })] })) });
  return new Table({ width: { size: CW, type: WidthType.DXA }, columnWidths: [L, R], rows: [
    new TableRow({ children: [cL(['Aprobado por:', 'Director Técnico']), cR(1)] }),
    new TableRow({ children: [cL([
      'Revisado por:',
      'Coordinador General de Investigación',
      'Coordinador General de Control de Calidad',
      'Coordinador General de Hospitalización y Ambulatorio',
      'Coordinador General de Áreas Críticas',
      'Coordinador General de Diagnóstico y Tratamiento',
      'Jefe de Áreas Clínicas (Presidente PROA)',
      'Jefe de la Unidad de Cuidados Intensivos Adultos',
    ]), cR(7)] }),
    new TableRow({ children: [cL(['Elaborado por:', autor.nombre, autor.cargo, autor.unidad]
      .filter(Boolean)), cR(1)] }),
  ]});
}

// ── Control de cambios (creación) ─────────────────────────────────────────────
// Cronograma en el formato que fija la revisora: cuatro columnas fijas y una
// rejilla de meses marcada con «x», con el año en una fila de cabecera propia
// que abarca los meses. No se puede componer con mkT, que solo admite una fila
// de cabecera, y los meses necesitan márgenes y cuerpo menores para caber.
function cronograma(anio, meses, filas) {
  const W_ID = 300, W_TAREA = 2000, W_FECHA = 700;
  const wMes = Math.floor((CW - W_ID - W_TAREA - 2 * W_FECHA) / meses.length);
  const fijas = [['Id', W_ID], ['Nombre de la tarea', W_TAREA],
                 ['Comienzo', W_FECHA], ['Fin', W_FECHA]];

  const cabFija = (t, w) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders: allHdr, rowSpan: 2,
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: t, bold: true, color: WHITE, font: 'Arial', size: 17 })] })] });

  const cabMes = (t, span) => new TableCell({
    width: { size: wMes * (span || 1), type: WidthType.DXA }, borders: allHdr,
    columnSpan: span || 1,
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: { top: 40, bottom: 40, left: 20, right: 20 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: t, bold: true, color: WHITE, font: 'Arial', size: 14 })] })] });

  const celdaMes = (t, shade) => new TableCell({
    width: { size: wMes, type: WidthType.DXA }, borders: allCell,
    shading: { fill: shade, type: ShadingType.CLEAR },
    margins: { top: 40, bottom: 40, left: 20, right: 20 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: t, font: 'Arial', size: 14 })] })] });

  const filasTabla = [
    new TableRow({ tableHeader: true, children: [
      ...fijas.map(([t, w]) => cabFija(t, w)), cabMes(anio, meses.length)] }),
    new TableRow({ tableHeader: true, children: meses.map((m) => cabMes(m)) }),
  ];

  filas.forEach((f, i) => {
    const shade = i % 2 === 0 ? BLUE_LITE : WHITE;
    filasTabla.push(new TableRow({ children: [
      dC(String(f[0]), W_ID, shade, true),
      dC(String(f[1]), W_TAREA, shade),
      dC(String(f[2]), W_FECHA, shade, true),
      dC(String(f[3]), W_FECHA, shade, true),
      ...f.slice(4).map((m) => celdaMes(String(m || ''), shade)),
    ] }));
  });

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [W_ID, W_TAREA, W_FECHA, W_FECHA, ...meses.map(() => wMes)],
    rows: filasTabla });
}

function controlCambios() {
  return mkT(
    [{ label: 'No. Versión', w: 1300, centered: true }, { label: 'Fecha', w: 1900, centered: true }, { label: 'Descripción del Cambio', w: 5606 }],
    [['1', '(vigencia)', 'Creación del Protocolo.'], ['', '', ''], ['', '', '']]
  );
}

// ── Documento base ────────────────────────────────────────────────────────────
function buildDoc(titulo, codigo, version, children, fechaElab) {
  return new Document({
    numbering: { config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 700, hanging: 350 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1060, hanging: 350 } } } },
      ]},
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 700, hanging: 350 } } } },
      ]},
    ]},
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 }, paragraph: { spacing: { line: 276 } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 24, bold: true, color: WHITE },
          paragraph: { spacing: sp(280, 140), outlineLevel: 0,
            shading: { fill: BLUE, type: ShadingType.CLEAR }, indent: { left: 160, right: 160 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 22, bold: true, color: BLUE },
          paragraph: { spacing: sp(200, 100), outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 20, bold: true, color: TEXT },
          paragraph: { spacing: sp(140, 70), outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: 16838 },
        margin: { top: 1400, bottom: 1400, left: ML, right: MR } },
        titlePage: true },
      headers: {
        first: new Header({ children: [new Paragraph({ children: [] })] }),
        default: new Header({ children: [
          membrete(titulo, codigo, version, fechaElab),
          new Paragraph({ spacing: sp(0, 60), children: [] }),
        ]}),
      },
      footers: {
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
        default: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children,
    }],
  });
}

module.exports = {
  Packer, Paragraph, TextRun, Table, TableRow, TableCell, PageBreak, AlignmentType,
  WidthType, ShadingType, VerticalAlign, BorderStyle,
  BLUE, BLUE_LITE, GRAY_BG, WHITE, TEXT, GREEN_BG, AMBER_BG, RED_BG,
  CW, sp, parseRuns, h1, h2, h3, bp, blt, nmb, blk, dvd, caption, note, who,
  hC, dC, mkT, rC, rTable, semaforo, membrete, portada, tocItem, biblio,
  firmas, cronograma, controlCambios, buildDoc, allHdr, allCell, logo, AZUL_INST, escribir, LOGO_HEADER, LOGO_PORTADA,
};
