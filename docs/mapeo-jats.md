# Mapeo HECAM → JATS 1.3

Referencia para `scripts/build_jats.py`. Perfil: **JATS Journal Archiving and Interchange
1.3**, `article-type="clinical-guideline"`, `xml:lang="es"`.

Se eligió el perfil *Archiving* (no *Publishing*) porque es el más permisivo y el que
conviene para depósito institucional a largo plazo y para asignación de DOI.

---

## 1. Metadatos del documento

| Campo JSON-LD | Elemento JATS |
|---------------|---------------|
| `identifier` | `<article-id pub-id-type="publisher-id">` |
| `name` | `<article-title>` |
| `tipoDocumento` | `<subj-group subj-group-type="heading"><subject>` |
| `unidadTecnica` | `<subj-group subj-group-type="unidad-tecnica"><subject>` |
| `dateCreated` | `<pub-date date-type="original-elaboration" iso-8601-date="…">` |
| `description` | `<abstract abstract-type="summary">` |
| `publisher` | `<publisher><publisher-name>` |
| `inLanguage` | atributo `xml:lang` del `<article>` |

Todo lo que no tiene equivalente nativo en JATS va a `<custom-meta-group>`:
`codigo-sgd`, `codigo-provisional`, `version`, `unidad-tecnica`, `estado`,
`vigencia-anios`, `mes-anio-portada`, `sistema-evidencia`, `citas-superindice`,
`bibliografia-orden`, y una entrada `normativa` por cada norma aplicable.

---

## 2. Roles

JATS distingue el **tipo de contribuyente** (`contrib-type`) del **rol declarado**
(`<role>`). Se usan ambos, y los contribuyentes se separan en `<contrib-group>` por
`content-type` para que el bloque de firmas sea reconstruible desde el XML.

| Rol HECAM | `contrib-group content-type` | `contrib-type` | `<role content-type>` |
|-----------|------------------------------|----------------|------------------------|
| Elaborado por (autores) | `elaboracion` | `author` | `elaborado-por` |
| **Revisión editorial (revisora)** | `revision-editorial` | `editor` | `revision-editorial` |
| Revisado por (7 institucionales) | `revision-institucional` | `reviewer` | slug del cargo |
| Aprobado por (Director Técnico) | `aprobacion` | `editor` | `aprobado-por` |

La revisora se modela como `editor` porque su intervención es editorial y no de contenido —
la distinción importa: `reviewer` implica revisión de fondo, que en el flujo HECAM
corresponde a la Coordinación General de Investigación como instancia, no a ella
personalmente.

El orden de los revisores institucionales se preserva mediante el campo `position` del
JSON-LD, que determina el orden de salida en el `<contrib-group>`.

Cuando un rol no tiene persona asignada todavía (lo habitual antes de la firma), se emite el
`<contrib>` solo con `<role>`, sin `<name>`. Es válido en JATS y deja el hueco explícito.

---

## 3. Cuerpo

Cada sección del protocolo es un `<sec>` con `id="sec-{numeral}"` (los puntos se sustituyen
por guiones: `4.1` → `sec-4-1`), `<label>` con el numeral y `<title>` con el nombre literal.

| `secType` en JSON-LD | `sec-type` en JATS |
|----------------------|--------------------|
| `justificacion` | `justificacion` |
| `objetivos` | `objetivos` |
| `glosario` | `glosario` |
| `procedimiento` | `procedimiento` |
| `algoritmo` | `algoritmo` |
| `indicadores` | `indicadores` |
| `anexos` | `anexos` (cada anexo es un `<sec sec-type="anexo">` anidado) |
| `firmas` | `firmas` |
| `control-cambios` | `control-cambios` |
| `bibliografia` | — se omite del `<body>`; va a `<back><ref-list>` |

Campos derivados:

- `quienLoHace` → `<p><bold>Quién lo hace:</bold> …</p>`
- `cuando` → `<p><bold>Cuándo:</bold> …</p>`
- `objetivoGeneral` / `objetivosEspecificos` → subsecciones con `<list list-type="order">`
- `glosario` y `abreviaciones` → `<table-wrap>` de dos columnas
- `indicadores` → `<table-wrap>` de las 6 columnas oficiales
- `controlCambios` → `<table-wrap>` de 3 columnas

---

## 4. Bloques de contenido

| `type` JSON-LD | JATS |
|----------------|------|
| `Parrafo` | `<p>` |
| `Nota` | `<boxed-text content-type="nota"><p>` |
| `Lista` (`estilo: vinetas`) | `<list list-type="bullet">` |
| `Lista` (`estilo: numerada`) | `<list list-type="order">` |
| `Tabla` / `TablaResistencia` | `<table-wrap>` con `<caption><title>` y `<table-wrap-foot>` para la fuente |

Los anchos de columna (`anchos`, en DXA) son específicos del `.docx` y **no** se
trasladan al XML: en JATS el ancho es responsabilidad de la hoja de estilo.

---

## 5. Marcado en línea

| Marca | JATS |
|-------|------|
| `[[7]]` | `<sup><xref ref-type="bibr" rid="ref-7">7</xref></sup>` |
| `[[3,4]]` | `<sup><xref … rid="ref-3">3</xref>,<xref … rid="ref-4">4</xref></sup>` |
| `[[5–8]]` | se expande a los `<xref>` de 5, 6, 7 y 8 |
| `**texto**` | `<bold>` |
| `__texto__` | `<italic>` |

Los rangos se expanden porque `<xref>` apunta a un único `rid`; un rango sin expandir
rompería los enlaces en los visores JATS.

---

## 6. Bibliografía

```xml
<back>
  <ref-list>
    <title>Bibliografía</title>
    <ref id="ref-1">
      <label>1</label>
      <mixed-citation publication-type="journal">…Vancouver…<pub-id pub-id-type="pmid">26903338</pub-id><pub-id pub-id-type="doi">10.1001/jama.2016.0287</pub-id></mixed-citation>
    </ref>
  </ref-list>
</back>
```

Los campos `pmid` y `doi` de cada entrada de `citation[]` salen como `<pub-id>` dentro de
`<mixed-citation>`, que es donde los buscan los agregadores para enlazar la referencia. Se
omiten si están vacíos o si conservan el marcador `{{…}}` de la plantilla. Los rellena
`scripts/verificar_pmid.py` al comprobar la bibliografía contra PubMed; el campo
`verificado` guarda la fecha de esa comprobación.

Se usa `<mixed-citation>` y no `<element-citation>` porque la cadena Vancouver ya viene
compuesta desde el JSON-LD; descomponerla en `<surname>`, `<article-title>`, `<source>`,
`<volume>`, `<fpage>` etc. añade puntos de fallo sin beneficio para el uso actual.

Si en el futuro se quiere depositar en un agregador que exija metadatos granulares de
referencia, hay que enriquecer `citation[]` en el JSON-LD con esos campos y cambiar el
generador a `<element-citation>`. El JSON-LD ya admite `name`, `datePublished`, `isPartOf`
y `url` con ese fin.

---

## 7. Validación

El script no valida contra la DTD (no hay acceso a red en el contenedor). Para verificar
buena formación:

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('protocolo.jats.xml'); print('XML bien formado')"
```

Para validación completa contra la DTD, hacerlo fuera del contenedor con `xmllint --valid`
o con las herramientas del JATS4R.
