#!/usr/bin/env python3
"""
validate_jsonld.py — Comprueba que el protocolo.jsonld cumple la normativa HECAM
antes de compilar cualquier salida.

    python3 validate_jsonld.py protocolo.jsonld

Código de salida 0 si pasa, 1 si hay errores. Los avisos no bloquean.
"""

import json
import re
import sys

SECCIONES = [
    ("1", "Justificación"),
    ("2", "Objetivos"),
    ("3", "Glosario de términos / Abreviaciones"),
    ("4", "Procedimiento (Plan de Acción/Actuación)"),
    ("5", "Algoritmo de actuación"),
    ("6", "Indicadores"),
    ("7", "Bibliografía"),
    ("8", "Anexos"),
    ("9", "Firmas de los involucrados"),
    ("10", "Control de cambios"),
]

SUBSECCIONES = [
    ("4.1", "Evaluación inicial del paciente"),
    ("4.2", "Diagnóstico / Identificación de problemas basados en las necesidades"),
    ("4.3", "Plan Terapéutico / Intervenciones no farmacológicas"),
    ("4.4", "Clasificación de severidad / Manejo de Complicaciones"),
    ("4.5", "Plan de Egreso de la Unidad/Seguimiento / Evaluación integral"),
    ("4.6", "Nivel de evidencia y grado de recomendaciones"),
]

REVISORES = [
    "Coordinador General de Investigación",
    "Coordinador General de Control de Calidad",
    "Coordinador General de Hospitalización y Ambulatorio",
    "Coordinador General de Áreas Críticas",
    "Coordinador General de Diagnóstico y Tratamiento",
    "Jefe de Áreas Clínicas (Presidente PROA)",
    "Jefe de la Unidad de Cuidados Intensivos Adultos",
]

COLS_INDICADOR = ["name", "definicionIndicador", "calculo", "meta", "periodo", "responsable"]
CALIFICATIVOS = ["mejor", "óptimo", "optimo", "adecuado", "malo", "peor", "excelente", "ideal"]

CITA_RE = re.compile(r"\[\[([\d,\s\u2013\u2014-]+)\]\]")

errores, avisos = [], []


def err(m):
    errores.append(m)


def avi(m):
    avisos.append(m)


def g(o, *ks, default=None):
    if not isinstance(o, dict):
        return default
    for c in ks:
        for k in (c, f"hecam:{c}", f"schema:{c}"):
            if k in o:
                return o[k]
    return default


def secs_planas(doc):
    out = {}
    for s in doc.get("hasPart", []) or []:
        out[str(g(s, "numeral", default=""))] = s
        for sub in g(s, "hasPart", default=[]) or []:
            out[str(g(sub, "numeral", default=""))] = sub
    return out


