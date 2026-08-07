#!/usr/bin/env python3
"""
verificar_farmacos.py — Todo fármaco o fluido va en el tratamiento farmacológico.

    python3 skill/scripts/verificar_farmacos.py produccion/*/protocolo.jsonld

Dos observaciones de la revisora, comprobadas sobre la matriz:

  «Esta información corresponde a tratamiento farmacológico» (comentario 10),
  sobre la resucitación con cristaloides, que estaba bajo el apartado de
  intervenciones **no** farmacológicas. La hidratación cuenta como fármaco.

  «Colocar el nombre completo del servicio. Revisar en toda la tabla: Unidad
  Técnica de Medicina Interna, Unidad Técnica de Cuidados Intensivos etc.»
  (comentario 22).

Los nombres de fármaco no se listan a mano: se extraen de las propias tablas
farmacológicas del protocolo, de modo que la comprobación se adapta a cada uno
sin mantener un vademécum en el código.

Los servicios se reportan en dos niveles. En una celda que asigna destino o
responsable, la abreviatura es un hallazgo. En una cabecera o en un descriptor
de muestra —«E. coli — bacteriemia UCI (n=30)»— se avisa pero no se falla:
escribir ahí el nombre completo haría la tabla ilegible, y esa es una decisión
editorial que conviene acordar con ella.

Código de salida 0 si no hay hallazgos, 1 si los hay.
"""

import json
import os
import re
import sys

NO_FARMA = re.compile(r"no\s+farmacol", re.I)

# Fluidos y sueros: cuentan como tratamiento farmacológico aunque el texto no
# mencione la vía. Es el caso que la revisora marcó.
FLUIDOS = re.compile(
    r"cristaloide|soluci[oó]n salina|lactato de ringer|ringer lactato|"
    r"suero fisiol[oó]gico|dextrosa|coloide|albúmina|hidrataci[oó]n", re.I)

DOSIS = re.compile(
    r"\d+\s*(?:mg|mcg|µg|mL|ml|UI|mmol|mEq)\b|\bmcg/kg/min\b|\bmL\s*/\s*kg\b",
    re.I)
# El gramo se escribe en minúscula. «Calibre ≥ 18 G» es el grosor de un catéter,
# y confundirlo con 18 gramos marcaba una canalización venosa como si fuera una
# prescripción, que es justo lo contrario de lo que se busca.
GRAMOS = re.compile(r"\d+\s*g\b")
VIA = re.compile(r"\bIV\b|\bVO\b|\bSC\b|intravenos|vía oral|infusi[oó]n", re.I)

# Abreviaturas de servicio. PROA-HECAM es el nombre propio del programa.
ABREV = re.compile(r"(?<![\w])(MI|UCI|UCIA|CC|EM|MDI|CE)(?![\w/])")
DESCRIPTOR = re.compile(r"\(n\s*=|—|--")


def farmacos_del_protocolo(doc):
    """Nombres de fármaco tomados de las tablas farmacológicas del propio texto."""
    nombres = set()

    def walk(n):
        if isinstance(n, list):
            for x in n:
                walk(x)
        elif isinstance(n, dict):
            titulo = (n.get("titulo") or "").lower()
            if any(k in titulo for k in ("antimicrobian", "antibioticoterapia",
                                         "farmacol", "secuencial oral")):
                for fila in n.get("filas") or []:
                    for celda in fila[:3]:
                        for m in re.finditer(r"\b([A-Za-zÁÉÍÓÚáéíóúñ]{6,})\b",
                                             str(celda)):
                            p = m.group(1).lower()
                            if p.endswith(("cina", "mina", "ciclina", "bactam",
                                           "penem", "xacino", "zolid", "azol",
                                           "micina", "sona", "trexato")):
                                nombres.add(p)
            for v in n.values():
                walk(v)

    walk(doc.get("hasPart"))
    return nombres


def recorrer_con_subtitulo(doc):
    """Textos del documento con el subtítulo vigente y su sección."""
    salida = []

    def bloques(sec, ruta):
        sub = ""
        for b in sec.get("contenido") or []:
            if b.get("type") == "Subtitulo":
                sub = b.get("text", "")
                continue
            for k in ("text",):
                if isinstance(b.get(k), str):
                    salida.append((ruta, sub, b[k]))
            for it in b.get("itemListElement") or []:
                salida.append((ruta, sub, it))

    for s in doc.get("hasPart") or []:
        bloques(s, s.get("numeral", "?"))
        for sub in s.get("hasPart") or []:
            bloques(sub, sub.get("numeral", "?"))
    return salida


