#!/usr/bin/env python3
"""
verificar_firmas.py — Firma quien interviene, e interviene quien firma.

    python3 skill/scripts/verificar_firmas.py produccion/*/protocolo.jsonld

De la observación 28 de la revisora: «Se deben colocar a todas las Coordinaciones
y Jefaturas que intervienen en el protocolo, deben colocarse en orden
jerárquico; se han agregado algunas continuar según corresponda».

La regla se lee en lo que ella misma añadió. Al bloque de coordinaciones
generales le sumó dos jefaturas de unidad —Áreas Clínicas (PROA) y Cuidados
Intensivos Adultos— que ya quedaban cubiertas por su coordinación. Es decir: la
coordinación general no absorbe a la unidad. Cada unidad que interviene firma
por su cuenta, y «continuar según corresponda» significa seguir esa lista.

Por eso el script no da por buena la cobertura jerárquica. Cruza las unidades
que el protocolo nombra *en su contenido* contra los cargos del bloque de
firmas, y avisa en las dos direcciones:

  · interviene y no firma  → falta una jefatura
  · firma y no interviene  → firmante heredado de otro protocolo

La segunda dirección importa tanto como la primera: los tres protocolos nacieron
con la misma lista de siete revisores, así que hay firmantes que no pintan nada
en el suyo.

El bloque de firmas se excluye del texto donde se buscan las menciones; si no,
todo firmante se justificaría a sí mismo.

Código de salida 0 si no hay hallazgos, 1 si los hay.
"""

import json
import re
import sys

# unidad → (patrón que delata su intervención en el contenido, cargo firmante)
#
# El patrón exige la mención de la unidad, no de la enfermedad ni del examen:
# «Nefrología» sí, «renal» no. Los nombres de cargo siguen el patrón de los dos
# que añadió la revisora.
UNIDADES = [
    ("Emergencia",
     r"\bEmergencia\b",
     "Jefe de la Unidad Técnica de Emergencia"),
    ("Cuidados Intensivos",
     r"Cuidados Intensivos|\bUCI\b",
     "Jefe de la Unidad de Cuidados Intensivos Adultos"),
    ("Medicina Interna",
     r"Medicina Interna",
     "Jefe de la Unidad Técnica de Medicina Interna"),
    ("Infectología",
     r"Infectolog",
     "Jefe de la Unidad Técnica de Infectología"),
    ("Nefrología",
     r"Nefrolog",
     "Jefe de la Unidad Técnica de Nefrología"),
    ("Urología",
     r"Urolog",
     "Jefe de la Unidad Técnica de Urología"),
    ("Servicios Quirúrgicos",
     r"Servicios Quirúrgicos|Cirugía General",
     "Jefe de la Unidad Técnica de Cirugía General"),
    ("Laboratorio Clínico",
     r"Laboratorio Clínico|Laboratorio de Bacteriología|Bacteriología",
     "Jefe de la Unidad Técnica de Laboratorio Clínico"),
    ("Imagenología",
     r"Imagenolog",
     "Jefe de la Unidad Técnica de Imagenología"),
    ("Farmacia",
     r"\bFarmacia\b",
     "Jefe de la Unidad Técnica de Farmacia"),
    ("Nutrición y Dietética",
     r"Nutrición y Dietética",
     "Jefe de la Unidad Técnica de Nutrición y Dietética"),
    ("PROA",
     r"\bPROA\b|Programa de Optimización",
     "Jefe de Áreas Clínicas (Presidente PROA)"),
    ("Enfermería",
     r"Enfermer[íi]a",
     "Líder de Enfermería"),
]

# Cargos que firman siempre, intervengan o no en la clínica: gobiernan el
# documento, no el cuadro. No se les exige aparecer en el contenido.
INSTITUCIONALES = re.compile(r"Director Técnico|Coordinador General")

# Secciones donde nombrar a una unidad la compromete: la justificación declara
# quién participa, y el control de calidad y los indicadores le asignan tarea.
# Aparecer solo en la sección 4 es intervención clínica —una interconsulta— y
# se avisa, pero no se exige firma: quién de ellos firma es decisión de Control
# de Calidad, no del script.
COMPROMETEN = {"1", "5", "6"}

