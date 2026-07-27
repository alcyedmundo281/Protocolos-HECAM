---
name: hecam-protocolos
description: Pipeline genérico para compilar y verificar protocolos clínicos del Hospital de Especialidades Carlos Andrade Marín (HECAM / IESS, Quito). Compone el .docx institucional desde un generador en JavaScript y lo somete a tres verificaciones independientes: maquetación de carátula y membrete, orden correlativo de las citas, y existencia real de cada referencia contra PubMed y Crossref. Usar al crear un protocolo nuevo, al corregir uno existente, o al comprobar que una bibliografía no contiene citas inventadas.
---

# Pipeline de protocolos HECAM

Esta carpeta es la parte **genérica y reutilizable**: la librería de composición,
los verificadores y las referencias normativas. No contiene contenido clínico.
Cada protocolo vive en `produccion/<CODIGO>-<nombre>/` con su propio generador y
su propia carpeta `salida/`.

El principio del repositorio es que **el `.docx` no se edita a mano**: se edita
el generador y se vuelve a compilar. Así la maquetación no se degrada iteración
tras iteración.

## Cuándo usar esta skill

- Crear un protocolo nuevo en el formato institucional HECAM-CC-FR-012.
- Corregir uno existente sin romper la maquetación aprobada.
- Comprobar que una bibliografía no contiene citas fabricadas.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `lib/hecam-lib.js` | Composición del documento: membrete, carátula, tablas, firmas |
| `assets/` | Logotipos institucionales y barra del título |
| `scripts/verificar_caratula.py` | Compara la maquetación contra la referencia aprobada |
| `scripts/verificar_documento.py` | Comprueba que las piezas institucionales existan y estén enlazadas |
| `scripts/verificar_pmid.py` | Comprueba cada referencia contra PubMed y Crossref |
| `scripts/check_citas.py` | Verifica que las citas vayan en orden correlativo |
| `scripts/build_jats.py` | JSON-LD → JATS 1.3 para archivo y DOI |
| `scripts/validate_jsonld.py` | Valida la matriz antes de compilar |
| `referencia/caratula.json` | Medidas aprobadas de carátula y membrete |
| `referencia/pmid-cache.json` | Registros de PubMed ya verificados, con su fecha |
| `referencia/protocolo.template.jsonld` | Plantilla de la matriz editorial |

## Cómo se usa

Desde la raíz del repositorio:

```bash
make generar      # compila cada produccion/*/salida/*.docx
make verificar    # maquetación y orden de citas
make fuentes      # bibliografía contra PubMed y Crossref
make todo         # las tres cosas
```

Un protocolo suelto:

```bash
node produccion/HECAM-MI-PR-001-sepsis/sepsis.js
python3 skill/scripts/verificar_pmid.py produccion/HECAM-MI-PR-001-sepsis/sepsis.js
```

Los scripts de Python localizan `referencia/` subiendo un nivel desde su propia
ubicación, así que funcionan desde cualquier directorio de trabajo. Los
generadores resuelven su salida con `__dirname`, por lo mismo.

## Añadir un protocolo

1. Crear `produccion/<CODIGO>-<nombre>/` y copiar un generador existente como
   punto de partida.
2. Ajustar `require('../../skill/lib/hecam-lib.js')` y la ruta de salida, que
   debe construirse con `path.join(__dirname, 'salida', ...)`.
3. Compilar y pasar las tres verificaciones antes de mandar a revisión.

## Las cuatro verificaciones, y por qué son cuatro

Son independientes a propósito: cada una detecta un fallo que las otras no ven.

- **Maquetación.** Lee `word/document.xml` y compara posiciones, tamaños y
  márgenes contra `referencia/caratula.json`. La referencia solo se regenera
  cuando la revisora aprueba un cambio de formato, nunca para «hacer que pase»
  una compilación.
- **Piezas institucionales.** Comprueba que existan y estén bien enlazadas: que
  las tres imágenes salgan de `assets/` —comparadas por hash, no por nombre—,
  que el marco sea autoforma y no una imagen, que el membrete vaya en el
  encabezado de las páginas siguientes y no en la carátula, y que la paginación
  use campos automáticos en vez de texto fijo. La verificación de maquetación no
  lo cubre: mide dónde caen las cosas, no si son las correctas. Un logotipo
  sustituido por otro del mismo tamaño pasaría la primera y falla esta.
- **Orden de citas.** El formato exige bibliografía en orden de aparición.
  Insertar una referencia obliga a renumerar todas las posteriores, y es un
  error fácil de cometer y difícil de ver a simple vista.
- **Fuentes.** Comprueba que cada referencia exista. Detecta citas fabricadas,
  DOI mal copiados y títulos alterados. Ver el README para el detalle de los
  veredictos y de por qué solo la búsqueda por DOI se considera concluyente.
