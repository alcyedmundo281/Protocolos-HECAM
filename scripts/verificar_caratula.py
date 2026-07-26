#!/usr/bin/env python3
"""
Verifica que la maquetación de la carátula y del membrete no se haya movido.

Dos capas:
  1. GEOMETRÍA (word/document.xml): posiciones y tamaños de los objetos anclados,
     alturas de línea de la carátula, márgenes y ancho del membrete. No depende de
     ningún programa: es exactamente lo que leerá Word.
  2. RENDER (opcional): si hay LibreOffice, convierte a PDF y mide dónde cae cada
     elemento en la página, con tolerancia.

Uso:
    python3 scripts/verificar_caratula.py salida/PROTOCOLO.docx
    python3 scripts/verificar_caratula.py --generar-referencia salida/APROBADO.docx
"""
import sys, os, json, zipfile, subprocess, tempfile, shutil
import xml.etree.ElementTree as ET

NS = {
    'w':   'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'wp':  'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a':   'http://schemas.openxmlformats.org/drawingml/2006/main',
    'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
}
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF  = os.path.join(RAIZ, 'referencia', 'caratula.json')
EMU_CM = 360000
TOL_CM = 0.15          # tolerancia del render, en centímetros

def q(tag):
    p, n = tag.split(':')
    return '{%s}%s' % (NS[p], n)

# ─────────────────────────────────────────────────────── capa 1: geometría

def geometria(ruta):
    with zipfile.ZipFile(ruta) as z:
        doc = ET.fromstring(z.read('word/document.xml'))
        hdrs = [ET.fromstring(z.read(n)) for n in z.namelist()
                if n.startswith('word/header') and n.endswith('.xml')]
        medios = sorted(os.path.basename(n) for n in z.namelist()
                        if n.startswith('word/media/'))
        pesos = sorted(z.getinfo(n).file_size for n in z.namelist()
                       if n.startswith('word/media/'))

    g = {'objetos_anclados': [], 'caratula_lineas': [], 'medios': len(medios),
         'medios_bytes': pesos}

    # objetos anclados (formas e imágenes flotantes)
    for anc in doc.iter(q('wp:anchor')):
        nombre = anc.find(q('wp:docPr')).get('name', '')
        ph = anc.find(q('wp:positionH')); pv = anc.find(q('wp:positionV'))
        ext = anc.find(q('wp:extent'))
        forma = anc.find('.//' + q('a:prstGeom'))
        txbox = anc.find('.//' + q('wps:txbx'))
        g['objetos_anclados'].append({
            'nombre': nombre,
            'tipo': ('forma:' + forma.get('prst')) if forma is not None else 'imagen',
            'cuadro_texto': txbox is not None,
            'x_emu': int(ph.find(q('wp:posOffset')).text),
            'y_emu': int(pv.find(q('wp:posOffset')).text),
            'cx_emu': int(ext.get('cx')), 'cy_emu': int(ext.get('cy')),
        })
    g['objetos_anclados'].sort(key=lambda o: (o['y_emu'], o['x_emu']))

    # alturas de línea de los párrafos de la carátula (hasta el salto de página)
    cuerpo = doc.find(q('w:body'))
    for p in cuerpo.findall(q('w:p')):
        if p.find('.//' + q('w:br')) is not None and \
           p.find('.//' + q('w:br')).get(q('w:type')) == 'page':
            break
        sp = p.find(q('w:pPr') + '/' + q('w:spacing'))
        g['caratula_lineas'].append(None if sp is None else {
            'line': sp.get(q('w:line')), 'lineRule': sp.get(q('w:lineRule')),
            'before': sp.get(q('w:before')), 'after': sp.get(q('w:after'))})

    # página y márgenes
    pg = cuerpo.find(q('w:sectPr') + '/' + q('w:pgSz'))
    mg = cuerpo.find(q('w:sectPr') + '/' + q('w:pgMar'))
    g['pagina'] = {k: pg.get(q('w:' + k)) for k in ('w', 'h')}
    g['margenes'] = {k: mg.get(q('w:' + k)) for k in ('top', 'bottom', 'left', 'right')}
    g['titlePage'] = cuerpo.find(q('w:sectPr') + '/' + q('w:titlePg')) is not None

    # membrete: ancho e sangría de la tabla del encabezado
    for h in hdrs:
        t = h.find(q('w:tbl'))
        if t is None:
            continue
        pr = t.find(q('w:tblPr'))
        anc_ = pr.find(q('w:tblW')); ind = pr.find(q('w:tblInd'))
        g['membrete'] = {'ancho': anc_.get(q('w:w')) if anc_ is not None else None,
                         'sangria': ind.get(q('w:w')) if ind is not None else None}
    return g

# ─────────────────────────────────────────────────────── capa 2: render

