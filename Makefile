PROTOCOLOS := $(wildcard produccion/*/*.js)

generar:
	@for f in $(PROTOCOLOS); do node "$$f" || exit 1; done

verificar:
	@for f in produccion/*/salida/*.docx; do \
		python3 skill/scripts/verificar_caratula.py "$$f" || exit 1; \
		python3 skill/scripts/check_citas.py "$$f" || exit 1; \
	done

fuentes:
	python3 skill/scripts/verificar_pmid.py $(PROTOCOLOS)

todo: generar verificar fuentes

referencia:
	python3 skill/scripts/verificar_caratula.py --generar-referencia $(APROBADO)

.PHONY: generar verificar fuentes todo referencia
