#!/usr/bin/env python3
"""
build_jats.py — Convierte el protocolo.jsonld (única fuente de verdad) en JATS 1.3 XML.

Uso:
    python3 build_jats.py protocolo.jsonld -o protocolo.jats.xml

Mapeo completo en references/mapeo-jats.md
"""

import argparse
import json
import re
import sys
from datetime import date
from xml.sax.saxutils import escape

JATS_DOCTYPE = (
    '<!DOCTYPE article PUBLIC '
    '"-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3 20210610//EN" '
    '"https://jats.nlm.nih.gov/archiving/1.3/JATS-archivearticle1-3.dtd">'
)

CITA_RE = re.compile(r"\[\[([\d,\s\u2013\u2014-]+)\]\]")
BOLD_RE = re.compile(r"\*\*([^*]+)\*\*")
ITAL_RE = re.compile(r"__([^_]+)__")


# ── utilidades ────────────────────────────────────────────────────────────────

def esc(s):
    return escape(str(s if s is not None else ""))


def expandir_rango(token):
    """'3-6' o '3–6' → [3,4,5,6];  '7' → [7]"""
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


def inline(texto):
    """Convierte el marcado interno a JATS inline.

    [[n]]      → <sup><xref ref-type="bibr" rid="ref-n">n</xref></sup>
    **texto**  → <bold>
    __texto__  → <italic>
    """
    if texto is None:
        return ""
    out = []
    pos = 0
    for m in CITA_RE.finditer(texto):
        out.append(_marcas(esc(texto[pos:m.start()])))
        nums = []
        for tok in m.group(1).split(","):
            nums.extend(expandir_rango(tok))
        xrefs = "".join(
            f'<xref ref-type="bibr" rid="ref-{n}">{n}</xref>'
            + ("," if i < len(nums) - 1 else "")
            for i, n in enumerate(nums)
        )
        out.append(f"<sup>{xrefs}</sup>")
        pos = m.end()
    out.append(_marcas(esc(texto[pos:])))
    return "".join(out)


def _marcas(s):
    s = BOLD_RE.sub(r"<bold>\1</bold>", s)
    s = ITAL_RE.sub(r"<italic>\1</italic>", s)
    return s


def partir_nombre(nombre):
    """'Dr. Juan Pérez Rodríguez' → ('Pérez Rodríguez', 'Juan'). Heurística simple."""
    if not nombre:
        return ("", "")
    partes = [p for p in nombre.replace(",", " ").split() if not p.endswith(".")]
    if len(partes) == 1:
        return (partes[0], "")
    if len(partes) == 2:
        return (partes[1], partes[0])
    corte = len(partes) - 2
    return (" ".join(partes[corte:]), " ".join(partes[:corte]))


def g(obj, *claves, default=None):
    """Lee una clave probando el alias corto y el prefijado."""
    if not isinstance(obj, dict):
        return default
    for c in claves:
        for k in (c, f"hecam:{c}", f"schema:{c}"):
            if k in obj:
                return obj[k]
    return default


# ── bloques de contenido ──────────────────────────────────────────────────────

def render_contenido(items, ind="      "):
    out = []
    for it in items or []:
        t = it.get("type") or it.get("@type") or ""
        t = t if isinstance(t, str) else (t[0] if t else "")
        t = t.split(":")[-1]

        if t == "Parrafo":
            out.append(f"{ind}<p>{inline(g(it, 'text'))}</p>")

        elif t == "Nota":
            out.append(
                f'{ind}<boxed-text content-type="nota">'
                f"<p>{inline(g(it, 'text'))}</p></boxed-text>"
            )

        elif t == "Lista":
            estilo = g(it, "estilo", default="vinetas")
            tipo = "order" if estilo in ("numerada", "numeros") else "bullet"
            out.append(f'{ind}<list list-type="{tipo}">')
            for li in g(it, "itemListElement", default=[]) or []:
                txt = li if isinstance(li, str) else g(li, "text", default="")
                out.append(f"{ind}  <list-item><p>{inline(txt)}</p></list-item>")
            out.append(f"{ind}</list>")

        elif t in ("Tabla", "TablaResistencia"):
            out.extend(render_tabla(it, ind))

    return out


def render_tabla(tab, ind="      "):
    cols = g(tab, "columnas", default=[]) or []
    filas = g(tab, "filas", default=[]) or []
    titulo = g(tab, "titulo")
    fuente = g(tab, "fuente")

    out = [f'{ind}<table-wrap>']
    if titulo:
        out.append(f"{ind}  <caption><title>{inline(titulo)}</title></caption>")
    out.append(f"{ind}  <table>")
    if cols:
        out.append(f"{ind}    <thead><tr>")
        for c in cols:
            out.append(f"{ind}      <th>{inline(c)}</th>")
        out.append(f"{ind}    </tr></thead>")
    out.append(f"{ind}    <tbody>")
    for fila in filas:
        out.append(f"{ind}      <tr>")
        for celda in fila:
            out.append(f"{ind}        <td>{inline(celda)}</td>")
        out.append(f"{ind}      </tr>")
    out.append(f"{ind}    </tbody>")
    out.append(f"{ind}  </table>")
    if fuente:
        out.append(f'{ind}  <table-wrap-foot><fn><p>Fuente: {inline(fuente)}</p></fn></table-wrap-foot>')
    out.append(f"{ind}</table-wrap>")
    return out