def render(ruta):
    """Devuelve la posición vertical de cada elemento de la carátula, en cm."""
    try:
        import numpy as np, pypdfium2 as pdfium
        from PIL import Image
    except ImportError:
        return None
    if not shutil.which('soffice'):
        return None
    tmp = tempfile.mkdtemp()
    try:
        subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', ruta,
                        '--outdir', tmp], capture_output=True, timeout=180)
        pdfs = [f for f in os.listdir(tmp) if f.endswith('.pdf')]
        if not pdfs:
            return None
        pdf = pdfium.PdfDocument(os.path.join(tmp, pdfs[0]))
        img = pdf[0].render(scale=1.6).to_pil()
        a = np.array(img.convert('L')); H, W = a.shape
        ppc, ppcx = H / 29.7, W / 21.0
        tinta = a < 245
        rgb = np.array(img.convert('RGB')).astype(int)

        def banda(x0, x1, y0, y1, azul=False):
            if azul:
                R, B = rgb[:, :, 0], rgb[:, :, 2]
                m = (B - R > 18) & (B > 90) & (R < 215)
            else:
                m = tinta
            w = m[int(y0*ppc):int(y1*ppc), int(x0*ppcx):int(x1*ppcx)]
            ys = np.where(w.any(axis=1))[0]
            return None if not len(ys) else [round(float(y0+ys.min()/ppc), 2),
                                             round(float(y0+ys.max()/ppc), 2)]
        p2 = np.array(pdf[1].render(scale=1.6).to_pil().convert('L')) < 245
        return {
            'marco':      banda(0.5, 20.5, 0, 29.7),
            'logo':       banda(4.3, 6.2, 2, 9.5),
            'protocolo':  banda(6.5, 15, 9, 13),
            'titulo':     banda(3.5, 17, 13.9, 18),
            'pie':        banda(12, 18.5, 22, 28),
            'barra':      banda(1.6, 3.4, 9, 22, azul=True),
            'hojas': len(pdf),
            'tinta_hoja2_pct': round(100 * float(p2.mean()), 2),
        }
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

# ─────────────────────────────────────────────────────── comparación

def comparar(ref, act):
    fallos = []
    for clave in ('pagina', 'margenes', 'titlePage', 'membrete', 'caratula_lineas'):
        if ref.get(clave) != act.get(clave):
            fallos.append('%s cambió:\n     esperado %s\n     obtenido %s'
                          % (clave, ref.get(clave), act.get(clave)))
    ro, ao = ref['objetos_anclados'], act['objetos_anclados']
    if len(ro) != len(ao):
        fallos.append('nº de objetos anclados: esperado %d, obtenido %d' % (len(ro), len(ao)))
    else:
        for r, a in zip(ro, ao):
            for k in ('tipo', 'cuadro_texto', 'x_emu', 'y_emu', 'cx_emu', 'cy_emu'):
                if r[k] != a[k]:
                    fallos.append('objeto "%s" · %s: esperado %s, obtenido %s'
                                  % (r['nombre'], k, r[k], a[k]))
    if ref.get('medios') != act.get('medios'):
        fallos.append('imágenes incrustadas: esperado %s, obtenido %s'
                      % (ref.get('medios'), act.get('medios')))
    return fallos

def comparar_render(ref, act):
    fallos = []
    if not ref or not act:
        return fallos
    for k, v in ref.items():
        if k in ('hojas', 'tinta_hoja2_pct'):
            continue
        w = act.get(k)
        if v is None or w is None:
            if v != w:
                fallos.append('render · %s: esperado %s, obtenido %s' % (k, v, w))
            continue
        for i in (0, 1):
            if abs(v[i] - w[i]) > TOL_CM:
                fallos.append('render · %s: esperado %s cm, obtenido %s cm (tolerancia %.2f)'
                              % (k, v, w, TOL_CM))
                break
    if act.get('tinta_hoja2_pct', 100) < 1.0:
        fallos.append('la hoja 2 está casi vacía (%.2f%% de tinta): la carátula se desbordó'
                      % act['tinta_hoja2_pct'])
    return fallos

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    generar = '--generar-referencia' in sys.argv
    if not args:
        print(__doc__); return 2
    ruta = args[0]

    act = {'geometria': geometria(ruta), 'render': render(ruta)}
    if generar:
        os.makedirs(os.path.dirname(REF), exist_ok=True)
        with open(REF, 'w', encoding='utf8') as f:
            json.dump(act, f, indent=2, ensure_ascii=False)
        print('Referencia guardada en %s (a partir de %s)' % (REF, os.path.basename(ruta)))
        return 0

    if not os.path.exists(REF):
        print('No hay referencia. Genérala con:\n'
              '  python3 scripts/verificar_caratula.py --generar-referencia <docx aprobado>')
        return 2
    ref = json.load(open(REF, encoding='utf8'))

    fallos = comparar(ref['geometria'], act['geometria'])
    fallos += comparar_render(ref.get('render'), act.get('render'))

    print('Verificando %s' % os.path.basename(ruta))
    if act['render'] is None:
        print('  (capa de render omitida: falta LibreOffice o pypdfium2)')
    if fallos:
        print('\nFALLA — %d discrepancia(s):' % len(fallos))
        for f in fallos:
            print('  · %s' % f)
        return 1
    print('  OK — la maquetación coincide con la referencia aprobada.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
