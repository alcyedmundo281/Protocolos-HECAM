#!/usr/bin/env python3
"""
renumerar_citas.py — Reordena la bibliografía por orden de aparición.

    python3 skill/scripts/renumerar_citas.py produccion/X/protocolo.jsonld

La regla 2 de la revisora —«la bibliografía se ordena por aparición»— convierte
cualquier cita nueva en el medio del documento en una renumeración completa. A
mano es inviable y es exactamente la clase de error que ella detecta.

El recorrido documental se toma de check_citas.py, que es quien verifica el
resultado: si el renumerado usara un orden propio, se estaría examinando a sí
mismo. Aquí se reutiliza `_walk`, el mismo que hoy concuerda con el .docx
compilado.

Los marcadores se reescriben cadena a cadena, nunca sobre el JSON serializado:
ahí un array de arrays abre con «[[» y una expresión regular ingenua lo
confunde con una cita.

Se conservan los grupos: `[[6,7]]` se renumera como grupo, no se descompone.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_citas import _walk, parsear_grupo  # noqa: E402

CITA_RE = re.compile(r"\[\[([\d,\s–—-]+)\]\]")


def orden_de_aparicion(doc):
    """Los números de referencia en el orden en que se citan por primera vez."""
    textos = []
    _walk(doc.get("hasPart", []), textos)
    visto, orden = set(), []
    for t in textos:
        for m in CITA_RE.finditer(t):
            for n in parsear_grupo(m.group(1)):
                if n not in visto:
                    visto.add(n)
                    orden.append(n)
    return orden


def reescribir(nodo, mapa):
    """Devuelve el nodo con cada marcador traducido según `mapa`."""
    if isinstance(nodo, str):
        def sub(m):
            nums = parsear_grupo(m.group(1))
            return "[[%s]]" % ",".join(str(mapa.get(n, n)) for n in nums)
        return CITA_RE.sub(sub, nodo)
    if isinstance(nodo, list):
        return [reescribir(x, mapa) for x in nodo]
    if isinstance(nodo, dict):
        return {k: (v if k == "citation" else reescribir(v, mapa))
                for k, v in nodo.items()}
    return nodo


def renumerar(ruta, verboso=True):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    orden = orden_de_aparicion(doc)
    citas = {c["position"]: c for c in doc.get("citation", [])}

    huerfanas = [n for n in orden if n not in citas]
    if huerfanas:
        print("  ERROR: se citan %s sin entrada bibliográfica" % huerfanas)
        return 1
    sin_citar = [n for n in citas if n not in orden]
    if sin_citar:
        print("  ERROR: las referencias %s no se citan en ninguna parte"
              % sorted(sin_citar))
        return 1

    mapa = {viejo: nuevo for nuevo, viejo in enumerate(orden, start=1)}
    if all(k == v for k, v in mapa.items()):
        if verboso:
            print("  ya estaban en orden; nada que renumerar.")
        return 0

    # El cuerpo primero, con el mapa completo; después las entradas.
    doc["hasPart"] = reescribir(doc["hasPart"], mapa)
    nuevas = []
    for viejo in orden:
        c = dict(citas[viejo])
        c["position"] = mapa[viejo]
        nuevas.append(c)
    doc["citation"] = nuevas

    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    if verboso:
        movidas = [(v, n) for v, n in sorted(mapa.items()) if v != n]
        print("  renumeradas %d de %d referencias" % (len(movidas), len(mapa)))
        for v, n in movidas:
            print("      %2d → %2d  %s" % (v, n, citas[v].get("name", "")[:52]))
    return 0


def main():
    rutas = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not rutas:
        print(__doc__)
        return 2
    peor = 0
    for r in rutas:
        print("Renumerando %s" % os.path.basename(os.path.dirname(r)))
        peor = max(peor, renumerar(r))
    return peor


if __name__ == "__main__":
    sys.exit(main())