def texto_completo(node, acc):
    if isinstance(node, str):
        acc.append(node)
    elif isinstance(node, list):
        for x in node:
            texto_completo(x, acc)
    elif isinstance(node, dict):
        for k, v in node.items():
            if k in ("citation", "@context"):
                continue
            texto_completo(v, acc)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    ruta = sys.argv[1]
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    # ── metadatos ────────────────────────────────────────────────────────────
    ident = g(doc, "identifier", default="")
    if not ident:
        err("Falta 'identifier'.")
    elif not re.match(r"^HECAM-[A-Za-z]{2}-PR-[\dx]{3}$", ident):
        avi(f"'identifier' = {ident!r} no sigue el patrón HECAM-XX-PR-###.")
    if "x" in ident and not g(doc, "codigoProvisional"):
        avi("El código parece provisional pero 'codigoProvisional' no está en true. "
            "Advertir al usuario de que el SGD aún debe asignarlo.")

    titulo = g(doc, "name", default="")
    if not titulo:
        err("Falta 'name' (título del protocolo).")
    elif len(titulo.split()) > 15:
        err(f"El título tiene {len(titulo.split())} palabras; el máximo normativo es 15.")

    if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(g(doc, "dateCreated", default=""))):
        err("'dateCreated' debe estar en formato AAAA-MM-DD.")
    for campo in ("version", "unidadTecnica", "mesAnioPortada"):
        if not g(doc, campo):
            err(f"Falta '{campo}'.")

    # ── secciones ────────────────────────────────────────────────────────────
    planas = secs_planas(doc)
    for num, nombre in SECCIONES + SUBSECCIONES:
        s = planas.get(num)
        if s is None:
            err(f"Falta la sección {num} — {nombre}.")
        elif g(s, "name", default="").strip() != nombre:
            err(f"Sección {num}: el título es {g(s, 'name', default='')!r}; "
                f"debe ser exactamente {nombre!r}.")

    # 1 Justificación
    s1 = planas.get("1")
    if s1:
        t = []
        texto_completo(g(s1, "contenido", default=[]), t)
        n = len(CITA_RE.sub("", " ".join(t)).split())
        if n and not (300 <= n <= 500):
            err(f"Justificación: {n} palabras. El rango normativo es 300–500.")

    # 2 Objetivos
    s2 = planas.get("2")
    if s2:
        og = g(s2, "objetivoGeneral", default="") or ""
        if not og:
            err("Falta el objetivo general.")
        for c in CALIFICATIVOS:
            if re.search(rf"\b{c}\b", og, re.I):
                err(f"El objetivo general contiene el adjetivo calificativo {c!r}, prohibido por normativa.")
        oes = g(s2, "objetivosEspecificos", default=[]) or []
        if len(oes) > 4:
            err(f"Hay {len(oes)} objetivos específicos; el máximo es 4.")
        if not oes:
            err("Faltan los objetivos específicos.")

    # 3 Glosario
    s3 = planas.get("3")
    if s3:
        gl = g(s3, "glosario", default=[]) or []
        ab = g(s3, "abreviaciones", default=[]) or []
        if not (10 <= len(gl) <= 12):
            avi(f"Glosario con {len(gl)} términos; lo esperado es 10–12.")
        if not (6 <= len(ab) <= 8):
            avi(f"{len(ab)} abreviaciones; lo esperado es 6–8.")

    # 4.x Quién / Cuándo
    for num, _ in SUBSECCIONES[:5]:
        s = planas.get(num)
        if s and not (g(s, "quienLoHace") and g(s, "cuando")):
            err(f"Sección {num}: faltan 'quienLoHace' y/o 'cuando'.")

    # 4.3 elementos obligatorios del tratamiento farmacológico
    s43 = planas.get("4.3")
    if s43:
        t = []
        texto_completo(s43, t)
        blob = " ".join(t).lower()
        for palabra, etiqueta in [("duración", "duración del tratamiento"),
                                  ("suspensión", "criterios de suspensión"),
                                  ("inclusión", "criterios de inclusión"),
                                  ("exclusión", "criterios de exclusión")]:
            if palabra not in blob:
                err(f"Sección 4.3: no se menciona {etiqueta} (obligatorio).")

    # 5 nota Bizagi
    s5 = planas.get("5")
    if s5:
        t = []
        texto_completo(s5, t)
        if "bizagi" not in " ".join(t).lower():
            err("Sección 5: falta la nota obligatoria sobre el diagrama en Bizagi.")

    # 6 Indicadores
    s6 = planas.get("6")
    if s6:
        inds = g(s6, "indicadores", default=[]) or []
        if len(inds) < 8:
            err(f"Hay {len(inds)} indicadores; el mínimo es 8 (≥2 por tipo).")
        tipos = {}
        for i, ind in enumerate(inds, 1):
            for c in COLS_INDICADOR:
                if not g(ind, c):
                    err(f"Indicador {i}: falta '{c}'.")
            calc = g(ind, "calculo", default="")
            if calc and "/" not in calc:
                err(f"Indicador {i}: 'calculo' debe expresarse como fórmula numerador/denominador.")
            t = (g(ind, "tipoIndicador", default="") or "").lower()
            tipos[t] = tipos.get(t, 0) + 1
        for t in ("diagnóstico", "seguimiento", "tratamiento", "resultado"):
            if tipos.get(t, 0) < 2:
                err(f"Solo hay {tipos.get(t, 0)} indicador(es) de tipo '{t}'; se requieren al menos 2.")

    # 8 Anexos
    s8 = planas.get("8")
    if s8:
        anexos = g(s8, "anexos", default=[]) or []
        if len(anexos) < 3:
            err(f"Hay {len(anexos)} anexos; el formato vigente requiere 3.")
        if anexos and "cronograma" not in (g(anexos[0], "name", default="") or "").lower():
            err("El Anexo 1 debe ser el Cronograma de implementación.")

    # 10 Control de cambios
    s10 = planas.get("10")
    if s10 and not (g(s10, "controlCambios", default=[]) or []):
        err("Sección 10: falta al menos una fila de control de cambios.")

    # ── roles y firmas ───────────────────────────────────────────────────────
    autores = doc.get("author") or []
    if not autores:
        err("Falta al menos un autor en 'author' (bloque «Elaborado por»).")
    for a in (autores if isinstance(autores, list) else [autores]):
        p = g(a, "author", default={}) or {}
        if not g(p, "name") or not g(p, "jobTitle"):
            err("Cada autor requiere 'name' y 'jobTitle' (nombres, titulación y cargo).")

    if not g(doc, "revisionEditorial"):
        err("Falta 'revisionEditorial' (rol de la revisora de protocolos).")
    else:
        reglas = g(g(doc, "revisionEditorial"), "reglasVigentes", default={}) or {}
        if not g(reglas, "citasEnSuperindice"):
            err("'revisionEditorial.reglasVigentes.citasEnSuperindice' debe ser true.")
        if not g(reglas, "bibliografiaOrdenAparicion"):
            err("'revisionEditorial.reglasVigentes.bibliografiaOrdenAparicion' debe ser true.")

    contribs = doc.get("contributor") or []
    cargos = [g(g(c, "contributor", default={}) or {}, "jobTitle", default="") for c in contribs]
    if "Director Técnico" not in cargos:
        err("Falta el Director Técnico en el bloque «Aprobado por».")
    for r in REVISORES:
        if r not in cargos:
            err(f"Falta el revisor institucional: {r}.")

    # ── bibliografía y citas ─────────────────────────────────────────────────
    refs = doc.get("citation") or []
    if len(refs) < 15:
        err(f"Hay {len(refs)} referencias; el mínimo normativo es 15.")
    for i, r in enumerate(refs, 1):
        if not g(r, "vancouver"):
            err(f"Referencia {i}: falta el campo 'vancouver'.")
        pos = g(r, "position")
        if pos is not None and int(pos) != i:
            err(f"Referencia en la posición {i} declara position={pos}. Deben coincidir.")

    t = []
    texto_completo(doc.get("hasPart", []), t)
    citadas = set()
    for txt in t:
        for m in CITA_RE.finditer(txt):
            for tok in m.group(1).split(","):
                tok = tok.strip().replace("\u2013", "-").replace("\u2014", "-")
                if "-" in tok:
                    a, b = tok.split("-", 1)
                    try:
                        citadas.update(range(int(a), int(b) + 1))
                    except ValueError:
                        pass
                else:
                    try:
                        citadas.add(int(tok))
                    except ValueError:
                        pass
    if refs:
        fantasmas = sorted(n for n in citadas if n > len(refs))
        if fantasmas:
            err(f"Citas sin entrada en la bibliografía: {fantasmas}")
        huerfanas = sorted(set(range(1, len(refs) + 1)) - citadas)
        if huerfanas:
            avi(f"Referencias nunca citadas en el cuerpo: {huerfanas}")

    # ── placeholders ─────────────────────────────────────────────────────────
    crudo = json.dumps(doc, ensure_ascii=False)
    n_ph = crudo.count("{{")
    if n_ph:
        err(f"Quedan {n_ph} marcadores '{{{{...}}}}' sin rellenar.")

    # ── informe ──────────────────────────────────────────────────────────────
    print(f"Validación de {ruta}\n")
    for m in errores:
        print(f"  ERROR  {m}")
    for m in avisos:
        print(f"  aviso  {m}")
    print()
    if errores:
        print(f"{len(errores)} error(es), {len(avisos)} aviso(s). No compilar todavía.")
        return 1
    print(f"Sin errores. {len(avisos)} aviso(s). Listo para compilar.")
    print("Siguiente paso: generar el .docx y ejecutar check_citas.py sobre el resultado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
