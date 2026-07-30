# Protocolos clínicos HECAM

Generación automatizada de protocolos clínicos del **Hospital de Especialidades
Carlos Andrade Marín** (HECAM / IESS, Quito) en el formato institucional exigido
por Control de Calidad, con salida `.docx` lista para revisión y firma.

El principio es que **el documento no se edita a mano**. La fuente de verdad es
`protocolo.jsonld`, y el `.docx` se compila desde ahí. Así la maquetación no
puede degradarse iteración tras iteración, que es el problema que este
repositorio existe para resolver.

---

## Requisitos

| | |
|---|---|
| Node.js | 18 o superior |
| Python | 3.9 o superior |
| LibreOffice | opcional, solo para la capa de render del verificador |
| Python: `pypdfium2`, `Pillow`, `numpy` | opcional, misma capa |

```bash
npm install
pip install pypdfium2 Pillow numpy     # opcional
```

---

## Uso

```bash
make generar      # compila cada produccion/*/salida/*.docx
make verificar    # comprueba que la maquetación no se movió
make fuentes      # comprueba contra PubMed que la bibliografía exista
make todo         # las tres cosas
```

Sin `make`:

```bash
node skill/scripts/compilar_docx.js produccion/*/protocolo.jsonld
python3 skill/scripts/verificar_caratula.py produccion/*/salida/*.docx
python3 skill/scripts/verificar_pmid.py produccion/*/protocolo.jsonld
```

---

## La referencia de maquetación

`skill/referencia/caratula.json` guarda las medidas de la carátula y el membrete tal y
como fueron aprobadas. `skill/scripts/verificar_caratula.py` compara cada compilación
contra ese archivo y **falla** si algo se desplazó.

Comprueba en dos capas:

1. **Geometría**, leída de `word/document.xml`: posición y tamaño de cada objeto
   anclado, alturas de línea de la carátula, márgenes, tamaño de página y ancho
   del membrete. No depende de ningún programa: es literalmente lo que leerá
   Word.
2. **Render** (si hay LibreOffice): convierte a PDF y mide en qué centímetro cae
   cada elemento, con 1,5 mm de tolerancia. También avisa si la hoja 2 sale casi
   vacía, señal de que la carátula se desbordó.

La referencia **solo se regenera cuando la revisora aprueba un cambio de
formato**, nunca para «hacer que pase» una compilación:

```bash
python3 skill/scripts/verificar_caratula.py --generar-referencia APROBADO.docx
```

Conviene revisar el `git diff` de `skill/referencia/caratula.json` antes de confirmar:
ahí se ve exactamente qué se movió y cuánto.

### Y las piezas, aparte de las medidas

`skill/scripts/verificar_documento.py` comprueba lo que la referencia de
maquetación no puede ver: que las piezas **sean** las correctas, no solo que
caigan donde deben.

```bash
python3 skill/scripts/verificar_documento.py produccion/*/salida/*.docx
```

Verifica que las tres imágenes del documento salgan de `skill/assets`
—comparadas por hash, no por nombre ni por tamaño—, que el marco de la carátula
sea autoforma y no una imagen, que la unidad y la fecha vayan en cuadro de texto
anclado, que el membrete con el logotipo esté en el encabezado de las páginas
siguientes y **no** en la carátula, que «Página X de Y» use campos automáticos
en vez de texto fijo, y que las citas vayan en superíndice.

La distinción importa: un logotipo sustituido por otro del mismo tamaño pasaría
la verificación de maquetación sin inmutarse, porque las medidas no cambian.

---

## La verificación de fuentes

`skill/scripts/verificar_pmid.py` comprueba contra PubMed que cada referencia de la
bibliografía exista de verdad. Acepta un `protocolo.jsonld`, el `.docx`
compilado o un generador `.js` heredado, y busca el PMID en tres pasadas: por DOI, por título y,
como último recurso, por autor, año y revista.

```bash
python3 skill/scripts/verificar_pmid.py produccion/HECAM-MI-PR-001-sepsis/protocolo.jsonld
python3 skill/scripts/verificar_pmid.py --offline produccion/*/protocolo.jsonld   # solo caché, sin red
```

