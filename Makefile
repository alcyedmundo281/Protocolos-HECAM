PROTOCOLOS := $(wildcard produccion/*/*.js)

generar:
	@for f in $(PROTOCOLOS); do node "$$f" || exit 1; done

verificar:
	@for f in produccion/*/salida/*.docx; do \
		python3 skill/scripts/verificar_caratula.py "$$f" || exit 1; \
		python3 skill/scripts/verificar_documento.py "$$f" || exit 1; \
		python3 skill/scripts/check_citas.py "$$f" || exit 1; \
	done

fuentes:
	python3 skill/scripts/verificar_pmid.py $(PROTOCOLOS)

matriz:
	@for f in $(PROTOCOLOS); do python3 skill/scripts/armar_jsonld.py "$$f" || exit 1; done

validar:
	@for f in produccion/*/protocolo.jsonld; do python3 skill/scripts/validate_jsonld.py "$$f" || exit 1; done

jats:
	@for d in produccion/*/; do \
		python3 skill/scripts/build_jats.py "$$d/protocolo.jsonld" \
			-o "$$d/salida/protocolo.jats.xml" || exit 1; \
	done

todo: generar verificar fuentes

referencia:
	python3 skill/scripts/verificar_caratula.py --generar-referencia $(APROBADO)

.PHONY: generar verificar fuentes matriz validar jats todo referencia
