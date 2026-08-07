#!/usr/bin/env python3
"""
verificar_numeracion.py — Cada lista numerada debe empezar en 1.

    python3 skill/scripts/verificar_numeracion.py produccion/*/salida/*.docx

Word no guarda el número que muestra: lo calcula al abrir el documento a partir
del identificador de numeración de cada párrafo. Dos listas que comparten
identificador forman una sola a ojos de Word, de modo que la segunda continúa la
cuenta de la primera y empieza en 5, o en 9, en vez de en 1. Es el error que la
revisora marcó con «Revisar esta numeración… ya que inicia en 5», y no se ve en
el texto: hay que leer el XML.

El script agrupa los párrafos numerados en series consecutivas y comprueba que
ninguna comparta identificador con otra. Los números escritos a mano dentro del texto los detecta
verificar_revisora.py, que sabe distinguirlos de los encabezados y de la
bibliografía, numerados por diseño.

Código de salida 0 si la numeración es correcta, 1 si no.
"""

import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def texto(p):
    return " ".join("".join(t.text or "" for t in p.iter(W + "t")).split())


def numid(p):
    pr = p.find(W + "pPr")
    if pr is None:
        return None
    npr = pr.find(W + "numPr")
    if npr is None:
        return None
    el = npr.find(W + "numId")
    return el.get(W + "val") if el is not None else None


def revisar(ruta):
    with zipfile.ZipFile(ruta) as z:
        cuerpo = ET.fromstring(z.read("word/document.xml")).find(W + "body")
        numbering = z.read("word/numbering.xml").decode("utf-8") \
            if "word/numbering.xml" in z.namelist() else ""

    # qué identificadores son de lista numerada y no de viñeta
    decimales = set()
    if numbering:
        raiz = ET.fromstring(numbering)
        abstractos = {}
        for a in raiz.iter(W + "abstractNum"):
            fmt = a.find(".//" + W + "numFmt")
            abstractos[a.get(W + "abstractNumId")] = (
                fmt.get(W + "val") if fmt is not None else "")
        for n in raiz.iter(W + "num"):
            ref = n.find(W + "abstractNumId")
            if ref is not None and abstractos.get(ref.get(W + "val")) == "decimal":
                decimales.add(n.get(W + "numId"))

    series, actual = [], None
    for p in cuerpo.iter(W + "p"):
        nid = numid(p)
        t = texto(p)
        if nid and nid in decimales:
            if actual and actual["numId"] == nid:
                actual["n"] += 1
            else:
                actual = {"numId": nid, "n": 1, "primero": t[:60]}
                series.append(actual)
        else:
            actual = None

    print("Verificando %s" % os.path.basename(ruta))
    print("  listas numeradas: %d" % len(series))

    problemas = []
    usados = {}
    for s in series:
        usados.setdefault(s["numId"], []).append(s)
    for nid, grupos in usados.items():
        if len(grupos) > 1:
            arranque = 1
            for k, gr in enumerate(grupos):
                if k:
                    problemas.append(
                        "la lista «%s…» continúa la numeración anterior y "
                        "empieza en %d" % (gr["primero"][:46], arranque))
                arranque += gr["n"]

    if not problemas:
        print("  OK — cada lista empieza en 1.\n")
        return 0
    print("  FALLA: %d problema(s)" % len(problemas))
    for p in problemas:
        print("      · %s" % p)
    print("  Las listas no deben heredar la numeración de la anterior.\n")
    return 1


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2
    return max(revisar(r) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
