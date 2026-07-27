# Protocolos clínicos HECAM

Generación automatizada de protocolos clínicos del **Hospital de Especialidades
Carlos Andrade Marín** (HECAM / IESS, Quito) en el formato institucional exigido
por Control de Calidad, con salida `.docx` lista para revisión y firma.

El principio es que **el documento no se edita a mano**. Se edita el generador y
se vuelve a compilar. Así la maquetación no puede degradarse iteración tras
iteración, que es el problema que este repositorio existe para resolver.

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
make generar      # compila los .docx en salida/
make verificar    # comprueba que la maquetación no se movió
make fuentes      # comprueba contra PubMed que la bibliografía exista
make todo         # las tres cosas
```

Sin `make`:

```bash
cd protocolos && node sepsis.js && node itu.js
python3 scripts/verificar_caratula.py salida/HECAM-MI-PR-001_*.docx
python3 scripts/verificar_pmid.py protocolos/sepsis.js
```

---

## La referencia de maquetación

`referencia/caratula.json` guarda las medidas de la carátula y el membrete tal y
como fueron aprobadas. `scripts/verificar_caratula.py` compara cada compilación
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
python3 scripts/verificar_caratula.py --generar-referencia salida/APROBADO.docx
```

Conviene revisar el `git diff` de `referencia/caratula.json` antes de confirmar:
ahí se ve exactamente qué se movió y cuánto.

---

## La verificación de fuentes

`scripts/verificar_pmid.py` comprueba contra PubMed que cada referencia de la
bibliografía exista de verdad. Acepta el generador `.js`, el `.docx` compilado o
un `protocolo.jsonld`, y busca el PMID en tres pasadas: por DOI, por título y,
como último recurso, por autor, año y revista.

```bash
python3 scripts/verificar_pmid.py protocolos/sepsis.js
python3 scripts/verificar_pmid.py --offline protocolos/*.js   # solo caché, sin red
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

`referencia/pmid-cache.json` guarda cada registro recuperado y la fecha de
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
lib/hecam-lib.js        librería de composición (membrete, portada, tablas, firmas)
protocolos/*.js         un archivo por protocolo: contenido clínico y llamadas a la librería
assets/                 logotipos y barra
scripts/                verificadores de maquetación y de fuentes, validadores de la matriz
referencia/             plantilla JSON-LD, contexto, plantilla JATS, caratula.json y pmid-cache.json
docs/                   matriz editorial, mapeo JATS y datos institucionales
salida/                 documentos compilados (ignorados por git)
```

`docs/matriz-editorial.md` recoge el formato vigente de la revisora y **manda
sobre el formato genérico HECAM-CC-FR-012**. Cuando lleguen correcciones nuevas,
se actualiza ese archivo primero y luego se recompila.

---

## Pendientes

### Bibliografía: lo que queda por decidir en el bloque de altura

La cita inventada ya no está. `sepsis.js` [6] e `itu.js` [8] apuntan ahora a
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

**Lo que sigue pendiente** es sustituir la extrapolación por datos propios. Dos
caminos, ninguno de los cuales puede resolver el generador:

- Validar los valores basales en la población del HECAM, a 2.850 m. Es lo único
  que permitiría quitar la palabra «extrapolados».
- Mientras tanto, estratificar el rango por edad y sexo con las tablas del
  artículo de Gonzalez-Garcia, o respaldarlo con Forrer A, Gaisl T, Sevik A,
  Meyer M, Senteler L, Lichtblau M, et al. *Partial pressure of arterial oxygen
  in healthy adults at high altitudes: a systematic review and meta-analysis.*
  JAMA Netw Open. 2023;6(6):e2318036 (**PMID 37326993**), que modela el PaO₂
  frente a la altitud y permitiría estimar el valor a 2.850 m.

Si además se quiere respaldar la interpretación del cociente PaO₂/FiO₂ en
ventilación mecánica en altura, está verificada Ortiz G, Bastidas A,
Garay-Fernández M, Lara A, Benavides M, Rocha E, et al. *Correlation and validity
of imputed PaO₂/FiO₂ and SpO₂/FiO₂ in patients with invasive mechanical
ventilation at 2600 m above sea level.* Med Intensiva. 2022;46(9):501–7 (**PMID
36057441**).

### Bibliografía ya corregida

| Dónde | Qué se hizo |
|---|---|
| `sepsis.js` [11] y `itu.js` [7] | La referencia de Tamma mezclaba dos documentos de la IDSA: llevaba el DOI y las páginas de la guía de AmpC/*Acinetobacter*/*Stenotrophomonas* pero el título de la de ESBL-E/CRE/DTR-*P. aeruginosa*. Como el texto que la cita habla de *E. coli* BLEE y desescalamiento, se corrigieron DOI y páginas al documento de ESBL-E (PMID 35439291). |
| `sepsis.js` [15] | Sustituida por el artículo real de Marik y Farkas: *The Changing Paradigm of Sepsis: Early Diagnosis, Early Antibiotics, Early Pressors, and Early Adjuvant Treatment*, Crit Care Med. 2018;46(10):1690–2 (PMID 30216303). El DOI que llevaba no existía. |
| `itu.js` [16] | REPRISE: corregido el título al plural publicado, *infections*. |
| `sepsis.js` [6] y `itu.js` [8] | Sustituida la cita fabricada de altura (DOI inexistente en PubMed y en Crossref, y con dos títulos distintos según el protocolo) por Gonzalez-Garcia M, et al. Eur J Appl Physiol. 2020;120(12):2729–36 (PMID 32939642), del mismo primer autor y año. Ver arriba los dos matices pendientes. |
| `sepsis.js` [7] (nueva) | Añadida Eltzschig HK, Carmeliet P. Hypoxia and inflammation. N Engl J Med. 2011;364(7):656–65 (PMID 21323543) para las afirmaciones sobre HIF-1, que un artículo de gasometría no respalda. El glosario de «HIF-1» pasa a citarla en exclusiva; la justificación y el glosario de «Hipoxia dual» citan las dos, porque mezclan mecanismo y valores de referencia. Sepsis pasa de 18 a 19 referencias y el resto se renumeró. **ITU no la lleva**: su justificación no hace ninguna afirmación sobre HIF-1. |

### Del formato

- Nombre de la revisora de protocolos y fecha exacta de elaboración (hoy son
  marcadores en la plantilla JSON-LD).
- Códigos definitivos del SGD; los actuales son provisionales.
- Diagramas de flujo en Bizagi, a cargo de Control de Calidad.
- Ingeniería inversa de los dos protocolos ya terminados hacia su
  `protocolo.jsonld`, para que el tercero nazca dentro de la matriz.
