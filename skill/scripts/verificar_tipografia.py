#!/usr/bin/env python3
"""
verificar_tipografia.py — La letra del .docx contra el formato oficial.

    python3 skill/scripts/verificar_tipografia.py produccion/*/salida/*.docx

Ninguna capa comprobaba la tipografía: se daba por hecho que la biblioteca
componía en Arial porque así estaba escrito en cada llamada. Bastaba una celda
nueva sin `font:` para que Word la resolviera con su propio predeterminado
—Calibri— y el documento saliera con dos familias sin que nadie lo notara.

La especificación no se repite aquí: se lee de skill/reglas/formato.json, que a
su vez está extraído del HECAM-CC-FR-012 V3.0. Conviene recordar que el
«Times New Roman» del FR-012 vive en `w:cs` de docDefaults, que es el respaldo
de escritura compleja; la fuente del documento es la del estilo Normal, Arial.

Se revisan document.xml, los encabezados y styles.xml, porque una familia
intrusa en el membrete se ve en todas las páginas.

Código de salida 0 si la tipografía es conforme, 1 si no.
"""

import json
import os
import re
import sys
import zipfile

REGLAS = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "reglas", "formato.json")

FUENTE_RE = re.compile(r'w:ascii="([^"]+)"')
TAM_RE = re.compile(r'<w:sz w:val="(\d+)"')
# El respaldo de escritura compleja no es la fuente del documento; Word lo usa
# solo para alfabetos que Arial no cubre. Marcarlo sería un falso positivo.
CS_RE = re.compile(r'w:cs="([^"]+)"')


def partes(z):
    return [n for n in z.namelist()
            if re.fullmatch(r"word/(document|header\d*|footer\d*|styles)\.xml", n)]


def revisar(ruta, fmt):
    familia = fmt["tipografia"]["familia"]
    permitidos = set(fmt["tipografia"]["tamanosPermitidosHalfPoints"])
    fallos = []

    with zipfile.ZipFile(ruta) as z:
        for parte in partes(z):
            xml = z.read(parte).decode("utf-8")

            intrusas = {f for f in FUENTE_RE.findall(xml) if f != familia}
            if intrusas:
                fallos.append("%s: familia ajena %s; el formato manda %s"
                              % (parte, sorted(intrusas), familia))

            raros = {t for t in TAM_RE.findall(xml) if t not in permitidos}
            if raros:
                fallos.append("%s: cuerpo %s sin uso declarado en formato.json"
                              % (parte, sorted(raros, key=int)))

    print("Revisando %s" % os.path.basename(ruta))
    if not fallos:
        print("  OK — %s en todo el documento, cuerpos declarados.\n" % familia)
        return 0
    for f in fallos:
        print("  FALLA: %s" % f)
    print()
    return 1


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2
    with open(REGLAS, encoding="utf-8") as f:
        fmt = json.load(f)
    return max(revisar(r, fmt) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
