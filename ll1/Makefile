help:
	@echo "Possible make commands:"
	@echo
	@echo "make help"
	@echo "display this message"
	@echo
	@echo "make generate"
	@echo "browserify the node dependencies for the LL(1) parser and minify it."
	@echo "writes modules.min.js"
	@echo "takes < 5 seconds"
	@echo
	@echo "make run"
	@echo "start a python http.server to serve the website"

generate:
	npx browserify -r jison-lex -r ebnf-parser -r fs | npx terser -o modules.min.js

run:
	python3 -m http.server