| Veredicto | Qué significa |
|---|---|
| `OK` | el registro de PubMed coincide con la referencia local |
| `REVISAR` | el artículo existe pero algún dato no cuadra: título, año, revista o DOI |
| `SIN PMID` | ni PubMed ni Crossref lo conocen; la cita es sospechosa |
| `SOLO DOI` | el DOI es válido en Crossref pero la revista no está indexada en PubMed |
| `NO INDEXADA` | literatura gris: normativa, informes, monografías |

Falla (código 1) solo con `REVISAR` y `SIN PMID`. `SOLO DOI` y `NO INDEXADA` son
avisos: hay fuentes legítimas que nunca tendrán PMID, y acusarlas de inventadas
haría que se dejara de mirar el informe.

Tres decisiones que evitan falsos positivos, y que conviene no revertir:

- **Un título local más corto que el de PubMed se acepta.** Vancouver permite
  podar el subtítulo posterior a los dos puntos y la coletilla de autoría
  corporativa. La comprobación es asimétrica a propósito: si es el título local
  el que *añade* texto que PubMed no tiene, se marca. Ese es justo el patrón de
  una referencia adulterada.
- **Solo la búsqueda por DOI se considera concluyente.** Cuando una frase
  entrecomillada no existe, PubMed no devuelve vacío: la rompe en términos
  sueltos y busca igual, así que un título inventado puede devolver cualquier
  artículo del mismo campo. Los resultados que no llegan por DOI se descartan si
  el título no se corresponde.
- **Crossref es la segunda opinión.** No todo artículo real está en PubMed, pero
  casi todo tiene DOI registrado. Es lo que separa «esta cita no existe» de
  «esta revista no está indexada».

`skill/referencia/pmid-cache.json` guarda cada registro recuperado y la fecha de
consulta. Permite repetir la verificación sin red y deja constancia de qué se
comprobó. Se regenera solo; no se edita a mano.

Con `NCBI_API_KEY` en el entorno, el límite de PubMed sube de 3 a 10 consultas
por segundo.

---

## Cómo está armada la carátula

El formato institucional es estricto, así que cada elemento usa el recurso que
corresponde y no un sustituto parecido:

| Elemento | Cómo está hecho |
|---|---|
| Marco | Autoforma de Word, **Rectángulo: esquinas redondeadas**, sin relleno, contorno azul `#154291` de 1 pt |
| Barra del título | Imagen `assets/barra.png`, la original de la institución |
| Logo de carátula | `assets/logo-up.png`, 13,23 × 3,89 cm |
| Logo del membrete | `assets/logo-header.png`, en la celda izquierda |
| Unidad y fecha | Cuadro de texto anclado a la página |
| Membrete | Tabla en el **encabezado**, se repite sola; la carátula no lo lleva (`titlePage`) |
| Paginación | Campos automáticos «Página X de Y» dentro del membrete |

Dos decisiones que conviene no revertir sin entender por qué se tomaron:

- **Las alturas de línea de la carátula son explícitas** (`lineRule` fijo). Si se
  dejan automáticas, cada programa mide la fuente a su manera y el bloque
  inferior se desborda a una hoja nueva en Word aunque en otros visores quepa.
- **La unidad y la fecha van ancladas, fuera del flujo del texto.** Estando en el
  flujo, empujaban contenido a una segunda hoja que salía casi en blanco.

Los logotipos originales llegaron en `.jpg` con el fondo en negro, resultado de
convertir un PNG con transparencia. Los de `assets/` ya están corregidos: fondo
transparente y margen recortado, sin tocar ningún color.

---

## Estructura

```
skill/                  el pipeline genérico y reutilizable; no lleva contenido clínico
  SKILL.md              qué hace, cuándo usarla y cómo añadir un protocolo
  lib/hecam-lib.js      composición del documento (membrete, portada, tablas, firmas)
  assets/               logotipos y barra
  scripts/              verificadores de maquetación, citas y fuentes; matriz y JATS
  referencia/           plantilla JSON-LD, contexto, plantilla JATS, caratula.json, pmid-cache.json

produccion/             un directorio por protocolo, con su código institucional
  HECAM-MI-PR-001-sepsis/
    protocolo.jsonld    la fuente de verdad: contenido clínico y metadatos
    salida/             el .docx y el JATS compilados (ignorados por git)
  HECAM-MI-PR-002-itu/
    protocolo.jsonld
    salida/
  HECAM-MI-PR-003-hiponatremia/
    protocolo.jsonld
    salida/

docs/                   matriz editorial, mapeo JATS, datos institucionales, valores de altitud
```

