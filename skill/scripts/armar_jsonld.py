#!/usr/bin/env python3
"""
armar_jsonld.py — Reconstruye el protocolo.jsonld a partir del generador .js.

    python3 skill/scripts/armar_jsonld.py produccion/HECAM-MI-PR-001-sepsis/sepsis.js

Escribe protocolo.jsonld junto al generador. Necesita un metadatos.json en el
mismo directorio con lo que el generador no puede saber: el resumen para
indexación, el código CIE-10, las fechas y los datos del autor.

Cómo funciona
-------------
1. Invoca grabar_estructura.js, que ejecuta el generador con la librería
   instrumentada y devuelve la secuencia de llamadas en orden documental.
2. Corta esa secuencia por las llamadas a h1() y h2(), que son las que marcan
   secciones y subsecciones, y traduce cada bloque al vocabulario de la matriz.
3. Toma los nombres normativos de las secciones de la propia normativa y no del
   generador: el .docx tiene variantes cosméticas («Plan de Acción / Actuación»
   con espacios) que no son las del HECAM-CC-FR-012.
4. Rellena pmid y doi de cada referencia desde referencia/pmid-cache.json, de
   modo que lo verificado contra PubMed llegue al XML de archivo.

El resultado se valida con validate_jsonld.py, que es quien manda.
"""

import json
import os
import re
import subprocess
import sys
import tempfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(RAIZ, "referencia", "pmid-cache.json")
GRABADOR = os.path.join(RAIZ, "scripts", "grabar_estructura.js")

# Nombres normativos. El generador usa variantes cosméticas; manda la normativa.
SECCIONES = [
    ("1", "Justificación", "justificacion"),
    ("2", "Objetivos", "objetivos"),
    ("3", "Glosario de términos / Abreviaciones", "glosario"),
    ("4", "Procedimiento (Plan de Acción/Actuación)", "procedimiento"),
    ("5", "Algoritmo de actuación", "algoritmo"),
    ("6", "Indicadores", "indicadores"),
    ("7", "Bibliografía", "bibliografia"),
    ("8", "Anexos", "anexos"),
    ("9", "Firmas de los involucrados", "firmas"),
    ("10", "Control de cambios", "control-cambios"),
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
    "Jefe de la Unidad Técnica de Cuidados Intensivos",
]

TIPOS_INDICADOR = ("diagnóstico", "seguimiento", "tratamiento", "resultado")
CITA_RE = re.compile(r"\[\[([\d,\s–-]+)\]\]")
DOI_RE = re.compile(r"\bdoi:\s*(10\.\d{4,9}/\S+)", re.I)


# ── captura de la estructura ──────────────────────────────────────────────────