def tablas(doc):
    out = []

    def walk(n, ruta):
        if isinstance(n, list):
            for x in n:
                walk(x, ruta)
        elif isinstance(n, dict):
            r = n.get("numeral") or ruta
            if str(n.get("type", "")).startswith("Tabla") or (
                    n.get("type") == "Anexo" and n.get("columnas")):
                out.append((r, n.get("titulo") or n.get("name") or "", n))
            for k, v in n.items():
                if k not in ("type",):
                    walk(v, r)

    walk(doc.get("hasPart"), "?")
    return out


def revisar(ruta):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    farmacos = farmacos_del_protocolo(doc)
    fallos, avisos = [], []

    # ── 1. fármacos y fluidos bajo «no farmacológicas» ───────────────────────
    for seccion, sub, texto in recorrer_con_subtitulo(doc):
        if not NO_FARMA.search(sub or ""):
            continue
        motivo = None
        if FLUIDOS.search(texto):
            motivo = "menciona fluidos o hidratación"
        elif (DOSIS.search(texto) or GRAMOS.search(texto)) and VIA.search(texto):
            motivo = "indica dosis y vía"
        else:
            hallado = next((f for f in farmacos if f in texto.lower()), None)
            if hallado and (DOSIS.search(texto) or GRAMOS.search(texto)):
                motivo = "prescribe %s" % hallado
        if motivo:
            fallos.append(("farmaco-mal-ubicado", "%s / %s" % (seccion, sub[:30]),
                           "%s: «%s…»" % (motivo, texto[:96])))

    # ── 2. abreviaturas de servicio en tablas ────────────────────────────────
    vistas = set()
    for seccion, titulo, t in tablas(doc):
        clave = (seccion, titulo)
        if clave in vistas:
            continue          # los anexos exponen su tabla dos veces
        vistas.add(clave)
        for c in t.get("columnas") or []:
            m = ABREV.search(str(c))
            if m:
                avisos.append(("servicio-en-cabecera", seccion,
                               "cabecera «%s» usa %s" % (str(c)[:40], m.group(1))))
        for fila in t.get("filas") or []:
            for celda in fila:
                celda = str(celda)
                m = ABREV.search(celda)
                if not m:
                    continue
                destino = ("servicio-en-cabecera"
                           if DESCRIPTOR.search(celda) and len(celda) < 60
                           else "servicio-abreviado")
                item = (destino, seccion,
                        "«%s» usa %s" % (celda[:56], m.group(1)))
                (avisos if destino == "servicio-en-cabecera" else fallos).append(item)

    return doc, fallos, avisos


ETIQUETAS = {
    "farmaco-mal-ubicado": "Fármaco o fluido fuera del tratamiento farmacológico",
    "servicio-abreviado": "Servicio abreviado en una celda",
    "servicio-en-cabecera": "Servicio abreviado en cabecera o descriptor de muestra",
}


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2

    total = 0
    for ruta in rutas:
        doc, fallos, avisos = revisar(ruta)
        print("Revisando %s" % doc.get("identifier"))
        for etiqueta, grupo, marca in (("FALLA", fallos, "·"),
                                       ("aviso", avisos, "-")):
            por_regla = {}
            for regla, donde, detalle in grupo:
                por_regla.setdefault(regla, []).append((donde, detalle))
            for regla, items in por_regla.items():
                print("  %s  %s (%d)" % (etiqueta, ETIQUETAS.get(regla, regla),
                                         len(items)))
                for donde, detalle in items[:5]:
                    print("      %s [%s] %s" % (marca, donde, detalle))
                if len(items) > 5:
                    print("      %s … y %d más" % (marca, len(items) - 5))
        if not fallos and not avisos:
            print("  OK — sin hallazgos.")
        elif not fallos:
            print("  OK — solo avisos de cabecera, que son decisión editorial.")
        print()
        total += len(fallos)

    if total:
        print("Total: %d hallazgo(s) que corregir." % total)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