# ── secciones especiales ──────────────────────────────────────────────────────

def render_seccion(sec, nivel=0):
    ind = "    " + "  " * nivel
    numeral = g(sec, "numeral", default="")
    sid = "sec-" + str(numeral).replace(".", "-")
    stype = g(sec, "secType")
    attr = f' sec-type="{esc(stype)}"' if stype else ""

    out = [f'{ind}<sec id="{esc(sid)}"{attr}>']
    if numeral:
        out.append(f"{ind}  <label>{esc(numeral)}</label>")
    out.append(f"{ind}  <title>{esc(g(sec, 'name', default=''))}</title>")

    quien = g(sec, "quienLoHace")
    cuando = g(sec, "cuando")
    if quien:
        out.append(f"{ind}  <p><bold>Quién lo hace:</bold> {inline(quien)}</p>")
    if cuando:
        out.append(f"{ind}  <p><bold>Cuándo:</bold> {inline(cuando)}</p>")

    # Objetivos
    og = g(sec, "objetivoGeneral")
    if og:
        out.append(f'{ind}  <sec id="{sid}-general"><title>Objetivo General</title>')
        out.append(f"{ind}    <p>{inline(og)}</p></sec>")
    oes = g(sec, "objetivosEspecificos")
    if oes:
        out.append(f'{ind}  <sec id="{sid}-especificos"><title>Objetivos Específicos</title>')
        out.append(f'{ind}    <list list-type="order">')
        for o in oes:
            out.append(f"{ind}      <list-item><p>{inline(o)}</p></list-item>")
        out.append(f"{ind}    </list></sec>")

    # Glosario / abreviaciones
    glos = g(sec, "glosario")
    if glos:
        out.extend(render_tabla({
            "titulo": "Glosario de términos",
            "columnas": ["TÉRMINO", "DEFINICIÓN"],
            "filas": [[f"**{g(e,'termino',default='')}**", g(e, "definicion", default="")] for e in glos],
        }, ind + "  "))
    abrev = g(sec, "abreviaciones")
    if abrev:
        out.extend(render_tabla({
            "titulo": "Abreviaciones",
            "columnas": ["ABREVIACIÓN", "SIGNIFICADO"],
            "filas": [[g(e, "sigla", default=""), g(e, "significado", default="")] for e in abrev],
        }, ind + "  "))

    # Indicadores
    inds = g(sec, "indicadores")
    if inds:
        filas = [[
            g(i, "name", default=""),
            g(i, "definicionIndicador", default=""),
            g(i, "calculo", default=""),
            g(i, "meta", default=""),
            g(i, "periodo", default=""),
            g(i, "responsable", default=""),
        ] for i in inds]
        out.extend(render_tabla({
            "columnas": ["Nombre Indicador", "Definición", "Cálculo", "Meta", "Periodo", "Responsable"],
            "filas": filas,
        }, ind + "  "))

    # Anexos
    anexos = g(sec, "anexos")
    if anexos:
        for a in anexos:
            pos = g(a, "position", default="")
            out.append(f'{ind}  <sec id="{sid}-anexo-{pos}" sec-type="anexo">')
            out.append(f"{ind}    <label>Anexo {esc(pos)}</label>")
            out.append(f"{ind}    <title>{esc(g(a, 'name', default=''))}</title>")
            if g(a, "columnas"):
                out.extend(render_tabla(a, ind + "    "))
            out.extend(render_contenido(g(a, "contenido"), ind + "    "))
            out.append(f"{ind}  </sec>")

    # Control de cambios
    cc = g(sec, "controlCambios")
    if cc:
        filas = [[
            g(c, "version", default=""),
            g(c, "dateCreated", default=""),
            g(c, "descripcionCambio", default=""),
        ] for c in cc]
        out.extend(render_tabla({
            "columnas": ["No. Versión", "Fecha", "Descripción del Cambio"],
            "filas": filas,
        }, ind + "  "))

    out.extend(render_contenido(g(sec, "contenido"), ind + "  "))

    for sub in g(sec, "hasPart", default=[]) or []:
        out.extend(render_seccion(sub, nivel + 1))

    out.append(f"{ind}</sec>")
    return out


# ── contribuyentes ────────────────────────────────────────────────────────────

