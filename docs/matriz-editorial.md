# Matriz editorial HECAM — formato vigente

**Origen:** documento modelo remitido por la revisora de protocolos de la Coordinación
General de Investigación (revisión de julio 2026, sobre HECAM-MI-PR-001).
**Estado:** vigente. Este archivo manda sobre la plantilla FR-012 genérica cuando hay
conflicto.

**Última actualización:** julio 2026.
Al recibir nuevas correcciones de la revisora, actualizar este archivo **primero** y luego
recompilar los protocolos afectados.

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
programáticamente (`scripts/check_citas.py`) y nunca a ojo.

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
| 1 | Cronograma de implementación (obligatorio) — ID, Tarea, Responsable, Inicio, Fin, Recursos. 8–10 actividades. |
| 2 | Herramienta clínica de apoyo — escala, criterios de riesgo, ajuste por altitud. |
| 3 | Comparación del perfil de resistencia nacional vs. HECAM. |

Imágenes numeradas y centradas: título `Imagen N: Nombre`, `Fuente:` al pie.

### 9. Firmas de los involucrados
Tabla de 2 columnas (bloque+cargo | línea de firma). **Siete revisores nominados**, en este
orden exacto — ver la tabla en `SKILL.md`. Nota al pie sobre firma electrónica.

### 10. Control de cambios
Tres columnas: `No. Versión | Fecha | Descripción del Cambio`.
Protocolo nuevo → una fila: `1 | {fecha} | Creación del Protocolo.` más filas vacías.
Se conservan la primera y las dos últimas versiones.

---

## 5. Tipografía y geometría

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
| Revisores | 4 genéricos | **7 nominados** |
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
- [ ] Firmas con los 7 revisores nominados + nota de firma electrónica
- [ ] Control de cambios de 3 columnas
- [ ] Membrete en todas las páginas, sin fila "Unidad", con `Página # de #`
- [ ] Arial 10, interlineado 1.15
- [ ] `validate.py` pasa sin errores
- [ ] Código: definitivo del SGD, o placeholder `HECAM-xx-PR-xxx` con advertencia al usuario
