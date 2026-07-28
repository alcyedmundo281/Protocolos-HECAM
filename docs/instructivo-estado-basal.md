# Evaluación del estado basal del adulto y ajuste de las escalas de valoración clínica

Documento en preparación. Este archivo recoge lo decidido, por qué, la
bibliografía ya verificada y qué falta para poder escribirlo.

| | |
|---|---|
| **Título** | Evaluación del estado basal del adulto y ajuste de las escalas de valoración clínica |
| **Código** | HECAM-MI-IT-001 *(provisional; lo asigna Control de Calidad)* |
| **Clase** | Instructivo de trabajo, **no** protocolo clínico |
| **Unidad** | Medicina Interna |
| **Autor** | Dr. Alcy Edmundo Torres Guerrero, Médico Internista (Tratante) |

---

## 1. Por qué instructivo y no protocolo

El formato de protocolo (HECAM-CC-FR-012) está construido para el manejo de una
condición clínica. Este documento es metodología transversal: cómo se establece
el estado basal de un paciente y cómo ese basal modifica la interpretación de las
escalas de valoración. Tres piezas del formato de protocolo no encajan, y las
tres por la misma razón:

| Exigencia del formato de protocolo | Por qué no encaja |
|---|---|
| Sección 4.3 «Plan Terapéutico», que además debe declarar duración del tratamiento y criterios de suspensión | El documento no prescribe tratamiento |
| Sección 4.5 «Plan de Egreso de la Unidad» | No hay episodio asistencial que cerrar |
| `guidelineSubject` con código CIE-10 de condición | El estado basal no es una condición; forzaría un Z00–Z01 de examen general |

Hay precedente institucional a favor: el propio **HECAM-CC-IT-008**, que regula
cómo se elaboran los protocolos clínicos, es un instructivo. En la nomenclatura
del HECAM el envase de la metodología es el instructivo.

Este documento **no depende del HECAM-MI-PR-001 ni del HECAM-MI-PR-002**. No es
una puerta de entrada a la sepsis: es transversal a cualquier escala de
valoración, y la sepsis es solo una de sus aplicaciones.

---

## 2. La tesis

Las escalas de valoración clínica asumen un basal poblacional. Cuando el basal
del paciente se aparta de ese supuesto —por altitud, edad, sexo o enfermedad
crónica—, la precisión de la escala se degrada.

El caso más limpio está en la propia definición de Sepsis-3: la sepsis es un
aumento agudo del SOFA **≥ 2 puntos sobre el basal**. El basal está dentro de la
definición, y la convención de asumirlo en cero salvo disfunción documentada
falla justo en la población que más lo necesita: enfermedad renal crónica, EPOC,
cirrosis.

Aplicaciones previstas, más allá de la sepsis:

- Ajuste del dominio respiratorio de las escalas por la altitud de Quito.
- Interpretación de la fracción de acortamiento según las condiciones de carga.
- Variabilidad de la frecuencia cardíaca como medida continua de desviación.
- Cualquier escala cuyo umbral se haya derivado a nivel del mar.

---

## 3. Qué falta para escribirlo

**Bloqueante.** No se conoce la estructura normativa de un instructivo del HECAM.
El repositorio cita el HECAM-CC-P-001 v13 y el HECAM-CC-IT-008, pero no los
contiene. Hace falta uno de los dos, o cualquier instructivo ya aprobado que
sirva de molde, para saber qué secciones exige, en qué orden y con qué
encabezados.

**Consecuencia sobre el pipeline.** El validador, la plantilla y el compilador
tienen codificadas las diez secciones del protocolo y las subsecciones 4.1–4.6.
Para admitir instructivos, el conjunto de secciones debe pasar de estar escrito
en `validate_jsonld.py` a ser un dato indexado por `tipoDocumento`, con un
esquema por clase documental. Es un cambio acotado, pero no se puede hacer sin
saber cuál es el esquema del instructivo.

**Datos que tampoco existen todavía.** Los tres basales de referencia a 2.850 m
—gasométrico, autonómico y cardíaco— están especificados en
`docs/valores-altitud.md`. Sin ellos el instructivo puede describir el método,
pero no dar los valores de referencia locales.

---

## 4. Bibliografía verificada

Las 22 referencias siguientes se recuperaron del registro oficial de PubMed y se
comprobaron una a una; ninguna se transcribió a mano. El orden es temático: el
orden de aparición se fijará al redactar el cuerpo.

### El basal está dentro de la definición