`docs/matriz-editorial.md` recoge el formato vigente de la revisora y **manda
sobre el formato genérico HECAM-CC-FR-012**. Cuando lleguen correcciones nuevas,
se actualiza ese archivo primero y luego se recompila.

---

## La matriz JSON-LD

El `.docx` es la salida para firma; `produccion/*/protocolo.jsonld` es el
registro normativo, y de él salen el JATS de archivo y la validación contra la
norma.

```bash
make matriz     # reconstruye la matriz desde cada generador
make validar    # la comprueba contra HECAM-CC-IT-008
make jats       # matriz -> JATS 1.3
make docx       # matriz -> .docx institucional
```

La última cierra el círculo: `compilar_docx.js` compila el `.docx` **desde** la
matriz, de modo que un protocolo nuevo puede escribirse como JSON-LD sin tocar
JavaScript. Los dos caminos convergen —el `.docx` compilado desde la matriz y el
compilado desde el `.js` coinciden al 99,6 % en texto, con idéntico número de
párrafos, tablas y filas— y lo único que difiere son los nombres de sección,
donde la matriz usa los normativos.

La reconstrucción no es una transcripción: `armar_jsonld.py` ejecuta el
generador con la librería instrumentada y arma las secciones desde la secuencia
real de llamadas, así que no puede desincronizarse del `.docx`. Los `pmid` y
`doi` se rellenan desde la caché de PubMed, de modo que la verificación de
fuentes llega ahora al XML de archivo y no se queda en el documento de Word.

---

## Pendientes

### Bibliografía: lo que queda por decidir en el bloque de altura

La cita inventada ya no está. Sepsis [6] e ITU [8] apuntan ahora a
Gonzalez-Garcia M, Maldonado D, Barrero M, Casas A, Perez-Padilla R,
Torres-Duque CA. *Arterial blood gases and ventilation at rest by age and sex in
an adult Andean population resident at high altitude.* Eur J Appl Physiol.
2020;120(12):2729–36 (**PMID 32939642**).

El texto clínico ya declara la procedencia de las cifras. Antes decía «la SatO₂
basal normal **en Quito** es 88–92 %», lo que atribuía a Quito una medición que
nunca se hizo allí: el estudio es de Bogotá, a 2.640 m, con 374 adultos sanos de
18 a 83 años. Ahora los siete puntos donde aparecen esos valores dicen que son de
población andina sana estudiada a 2.640 m y extrapolados a los 2.850 m de Quito,
y advierten que descienden con la edad y que la caída es mayor en mujeres, que es
justamente el hallazgo del artículo.

Conviene no revertirlo a la forma corta. La diferencia importa en la cabecera:
un rango plano para todo adulto puede hacer parecer hipoxémico a un paciente
mayor que está en su basal, y el paciente séptico suele ser mayor.

**Decisión tomada: «extrapolados» se queda** hasta que existan datos propios. No
hay estudio de valores gasométricos de referencia en adultos sanos residentes en
Quito, y aplicar una ecuación altitud–PaO₂ genérica sería peor que extrapolar
210 m dentro de la misma población andina.

`docs/valores-altitud.md` recoge la búsqueda completa, por qué la extrapolación
desde Bogotá es la opción menos mala, y la especificación exacta del estudio que
haría falta para quitar esa palabra: criterios de inclusión y exclusión, tamaño
por celda de edad y sexo, variables a medir y condiciones que hay que registrar.

Si además se quiere respaldar la interpretación del cociente PaO₂/FiO₂ en
ventilación mecánica en altura, está verificada Ortiz G, Bastidas A,
Garay-Fernández M, Lara A, Benavides M, Rocha E, et al. *Correlation and validity
of imputed PaO₂/FiO₂ and SpO₂/FiO₂ in patients with invasive mechanical
ventilation at 2600 m above sea level.* Med Intensiva. 2022;46(9):501–7 (**PMID
36057441**).

### Bibliografía ya corregida

