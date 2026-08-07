#!/usr/bin/env python3
"""
verificar_revisora.py — Comprueba las observaciones que la revisora repite.

    python3 skill/scripts/verificar_revisora.py produccion/*/protocolo.jsonld

Las reglas no son inventadas: salen de los comentarios que la revisora de
protocolos dejó en la revisión del HECAM-MI-PR-001 del 16 al 20 de julio de
2026. De sus trece observaciones, cinco eran literalmente la misma frase sobre
las tablas, y varias más son comprobables sin criterio clínico. Este script las
convierte en comprobaciones para que no haya que volver a recibirlas.

Cada regla lleva anotado el comentario que la originó, de modo que si alguna
resulta discutible se pueda rastrear hasta su fuente y renegociarla con ella en
vez de borrarla del código.

Código de salida 0 si no hay hallazgos, 1 si los hay.
"""

import json
import os
import re
import sys

# ── reglas, con el comentario que las originó ────────────────────────────────

# «Colocar el número y título de la tabla así como la fuente correspondiente»
# (comentarios 8, 11, 12, 14 y 18: cinco veces la misma observación)
TITULO_TABLA = re.compile(r"^\s*Tabla\s*\d+\s*[.:]")

# «Colocar el nombre completo del servicio. Revisar en toda la tabla: Unidad
# Técnica de Medicina Interna, Unidad Técnica de Cuidados Intensivos etc.»
# (comentario 22)
ABREV_SERVICIO = re.compile(
    r"(?<![\w])(MI|UCI|UCIA|CC|EM|MDI|CE|PROA)(?![\w])")
# PROA aparece en el cuerpo como nombre propio del programa; se admite cuando va
# acompañado de su expansión o del guion institucional.
ADMITIDAS = re.compile(r"PROA[- ]HECAM|Programa de Optimización")

# «Tomar en cuenta el formato de cronograma establecido» (comentario 25)
CRONOGRAMA = ["Id", "Nombre de la tarea", "Comienzo", "Fin"]

# «Revisar esta numeración, en relación a que se encuentra ya que inicia en 5»
# (comentario 7): la numeración debe ser estructural, no escrita en el texto.
NUMERO_ESCRITO = re.compile(r"^\s*(\d{1,2})[.)]\s+\S")


def bloques_tabla(doc):
    """Tablas del documento, con su sección y si viven dentro de un anexo.

    Las de anexo se marcan porque toman el título del encabezado «Anexo N. …» y
    no necesitan además un «Tabla N.» propio; sí necesitan fuente. Y se recorre
    solo `contenido`, porque en un anexo las columnas y filas aparecen dos veces:
    dentro del bloque que se maqueta y al margen, para la plantilla.
    """
    out = []

    def walk(n, ruta, en_anexo):
        if isinstance(n, list):
            for x in n:
                walk(x, ruta, en_anexo)
        elif isinstance(n, dict):
            r = n.get("numeral") or n.get("name") or ruta
            if str(n.get("type", "")).startswith("Tabla"):
                out.append((r, n, en_anexo))
            dentro = en_anexo or n.get("type") == "Anexo"
            for k, v in n.items():
                if k in ("type", "columnas", "filas", "anchos", "centrados"):
                    continue
                walk(v, r, dentro)

    walk(doc.get("hasPart"), "?", False)
    return out


def textos_con_ruta(doc):
    out = []

    def walk(n, ruta):
        if isinstance(n, dict):
            r = n.get("numeral") or n.get("name") or ruta
            for k, v in n.items():
                if k in ("text", "itemListElement"):
                    if isinstance(v, str):
                        out.append((r, v))
                    elif isinstance(v, list):
                        out.extend((r, x) for x in v if isinstance(x, str))
                else:
                    walk(v, r)
        elif isinstance(n, list):
            for x in n:
                walk(x, ruta)

    walk(doc.get("hasPart"), "?")
    return out