| PMID | Referencia |
|---|---|
| 26903338 | Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016 |
| 11594901 | Ferreira FL, et al. Serial evaluation of the SOFA score to predict outcome in critically ill patients. JAMA. 2001 |
| 36152041 | Bhavani SV, et al. Development and validation of novel sepsis subphenotypes using trajectories of vital signs. Intensive Care Med. 2022 |

### Escalas de alerta temprana, y su crítica

| PMID | Referencia |
|---|---|
| 11588210 | Subbe CP, et al. Validation of a modified Early Warning Score in medical admissions. QJM. 2001 |
| 32434791 | Gerry S, et al. Early warning scores for detecting deterioration in adult hospital patients: systematic review and critical appraisal. BMJ. 2020 |

### Basal gasométrico en altura

| PMID | Referencia |
|---|---|
| 32939642 | Gonzalez-Garcia M, et al. Arterial blood gases and ventilation at rest by age and sex in an adult Andean population resident at high altitude. Eur J Appl Physiol. 2020 |
| 25418645 | Pereira-Victorio CJ, et al. Gases arteriales en adultos clínicamente sanos a 3.350 m. Rev Peru Med Exp Salud Publica. 2014 |
| 37326993 | Forrer A, et al. Partial pressure of arterial oxygen in healthy adults at high altitudes: systematic review and meta-analysis. JAMA Netw Open. 2023 |
| 10846438 | Pérez Padilla JR, Vázquez García JC. Estimación de valores gasométricos a distintas altitudes. Rev Invest Clin. 2000 |

### Basal autonómico

| PMID | Referencia |
|---|---|
| 8737210 | Task Force ESC/NASPE. Heart rate variability: standards of measurement, physiological interpretation and clinical use. Eur Heart J. 1996 |
| 29292837 | Dantas EM, et al. Reference values for short-term resting-state heart rate variability in healthy adults (ELSA-Brasil). Psychophysiology. 2018 |
| 20663071 | Nunan D, et al. A quantitative systematic review of normal values for short-term heart rate variability in healthy adults. Pacing Clin Electrophysiol. 2010 |
| 26964804 | Koenig J, Thayer JF. Sex differences in healthy human heart rate variability: a meta-analysis. Neurosci Biobehav Rev. 2016 |
| 37552638 | Hou J, et al. Comprehensive viewpoints on heart rate variability at high altitude. Clin Exp Hypertens. 2023 |
| 30204803 | de Castilho FM, et al. Heart rate variability as predictor of mortality in sepsis: a systematic review. PLoS One. 2018 |
| 37651781 | Adam J, et al. Heart rate variability as a marker and predictor of inflammation, nosocomial infection, and sepsis. Auton Neurosci. 2023 |
| 18003665 | Ranpuria R, et al. Heart rate variability in kidney failure: measurement and consequences of reduced HRV. Nephrol Dial Transplant. 2008 |

### Basal cardíaco

| PMID | Referencia |
|---|---|
| 27660297 | Soria R, et al. Pulmonary artery pressure and arterial oxygen saturation in people living at high or low altitude: systematic review and meta-analysis. J Appl Physiol. 2016 |
| 37272081 | Hasegawa D, et al. Prevalence and prognosis of sepsis-induced cardiomyopathy: systematic review and meta-analysis. J Intensive Care Med. 2023 |
| 33068615 | Lanspa MJ, et al. Right ventricular dysfunction in early sepsis and septic shock. Chest. 2021 |
| 37231510 | Yoshida T, et al. Diagnostic accuracy of point-of-care ultrasound for shock: systematic review and meta-analysis. Crit Care. 2023 |
| 40416836 | Mekonnen D, et al. Echocardiographic nomograms in children living at high altitude according to sex. Eur Heart J Imaging Methods Pract. 2025 |

Las cadenas Vancouver completas, con DOI y paginación, están en
`docs/citas-estado-basal.json`, listas para volcarse a la matriz cuando se
conozca su estructura.

---

## 5. Dos advertencias que el documento deberá conservar

Ambas son fáciles de invertir al redactar, y las dos importan en la cabecera.

**Un patrón hiperdinámico no es tranquilizador: es el hallazgo esperado.** Como
la fracción de acortamiento depende de la poscarga, un valor «normal» en un
paciente vasodilatado puede encubrir una contractilidad deprimida.

**La HRV da el basal, no un umbral.** La evidencia en sepsis es de asociación
consistente con valor predictivo no establecido, y la fibrilación auricular la
vuelve ininterpretable. No puede figurar como criterio obligatorio de
escalamiento mientras no exista punto de corte validado en población de altura.
