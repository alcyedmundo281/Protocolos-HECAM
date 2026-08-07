MATRICES := $(wildcard produccion/*/protocolo.jsonld)

# La matriz es la fuente de verdad: el .docx se compila desde ella.
generar:
	@for f in $(MATRICES); do node skill/scripts/compilar_docx.js "$$f" || exit 1; done

validar:
	@for f in $(MATRICES); do python3 skill/scripts/validate_jsonld.py "$$f" || exit 1; done

verificar:
	@for f in produccion/*/salida/*.docx; do \
		python3 skill/scripts/verificar_caratula.py "$$f" || exit 1; \
		python3 skill/scripts/verificar_documento.py "$$f" || exit 1; \
		python3 skill/scripts/check_citas.py "$$f" || exit 1; \
		python3 skill/scripts/verificar_fuentes_docx.py "$$f" || exit 1; \
		python3 skill/scripts/verificar_numeracion.py "$$f" || exit 1; \
		python3 skill/scripts/verificar_tipografia.py "$$f" || exit 1; \
	done

fuentes:
	python3 skill/scripts/verificar_pmid.py $(MATRICES)

# Las observaciones que la revisora repite, comprobadas antes de enviarle nada.
revisora:
	python3 skill/scripts/verificar_revisora.py $(MATRICES)
	python3 skill/scripts/verificar_farmacos.py $(MATRICES)
	python3 skill/scripts/verificar_firmas.py $(MATRICES)
	python3 skill/scripts/verificar_citas_matriz.py $(MATRICES)

jats:
	@for f in $(MATRICES); do \
		python3 skill/scripts/build_jats.py "$$f" \
			-o "$$(dirname $$f)/salida/protocolo.jats.xml" || exit 1; \
	done

todo: validar generar verificar fuentes revisora

# Ingeniería inversa: reconstruye la matriz desde un generador .js heredado.
# Los dos protocolos actuales ya están migrados y no lo necesitan.
matriz:
	python3 skill/scripts/armar_jsonld.py $(JS)

referencia:
	python3 skill/scripts/verificar_caratula.py --generar-referencia $(APROBADO)

.PHONY: generar validar verificar fuentes revisora jats todo matriz referencia
