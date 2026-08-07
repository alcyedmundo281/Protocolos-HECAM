# Matriz editorial HECAM — formato vigente

**Origen:** documento modelo remitido por la revisora de protocolos de la Coordinación
General de Investigación (revisión de julio 2026, sobre HECAM-MI-PR-001).
**Estado:** vigente. Este archivo manda sobre la plantilla FR-012 genérica cuando hay
conflicto.

**Última actualización:** julio 2026, incorporando los trece comentarios de la revisión
del 16 al 20 de julio de 2026 sobre el HECAM-MI-PR-001 y el cotejo con el
HECAM-CC-FR-012 V3.0 original.
Al recibir nuevas correcciones de la revisora, actualizar este archivo **primero** y luego
recompilar los protocolos afectados.

**Lo comprobable de este archivo está automatizado** en
`skill/scripts/verificar_revisora.py`. Si se añade aquí una regla nueva, conviene
añadirla también allí; si no, volverá a llegar como comentario.

---

## Contenido

1. [Instrucciones explícitas de la revisora](#1-instrucciones-explicitas-de-la-revisora)
2. [Membrete y portada](#2-membrete-y-portada)
3. [Nombres literales de las secciones](#3-nombres-literales-de-las-secciones)
4. [Reglas por sección](#4-reglas-por-seccion)
5. [Tipografía y geometría](#5-tipografia-y-geometria)
6. [Diferencias respecto de FR-012 genérico](#6-diferencias-respecto-de-fr-012-generico)
7. [Checklist de entrega](#7-checklist-de-entrega)

---

## 1. Instrucciones explícitas de la revisora

Cuatro reglas, en orden de importancia:

1. **Las citas bibliográficas van en superíndice** dentro del cuerpo del texto. Sin
   paréntesis, sin corchetes. Se colocan después del signo de puntuación.
2. **La bibliografía se ordena por aparición**, no alfabéticamente. La referencia 1 es la
   primera citada en el documento; la N es la última.
3. **El mismo formato se aplica a todos los protocolos de la serie**, no solo al revisado.
4. **El contenido científico es responsabilidad del autor.** La revisión es de forma. Los
   medicamentos deben constar en el CNMB.

Consecuencia operativa: si al añadir un párrafo se introduce una cita nueva en medio del
documento, hay que **renumerar toda la bibliografía posterior**. Por eso el orden se verifica
programáticamente (`skill/scripts/check_citas.py`) y nunca a ojo.

---

## 2. Membrete y portada

### Membrete (en todas las páginas, tabla de 3 columnas)

```
| [logo HECAM] | Protocolo Clínico:   | Código: {identifier}                |
|              | {título}             | Versión: {version}                  |
|              |                      | Fecha de Elaboración: {DD/MM/AAAA}  |
|              |                      | Página: # de #                      |
```

- **No** incluye la fila "Unidad". El formato revisado la eliminó.
- Color institucional `#003366`. Arial 10 en todo el membrete.

### Portada

```
[logo]
PROTOCOLO                       Arial 48, negrita, 003366
{TÍTULO DEL PROTOCOLO}          Arial 20, negrita, 003366
Unidad Técnica de {unidad}      Arial 16, cursiva, 003366
{Mes, Año}                      Arial 16, cursiva, 003366
```

Ejemplo de pie de portada vigente: `Julio, 2026`.

---

## 3. Nombres literales de las secciones

Usar exactamente estos títulos. Las variantes son motivo de devolución.

| # | Título literal |
|---|----------------|
| 1 | Justificación |
| 2 | Objetivos |
| 3 | Glosario de términos / Abreviaciones |
| 4 | Procedimiento (Plan de Acción/Actuación) |
| 4.1 | Evaluación inicial del paciente |
| 4.2 | Diagnóstico / Identificación de problemas basados en las necesidades |
| 4.3 | Plan Terapéutico / Intervenciones no farmacológicas |
| 4.4 | Clasificación de severidad / Manejo de Complicaciones |
| 4.5 | Plan de Egreso de la Unidad/Seguimiento/Evaluación integral |
| 4.6 | Nivel de evidencia y grado de recomendaciones |
| 5 | Algoritmo de actuación |
| 6 | Indicadores |
| 7 | Bibliografía |
| 8 | Anexos |
| 9 | Firmas de los involucrados |
| 10 | Control de cambios |

**No usar:** "Justificación y Alcance", "Indicadores de Calidad", "Referencias
Bibliográficas", "Anexos y Cronograma".

---

## 4. Reglas por sección

### 1. Justificación
300–500 palabras, párrafos continuos, sin viñetas ni tablas. Debe cubrir: definición y
epidemiología (global → Ecuador → HECAM), motivo institucional, altitud de Quito
(2.850 m s. n. m.) si es fisiopatológicamente relevante, población objetivo, unidades
involucradas, alcance y resultados esperados. Con citas en superíndice.

### 2. Objetivos
- **General:** una oración, `[infinitivo] + [qué] + para [para qué]`. Prohibidos los
  adjetivos calificativos (mejor, óptimo, adecuado).
- **Específicos:** máximo 4, cada uno inicia con infinitivo.

### 3. Glosario de términos / Abreviaciones
Dos tablas separadas.

**A. Términos — 2 columnas** (10–12 entradas):

| TÉRMINO | DEFINICIÓN |
|---------|------------|

El término va en negrita. La **cita en superíndice va al final de la definición**, dentro de
la misma celda. No hay tercera columna de cita en el formato revisado.

**B. Abreviaciones — 2 columnas** (6–8 entradas):

| ABREVIACIÓN | SIGNIFICADO |
|-------------|-------------|

### 4. Procedimiento
Cada subsección declara explícitamente, en negrita, `Quién lo hace:` y `Cuándo:`.
Toda afirmación clínica lleva cita en superíndice.

- **4.3** debe incluir obligatoriamente, para el tratamiento farmacológico: **dosis, vía,
  frecuencia, duración, criterios de suspensión, criterios de inclusión y criterios de
  exclusión.** Los esquemas antibióticos se estratifican por escenario clínico y por
  servicio, contra la cartilla local de resistencia.
- **4.6** usa Oxford CEBM (marzo 2009), tabla de 4 columnas: Área | Recomendación | Nivel de
  Evidencia (1a–5) | Grado (A–D). 6–8 filas. Nota explicativa del sistema al pie.

### 5. Algoritmo de actuación
**Texto narrativo secuencial** que describe el flujo, redactado para que Control de Calidad
lo transcriba a Bizagi. El formato revisado **eliminó la tabla decisional**.

Nota obligatoria al final: *"El diagrama de flujo será elaborado en la herramienta Bizagi con
el soporte de la Coordinación General de Control de Calidad del HECAM."*

### 6. Indicadores
Tabla de **exactamente 6 columnas**:

| Nombre Indicador | Definición | Cálculo | Meta | Periodo | Responsable |
|------------------|-----------|---------|------|---------|-------------|

- Mínimo 8 indicadores: ≥2 de cada tipo (diagnóstico, seguimiento, tratamiento, resultado).
  El tipo se declara dentro del nombre o la definición.
- `Cálculo` siempre como fórmula `(Numerador / Denominador) × 100`, con numerador y
  denominador explícitos.
- `Meta` cuantificada (`≥80%`, `≤48h`).
- `Responsable` es un cargo, nunca una persona.

### 7. Bibliografía
Vancouver numerada, **en orden de aparición**, en idioma original sin traducir. Mínimo 15,
habitualmente 18. Priorizar guías internacionales, metaanálisis y revisiones sistemáticas
2018–2026, y normativa nacional (MSP, CNMB, acuerdos ministeriales).

```
N. Apellido AA, Apellido BB. Título del artículo. Revista Abrev. Año;Vol(Núm):pp-pp. doi:xxx
```

### 8. Anexos
**Tres anexos** en el formato vigente:

| Anexo | Contenido |
|-------|-----------|
| 1 | Cronograma de implementación (obligatorio). 8–10 actividades. Formato en el apartado siguiente. |
| 2 | Herramienta clínica de apoyo — escala, criterios de riesgo, ajuste por altitud. |
| 3 | Comparación del perfil de resistencia nacional vs. HECAM. |

#### Formato del cronograma

Corregido por la revisora el **20 de julio de 2026**: «Tomar en cuenta el formato
de cronograma establecido». Sustituye a las columnas anteriores —ID, Tarea,
Responsable, Inicio, Fin, Recursos—, que ya no se usan.

**Dos filas de cabecera.** El año va en la primera, abarcando toda la rejilla de
meses; los nombres de mes en la segunda. Las cuatro columnas fijas se combinan
verticalmente entre ambas filas:

```
| Id | Nombre de la tarea | Comienzo   | Fin        |            2025           |
|    |                    |            |            | Nov | Dic | Ene | … | Dic |
|  1 | Elaboración        | 29/11/2024 | 29/12/2024 |  x  |  x  |     |   |     |
|  2 | Aprobación         | 01/01/2025 | 15/01/2025 |     |     |  x  |   |     |
|  4 | Implementación     | 01/02/2025 | 31/12/2025 |     |     |     | x |  x  |
```

**Catorce columnas de mes**, como en el modelo de la revisora. Se marcan con `x`
los meses que abarca cada tarea. La ventana no tiene que cubrir el final de la
última tarea: la columna **Fin** es la que declara la fecha real.

Lo compone `cronograma()` en `lib/hecam-lib.js`, que no se puede sustituir por
`mkT()`: esta solo admite una fila de cabecera y los meses necesitan márgenes y
cuerpo menores para caber en el ancho de la página.

Se pierden «Responsable» y «Recursos» respecto al formato anterior. Si alguna de
las dos llevaba una cita, hay que reubicarla o la referencia queda huérfana en la
bibliografía; pasó con la referencia 20 de hiponatremia.

Imágenes numeradas y centradas: título `Imagen N: Nombre`, `Fuente:` al pie.

### 9. Firmas de los involucrados
Tabla de 2 columnas (bloque+cargo | línea de firma). Nota al pie sobre firma electrónica.

**La lista de revisores no es fija: depende de qué unidades intervienen.**
Observación 28: «Se deben colocar a todas las Coordinaciones y Jefaturas que
intervienen en el protocolo, deben colocarse en orden jerárquico; se han
agregado algunas continuar según corresponda».

La coordinación general **no absorbe** a la unidad. La propia revisora añadió
las jefaturas de Áreas Clínicas (PROA) y de Cuidados Intensivos Adultos aunque
sus coordinaciones ya firmaban; ese es el patrón a continuar. Cada unidad que
interviene firma por su cuenta, además de su coordinación.

Firman siempre, gobiernen o no el cuadro clínico: Director Técnico y las cinco
Coordinaciones Generales. A ellas se suma una jefatura por cada unidad que el
protocolo nombre en la **sección 1 (justificación), 5 (control de calidad) o 6
(indicadores)**. Nombrar una unidad solo en la sección 4 es una interconsulta:
`verificar_firmas.py` lo señala como aviso y la decisión es de Control de
Calidad.

Orden jerárquico: Director Técnico → Coordinaciones Generales → Jefe de Áreas
Clínicas → jefaturas de unidad → Líder de Enfermería. Entre las jefaturas de
unidad, que no se ordenan entre sí, se sigue el recorrido del paciente:
Cuidados Intensivos, Emergencia, Medicina Interna, subespecialidades, apoyo
diagnóstico y terapéutico. La lista canónica vive en `ORDEN`, dentro de
`skill/scripts/verificar_firmas.py`.

Un firmante que no aparezca en ninguna sección es herencia de otro protocolo y
se retira: los tres protocolos nacieron con la misma lista de siete.

**En «Elaborado por» se imprime el cargo, no el nombre.** Observación 29:
«Colocar el cargo no el nombre ejemplo Oficinista de la Coordinación General de
Control de Calidad». El patrón es `{Cargo} de la {Unidad}`, y la matriz lo
declara en `author[].author.cargoFirma`. El nombre propio permanece en la
matriz y viaja al JATS —la autoría es real y no se pierde—; lo que ella corrige
es lo que se lee en el papel.

### 10. Control de cambios
Tres columnas: `No. Versión | Fecha | Descripción del Cambio`.
Protocolo nuevo → una fila: `1 | {fecha} | Creación del Protocolo.` más filas vacías.
Se conservan la primera y las dos últimas versiones.

---

## 5. Tipografía y geometría

Los valores viven en `skill/reglas/formato.json`, extraídos del propio
`HECAM-CC-FR-012-v3.docx`, y `verificar_tipografia.py` los comprueba sobre el
`.docx` compilado. Esta tabla es su resumen legible, no la fuente.

El formato oficial es **Arial**: así lo fija el estilo `Normal` de la norma. El
`Times New Roman` que aparece en sus `docDefaults` es el respaldo de escritura
compleja (`w:cs`), no la letra del documento; conviene no confundirlo.

| Parámetro | Valor | En `docx` |
|-----------|-------|-----------|
| Fuente cuerpo | Arial 10 pt | `size: 20` |
| Interlineado | 1.15 | `spacing: { line: 276 }` |
| Espaciado antes/después | 0 pt base | `before: 0, after: 0` |
| Página | A4 | 11906 × 16838 DXA |
| Margen izquierdo | — | 1700 DXA |
| Margen derecho | — | 1400 DXA |
| Ancho útil de tablas | — | 8806 DXA |
| Azul institucional | `#003366` | `BLUE` |
| Azul claro (filas alternas) | `#E8EFF7` | `BLUE_LITE` |
| Gris de bloques | `#F2F2F2` | `GRAY_BG` |

Semáforo de resistencia antimicrobiana: verde `#D6EAD8` (<30 % R), ámbar `#FFF2CC`
(30–70 % R), rojo `#FDDCDC` (>70 % R). Incluir siempre la leyenda (`L.semaforo()`).

---

## 6. Diferencias respecto de FR-012 genérico

| Elemento | FR-012 genérico | Formato revisado (vigente) |
|----------|-----------------|----------------------------|
| Citas | `(N)` entre paréntesis | **Superíndice**, sin paréntesis |
| Bibliografía | Numerada | **En orden de aparición** |
| Membrete | Incluye "Unidad" | Sin "Unidad"; Código/Versión/Fecha/Página |
| Glosario | 3 columnas con columna CITA | **2 columnas**, cita al final de la definición |
| Indicadores | Hasta 10 columnas | **6 columnas** exactas |
| Algoritmo | Narrativa + tabla decisional | **Solo narrativa** para Bizagi |
| Revisores | 4 genéricos | **variables: una jefatura por unidad interviniente** |
| Anexos | 1 obligatorio + opcionales | **3** |
| Sección 1 | "Justificación y Alcance" | **"Justificación"** |
| Sección 6 | "Indicadores de Calidad" | **"Indicadores"** |

---

## 7. Checklist de entrega

- [ ] Título ≤ 15 palabras
- [ ] Justificación entre 300 y 500 palabras
- [ ] Objetivo general sin adjetivos calificativos; ≤ 4 objetivos específicos
- [ ] Glosario en 2 columnas, cita al final de cada definición
- [ ] 4.3 con dosis, vía, frecuencia, duración, suspensión, inclusión y exclusión
- [ ] 4.6 con Oxford CEBM y nota explicativa
- [ ] Algoritmo narrativo + nota Bizagi
- [ ] Indicadores: 6 columnas, ≥8 filas, ≥2 por tipo
- [ ] Bibliografía Vancouver, idioma original, **orden de aparición verificado por script**
- [ ] Anexo 1 = cronograma; anexos 2 y 3 presentes
- [ ] Firmas: una jefatura por unidad interviniente, en orden jerárquico
      (`verificar_firmas.py`) + nota de firma electrónica
- [ ] Control de cambios de 3 columnas
- [ ] Membrete en todas las páginas, sin fila "Unidad", con `Página # de #`
- [ ] Arial 10, interlineado 1.15
- [ ] `validate.py` pasa sin errores
- [ ] Código: definitivo del SGD, o placeholder `HECAM-xx-PR-xxx` con advertencia al usuario