| Dónde | Qué se hizo |
|---|---|
| Sepsis [11] e ITU [7] | La referencia de Tamma mezclaba dos documentos de la IDSA: llevaba el DOI y las páginas de la guía de AmpC/*Acinetobacter*/*Stenotrophomonas* pero el título de la de ESBL-E/CRE/DTR-*P. aeruginosa*. Como el texto que la cita habla de *E. coli* BLEE y desescalamiento, se corrigieron DOI y páginas al documento de ESBL-E (PMID 35439291). |
| Sepsis [15] | Sustituida por el artículo real de Marik y Farkas: *The Changing Paradigm of Sepsis: Early Diagnosis, Early Antibiotics, Early Pressors, and Early Adjuvant Treatment*, Crit Care Med. 2018;46(10):1690–2 (PMID 30216303). El DOI que llevaba no existía. |
| ITU [16] | REPRISE: corregido el título al plural publicado, *infections*. |
| Sepsis [6] e ITU [8] | Sustituida la cita fabricada de altura (DOI inexistente en PubMed y en Crossref, y con dos títulos distintos según el protocolo) por Gonzalez-Garcia M, et al. Eur J Appl Physiol. 2020;120(12):2729–36 (PMID 32939642), del mismo primer autor y año. Ver arriba los dos matices pendientes. |
| Sepsis [7] (nueva) | Añadida Eltzschig HK, Carmeliet P. Hypoxia and inflammation. N Engl J Med. 2011;364(7):656–65 (PMID 21323543) para las afirmaciones sobre HIF-1, que un artículo de gasometría no respalda. El glosario de «HIF-1» pasa a citarla en exclusiva; la justificación y el glosario de «Hipoxia dual» citan las dos, porque mezclan mecanismo y valores de referencia. Sepsis pasa de 18 a 19 referencias y el resto se renumeró. **ITU no la lleva**: su justificación no hace ninguna afirmación sobre HIF-1. |

### Lo que destapó la validación de la matriz, y cómo se resolvió

Reconstruir el `protocolo.jsonld` y pasarlo por `validate_jsonld.py` sacó a la
luz incumplimientos que hasta entonces nadie podía ver, porque no había contra
qué comprobarlos. **Los dos protocolos validan ya sin ningún error.**

| Qué dice la norma | Qué había | Cómo se resolvió |
|---|---|---|
| Justificación de 300–500 palabras | sepsis 580, ITU 717 | recortadas a 486 y 488, sin perder ninguna cifra ni cita |
| 4.3 debe declarar duración, suspensión, inclusión y exclusión | los cuatro existían, repartidos entre 4.1, 4.2 y 4.5 | agrupados en el apartado F de 4.3 |
| El cálculo de cada indicador debe ser numerador/denominador | el indicador 11 de ITU medía una mediana de estancia | reformulado como proporción de egresos con estancia > 10 días, umbral tomado de la Tabla 9 del propio protocolo |

Quedan dos avisos que no bloquean: el glosario tiene 13 términos en sepsis y 14
en ITU frente a los 10–12 esperados, y las abreviaciones son 14 y 15 frente a
6–8.

Al agrupar los criterios en 4.3 se evitó duplicarlos: donde el contenido cumplía
además una función operativa —la procalcitonina como parámetro de monitoreo en
4.5— esa mención se conservó y ahora remite al numeral 4.3, que es donde está el
criterio. Y en ITU la Tabla 3 de factores de complicación se quedó en 4.1,
porque define qué es una ITU complicada y eso es evaluación, no tratamiento: el
criterio de inclusión de 4.3 remite a ella en vez de moverla.

Los nombres de las secciones también difieren: el generador escribe «Procedimiento
(Plan de Acción / Actuación)» y «Plan de Egreso de la Unidad / Seguimiento /
Evaluación integral», con espacios alrededor de las barras, donde el
HECAM-CC-FR-012 no los lleva. La matriz usa los nombres normativos; el `.docx`
todavía no. Es cosmético, pero conviene alinearlo antes de la firma.

### Del formato

- Nombre de la revisora de protocolos y fecha exacta de elaboración (hoy son
  marcadores en la plantilla JSON-LD).
- Códigos definitivos del SGD; los actuales son provisionales.
- Diagramas de flujo en Bizagi, a cargo de Control de Calidad.
- Diagramas de la sección 5: hoy ambos protocolos llevan el texto de instrucción
  del formato en lugar del algoritmo. Corresponde a Control de Calidad.
