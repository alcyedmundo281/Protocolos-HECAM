#!/usr/bin/env python3
"""
check_citas.py — Verifica que las citas bibliográficas aparezcan en orden correlativo.

Acepta un .docx generado o un protocolo.jsonld.

    python3 check_citas.py salida.docx
    python3 check_citas.py protocolo.jsonld

En el .docx busca los runs con w:vertAlign="superscript".
En el .jsonld busca las marcas [[n]] recorriendo el cuerpo en orden documental.

Salida: orden de primera aparición, huecos, referencias no citadas, citas sin referencia.
Código de salida 0 si todo está correcto, 1 si hay problemas.
"""

import json
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
CITA_RE = re.compile(r"\[\[([\d,\s\u2013\u2014-]+)\]\]")
NUM_RE = re.compile(r"^\s*[\d,\s\u2013\u2014-]+\s*$")


def expandir(token):
    token = token.strip().replace("\u2013", "-").replace("\u2014", "-")
    if "-" in token:
        a, b = token.split("-", 1)
        try:
            return list(range(int(a.strip()), int(b.strip()) + 1))
        except ValueError:
            return []
    try:
        return [int(token)]
    except ValueError:
        return []


def parsear_grupo(texto):
    nums = []
    for tok in texto.split(","):
        nums.extend(expandir(tok))
    return nums


# ── extracción desde .docx ────────────────────────────────────────────────────

def citas_docx(ruta):
    secuencia = []
    n_runs = 0
    with zipfile.ZipFile(ruta) as z:
        partes = [n for n in z.namelist()
                  if n == "word/document.xml"
                  or (n.startswith("word/") and n.endswith(".xml")
                      and ("header" in n or "footer" in n))]
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    for run in root.iter(f"{W}r"):
        props = run.find(f"{W}rPr")
        if props is None:
            continue
        va = props.find(f"{W}vertAlign")
        if va is None or va.get(f"{W}val") != "superscript":
            continue
        texto = "".join(t.text or "" for t in run.iter(f"{W}t"))
        if not NUM_RE.match(texto):
            continue
        n_runs += 1
        secuencia.extend(parsear_grupo(texto))
    return secuencia, n_runs


def refs_docx(ruta):
    """Cuenta las entradas de bibliografía por el patrón 'N. ' al inicio de párrafo."""
    with zipfile.ZipFile(ruta) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    maximo = 0
    for p in root.iter(f"{W}p"):
        texto = "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
        m = re.match(r"^(\d{1,3})\.\s+\S", texto)
        if m and len(texto) > 30:
            maximo = max(maximo, int(m.group(1)))
    return maximo


# ── extracción desde .jsonld ──────────────────────────────────────────────────

def _walk(node, acc):
    """Recorre el JSON en orden documental acumulando el texto encontrado."""
    if isinstance(node, str):
        acc.append(node)
    elif isinstance(node, list):
        for x in node:
            _walk(x, acc)
    elif isinstance(node, dict):
        for k, v in node.items():
            if k in ("citation", "@context"):
                continue
            _walk(v, acc)


def citas_jsonld(ruta):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)
    textos = []
    _walk(doc.get("hasPart", []), textos)
    secuencia, n_marcas = [], 0
    for t in textos:
        for m in CITA_RE.finditer(t):
            n_marcas += 1
            secuencia.extend(parsear_grupo(m.group(1)))
    return secuencia, n_marcas, len(doc.get("citation", []))


# ── informe ───────────────────────────────────────────────────────────────────

def informe(secuencia, n_marcas, n_refs, fuente):
    print(f"Fuente: {fuente}")
    print(f"Marcas de cita encontradas: {n_marcas}")

    if not secuencia:
        print("ERROR: no se encontró ninguna cita.")
        return 1

    orden = []
    vistas = set()
    for n in secuencia:
        if n not in vistas:
            vistas.add(n)
            orden.append(n)

    print(f"Referencias distintas citadas: {len(orden)}")
    if n_refs:
        print(f"Entradas en la bibliografía: {n_refs}")
    print(f"Orden de primera aparición: {orden}")

    problemas = []
    esperado = list(range(1, len(orden) + 1))
    if orden != esperado:
        primera = next((i for i, (a, b) in enumerate(zip(orden, esperado)) if a != b), 0)
        problemas.append(
            f"El orden NO es correlativo. Primera discrepancia en la posición {primera + 1}: "
            f"aparece [{orden[primera]}] donde debería aparecer [{esperado[primera]}]."
        )

    if n_refs:
        citadas = set(orden)
        todas = set(range(1, n_refs + 1))
        huerfanas = sorted(todas - citadas)
        fantasmas = sorted(citadas - todas)
        if huerfanas:
            problemas.append(f"Referencias en la bibliografía nunca citadas: {huerfanas}")
        if fantasmas:
            problemas.append(f"Citas sin entrada en la bibliografía: {fantasmas}")

    print()
    if problemas:
        for p in problemas:
            print(f"  FALLA: {p}")
        print()
        print("Corregir reordenando la bibliografía en el JSON-LD y recompilar. "
              "No editar el .docx a mano.")
        return 1

    print(f"  OK: orden de aparición correlativo 1..{len(orden)}.")
    return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    ruta = sys.argv[1]
    if ruta.endswith(".docx"):
        secuencia, n_marcas = citas_docx(ruta)
        n_refs = refs_docx(ruta)
    elif ruta.endswith((".json", ".jsonld")):
        secuencia, n_marcas, n_refs = citas_jsonld(ruta)
    else:
        print("Formato no reconocido. Use un .docx o un .jsonld")
        return 2
    return informe(secuencia, n_marcas, n_refs, ruta)


if __name__ == "__main__":
    sys.exit(main())
