#!/usr/bin/env python3
"""
verificar_fuentes_docx.py — Número, título y fuente de cada tabla del .docx.

    python3 skill/scripts/verificar_fuentes_docx.py produccion/*/salida/*.docx

Se comprueba sobre el .docx y no sobre la matriz a propósito: hay tablas que el
compilador genera y que la matriz no describe —el glosario, las abreviaciones,
los indicadores—, de modo que revisar solo la matriz las deja fuera. La revisora
las ve todas.

Para cada tabla se busca, en los párrafos inmediatamente siguientes, uno que
empiece por «Fuente:». Se exceptúan las tablas que son parte del formulario y no
contenido: las firmas y el control de cambios.

Código de salida 0 si todas la declaran, 1 si falta alguna.
"""

import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Tablas que forman parte del formulario, no del contenido clínico
ESTRUCTURALES = re.compile(
    r"Aprobado por|Revisado por|Elaborado por|No\.\s*Versión|"
    r"Descripción del Cambio", re.I)

FUENTE = re.compile(r"^\s*Fuente\s*:", re.I)
NUMERO = re.compile(r"^\s*Tabla\s*(\d+)\s*[.:]")
ANEXOS = re.compile(r"^\s*8\s*[.．]\s*Anexos\s*$")


def texto(nodo):
    return " ".join("".join(t.text or "" for t in nodo.iter(W + "t")).split())


def revisar(ruta):
    with zipfile.ZipFile(ruta) as z:
        cuerpo = ET.fromstring(z.read("word/document.xml")).find(W + "body")

    hijos = list(cuerpo)
    faltan, total, exentas, numeros = [], 0, 0, []

    en_anexos = False
    for i, hijo in enumerate(hijos):
        if hijo.tag == W + "p":
            # a partir del encabezado de la sección 8, las tablas son de anexo y
            # toman su título del «Anexo N. …» que las precede
            if ANEXOS.match(texto(hijo)):
                en_anexos = True
            continue
        if hijo.tag != W + "tbl":
            continue
        contenido = texto(hijo)
        if ESTRUCTURALES.search(contenido[:220]):
            exentas += 1
            continue
        total += 1

        # el encabezado que la precede, para poder nombrarla en el informe
        titulo = ""
        for j in range(i - 1, max(-1, i - 4), -1):
            if hijos[j].tag == W + "p":
                t = texto(hijos[j])
                if t:
                    titulo = t
                    break

        # ¿hay un «Fuente:» en los párrafos que la siguen?
        tiene = False
        for j in range(i + 1, min(len(hijos), i + 4)):
            if hijos[j].tag == W + "tbl":
                break
            if hijos[j].tag == W + "p":
                t = texto(hijos[j])
                if FUENTE.match(t):
                    tiene = True
                    break
                if t and not t.startswith("■"):
                    # un párrafo de contenido cierra la ventana de búsqueda,
                    # salvo la leyenda del semáforo, que va entre medias
                    break
        if not tiene:
            faltan.append(titulo or contenido[:70])
        if not en_anexos:
            numeros.append((titulo, NUMERO.match(titulo or "")))

    print("Verificando %s" % os.path.basename(ruta))
    print("  tablas de contenido: %d | exentas por ser del formulario: %d"
          % (total, exentas))

    problemas = []
    for t, m in numeros:
        if not m:
            problemas.append("sin «Tabla N.»: %s" % (t[:70] or "(sin título)"))
    # la numeración debe ser consecutiva desde 1
    vistos = [int(m.group(1)) for _, m in numeros if m]
    if vistos and vistos != list(range(1, len(vistos) + 1)):
        problemas.append("numeración no consecutiva: %s" % vistos)

    for f in faltan:
        problemas.append("sin «Fuente:»: %s" % f[:70])

    if not problemas:
        print("  OK — todas numeradas, tituladas y con su fuente.\n")
        return 0
    print("  FALLA: %d problema(s)" % len(problemas))
    for p in problemas:
        print("      · %s" % p)
    print("  Toda tabla lleva número, título y fuente o «Elaboración propia».\n")
    return 1


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2
    return max(revisar(r) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