def revisar(ruta):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    hallazgos = []

    def anota(regla, donde, detalle):
        hallazgos.append((regla, donde, detalle))

    # ── 1. Tablas: número, título y fuente ───────────────────────────────────
    for seccion, t, en_anexo in bloques_tabla(doc):
        titulo = t.get("titulo") or ""
        if not en_anexo and not TITULO_TABLA.match(titulo):
            anota("tabla-sin-numero", seccion,
                  "título %r; debe empezar por «Tabla N.»"
                  % (titulo[:60] or "(ninguno)"))
        if not t.get("fuente"):
            anota("tabla-sin-fuente", seccion,
                  "«%s» no declara fuente"
                  % (titulo[:60] or ("tabla del anexo" if en_anexo else "sin título")))

    # ── 2. Cronograma del Anexo 1 ────────────────────────────────────────────
    s8 = next((s for s in doc.get("hasPart", []) if s.get("numeral") == "8"), None)
    anexos = (s8 or {}).get("anexos") or []
    if anexos:
        cols = anexos[0].get("columnas") or []
        if cols[:4] != CRONOGRAMA:
            anota("cronograma", "8 / Anexo 1",
                  "columnas %s; el formato establecido empieza por %s más las "
                  "columnas de meses" % (cols[:4], CRONOGRAMA))

    # ── 3. Nombre completo del servicio ──────────────────────────────────────
    s6 = next((s for s in doc.get("hasPart", []) if s.get("numeral") == "6"), None)
    for i, ind in enumerate((s6 or {}).get("indicadores") or [], start=1):
        resp = ind.get("responsable") or ""
        if ADMITIDAS.search(resp):
            continue
        m = ABREV_SERVICIO.search(resp)
        if m:
            anota("servicio-abreviado", "6 / indicador %d" % i,
                  "responsable %r: escribir «Unidad Técnica de …» en vez de %r"
                  % (resp[:56], m.group(1)))

    # ── 4. Numeración escrita a mano ─────────────────────────────────────────
    vistos = {}
    for seccion, texto in textos_con_ruta(doc):
        m = NUMERO_ESCRITO.match(texto)
        if not m:
            continue
        n = int(m.group(1))
        primero = vistos.setdefault(seccion, n)
        if primero != 1:
            anota("numeracion-escrita", seccion,
                  "la enumeración empieza en %d; usar lista numerada en vez de "
                  "escribir el número en el texto" % primero)
            vistos[seccion] = 1  # no repetir el aviso por sección

    # ── 5. Cronograma: entre 8 y 10 actividades ──────────────────────────────
    # matriz-editorial.md, apartado 8: «8–10 actividades».
    if anexos:
        n_tareas = len(anexos[0].get("filas") or [])
        if n_tareas and not (8 <= n_tareas <= 10):
            anota("cronograma-tareas", "8 / Anexo 1",
                  "%d actividades; el formato pide entre 8 y 10" % n_tareas)

    # ── 6. Bibliografía: mínimo 15, habitualmente 18 ─────────────────────────
    n_refs = len(doc.get("citation") or [])
    if n_refs < 18:
        anota("bibliografia-corta", "7",
              "%d referencias; el mínimo es 15 y lo habitual 18" % n_refs)

    # ── 7. El índice debe repetir el nombre exacto de cada sección ───────────
    # La revisora coteja el contenido con los encabezados; una variante
    # cosmética en uno de los dos lados se ve a simple vista.
    por_numeral = {}
    for s in doc.get("hasPart", []):
        por_numeral[s.get("numeral")] = s.get("name")
        for sub in s.get("hasPart", []) or []:
            por_numeral[sub.get("numeral")] = sub.get("name")
    for e in doc.get("indice") or []:
        esperado = por_numeral.get(e.get("numeral"))
        if esperado and e.get("name") != esperado:
            anota("indice-divergente", e.get("numeral"),
                  "el contenido dice %r y la sección %r"
                  % (e.get("name", "")[:44], esperado[:44]))

    # ── 8. «Elaborado por»: cargo, no nombre ─────────────────────────────────
    # (comentario 29: «Colocar el cargo no el nombre»)
    for rol in doc.get("author") or []:
        p = rol.get("author") or {}
        if p.get("name") and not p.get("jobTitle"):
            anota("firma-sin-cargo", "9",
                  "«Elaborado por» lleva nombre sin cargo: %r" % p["name"])

    return doc, hallazgos


ETIQUETAS = {
    "tabla-sin-numero": "Tabla sin «Tabla N.» en el título",
    "tabla-sin-fuente": "Tabla sin fuente declarada",
    "cronograma": "Cronograma fuera del formato establecido",
    "servicio-abreviado": "Servicio abreviado en vez de nombre completo",
    "numeracion-escrita": "Numeración escrita en el texto",
    "cronograma-tareas": "Cronograma fuera del rango de 8–10 actividades",
    "indice-divergente": "El contenido no repite el nombre de la sección",
    "bibliografia-corta": "Bibliografía por debajo de lo habitual",
    "firma-sin-cargo": "«Elaborado por» sin cargo",
}


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2

    total = 0
    for ruta in rutas:
        doc, hallazgos = revisar(ruta)
        print("Revisando %s — %s" % (doc.get("identifier"), doc.get("name", "")[:44]))
        if not hallazgos:
            print("  OK — sin observaciones de las que la revisora repite.\n")
            continue

        por_regla = {}
        for regla, donde, detalle in hallazgos:
            por_regla.setdefault(regla, []).append((donde, detalle))
        for regla, items in por_regla.items():
            print("  %s  (%d)" % (ETIQUETAS.get(regla, regla), len(items)))
            for donde, detalle in items[:6]:
                print("      · [%s] %s" % (donde, detalle))
            if len(items) > 6:
                print("      … y %d más" % (len(items) - 6))
        print("  %d observación(es).\n" % len(hallazgos))
        total += len(hallazgos)

    if total:
        print("Total: %d observación(es) que la revisora marcaría." % total)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
