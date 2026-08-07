#!/usr/bin/env python3
"""
verificar_citas_matriz.py — `primeraAparicion` dice la verdad.

    python3 skill/scripts/verificar_citas_matriz.py produccion/*/protocolo.jsonld
    python3 skill/scripts/verificar_citas_matriz.py --corregir produccion/*/protocolo.jsonld

Cada referencia declara en qué sección aparece por primera vez. En dos de los
tres protocolos ese campo guardaba el número de la referencia y no el de la
sección —«17», «18», «19», que no son secciones de nada—: un residuo de cuando
la matriz se derivaba del generador .js, donde el dato no existía.

No se ve en el .docx, que imprime la bibliografía por posición, y por eso
ninguna capa lo detectaba. Pero la matriz es el registro normativo, y de ella
sale el JATS de archivo.

El recorrido reproduce el del compilador: las secciones en orden de numeral y,
dentro de cada una, el contenido en el orden en que está escrito. La primera
sección donde aparece `[[n]]` es la respuesta.

Código de salida 0 si todos los campos concuerdan, 1 si alguno no.
"""

import json
import re
import sys

CITA = re.compile(r"\[\[([\d,\s–—-]+)\]\]")


def numeros(texto):
    """Los números citados en un fragmento, resolviendo los rangos [[3-5]]."""
    salida = []
    for grupo in CITA.findall(texto):
        for parte in grupo.split(","):
            parte = parte.strip().replace("–", "-").replace("—", "-")
            if "-" in parte:
                a, b = parte.split("-", 1)
                if a.strip().isdigit() and b.strip().isdigit():
                    salida.extend(range(int(a), int(b) + 1))
            elif parte.isdigit():
                salida.append(int(parte))
    return salida


def clave(numeral):
    """Ordena «4.10» después de «4.9» y no antes, como haría el orden textual."""
    return tuple(int(p) for p in numeral.split(".") if p.isdigit())


def primeras_apariciones(doc):
    """{número de referencia: numeral de la sección donde aparece primero}."""
    vistas = {}
    secciones = sorted(doc.get("hasPart", []), key=lambda s: clave(s["numeral"]))
    for s in secciones:
        # Una sección con subsecciones cita a través de ellas; se recorren en
        # su propio orden para que 4.2 no adelante a 4.1.
        partes = [s] + sorted(s.get("hasPart") or [], key=lambda x: clave(x["numeral"]))
        for parte in partes:
            propio = dict(parte)
            propio.pop("hasPart", None)
            for n in numeros(json.dumps(propio, ensure_ascii=False)):
                vistas.setdefault(n, parte["numeral"])
    return vistas


def revisar(ruta, corregir=False):
    with open(ruta, encoding="utf-8") as f:
        doc = json.load(f)

    reales = primeras_apariciones(doc)
    validas = {s["numeral"] for s in doc.get("hasPart", [])}
    validas |= {x["numeral"] for s in doc.get("hasPart", [])
                for x in (s.get("hasPart") or [])}

    fallos, arreglados = [], 0
    for c in doc.get("citation", []):
        n = c.get("position")
        declarada = c.get("primeraAparicion")
        real = reales.get(n)
        if real is None:
            # Una referencia que no se cita en ninguna parte es otro problema,
            # y de ese ya se ocupa check_citas.py sobre el .docx.
            continue
        if declarada != real:
            motivo = ("no es una sección" if declarada not in validas
                      else "la primera cita está en %s" % real)
            fallos.append((n, declarada, real, motivo))
            if corregir:
                c["primeraAparicion"] = real
                arreglados += 1

    print("Revisando %s" % doc.get("identifier"))
    if not fallos:
        print("  OK — las %d referencias declaran bien su primera aparición.\n"
              % len(doc.get("citation", [])))
        return 0

    print("  %d referencia(s) con 'primeraAparicion' equivocada" % len(fallos))
    for n, declarada, real, motivo in fallos[:8]:
        print("      · ref %-3d dice %-6r → %-6r  (%s)" % (n, declarada, real, motivo))
    if len(fallos) > 8:
        print("      … y %d más" % (len(fallos) - 8))

    if corregir:
        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("  corregidas %d.\n" % arreglados)
        return 0
    print()
    return 1


def main():
    args = sys.argv[1:]
    corregir = "--corregir" in args
    rutas = [a for a in args if not a.startswith("-")]
    if not rutas:
        print(__doc__)
        return 2
    return max(revisar(r, corregir) for r in rutas)


if __name__ == "__main__":
    sys.exit(main())
