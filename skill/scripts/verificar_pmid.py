#!/usr/bin/env python3
"""
verificar_pmid.py — Comprueba contra PubMed que cada referencia exista de verdad.

Acepta un protocolo .js, un .docx generado o un protocolo.jsonld.

    python3 scripts/verificar_pmid.py protocolos/sepsis.js
    python3 scripts/verificar_pmid.py salida/HECAM-MI-PR-001_*.docx
    python3 scripts/verificar_pmid.py protocolo.jsonld
    python3 scripts/verificar_pmid.py --offline protocolos/*.js

Para cada referencia busca el PMID en PubMed: primero por DOI, luego por título
y, como último recurso, por autor + año + revista. Recupera el registro oficial
y lo compara con lo que dice la bibliografía local.

Veredictos:
  OK           el registro de PubMed coincide con la referencia local
  REVISAR      el registro existe pero algo no cuadra (título, año, revista, DOI)
  SIN PMID     PubMed no conoce ni el DOI ni el título: referencia sospechosa
  NO INDEXADA  literatura gris (normativa, informes, guías ministeriales)
  SIN CONSULTA con --offline, referencia que todavía no está en la caché

Una referencia SIN PMID casi siempre significa una de tres cosas: la cita se
inventó, el DOI se copió mal, o el título se alteró al traducirlo. Las tres hay
que corregirlas en el generador antes de que el protocolo salga a firma.

Los resultados quedan en referencia/pmid-cache.json, que permite repetir la
verificación sin red (--offline) y deja constancia de qué se comprobó y cuándo.

Código de salida 0 si no hay SIN PMID ni REVISAR, 1 en caso contrario.
"""

import argparse
import glob
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import date
from difflib import SequenceMatcher
from xml.etree import ElementTree as ET

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(RAIZ, "referencia", "pmid-cache.json")
EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
HERRAMIENTA = "hecam-protocolos"

UMBRAL_TITULO = 0.90       # similitud mínima entre el título local y el de PubMed
UMBRAL_ABREVIADO = 0.92    # el título local es un tramo literal del de PubMed
UMBRAL_REVISTA = 0.75      # la abreviatura de la revista admite más holgura
UMBRAL_CANDIDATO = 0.50    # por debajo, el candidato hallado no es esa referencia

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

DOI_RE = re.compile(
    r"\b(?:doi:\s*|https?://(?:dx\.)?doi\.org/)(10\.\d{4,9}/\S+)", re.I)
# "… Rev Abrev. 2016;315(8):801–10" — la firma tipográfica de un artículo de revista
REVISTA_RE = re.compile(r"\.\s*\d{4}\s*;\s*\d+")
# "Arnhem: EAU Guidelines Office; 2023" — pie de imprenta de monografía o guía
MONOGRAFIA_RE = re.compile(r"[A-ZÁÉÍÓÚÑ][\wáéíóúñ.'’-]+:\s+[^;.]{3,80};\s*\d{4}")
# "In: StatPearls. Treasure Island (FL): StatPearls Publishing; 2024" — capítulo
# de libro. PubMed los tiene en Bookshelf, no en el índice de artículos, así que
# buscarlos ahí devuelve cualquier cosa.
CAPITULO_RE = re.compile(r"\bIn:\s+\S")
ET_AL_RE = re.compile(r"\bet\s+al\.[\s.]*")   # tolera «et al.. Título» de los exportadores
INICIALES_RE = re.compile(r"\s[A-ZÁÉÍÓÚÑ]{1,4}\.\s+")
CORPORATIVO_RE = re.compile(
    r"^(.{2,140}?(?:Group|Committee|Society|Association|Task Force|Panel|"
    r"Collaboration|Network|Consortium|Investigators|Trialists|Trial|"
    r"Study Investigators|Working Party))\.\s+")

# Literatura gris: normativa, informes institucionales y documentos oficiales.
# Solo se aplica cuando la referencia NO tiene DOI ni patrón de revista, para que
# una guía publicada en una revista indexada siga verificándose.
GRIS_RE = re.compile(
    r"ministerio de salud|world health organization|organizaci[oó]n mundial|"
    r"acuerdo ministerial|registro oficial|oficio nro|informe t[eé]cnico|"
    r"cuadro nacional de medicamentos|cartillas de resistencia|"
    r"resoluci[oó]n wha|\bwha\d|norma t[eé]cnica|\bhecam\b|\biess\b|\binspi\b|"
    r"direcci[oó]n nacional de vigilancia|instituto ecuatoriano", re.I)


