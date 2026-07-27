#!/usr/bin/env python3
"""
verificar_documento.py — Comprueba que las piezas institucionales estén donde toca.

    python3 skill/scripts/verificar_documento.py produccion/*/salida/*.docx

Complementa a los otros verificadores sin solaparse con ellos:

  - verificar_caratula.py compara medidas contra la referencia aprobada;
    este comprueba que los elementos **existan** y estén bien enlazados.
  - check_citas.py mira el orden de las citas; este mira que vayan en
    superíndice.
  - verificar_pmid.py mira la bibliografía; este no la toca.

Lo que verifica:

  1. Las tres imágenes del documento salen de skill/assets, comparadas por
     hash, no por nombre ni por tamaño.
  2. La carátula lleva el marco como autoforma, la barra y el logotipo como
     imágenes, y la unidad y fecha en cuadro de texto anclado.
  3. El membrete va en el encabezado de las páginas siguientes —no en la
     carátula— con el logotipo y la tabla.
  4. La paginación usa campos automáticos PAGE y NUMPAGES, no texto fijo.
  5. Las citas van en superíndice.

Código de salida 0 si todo está, 1 si falta algo.
"""

import hashlib
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
WP = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"
WPS = "{http://schemas.microsoft.com/office/word/2010/wordprocessingShape}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(RAIZ, "assets")
EMU_CM = 360000


def sha(b):
    return hashlib.sha256(b).hexdigest()


def clasificar(nodo):
    """El orden importa: un cuadro de texto también lleva prstGeom."""
    if nodo.find(".//" + WPS + "txbx") is not None:
        return "cuadro de texto"
    if nodo.find(".//" + A + "blip") is not None:
        return "imagen"
    forma = nodo.find(".//" + A + "prstGeom")
    return ("forma:" + forma.get("prst")) if forma is not None else "?"


def medir(nodo):
    ext = nodo.find(WP + "extent")
    if ext is None:
        return None
    return (round(int(ext.get("cx")) / EMU_CM, 2),
            round(int(ext.get("cy")) / EMU_CM, 2))


def verificar(ruta):
    print("Verificando %s" % os.path.basename(ruta))
    fallos = []

    def ok(cond, texto, detalle=""):
        print("  %s %s%s" % ("OK  " if cond else "FALLA", texto,
                             (" — " + detalle) if detalle else ""))
        if not cond:
            fallos.append(texto)

    with zipfile.ZipFile(ruta) as z:
        nombres = z.namelist()
        doc = ET.fromstring(z.read("word/document.xml"))
        doc_rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
        hdr = {n: z.read(n).decode("utf-8") for n in nombres
               if re.match(r"word/header\d*\.xml$", n)}
        hdr_rels = {n: z.read(n).decode("utf-8") for n in nombres
                    if re.match(r"word/_rels/header\d*\.xml\.rels$", n)}
        medios = {n: z.read(n) for n in nombres
                  if n.startswith("word/media/") and not n.endswith("/")}

    # ── 1. procedencia de las imágenes ────────────────────────────────────────
    if not os.path.isdir(ASSETS):
        ok(False, "existe skill/assets", ASSETS)
        return 1
    en_assets = {}
    for f in sorted(os.listdir(ASSETS)):
        if f.lower().endswith(".png"):
            with open(os.path.join(ASSETS, f), "rb") as fh:
                en_assets[sha(fh.read())] = f

    usadas = {sha(b) for b in medios.values() if b}
    sin_usar = sorted(f for h, f in en_assets.items() if h not in usadas)
    ajenas = [n for n, b in medios.items() if b and sha(b) not in en_assets]
    ok(not sin_usar, "el documento usa las tres imágenes de skill/assets",
       "sin usar: " + ", ".join(sin_usar) if sin_usar else
       ", ".join(sorted(en_assets.values())))
    ok(not ajenas, "no hay imágenes ajenas a skill/assets",
       ", ".join(os.path.basename(n) for n in ajenas) if ajenas else "")

    # ── 2. carátula ───────────────────────────────────────────────────────────
    anclados = [{"tipo": clasificar(a), "cm": medir(a)}
                for a in doc.iter(WP + "anchor")]
    # la barra va anclada; el logotipo de portada va en el flujo
    en_linea = [{"tipo": clasificar(i), "cm": medir(i)}
                for i in doc.iter(WP + "inline")]

    ok(any(o["tipo"] == "forma:roundRect" for o in anclados),
       "el marco es autoforma, no una imagen")
    imagenes = [o for o in anclados + en_linea if o["tipo"] == "imagen"]
    ok(len(imagenes) >= 2, "la barra y el logotipo van como imágenes",
       "; ".join(str(o["cm"]) + " cm" for o in imagenes))
    ok(any(o["tipo"] == "cuadro de texto" for o in anclados),
       "unidad y fecha van en cuadro de texto anclado, fuera del flujo")

    # ── 3. membrete y 4. paginación ───────────────────────────────────────────
    rid_a_header = {rid: "word/" + t for rid, t in re.findall(
        r'Id="([^"]+)"[^>]*Target="(header\d*\.xml)"', doc_rels)}
    sect = doc.find(".//" + W + "sectPr")
    asignacion = {}
    if sect is not None:
        for ref in sect.findall(W + "headerReference"):
            asignacion[ref.get(W + "type")] = rid_a_header.get(ref.get(R + "id"), "")

    xml_def = hdr.get(asignacion.get("default", ""), "")
    xml_1ra = hdr.get(asignacion.get("first", ""), "")

    ok(sect is not None and sect.find(W + "titlePg") is not None,
       "titlePage activo")
    ok("<a:blip" in xml_def and "<w:tbl>" in xml_def,
       "las páginas siguientes llevan el membrete con logotipo y tabla",
       asignacion.get("default", "?").replace("word/", ""))
    ok("<a:blip" not in xml_1ra, "la carátula no repite el membrete",
       asignacion.get("first", "?").replace("word/", ""))
    ok("PAGE" in xml_def and "NUMPAGES" in xml_def,
       "«Página X de Y» usa campos automáticos, no texto fijo")

    # el logotipo del membrete debe ser el asset, no otra imagen del paquete
    ids = set(re.findall(r'r:embed="([^"]+)"', xml_def))
    rels = hdr_rels.get(
        asignacion.get("default", "").replace("word/", "word/_rels/") + ".rels", "")
    destinos = ["word/" + t for rid, t in
                re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', rels) if rid in ids]
    nombres_hdr = [en_assets.get(sha(medios[d])) for d in destinos if d in medios]
    ok(nombres_hdr == ["logo-header.png"],
       "el logotipo del membrete es assets/logo-header.png",
       ", ".join(n or "desconocida" for n in nombres_hdr) or "ninguna")

    # ── 5. citas en superíndice ───────────────────────────────────────────────
    sup = 0
    for run in doc.iter(W + "r"):
        pr = run.find(W + "rPr")
        if pr is None:
            continue
        va = pr.find(W + "vertAlign")
        if va is not None and va.get(W + "val") == "superscript":
            if re.match(r"^[\d,\s–-]+$",
                        "".join(t.text or "" for t in run.iter(W + "t"))):
                sup += 1
    ok(sup > 0, "las citas van en superíndice", "%d marcas" % sup)

    if fallos:
        print("\n  FALLA: %d comprobación(es). Corregir el generador y recompilar."
              % len(fallos))
        return 1
    print("  OK — todas las piezas institucionales están en su sitio.\n")
    return 0


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2
    return max(verificar(r) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
