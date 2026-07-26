generar:
	cd protocolos && node sepsis.js && node itu.js

verificar:
	@for f in salida/*.docx; do python3 scripts/verificar_caratula.py "$$f" || exit 1; done

todo: generar verificar

referencia:
	python3 scripts/verificar_caratula.py --generar-referencia $(DOCX)

.PHONY: generar verificar todo referencia