def render_contrib(rol, contrib_type, role_ctype):
    persona = g(rol, "author") or g(rol, "contributor") or {}
    if isinstance(persona, list):
        persona = persona[0] if persona else {}
    nombre = g(persona, "name")
    cargo = g(persona, "jobTitle")
    afil = g(persona, "worksFor") or g(persona, "memberOf") or {}
    afil_nombre = g(afil, "name") if isinstance(afil, dict) else None

    out = [f'      <contrib contrib-type="{contrib_type}">']
    if nombre and "{{" not in str(nombre):
        ap, nom = partir_nombre(nombre)
        out.append(f"        <name><surname>{esc(ap)}</surname>"
                   f"<given-names>{esc(nom)}</given-names></name>")
    etiqueta = cargo or g(rol, "roleName", default="")
    out.append(f'        <role content-type="{role_ctype}">{esc(etiqueta)}</role>')
    if afil_nombre:
        out.append(f"        <aff><institution>{esc(afil_nombre)}</institution></aff>")
    out.append("      </contrib>")
    return out


def slug_role(s):
    s = (s or "").lower()
    s = re.sub(r"[áàä]", "a", s)
    s = re.sub(r"[éèë]", "e", s)
    s = re.sub(r"[íìï]", "i", s)
    s = re.sub(r"[óòö]", "o", s)
    s = re.sub(r"[úùü]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "rol"


# ── documento ─────────────────────────────────────────────────────────────────

def build(doc):
    ident = g(doc, "identifier", default="HECAM-xx-PR-xxx")
    titulo = g(doc, "name", default="")
    unidad = g(doc, "unidadTecnica", default="")
    version = g(doc, "version", default="1")
    fecha = str(g(doc, "dateCreated", default=date.today().isoformat()))
    estado = g(doc, "estado", default="borrador")
    desc = g(doc, "description", default="")
    pub = g(doc, "publisher", default={}) or {}
    lang = g(doc, "inLanguage", default="es-EC")

    L = ['<?xml version="1.0" encoding="UTF-8"?>', JATS_DOCTYPE]
    L.append('<article xmlns:xlink="http://www.w3.org/1999/xlink"')
    L.append('         dtd-version="1.3"')
    L.append('         article-type="clinical-guideline"')
    L.append(f'         xml:lang="{esc(lang.split("-")[0])}">')

    # front
    L.append("  <front>")
    L.append("    <journal-meta>")
    L.append('      <journal-id journal-id-type="publisher">HECAM-PROTOCOLOS</journal-id>')
    L.append("      <journal-title-group>")
    L.append("        <journal-title>Protocolos Clínicos del Hospital de Especialidades "
             "Carlos Andrade Marín</journal-title>")
    L.append("        <abbrev-journal-title>HECAM Protoc Clin</abbrev-journal-title>")
    L.append("      </journal-title-group>")
    L.append("      <publisher>")
    L.append(f"        <publisher-name>{esc(g(pub, 'name', default='HECAM — IESS'))}</publisher-name>")
    L.append("        <publisher-loc>Quito, Pichincha, Ecuador</publisher-loc>")
    L.append("      </publisher>")
    L.append("    </journal-meta>")

    L.append("    <article-meta>")
    L.append(f'      <article-id pub-id-type="publisher-id">{esc(ident)}</article-id>')
    L.append("      <article-categories>")
    L.append('        <subj-group subj-group-type="heading">'
             f"<subject>{esc(g(doc, 'tipoDocumento', default='Protocolo Clínico'))}</subject></subj-group>")
    if unidad:
        L.append('        <subj-group subj-group-type="unidad-tecnica">'
                 f"<subject>{esc(unidad)}</subject></subj-group>")
    L.append("      </article-categories>")
    L.append(f"      <title-group><article-title>{esc(titulo)}</article-title></title-group>")

    # autores
    autores = g(doc, "author", default=[]) or []
    if not isinstance(autores, list):
        autores = [autores]
    if autores:
        L.append('      <contrib-group content-type="elaboracion">')
        for a in autores:
            L.extend(render_contrib(a, "author", "elaborado-por"))
        L.append("      </contrib-group>")

    # revisión editorial (la revisora)
    rev_ed = g(doc, "revisionEditorial")
    if rev_ed:
        L.append('      <contrib-group content-type="revision-editorial">')
        L.extend(render_contrib(rev_ed, "editor", "revision-editorial"))
        L.append("      </contrib-group>")

    # contribuyentes institucionales, agrupados por bloque de firma
    contribs = g(doc, "contributor", default=[]) or []
    if not isinstance(contribs, list):
        contribs = [contribs]
    aprob = [c for c in contribs if "Aprobado" in str(g(c, "bloqueFirma", "roleName", default=""))]
    revis = [c for c in contribs if c not in aprob]
    if revis:
        L.append('      <contrib-group content-type="revision-institucional">')
        for c in sorted(revis, key=lambda x: g(x, "position", default=99) or 99):
            persona = g(c, "contributor", default={}) or {}
            L.extend(render_contrib(c, "reviewer", slug_role(g(persona, "jobTitle", default="revisado-por"))))
        L.append("      </contrib-group>")
    if aprob:
        L.append('      <contrib-group content-type="aprobacion">')
        for c in aprob:
            L.extend(render_contrib(c, "editor", "aprobado-por"))
        L.append("      </contrib-group>")

    # fecha
    try:
        y, m, d = fecha.split("-")
        L.append(f'      <pub-date date-type="original-elaboration" iso-8601-date="{esc(fecha)}">')
        L.append(f"        <day>{esc(d)}</day><month>{esc(m)}</month><year>{esc(y)}</year>")
        L.append("      </pub-date>")
    except ValueError:
        pass

    L.append("      <permissions>")
    L.append("        <copyright-statement>© Hospital de Especialidades Carlos Andrade Marín — "
             "IESS</copyright-statement>")
    L.append(f"        <copyright-year>{esc(fecha[:4])}</copyright-year>")
    L.append("      </permissions>")

    if desc:
        L.append('      <abstract abstract-type="summary">')
        L.append(f"        <p>{inline(desc)}</p>")
        L.append("      </abstract>")

    L.append("      <custom-meta-group>")
    metas = [
        ("codigo-sgd", ident),
        ("codigo-provisional", "sí" if g(doc, "codigoProvisional") else "no"),
        ("version", version),
        ("unidad-tecnica", unidad),
        ("estado", estado),
        ("vigencia-anios", g(doc, "vigenciaAnios", default=3)),
        ("mes-anio-portada", g(doc, "mesAnioPortada", default="")),
        ("sistema-evidencia", g(doc, "evidenceOrigin", default="Oxford CEBM 2009")),
        ("citas-superindice", "sí"),
        ("bibliografia-orden", "aparición"),
    ]
    for nombre_meta, valor in metas:
        if valor not in (None, ""):
            L.append(f"        <custom-meta><meta-name>{esc(nombre_meta)}</meta-name>"
                     f"<meta-value>{esc(valor)}</meta-value></custom-meta>")
    for n in g(doc, "normativaAplicable", default=[]) or []:
        L.append("        <custom-meta><meta-name>normativa</meta-name>"
                 f"<meta-value>{esc(g(n, 'identifier', default=''))} — "
                 f"{esc(g(n, 'name', default=''))}</meta-value></custom-meta>")
    L.append("      </custom-meta-group>")
    L.append("    </article-meta>")
    L.append("  </front>")

    # body
    L.append("  <body>")
    for sec in g(doc, "hasPart", default=[]) or []:
        if g(sec, "secType") == "bibliografia":
            continue  # va en <back>
        L.extend(render_seccion(sec))
    L.append("  </body>")

    # back
    L.append("  <back>")
    L.append("    <ref-list>")
    L.append("      <title>Bibliografía</title>")
    for i, ref in enumerate(g(doc, "citation", default=[]) or [], start=1):
        pos = g(ref, "position", default=i)
        L.append(f'      <ref id="ref-{esc(pos)}">')
        L.append(f"        <label>{esc(pos)}</label>")
        L.append('        <mixed-citation publication-type="journal">'
                 f"{esc(g(ref, 'vancouver', default=g(ref, 'name', default='')))}</mixed-citation>")
        L.append("      </ref>")
    L.append("    </ref-list>")
    L.append("  </back>")
    L.append("</article>")
    return "\n".join(L) + "\n"


def main():
    ap = argparse.ArgumentParser(description="JSON-LD del protocolo HECAM → JATS 1.3 XML")
    ap.add_argument("jsonld", help="Ruta al protocolo.jsonld")
    ap.add_argument("-o", "--output", default=None, help="Archivo de salida .xml")
    args = ap.parse_args()

    with open(args.jsonld, encoding="utf-8") as f:
        doc = json.load(f)

    xml = build(doc)
    destino = args.output or args.jsonld.rsplit(".", 1)[0] + ".jats.xml"
    with open(destino, "w", encoding="utf-8") as f:
        f.write(xml)

    n_secs = len(doc.get("hasPart", []))
    n_refs = len(doc.get("citation", []))
    print(f"JATS generado: {destino}")
    print(f"  secciones de primer nivel: {n_secs}")
    print(f"  referencias: {n_refs}")

    # aviso rápido de placeholders sin rellenar
    pendientes = xml.count("{{")
    if pendientes:
        print(f"  AVISO: {pendientes} marcadores '{{{{...}}}}' sin rellenar", file=sys.stderr)


if __name__ == "__main__":
    main()
