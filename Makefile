generar:
	cd protocolos && node sepsis.js && node itu.js

verificar:
	@for f in salida/*.docx; do python3 scripts/verificar_caratula.py "$$f" || exit 1; done

fuentes:
	python3 scripts/verificar_pmid.py protocolos/*.js

todo: generar verificar fuentes

referencia:
	python3 scripts/verificar_caratula.py --generar-referencia $(DOCX)

.PHONY: generar verificar fuentes todo referencia
