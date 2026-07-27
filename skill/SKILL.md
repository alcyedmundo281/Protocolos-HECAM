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
| `scripts/compilar_docx.js` | Compila el `protocolo.jsonld` al `.docx` institucional |
| `scripts/grabar_estructura.js` | Captura la estructura semántica de un generador |
| `scripts/armar_jsonld.py` | Reconstruye el `protocolo.jsonld` desde el generador |
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

## La matriz JSON-LD

El `.docx` es la salida para firma; el `protocolo.jsonld` es el registro
normativo, y de él salen el JATS de archivo y la validación contra la norma.

```bash
make matriz     # reconstruye produccion/*/protocolo.jsonld desde cada generador
make validar    # comprueba la matriz contra HECAM-CC-IT-008
make jats       # matriz -> JATS 1.3 para depósito
```

`armar_jsonld.py` no transcribe a mano: ejecuta el generador con la librería
instrumentada por `grabar_estructura.js` y reconstruye las secciones desde la
secuencia real de llamadas. Se lee el generador y no el `.docx` porque el `.docx`
ya perdió la distinción entre un párrafo y una viñeta, o entre la tabla del
glosario y la de indicadores.

Cada protocolo necesita un `metadatos.json` junto al generador con lo que el
código no contiene: el resumen para indexación, el código CIE-10, las fechas y
los datos del autor.

Los `pmid` y `doi` de la bibliografía se rellenan desde
`referencia/pmid-cache.json`, de modo que lo verificado contra PubMed llegue al
XML de archivo en vez de quedarse en el `.docx`.

Los nombres de las secciones en la matriz son los **normativos**, no los del
generador: el `.docx` tiene variantes cosméticas —«Plan de Acción / Actuación»
con espacios alrededor de la barra— que no son las del HECAM-CC-FR-012.

## El autor de la tabla de firmas

`firmas()` rellena «Elaborado por:» con el autor por defecto de la Unidad Técnica
de Medicina Interna, definido en `lib/hecam-lib.js`. Los demás roles de la tabla
—Director Técnico y los siete revisores institucionales— son cargos, no
personas, y firman sobre la línea.

Un protocolo de otra unidad o de otro autor lo sobrescribe sin tocar la
librería:

```js
firmas({ nombre: 'Dra. …', unidad: 'Unidad Técnica de …' })
```

## Un protocolo nuevo: dos caminos

**Desde la matriz** (recomendado para protocolos nuevos). Se escribe el
`protocolo.jsonld` y el `.docx` sale de él:

```bash
python3 skill/scripts/validate_jsonld.py produccion/X/protocolo.jsonld
node    skill/scripts/compilar_docx.js  produccion/X/protocolo.jsonld
```

No hace falta tocar JavaScript. `compilar_docx.js` acepta estos bloques de
contenido: `Parrafo`, `Subtitulo`, `Vineta`, `Numerada`, `Lista` (con `estilo`),
`Nota`, `Tabla`, `TablaResistencia`, `Espacio`, `Semaforo` y `Divisor`. Un bloque
que no reconozca se maqueta como párrafo y avisa, en vez de perderse en silencio.

El campo `indice` lleva los números de página del contenido. No se pueden deducir
del texto —dependen de cómo pagine Word— así que hay que declararlos y revisarlos
cuando el contenido crezca. Sin `indice`, el compilador avisa y deja la columna
en blanco.

**Desde un generador `.js`**, como los dos protocolos existentes: se copia uno
como punto de partida, se ajusta `require('../../skill/lib/hecam-lib.js')` y la
ruta de salida con `path.join(__dirname, 'salida', ...)`, y la matriz se deriva
después con `armar_jsonld.py`.

Los dos caminos convergen: el `.docx` compilado desde la matriz y el compilado
desde el `.js` coinciden al 99,6 % en texto, con el mismo número de párrafos,
tablas y filas. Lo único que difiere son los nombres de sección, y a propósito:
la matriz usa los normativos y el generador arrastra variantes cosméticas.

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