def grabar(generador):
    tmp = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
    tmp.close()
    try:
        r = subprocess.run(["node", GRABADOR, generador, tmp.name],
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit("El generador falló:\n" + (r.stderr or r.stdout))
        with open(tmp.name, encoding="utf-8") as f:
            return json.load(f)
    finally:
        os.unlink(tmp.name)


def cortar(rec, fn):
    """Índices de las llamadas a fn, más el final, para trocear la secuencia."""
    idx = [i for i, x in enumerate(rec) if x["fn"] == fn]
    return idx


def numeral(texto):
    m = re.match(r"\s*(\d+(?:\.\d+)?)\s*\.", texto)
    return m.group(1) if m else None


# ── traducción de bloques ─────────────────────────────────────────────────────

def cols_de(tabla_args):
    return [c.get("label", "") for c in tabla_args[0]]


def anchos_de(tabla_args):
    return [c.get("w", 0) for c in tabla_args[0]]


def centrados_de(tabla_args):
    """Qué columnas van centradas. Se guarda para que compilar_docx.js pueda
    reproducir la tabla tal cual y no solo su contenido."""
    return [bool(c.get("centered")) for c in tabla_args[0]]


def bloques(tramo, saltar_hasta=0):
    """Traduce las llamadas de un tramo a bloques de contenido de la matriz."""
    salida = []
    for x in tramo[saltar_hasta:]:
        fn, a = x["fn"], x["args"]
        if fn == "h3":
            salida.append({"type": "Subtitulo", "text": a[0]})
        elif fn == "bp":
            salida.append({"type": "Parrafo", "text": a[0]})
        elif fn == "nmb":
            # nmb() es un ítem de lista numerada. Traducirlo a Parrafo hacía
            # desaparecer el número sin que el texto cambiara, y eso no se ve al
            # revisar el documento: hay que mirar la numeración.
            salida.append({"type": "Numerada", "text": a[0]})
        elif fn == "blt":
            if salida and salida[-1].get("type") == "Lista" \
                    and salida[-1].get("estilo") == "vinetas":
                salida[-1]["itemListElement"].append(a[0])
            else:
                salida.append({"type": "Lista", "estilo": "vinetas",
                               "itemListElement": [a[0]]})
        elif fn == "note":
            salida.append({"type": "Nota", "text": a[0]})
        elif fn == "caption":
            salida.append({"type": "_titulo_tabla", "text": a[0]})
        elif fn == "blk":
            salida.append({"type": "Espacio"})
        elif fn == "semaforo":
            salida.append({"type": "Semaforo"})
        elif fn in ("mkT", "rTable"):
            bloque = {
                "type": "Tabla" if fn == "mkT" else "TablaResistencia",
                "columnas": cols_de(a), "anchos": anchos_de(a),
                "centrados": centrados_de(a), "filas": a[1],
            }
            # el caption inmediatamente anterior es el título de esta tabla
            if salida and salida[-1].get("type") == "_titulo_tabla":
                bloque["titulo"] = salida.pop()["text"]
            salida.append(bloque)
    return [b for b in salida if b.get("type") != "_titulo_tabla"]


def texto_plano(bs):
    out = []
    for b in bs:
        if "text" in b:
            out.append(b["text"])
        for it in b.get("itemListElement", []):
            out.append(it)
        for fila in b.get("filas", []):
            out.extend(str(c) for c in fila)
    return " ".join(out)


# ── secciones ─────────────────────────────────────────────────────────────────

def seccion_2(tramo):
    general, especificos = "", []
    modo = None
    for x in tramo:
        if x["fn"] == "h3":
            modo = "gen" if "General" in x["args"][0] else "esp"
        elif x["fn"] in ("bp", "nmb"):
            if modo == "gen" and not general:
                general = x["args"][0]
            elif modo == "esp":
                especificos.append(x["args"][0])
    return general, especificos


def seccion_3(tramo):
    tablas = [x["args"] for x in tramo if x["fn"] == "mkT"]
    glosario, abreviaciones = [], []
    if tablas:
        glosario = [{"termino": f[0], "definicion": f[1]} for f in tablas[0][1]]
    if len(tablas) > 1:
        abreviaciones = [{"sigla": f[0], "significado": f[1]} for f in tablas[1][1]]
    return glosario, abreviaciones


def titulo_tabla_6(tramo):
    cap = next((x for x in tramo if x["fn"] == "caption"), None)
    return cap["args"][0] if cap else None


def seccion_6(tramo):
    tablas = [x["args"] for x in tramo if x["fn"] in ("mkT", "rTable")]
    if not tablas:
        return []
    inds = []
    for fila in tablas[0][1]:
        if len(fila) < 6:
            continue
        nombre = fila[0]
        tipo = ""
        m = re.search(r"\(([^)]+)\)\s*$", nombre)
        if m and m.group(1).strip().lower() in TIPOS_INDICADOR:
            tipo = m.group(1).strip().lower()
            nombre = nombre[:m.start()].strip()
        inds.append({
            "type": "Indicador", "name": nombre, "tipoIndicador": tipo,
            "definicionIndicador": fila[1], "calculo": fila[2],
            "meta": fila[3], "periodo": fila[4], "responsable": fila[5],
        })
    return inds


def seccion_8(tramo):
    """Cada h2 «Anexo N. …» abre un anexo; lo que sigue es su contenido."""
    marcas = [i for i, x in enumerate(tramo) if x["fn"] == "h2"]
    anexos = []
    for n, ini in enumerate(marcas):
        fin = marcas[n + 1] if n + 1 < len(marcas) else len(tramo)
        titulo = tramo[ini]["args"][0]
        nombre = re.sub(r"^Anexo\s*\d+\.\s*", "", titulo).strip()
        anexo = {"type": "Anexo", "position": n + 1, "name": nombre}
        cuerpo = bloques(tramo[ini + 1:fin])
        # El cuerpo se guarda entero y en orden, que es lo que necesita
        # compilar_docx.js. columnas/filas se exponen además al margen porque la
        # plantilla y el validador los esperan ahí, pero son un reflejo del
        # primer bloque de tabla, no una segunda copia que haya que maquetar.
        if cuerpo:
            anexo["contenido"] = cuerpo
        tabla = next((b for b in cuerpo if b["type"].startswith("Tabla")), None)
        if tabla:
            anexo["columnas"] = tabla["columnas"]
            anexo["filas"] = tabla["filas"]
        anexos.append(anexo)
    return anexos


def seccion_10(rec):
    llamada = next((x for x in rec if x["fn"] == "controlCambios"), None)
    filas = llamada["args"][1] if llamada and len(llamada["args"]) > 1 else []
    if not filas:
        # controlCambios() no recibe argumentos: la tabla vive en la librería
        filas = [["1", "(vigencia)", "Creación del Protocolo."]]
    return [{"type": "CambioVersion", "version": f[0] or "1",
             "descripcionCambio": f[2]} for f in filas if f[2]]


# ── bibliografía ──────────────────────────────────────────────────────────────

def cargar_cache():
    if not os.path.exists(CACHE):
        return {}
    try:
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f).get("entradas", {})
    except (OSError, json.JSONDecodeError):
        return {}


