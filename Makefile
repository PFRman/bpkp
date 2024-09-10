DIR = src/SPARQL-ac-jison

help:
	@echo "Possible make commands:"
	@echo
	@echo "make help"
	@echo "display this message"
	@echo
	@echo "make generate"
	@echo "let jison generate the Parser-JS for Autocompletion and minify it"
	@echo "reads from src/SPARQL-ac-jison/sparql-ac-parser.jison"
	@echo "writes src/SPARQL-ac-jison/sparql-ac-parser.js and src/SPARQL-ac-jison/sparql-ac-parser.min.js"
	@echo "takes < 5 seconds"
	@echo
	@echo "make run"
	@echo "start a python http.server to serve the website"

generate:
	cd $(DIR) && npx jison sparql-ac-parser.jison && npx terser sparql-ac-parser.js -o sparql-ac-parser.min.js -c -m

run:
	python3 -m http.server