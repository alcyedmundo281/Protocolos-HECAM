# Los valores basales de altitud: qué falta para dejar de extrapolar

Los protocolos afirman que la SatO₂ basal de referencia es 88–92 % y la PaO₂
basal 65–70 mmHg. Hoy esas cifras se declaran como **extrapoladas** desde una
cohorte andina estudiada a 2.640 m, porque no existe el dato a los 2.850 m de
Quito. Este documento recoge qué se buscó, qué hay, y qué haría falta para
sustituir la palabra «extrapolados» por un dato propio.

---

## 1. Qué se buscó y qué no existe

Búsqueda en PubMed (julio de 2026) combinando Quito y Ecuador con gasometría
arterial, saturación de oxígeno, PaO₂ y oximetría, más búsquedas de valores de
referencia gasométricos en adultos a gran altitud.

**No existe un estudio de valores de referencia gasométricos en adultos sanos
residentes en Quito.** Lo publicado sobre Ecuador y altitud es de otro tipo:
recién nacidos, preeclampsia, mortalidad materna, hipertensión pulmonar,
síndrome metabólico. Nada que sirva de referencia basal en adulto sano.

Lo más cercano disponible, por orden de utilidad:

| Fuente | Qué aporta | Limitación |
|---|---|---|
| Gonzalez-Garcia M, et al. Eur J Appl Physiol. 2020;120(12):2729–36 (**PMID 32939642**) | 374 adultos sanos de 18 a 83 años a 2.640 m, con PaO₂, PaCO₂ y SaO₂ por edad y sexo. Población andina | 210 m por debajo de Quito |
| Pereira-Victorio CJ, et al. Rev Peru Med Exp Salud Publica. 2014;31(3):473–9 (**PMID 25418645**) | 118 adultos clínicamente sanos a 3.350 m en Cusco. pH 7,42; PaO₂ 61,08 mmHg; PaCO₂ 30,62 mmHg; SaO₂ 91,13 % | Altitud muy superior; sirve de **molde metodológico**, no de valor |
| Forrer A, et al. JAMA Netw Open. 2023;6(6):e2318036 (**PMID 37326993**) | Revisión sistemática y metanálisis del PaO₂ frente a la altitud | Población mayoritariamente no andina |
| Pérez Padilla JR, Vázquez García JC. Rev Invest Clin. 2000;52(2):148–55 (**PMID 10846438**) | Ecuaciones para estimar gasometría a cualquier altitud | Calibrada en México; ver el aviso de abajo |

---

## 2. Por qué la extrapolación desde Bogotá es la opción menos mala

Podría parecer que basta con aplicar una ecuación altitud–PaO₂ y calcular el
valor a 2.850 m. El propio Pérez-Padilla advierte de por qué no: la pendiente
depende de la población. Su ecuación para México da

    PaCO₂ = 40 − 3,96 × (altitud en km)

mientras que la derivada de nativos andinos por Hurtado da

    PaCO₂ = 40,4 − 1,35 × (altitud en km)

Son pendientes que difieren casi por un factor de tres. A 2,85 km eso son unos
11 mmHg de PaCO₂ de diferencia según qué ecuación se use, y el PaO₂ alveolar se
calcula a partir del PaCO₂, así que el error se propaga.

Dicho de otro modo: **el residente andino permanente ventila distinto**. Por eso
extrapolar 210 m dentro de la misma población (Bogotá → Quito) es más defendible
que aplicar un modelo genérico calibrado en otra. La decisión de mantener
«extrapolados» está bien fundada; lo que no sería defendible es presentar la
cifra como un dato local medido.

---

## 3. Qué haría falta para tener el dato propio

Un estudio transversal de valores de referencia en el HECAM. El molde es
Pereira-Victorio; lo que sigue es su diseño trasladado a Quito.

### Sujetos

- Adultos de 18 a 80 años, residentes en Quito o su altitud equivalente desde
  hace **≥ 5 años** (el criterio de Cusco, que evita incluir a quien todavía se
  está aclimatando).
- **Excluir**: fumadores; enfermedad pulmonar, cardiovascular o hematológica
  conocida; anemia; apnea del sueño; embarazo; obesidad con IMC ≥ 35; deporte de
  resistencia más de 60 min/día; infección respiratoria en las 4 semanas
  previas; ascenso o descenso reciente de altitud.
- Clasificación de «clínicamente sano» por dos médicos, como en el estudio de
  referencia.

### Tamaño

Para publicar un rango único bastarían unos 120 sujetos. Pero el objetivo aquí
es **estratificar por edad y sexo**, que es el punto que hoy queda cojo: harían
falta del orden de **30 sujetos por celda**, con celdas de una década por sexo.
Cubriendo de los 20 a los 79 en seis décadas y dos sexos, eso son unos **360
sujetos**, cifra coherente con los 374 del estudio de Bogotá.

### Mediciones

Por sujeto, en reposo y respirando aire ambiente:

- Gasometría arterial: **pH, PaO₂, PaCO₂, SaO₂, HCO₃⁻, exceso de base**.
- Pulsioximetría simultánea (permite publicar la correspondencia SpO₂/SaO₂, que
  es lo que el personal usa en la cabecera).
- Hemoglobina y hematocrito.
- Frecuencia respiratoria, frecuencia cardíaca, presión arterial, IMC.
- Edad y sexo.

### Condiciones que hay que dejar registradas

Sin esto el dato no es reproducible ni publicable:

- **Presión barométrica del día**, medida, no asumida. En Quito oscila y el
  PaO₂ inspirado depende de ella directamente.
- Altitud exacta del punto de extracción.
- Postura (sentado) y tiempo de reposo previo (≥ 10 min).
- Temperatura del paciente y del analizador, y calibración del equipo.
- Tiempo entre extracción y procesamiento.

### Qué se publica

Por cada celda de edad y sexo: **media, desviación estándar y percentil 5**. El
percentil 5 es el que importa clínicamente, porque es el límite inferior de la
normalidad, y es lo que debería sustituir al «alarmar si < 88 %» actual.

---

## 4. Qué cambiaría en el protocolo

Con esos datos se podría:

1. Quitar la palabra «extrapolados» de los siete puntos de `sepsis.js` y los dos
   de `itu.js` donde hoy aparece.
2. Sustituir el rango plano 88–92 % por una tabla corta por edad y sexo, o al
   menos por un umbral de alarma ajustado a la edad.
3. Recalcular el PaO₂/FiO₂ basal (hoy 310, estimado) con la PaO₂ medida.
4. Subir el nivel de evidencia de la fila «Altitud» de la tabla de indicadores,
   que hoy está en 5/D precisamente porque el dato es indirecto.

Mientras tanto, la redacción actual es correcta: dice de dónde viene la cifra,
a qué altitud se midió, y que desciende con la edad y más en mujeres.

---

## 5. Atajo intermedio

Si el estudio propio no es viable a corto plazo, hay una opción intermedia que
no requiere pacientes: pedir a los autores del estudio de Bogotá las **tablas
por década y sexo**. El artículo las tiene; el resumen solo da la tendencia. Con
ellas se podría al menos estratificar el rango, que es la mitad del problema,
aunque la altitud siguiera siendo la de Bogotá.