def citaciones(rec, entradas):
    llamada = next((x for x in rec if x["fn"] == "biblio"), None)
    refs = llamada["args"][0] if llamada else []

    # orden de primera aparición, para el campo primeraAparicion
    orden, vistas = {}, set()
    for x in rec:
        for campo in x["args"]:
            for t in re.findall(r"\[\[([\d,\s–-]+)\]\]", json.dumps(campo, ensure_ascii=False)):
                for tok in re.split(r"[,–-]", t):
                    tok = tok.strip()
                    if tok.isdigit() and int(tok) not in vistas:
                        vistas.add(int(tok))
                        orden[int(tok)] = len(vistas)

    salida = []
    for i, ref in enumerate(refs, start=1):
        doi = DOI_RE.search(ref)
        doi = doi.group(1).rstrip(".,;)]}") if doi else None
        entrada = entradas.get("doi:" + doi.lower()) if doi else None
        reg = (entrada or {}).get("registro") or {}
        cita = {"type": "ArticuloAcademico", "position": i,
                "primeraAparicion": str(orden.get(i, i)), "vancouver": ref}
        if reg.get("titulo"):
            cita["name"] = reg["titulo"]
        if reg.get("anio"):
            cita["datePublished"] = reg["anio"]
        if reg.get("revista"):
            cita["schema:isPartOf"] = {"type": "schema:Periodical",
                                       "name": reg["revista"]}
        if doi:
            cita["doi"] = doi
            cita["url"] = "https://doi.org/" + doi
        if reg.get("pmid"):
            cita["pmid"] = reg["pmid"]
        if entrada and entrada.get("consultado"):
            cita["verificado"] = entrada["consultado"]
        salida.append(cita)
    return salida


# ── ensamblado ────────────────────────────────────────────────────────────────