# Orden jerárquico exigido, de mayor a menor. Entre jefaturas de unidad, que
# no se ordenan entre sí, se sigue el recorrido del paciente: puerta de
# entrada, área crítica, servicio tratante, subespecialidades, apoyo
# diagnóstico y terapéutico, y por último enfermería.
ORDEN = [
    "Director Técnico",
    "Coordinador General de Investigación",
    "Coordinador General de Control de Calidad",
    "Coordinador General de Hospitalización y Ambulatorio",
    "Coordinador General de Áreas Críticas",
    "Coordinador General de Diagnóstico y Tratamiento",
    "Jefe de Áreas Clínicas (Presidente PROA)",
    "Jefe de la Unidad de Cuidados Intensivos Adultos",
    "Jefe de la Unidad Técnica de Emergencia",
    "Jefe de la Unidad Técnica de Medicina Interna",
    "Jefe de la Unidad Técnica de Infectología",
    "Jefe de la Unidad Técnica de Nefrología",
    "Jefe de la Unidad Técnica de Urología",
    "Jefe de la Unidad Técnica de Cirugía General",
    "Jefe de la Unidad Técnica de Laboratorio Clínico",
    "Jefe de la Unidad Técnica de Imagenología",
    "Jefe de la Unidad Técnica de Farmacia",
    "Jefe de la Unidad Técnica de Nutrición y Dietética",
    "Líder de Enfermería",
]


def rango(cargo):
    return ORDEN.index(cargo) if cargo in ORDEN else len(ORDEN)


def secciones_donde_aparece(doc, patron):
    """Numerales de las secciones que nombran la unidad.

    Se recorre solo `hasPart`, con lo que el bloque de firmas queda fuera; si
    no, todo firmante se justificaría a sí mismo. La bibliografía es la
    sección 9 y también queda descartada más abajo.
    """
    vistas = []
    for s in doc.get("hasPart", []):
        if s.get("numeral") == "9":
            continue
        if re.search(patron, json.dumps(s, ensure_ascii=False)):
            vistas.append(s.get("numeral"))
    return vistas


def revisar(ruta):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    firmas = [(c.get("ordenFirma", 9), c.get("position", 0),
               (c.get("contributor") or {}).get("jobTitle") or "")
              for c in doc.get("contributor") or []]
    firmas = sorted(f for f in firmas if f[2])
    cargos = [c for _, _, c in firmas]

    faltan, sobran, avisos = [], [], []
    for unidad, patron, cargo in UNIDADES:
        vistas = secciones_donde_aparece(doc, patron)
        firma = cargo in cargos
        if firma and not vistas:
            sobran.append((unidad, cargo))
        elif not firma and COMPROMETEN & set(vistas):
            faltan.append((unidad, cargo, ",".join(vistas)))
        elif not firma and vistas:
            avisos.append((unidad, cargo, ",".join(vistas)))

    revisores = [c for o, _, c in firmas if o == 2]
    desorden = [(a, b) for a, b in zip(revisores, revisores[1:])
                if rango(a) > rango(b)]

    print("Revisando %s" % doc.get("identifier"))
    print("  firmantes: %d (%d revisores)" % (len(firmas), len(revisores)))

    for unidad, cargo, ss in faltan:
        print("  FALLA: %s consta en la sección %s y no firma; falta «%s»"
              % (unidad, ss, cargo))
    for unidad, cargo in sobran:
        print("  FALLA: «%s» firma y %s no aparece en el protocolo" % (cargo, unidad))
    for a, b in desorden:
        print("  FALLA: orden jerárquico: «%s» va antes que «%s»" % (a, b))
    for unidad, cargo, ss in avisos:
        print("  AVISO: %s interviene en la sección %s; valorar «%s»"
              % (unidad, ss, cargo))

    if not (faltan or sobran or desorden):
        print("  OK — firma quien interviene, en orden jerárquico.")
    print()
    return 1 if (faltan or sobran or desorden) else 0


def main():
    rutas = sys.argv[1:]
    if not rutas:
        print(__doc__)
        return 2
    return max(revisar(r) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