# ── normalización y comparación ───────────────────────────────────────────────

def norm(s):
    """Minúsculas, sin tildes y sin puntuación, para comparar de forma estable."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("–", "-").replace("—", "-")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


def similitud(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def contencion(corto, largo):
    """Qué proporción de `corto` aparece como bloque continuo dentro de `largo`.

    Vancouver admite acortar el título: se suele podar el subtítulo posterior a
    los dos puntos y la coletilla de autoría corporativa. Un título local que es
    un tramo literal del de PubMed está bien citado aunque la similitud global
    sea baja. La medida es asimétrica a propósito: si es el título *local* el que
    añade texto que PubMed no tiene, la proporción cae y la referencia se marca.
    """
    a, b = norm(corto), norm(largo)
    if not a or not b:
        return 0.0
    bloque = SequenceMatcher(None, a, b).find_longest_match(0, len(a), 0, len(b))
    return bloque.size / len(a)


# ── despiece de una cadena Vancouver ──────────────────────────────────────────

def extraer_doi(ref):
    m = DOI_RE.search(ref)
    if not m:
        return None
    return m.group(1).rstrip(".,;)]}«»'\"")


def partir_vancouver(ref):
    """De 'Autores. Título. Revista. Año;Vol(Núm):pp' saca (título, revista, año)."""
    s = DOI_RE.sub("", ref).strip()

    m = ET_AL_RE.search(s)
    if m:
        resto = s[m.end():]
    else:
        m = CORPORATIVO_RE.match(s) or INICIALES_RE.search(s)
        resto = s[m.end():] if m else s

    # puntuación sobrante entre autores y título («et al.. Título»), frecuente
    # cuando la cadena viene de un exportador y no de la mano
    resto = resto.lstrip(" .,;:")

    m = re.match(r"(?P<titulo>.+?)\.\s+(?P<revista>[^.]{2,90})\.\s*(?P<anio>\d{4})",
                 resto)
    if m:
        return m.group("titulo").strip(), m.group("revista").strip(), m.group("anio")

    m = re.match(r"(?P<titulo>.+?)\.\s", resto)
    titulo = m.group("titulo").strip() if m else resto.strip()
    anio = None
    m = re.search(r"\b(19|20)\d{2}\b", s)
    if m:
        anio = m.group(0)
    return titulo, None, anio


def primer_autor(ref):
    """Devuelve ('Singer', 'M') a partir del principio de la cadena Vancouver."""
    m = re.match(r"\s*([A-ZÁÉÍÓÚÑ][\w'’´-]+(?:\s+[a-z]{2,4}\s+[A-ZÁÉÍÓÚÑ][\w-]+)?)"
                 r"\s+([A-ZÁÉÍÓÚÑ]{1,4})\b", ref)
    return (m.group(1), m.group(2)) if m else (None, None)


def es_gris(ref):
    """Literatura gris: normativa, informes y monografías, que no van a PubMed.

    La comprobación de revista va primero a propósito: una guía publicada en una
    revista indexada sí se verifica, aunque la firme una sociedad científica.
    """
    if extraer_doi(ref) or REVISTA_RE.search(ref):
        return False
    return bool(GRIS_RE.search(ref) or MONOGRAFIA_RE.search(ref)
                or CAPITULO_RE.search(ref))


# ── acceso a PubMed (E-utilities) ─────────────────────────────────────────────

_ultima_peticion = [0.0]


def _esperar():
    """NCBI permite 3 peticiones/s sin clave y 10/s con NCBI_API_KEY."""
    intervalo = 0.11 if os.environ.get("NCBI_API_KEY") else 0.35
    falta = intervalo - (time.monotonic() - _ultima_peticion[0])
    if falta > 0:
        time.sleep(falta)
    _ultima_peticion[0] = time.monotonic()


def _pedir(endpoint, params, intentos=3):
    params = dict(params, tool=HERRAMIENTA, retmode="json")
    if os.environ.get("NCBI_API_KEY"):
        params["api_key"] = os.environ["NCBI_API_KEY"]
    if os.environ.get("NCBI_EMAIL"):
        params["email"] = os.environ["NCBI_EMAIL"]
    url = f"{EUTILS}/{endpoint}.fcgi?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": HERRAMIENTA})
    for intento in range(intentos):
        _esperar()
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and intento < intentos - 1:
                time.sleep(1.5 * (intento + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if intento < intentos - 1:
                time.sleep(1.5 * (intento + 1))
                continue
            raise
    return {}


def esearch(term, exigir_frase=False):
    """Busca en PubMed. Devuelve la lista de PMID.

    Cuando una frase entrecomillada no existe, PubMed no devuelve vacío: rompe la
    frase en términos sueltos y busca igual, así que un título inventado puede
    devolver un artículo cualquiera del mismo campo. `exigir_frase` descarta ese
    resultado leyendo el aviso `quotedphrasesnotfound` de la propia respuesta.
    """
    d = _pedir("esearch", {"db": "pubmed", "term": term, "retmax": "5"})
    res = d.get("esearchresult", {})
    if exigir_frase:
        avisos = res.get("warninglist", {}) or {}
        if avisos.get("quotedphrasesnotfound") or avisos.get("phrasesnotfound"):
            return []
    return res.get("idlist", []) or []


def esummary(pmid):
    d = _pedir("esummary", {"db": "pubmed", "id": pmid})
    r = (d.get("result") or {}).get(pmid)
    if not r:
        return None
    ids = {a.get("idtype"): a.get("value") for a in r.get("articleids", [])}
    anio = None
    m = re.search(r"\b(19|20)\d{2}\b", r.get("pubdate", "") or "")
    if m:
        anio = m.group(0)
    autores = [a.get("name") for a in r.get("authors", []) if a.get("name")]
    return {
        "pmid": pmid,
        "titulo": (r.get("title") or "").rstrip("."),
        "revista": r.get("source") or "",
        "anio": anio,
        "volumen": r.get("volume") or "",
        "numero": r.get("issue") or "",
        "paginas": r.get("pages") or "",
        "doi": ids.get("doi") or "",
        "autores": autores[:3],
    }


def localizar(ref, titulo, revista, anio):
    """Busca el PMID. Devuelve (pmid, vía) o (None, None)."""
    doi = extraer_doi(ref)
    if doi:
        ids = esearch(f'"{doi}"[AID]')
        if ids:
            return ids[0], "doi"

    if titulo and len(titulo) > 15:
        ids = esearch(f'"{titulo}"[Title]', exigir_frase=True)
        if ids:
            return ids[0], "titulo"
        # el título local puede traer subtítulo añadido o traducido: probar el
        # tramo anterior a los dos puntos, que es la parte estable
        raiz = titulo.split(":")[0].strip()
        if len(raiz) > 25 and raiz != titulo:
            ids = esearch(f'"{raiz}"[Title]', exigir_frase=True)
            if ids:
                return ids[0], "titulo-parcial"

    apellido, iniciales = primer_autor(ref)
    if apellido and anio:
        term = f'{apellido} {iniciales}[Author] AND {anio}[DP]'
        if revista:
            term += f' AND "{revista}"[Journal]'
        ids = esearch(term)
        if len(ids) == 1:
            return ids[0], "autor-anio"

    return None, None


def crossref(doi):
    """Segunda opinión: no todo artículo real está en PubMed, pero casi todo
    tiene DOI registrado. Devuelve el registro de Crossref o None."""
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="")
    req = urllib.request.Request(url, headers={"User-Agent": HERRAMIENTA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            m = json.load(r).get("message", {})
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None
    fecha = m.get("issued", {}).get("date-parts", [[None]])[0]
    return {
        "doi": m.get("DOI", doi),
        "titulo": (m.get("title") or [""])[0],
        "revista": (m.get("container-title") or [""])[0],
        "anio": str(fecha[0]) if fecha and fecha[0] else None,
        "tipo": m.get("type", ""),
    }


# ── caché ─────────────────────────────────────────────────────────────────────

def clave_cache(ref, titulo):
    doi = extraer_doi(ref)
    return f"doi:{doi.lower()}" if doi else f"titulo:{norm(titulo)[:120]}"


def cargar_cache():
    if not os.path.exists(CACHE):
        return {}
    try:
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f).get("entradas", {})
    except (json.JSONDecodeError, OSError):
        return {}


def guardar_cache(entradas):
    doc = {
        "_nota": "Registros de PubMed verificados por scripts/verificar_pmid.py. "
                 "Se regenera solo; no editar a mano.",
        "_actualizado": date.today().isoformat(),
        "entradas": dict(sorted(entradas.items())),
    }
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with open(CACHE, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")


# ── extracción de referencias ─────────────────────────────────────────────────

def refs_js(ruta):
    """Saca las cadenas del bloque 'const refs = [ … ];' de un protocolo .js."""
    with open(ruta, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"const\s+refs\s*=\s*\[", src)
    if not m:
        return []

    i, nivel, fin = m.end(), 1, None
    while i < len(src):
        c = src[i]
        if c in "'\"`":
            cierre = c
            i += 1
            while i < len(src):
                if src[i] == "\\":
                    i += 2
                    continue
                if src[i] == cierre:
                    break
                i += 1
        elif c == "[":
            nivel += 1
        elif c == "]":
            nivel -= 1
            if nivel == 0:
                fin = i
                break
        i += 1
    bloque = src[m.end():fin if fin is not None else len(src)]

    salida, i = [], 0
    while i < len(bloque):
        c = bloque[i]
        if c in "'\"`":
            cierre, i, buf = c, i + 1, []
            while i < len(bloque) and bloque[i] != cierre:
                if bloque[i] == "\\":
                    buf.append(bloque[i + 1] if i + 1 < len(bloque) else "")
                    i += 2
                    continue
                buf.append(bloque[i])
                i += 1
            i += 1
            salida.append("".join(buf).strip())
        else:
            i += 1
    return [s for s in salida if len(s) > 30]


def refs_docx(ruta):
    """Recoge los párrafos de bibliografía, numerados 'N. Autor…'."""
    with zipfile.ZipFile(ruta) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    encontradas = {}
    for p in root.iter(f"{W}p"):
        texto = "".join(t.text or "" for t in p.iter(f"{W}t")).strip()
        m = re.match(r"^(\d{1,3})\.\s+(\S.*)$", texto)
        if m and len(texto) > 30:
            encontradas[int(m.group(1))] = m.group(2).strip()
    return [encontradas[k] for k in sorted(encontradas)]


def refs_jsonld(ruta):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)
    salida = []
    for c in doc.get("citation", []) or []:
        s = c.get("vancouver") or c.get("name") or ""
        s = s.strip()
        if s:
            salida.append(s)
    return salida


def extraer(ruta):
    if ruta.endswith(".js"):
        return refs_js(ruta)
    if ruta.endswith(".docx"):
        return refs_docx(ruta)
    if ruta.endswith((".json", ".jsonld")):
        return refs_jsonld(ruta)
    raise ValueError(f"formato no reconocido: {ruta}")


# ── verificación ──────────────────────────────────────────────────────────────

def discrepancias(ref, titulo, revista, anio, reg):
    """Compara la referencia local con el registro de PubMed.

    Devuelve (notas de fallo, avisos informativos).
    """
    notas, avisos = [], []

    sim = similitud(titulo, reg["titulo"])
    if titulo and sim < UMBRAL_TITULO:
        if contencion(titulo, reg["titulo"]) >= UMBRAL_ABREVIADO:
            avisos.append("título abreviado respecto al de PubMed")
        else:
            notas.append(f"el título no coincide (similitud {sim:.2f})")

    if anio and reg["anio"] and anio != reg["anio"]:
        notas.append(f"año local {anio}, PubMed {reg['anio']}")

    if revista and reg["revista"]:
        if similitud(revista, reg["revista"]) < UMBRAL_REVISTA:
            notas.append(f"revista local «{revista}», PubMed «{reg['revista']}»")

    doi_local = extraer_doi(ref)
    if doi_local and reg["doi"] and doi_local.lower() != reg["doi"].lower():
        notas.append(f"DOI local {doi_local}, PubMed {reg['doi']}")

    return notas, avisos


def consultar(ref, titulo, revista, anio):
    """Resuelve una referencia contra PubMed y, si hace falta, contra Crossref."""
    pmid, via = localizar(ref, titulo, revista, anio)
    reg = esummary(pmid) if pmid else None

    # Solo la búsqueda por DOI identifica sin ambigüedad. Las demás pueden
    # devolver un artículo parecido pero distinto; si el título no se corresponde
    # se descarta el candidato y la referencia cuenta como no hallada.
    descartado = None
    if reg and via != "doi" and similitud(titulo, reg["titulo"]) < UMBRAL_CANDIDATO:
        descartado, reg, via = reg, None, None

    doi = extraer_doi(ref)
    return {
        "via": via,
        "consultado": date.today().isoformat(),
        "registro": reg,
        "descartado": descartado,
        "crossref": crossref(doi) if (reg is None and doi) else None,
    }


def verificar_una(ref, cache, offline, refrescar):
    titulo, revista, anio = partir_vancouver(ref)
    r = {"ref": ref, "titulo": titulo, "revista": revista, "anio": anio,
         "doi": extraer_doi(ref), "pmid": None, "via": None,
         "notas": [], "avisos": []}

    if es_gris(ref):
        r["veredicto"] = "NO INDEXADA"
        return r

    clave = clave_cache(ref, titulo)
    entrada = None if refrescar else cache.get(clave)

    if entrada is None:
        if offline:
            r["veredicto"] = "SIN CONSULTA"
            return r
        entrada = consultar(ref, titulo, revista, anio)
        cache[clave] = entrada

    reg = entrada.get("registro")
    r["via"] = entrada.get("via")
    r["candidato"] = entrada.get("descartado")
    r["crossref"] = entrada.get("crossref")

    if not reg:
        r["veredicto"] = "SOLO DOI" if entrada.get("crossref") else "SIN PMID"
        return r

    r["pmid"] = reg["pmid"]
    r["registro"] = reg
    r["notas"], r["avisos"] = discrepancias(ref, titulo, revista, anio, reg)
    r["veredicto"] = "REVISAR" if r["notas"] else "OK"
    return r


# ── informe ───────────────────────────────────────────────────────────────────

ORDEN = ["SIN PMID", "REVISAR", "SOLO DOI", "SIN CONSULTA", "NO INDEXADA", "OK"]


def recortar(s, n=72):
    s = " ".join(s.split())
    return s if len(s) <= n else s[:n - 1] + "…"


def informe(ruta, resultados):
    print(f"Verificando bibliografía de {os.path.basename(ruta)} "
          f"({len(resultados)} referencias)")
    print()

    for i, r in enumerate(resultados, start=1):
        print(f"  [{i:>2}] {r['veredicto']:<12} {recortar(r['ref'])}")
        if r["veredicto"] == "OK":
            reg = r["registro"]
            print(f"       {'':<12} PMID {reg['pmid']}"
                  + (f" · doi {reg['doi']}" if reg["doi"] else "")
                  + ("".join(f" · {a}" for a in r["avisos"])))
        elif r["veredicto"] == "REVISAR":
            reg = r["registro"]
            print(f"       {'':<12} PMID {reg['pmid']} — {reg['titulo']}")
            print(f"       {'':<12} {reg['revista']} {reg['anio']};"
                  f"{reg['volumen']}({reg['numero']}):{reg['paginas']}")
            for n in r["notas"]:
                print(f"       {'':<12} → {n}")
        elif r["veredicto"] == "SIN PMID":
            que = []
            if r["doi"]:
                que.append(f"el DOI {r['doi']}")
            if r["titulo"]:
                que.append("el título")
            print(f"       {'':<12} PubMed no conoce {' ni '.join(que) or 'la referencia'}")
            print(f"       {'':<12} tampoco consta en Crossref")
            cand = r.get("candidato")
            if cand:
                print(f"       {'':<12} el único candidato (PMID {cand['pmid']}) "
                      f"es otro artículo: {recortar(cand['titulo'], 60)}")
        elif r["veredicto"] == "SOLO DOI":
            cr = r["crossref"]
            print(f"       {'':<12} no está en PubMed, pero el DOI {cr['doi']} "
                  "sí consta en Crossref")
            print(f"       {'':<12} {cr['revista']} {cr['anio'] or ''} — "
                  f"{recortar(cr['titulo'], 60)}")

    conteo = {v: sum(1 for r in resultados if r["veredicto"] == v) for v in ORDEN}
    print()
    print("  Resumen: " + " · ".join(
        f"{conteo[v]} {v.lower()}" for v in ORDEN if conteo[v]))

    problemas = conteo["SIN PMID"] + conteo["REVISAR"]
    if problemas:
        print()
        if conteo["SIN PMID"]:
            print(f"  FALLA: {conteo['SIN PMID']} referencia(s) que PubMed no reconoce. "
                  "Comprobar si la cita existe realmente.")
        if conteo["REVISAR"]:
            print(f"  FALLA: {conteo['REVISAR']} referencia(s) con datos que no "
                  "coinciden con el registro oficial.")
        print("  Corregir la bibliografía en el generador y recompilar. "
              "No editar el .docx a mano.")
        return 1

    if conteo["SIN CONSULTA"]:
        print(f"  AVISO: {conteo['SIN CONSULTA']} referencia(s) sin consultar "
              "(modo --offline y sin entrada en la caché).")
    if conteo["SOLO DOI"]:
        print(f"  AVISO: {conteo['SOLO DOI']} referencia(s) con DOI válido en una "
              "revista que PubMed no indexa. Existen, pero no tendrán PMID.")
    print()
    print("  OK — todas las referencias indexables constan en PubMed.")
    return 0


# ── principal ─────────────────────────────────────────────────────────────────

def anotar_jsonld(ruta, resultados):
    """Escribe pmid, doi y verificado en cada entrada de citation[].

    Solo anota lo comprobado: una referencia sin PMID confirmado no recibe
    campo, en vez de recibir uno vacío que después parecería un dato ausente por
    descuido. El orden de citation[] es el de la bibliografía, y verificar_una
    respeta ese orden, así que se emparejan por posición.
    """
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    citas = doc.get("citation") or []
    n = 0
    for cita, r in zip(citas, resultados):
        reg = r.get("registro") or {}
        if reg.get("pmid"):
            cita["pmid"] = reg["pmid"]
            n += 1
        doi = r.get("doi") or reg.get("doi")
        if doi:
            cita["doi"] = doi
            cita.setdefault("url", "https://doi.org/" + doi)
        if reg.get("pmid") or doi:
            cita["verificado"] = date.today().isoformat()

    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return n


def main():
    ap = argparse.ArgumentParser(
        description="Verifica contra PubMed las referencias de un protocolo HECAM.")
    ap.add_argument("archivos", nargs="+",
                    help="protocolo .js, .docx generado o protocolo.jsonld")
    ap.add_argument("--offline", action="store_true",
                    help="no consultar la red; usar solo referencia/pmid-cache.json")
    ap.add_argument("--refrescar", action="store_true",
                    help="ignorar la caché y volver a consultar PubMed")
    ap.add_argument("--sin-cache", action="store_true",
                    help="no escribir la caché")
    ap.add_argument("--json", action="store_true",
                    help="salida en JSON en vez de informe legible")
    ap.add_argument("--anotar", action="store_true",
                    help="escribe pmid, doi y verificado en el .jsonld comprobado")
    args = ap.parse_args()

    rutas = []
    for a in args.archivos:
        expandido = glob.glob(a)
        rutas.extend(sorted(expandido) if expandido else [a])

    cache = cargar_cache()
    codigo, todo = 0, {}

    for ruta in rutas:
        if not os.path.exists(ruta):
            print(f"No existe: {ruta}", file=sys.stderr)
            codigo = 2
            continue
        try:
            refs = extraer(ruta)
        except ValueError as e:
            print(f"{e}", file=sys.stderr)
            codigo = 2
            continue

        if not refs:
            print(f"{os.path.basename(ruta)}: no se encontró bibliografía.",
                  file=sys.stderr)
            codigo = 2
            continue

        resultados = [verificar_una(r, cache, args.offline, args.refrescar)
                      for r in refs]
        todo[ruta] = resultados

        if args.anotar:
            if not ruta.endswith((".json", ".jsonld")):
                print("--anotar solo se aplica a un .jsonld; %s se omite" % ruta,
                      file=sys.stderr)
            else:
                n = anotar_jsonld(ruta, resultados)
                print("  anotadas %d referencias con su PMID en %s\n"
                      % (n, os.path.basename(ruta)))

        if not args.json:
            codigo = max(codigo, informe(ruta, resultados))
            print()
        else:
            codigo = max(codigo, 1 if any(
                r["veredicto"] in ("SIN PMID", "REVISAR") for r in resultados) else 0)

    if args.json:
        json.dump(todo, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")

    if not args.sin_cache and not args.offline:
        guardar_cache(cache)

    return codigo


if __name__ == "__main__":
    sys.exit(main())