def armar(generador, meta):
    rec = grabar(generador)
    h1 = cortar(rec, "h1")
    h1.append(len(rec))
    tramos = {}
    for n in range(len(h1) - 1):
        titulo = rec[h1[n]]["args"][0]
        tramos[numeral(titulo) or str(n + 1)] = rec[h1[n]:h1[n + 1]]

    doc_meta = next((x for x in rec if x["fn"] == "buildDoc"), None)
    titulo, codigo, version, _, fecha_elab = doc_meta["args"]
    # La portada y el membrete llevan la fecha con distinta puntuación
    # («Julio, 2026» frente a «Julio 2026»); se guardan las dos.
    port = next((x for x in rec if x["fn"] == "portada"), None)
    fecha_port = port["args"][2] if port and len(port["args"]) > 2 else fecha_elab

    partes = []
    for num, nombre, sec_type in SECCIONES:
        tramo = tramos.get(num, [])
        sec = {"type": "Seccion", "numeral": num, "name": nombre,
               "secType": sec_type}

        if num == "1":
            sec["contenido"] = bloques(tramo, 1)
        elif num == "2":
            gen, esp = seccion_2(tramo)
            sec["objetivoGeneral"] = gen
            sec["objetivosEspecificos"] = esp
        elif num == "3":
            gl, ab = seccion_3(tramo)
            sec["glosario"], sec["abreviaciones"] = gl, ab
        elif num == "4":
            marcas = [i for i, x in enumerate(tramo) if x["fn"] == "h2"]
            subs = []
            for k, ini in enumerate(marcas):
                fin = marcas[k + 1] if k + 1 < len(marcas) else len(tramo)
                sub_num = numeral(tramo[ini]["args"][0]) or SUBSECCIONES[k][0]
                nombre_norm = dict(SUBSECCIONES).get(sub_num, tramo[ini]["args"][0])
                sub = {"type": "Seccion", "numeral": sub_num, "name": nombre_norm}
                quien = next((x for x in tramo[ini:fin] if x["fn"] == "who"), None)
                if quien:
                    sub["quienLoHace"] = quien["args"][0]
                    sub["cuando"] = quien["args"][1]
                sub["contenido"] = bloques(tramo[ini + 1:fin])
                subs.append(sub)
            sec["hasPart"] = subs
        elif num == "6":
            sec["indicadores"] = seccion_6(tramo)
            titulo_tabla = titulo_tabla_6(tramo)
            if titulo_tabla:
                sec["tituloTabla"] = titulo_tabla
        elif num == "8":
            sec["anexos"] = seccion_8(tramo)
        elif num == "10":
            sec["controlCambios"] = seccion_10(rec)
        elif num != "7":
            sec["contenido"] = bloques(tramo, 1)

        partes.append(sec)

    autor = meta["autor"]
    doc = {
        "@context": ["https://schema.org", "./protocolo.context.jsonld"],
        "type": ["GuiaMedica", "schema:CreativeWork"],
        "id": "urn:hecam:protocolo:" + codigo,
        "identifier": codigo,
        "codigoProvisional": meta.get("codigoProvisional", True),
        "name": titulo,
        "tipoDocumento": "Protocolo Clínico",
        "unidadTecnica": meta["unidadTecnica"],
        "version": version,
        "estado": meta.get("estado", "borrador"),
        "inLanguage": "es-EC",
        "dateCreated": meta["dateCreated"],
        "mesAnioPortada": fecha_port,
        "fechaElaboracionTexto": fecha_elab,
        "vigenciaAnios": meta.get("vigenciaAnios", 3),
        "description": meta["description"],
        "publisher": {
            "type": "Organizacion",
            "name": "Hospital de Especialidades Carlos Andrade Marín",
            "alternateName": "HECAM",
            "schema:parentOrganization": {
                "type": "Organizacion",
                "name": "Instituto Ecuatoriano de Seguridad Social",
                "alternateName": "IESS"},
            "schema:address": {
                "type": "schema:PostalAddress",
                "schema:addressLocality": "Quito",
                "schema:addressRegion": "Pichincha",
                "schema:addressCountry": "EC"},
        },
        "recognizingAuthority": {"type": "Organizacion",
                                 "name": "Dirección Técnica del HECAM"},
        "audience": {
            "type": "AudienciaMedica",
            "schema:audienceType": "Personal médico y de enfermería del HECAM",
            "name": "Pacientes adultos (≥18 años) atendidos en el HECAM"},
        "guidelineSubject": {
            "type": "CondicionMedica",
            "name": meta["condicion"]["name"],
            "schema:code": {"type": "CodigoMedico",
                            "schema:codeValue": meta["condicion"]["cie10"],
                            "schema:codingSystem": "CIE-10"}},
        "evidenceOrigin": "Oxford Centre for Evidence-Based Medicine (CEBM), marzo 2009",
        "normativaAplicable": [
            {"identifier": "HECAM-CC-P-001 v13",
             "name": "Creación, Actualización y Control de Documentos"},
            {"identifier": "HECAM-CC-IT-008 v4",
             "name": "Elaboración de Protocolos Clínicos"},
            {"identifier": "HECAM-CC-FR-012 V3.0", "name": "Formato de Protocolos"},
        ],
        "author": [{
            "type": ["Rol", "RolElaboracion"],
            "roleName": "Elaborado por", "bloqueFirma": "Elaborado por:",
            "ordenFirma": 3,
            "author": {
                "type": "Persona",
                "honorificPrefix": autor.get("honorificPrefix", "Dr."),
                "name": autor["name"], "jobTitle": autor["jobTitle"],
                "schema:memberOf": {"type": "Organizacion",
                                    "name": autor["unidad"]},
                "worksFor": {"type": "Organizacion",
                             "name": "Hospital de Especialidades Carlos Andrade Marín"}},
        }],
        "revisionEditorial": {
            "type": ["Rol", "RolRevisionEditorial"],
            "roleName": "Revisión de forma y estilo editorial",
            "alcanceRevision": "forma",
            "instancia": "Coordinación General de Investigación",
            "description": "Fija el formato editorial de la serie completa de "
                           "protocolos. No revisa el contenido científico.",
            # Sin 'name': la revisora todavía no está nominada. El hueco se deja
            # explícito en vez de rellenarlo con un marcador.
            "contributor": {
                "type": "Persona",
                "jobTitle": "Revisora de Protocolos Clínicos",
                "worksFor": {"type": "Organizacion",
                             "name": "Coordinación General de Investigación — HECAM"}},
            "reglasVigentes": {
                "citasEnSuperindice": True,
                "bibliografiaOrdenAparicion": True,
                "aplicaASerieCompleta": True,
                "responsabilidadContenidoCientifico": "autor",
                "restriccionFarmacos": "CNMB",
                "documentoDeReglas": "docs/matriz-editorial.md"},
        },
        "contributor": (
            [{"type": ["Rol", "RolAprobacion"], "roleName": "Aprobado por",
              "bloqueFirma": "Aprobado por:", "ordenFirma": 1,
              "contributor": {"type": "Persona", "jobTitle": "Director Técnico"}}]
            + [{"type": ["Rol", "RolRevisionInstitucional"],
                "roleName": "Revisado por", "bloqueFirma": "Revisado por:",
                "ordenFirma": 2, "position": i,
                "contributor": {"type": "Persona", "jobTitle": cargo}}
               for i, cargo in enumerate(REVISORES, start=1)]
        ),
        "hasPart": partes,
        "citation": citaciones(rec, cargar_cache()),
    }

    # El índice lleva números de página, que no se pueden deducir del contenido:
    # dependen de cómo pagine Word. Se conservan tal y como los declaró el
    # generador para que compilar_docx.js pueda reproducirlos.
    indice = [{"numeral": x["args"][0], "name": x["args"][1],
               "pagina": x["args"][2],
               **({"subseccion": True} if len(x["args"]) > 3 and x["args"][3] else {})}
              for x in rec if x["fn"] == "tocItem"]
    if indice:
        doc["indice"] = indice

    # El nombre del archivo es una decisión editorial, no algo que se deduzca del
    # título: los existentes van sin tildes y abreviados. Se conserva el que
    # declaró el generador para que compilar_docx.js no lo cambie.
    esc = next((x for x in rec if x["fn"] == "escribir"), None)
    if esc:
        doc["nombreArchivo"] = os.path.basename(esc["args"][0].replace("\\", "/"))

    return doc


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    generador = os.path.abspath(sys.argv[1])
    carpeta = os.path.dirname(generador)
    ruta_meta = os.path.join(carpeta, "metadatos.json")
    if not os.path.exists(ruta_meta):
        sys.exit("Falta %s con los datos que el generador no conoce." % ruta_meta)
    with open(ruta_meta, encoding="utf-8") as f:
        meta = json.load(f)

    doc = armar(generador, meta)
    destino = os.path.join(carpeta, "protocolo.jsonld")
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("Escrito %s" % destino)
    print("  secciones: %d | referencias: %d | indicadores: %d"
          % (len(doc["hasPart"]), len(doc["citation"]),
             len(doc["hasPart"][5].get("indicadores", []))))
    con_pmid = sum(1 for c in doc["citation"] if c.get("pmid"))
    print("  referencias con PMID recuperado de la caché: %d" % con_pmid)
    return 0


if __name__ == "__main__":
    sys.exit(main())
