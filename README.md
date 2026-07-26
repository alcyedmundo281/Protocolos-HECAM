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
make todo         # ambas cosas
```

Sin `make`:

```bash
cd protocolos && node sepsis.js && node itu.js
python3 scripts/verificar_caratula.py salida/HECAM-MI-PR-001_*.docx
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
scripts/                verificador de maquetación y validadores de la matriz
referencia/             plantilla JSON-LD, contexto, plantilla JATS y caratula.json
docs/                   matriz editorial, mapeo JATS y datos institucionales
salida/                 documentos compilados (ignorados por git)
```

`docs/matriz-editorial.md` recoge el formato vigente de la revisora y **manda
sobre el formato genérico HECAM-CC-FR-012**. Cuando lleguen correcciones nuevas,
se actualiza ese archivo primero y luego se recompila.

---

## Pendientes

- Nombre de la revisora de protocolos y fecha exacta de elaboración (hoy son
  marcadores en la plantilla JSON-LD).
- Códigos definitivos del SGD; los actuales son provisionales.
- Diagramas de flujo en Bizagi, a cargo de Control de Calidad.
- Ingeniería inversa de los dos protocolos ya terminados hacia su
  `protocolo.jsonld`, para que el tercero nazca dentro de la matriz.
