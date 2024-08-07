import init, { parse } from "./src/pkg/text_utils_grammar.js";

// const keywords = ["select", "where", "filter", "prefix", "distinct", "order", "by", "desc", "limit", "offset"];
const keywords = await fetch("src/keywords.txt")
    .then(res => res.text())
    .then(text => text.split("\n").map(line => line.trim()));

const triplePattern =
new RegExp(/(?<subj>\S+)\s+(?<pred>\S+)\s+(?<obj>\S+)\s*\./g);
// todo: how to deal with whitespaces in strings (ac, syntax highlighting)?


let vars = [];
let definedPrefixes = [];

let SparqlParser = require('sparqljs').Parser;
let parser = { // does it have to be global?
    parser: new SparqlParser(),
    accepted: false,
    update(parseInput) {
        try {
            let results = this.parser.parse(parseInput);
            this.result = results.result;
            this.prefixes = results.result.prefixes;
            this.vstack = [results.result];
            this.expected = results.allExpected;
            this.accepted = true;
        } catch (e) {
            if (e.hash === undefined) throw e;
            this.result = undefined;
            this.prefixes = e.hash.prefixes;
            this.vstack = e.hash.vstack;
            this.expected = e.hash.allExpected;
            this.errorpos = e.hash.matched.length - e.hash.text.length;
            this.contextTriples = e.hash.contextTriples;
            this.accepted = false;
        }
    }
}

export default function documentReady() {
    // hard wrap for the textarea, so that line counting works
    document.querySelector("#query-input").wrap = "hard";
    document.querySelector("#query-input").addEventListener("input", processQuery);
    // document.querySelector("#query-input").addEventListener("selectionchange", autoSuggestion);
    document.querySelector("#query-input").addEventListener("input", autoSuggestion);
    document.querySelector("#text-utilsToggle").addEventListener("change", processQuery);
    document.querySelector("#sparqlJsToggle").addEventListener("change", processQuery);
    processQuery();
    // autoSuggestion();
}

async function processQuery() {
    const sparqlInput = document.querySelector("#query-input").value;
    const sparqlLower = sparqlInput.toLowerCase();
    let sparqlOutput = sparqlLower
        .replaceAll(/</g, `&lt;`).replaceAll(/>/g, `&gt;`);

    // string Syntax highlighting
    sparqlOutput = sparqlOutput.replaceAll(/"\w*"/g, `<span class="string">$&</span>`)

    // keyword syntax highlighting
    for (let keyword of keywords) {
        sparqlOutput = sparqlOutput.replaceAll(new RegExp(`\\b${keyword.toLowerCase()}\\b`, "g"),
            `<span class="keyword">${keyword}</span>`);
    }

    // variable syntax highlighting
    sparqlOutput = sparqlOutput.replaceAll(/\?\w*/g, `<span class="variable">$&</span>`);

    document.querySelector("#text").innerHTML = sparqlOutput;

    // Find all prefix definitions
    definedPrefixes = [...sparqlLower.matchAll(/prefix\s(\S+:)/g)]
        .map(m => m[1]);

    // Find all variables in the SPARQL between the SELECT and WHERE clause.
    const select_start = sparqlLower.search(/select\s/);
    const select_end = sparqlLower.search(/\swhere/);
    const variables = [...sparqlInput.slice(select_start + 7, select_end).matchAll(/\?\w+/g)];

    document.querySelector("#variables").innerHTML = variables.toString()
        .replaceAll(/\?\w*/g, `<span class="variable">$&</span>`);

    // Find all triples between "WHERE {" and "}"
    const whereStart = sparqlLower.search("{") + 1;
    const whereEnd = sparqlLower.search("}");
    const whereText = sparqlInput.slice(whereStart, whereEnd);
    const triples = [...whereText.matchAll(triplePattern)]
        .map(m => [m.groups.subj, m.groups.pred, m.groups.obj]);
    document.querySelector("#triples").innerHTML = triples.join(`<br />`);

    // Find the (optional) filter condition
    const filter = sparqlLower.match(/filter\s\((?<filter>.+)\)/)?.groups.filter;
    document.querySelector(`#filter`).innerHTML = (filter ? `Filter: ${filter}` : "");

    // Find the (optional) LIMIT clause.
    const limit = sparqlInput.match(/limit\s(?<limit>\d+)\b/)?.groups.limit;
    document.querySelector(`#limit`).innerHTML = (limit ? `Limit: ${limit}` : "");

    // Find the (optional) OFFSET clause.
    const offset = sparqlInput.match(/offset\s(?<offset>\d+)\b/)?.groups.offset;
    document.querySelector(`#offset`).innerHTML = (offset ? `Offset: ${offset}` : "");

    // Create an object with the variable occurrences and a list of non-variable occurrences
    let occurrences = Object.fromEntries(variables.map(k => [k, []]));
    let nonVars = [];
    for (let [t,[subj, pred, obj]] of triples.entries()) {
        if (subj in occurrences) occurrences[subj].push(`t${t}.subject`);
        else if (subj.charAt(0) === `?`) occurrences[subj] = [`t${t}.subject`];
        else nonVars.push(`t${t}.subject="${subj}"`);

        if (pred in occurrences) occurrences[pred].push(`t${t}.predicate`);
        else if (pred.charAt(0) === `?`) occurrences[pred] = [`t${t}.pred`];
        else nonVars.push(`t${t}.object="${pred}"`);

        if (obj in occurrences) occurrences[obj].push(`t${t}.object`);
        else if (obj.charAt(0) === `?`) occurrences[obj] = [`t${t}.object`];
        else nonVars.push(`t${t}.object="${obj}"`);
    }
    vars = Object.keys(occurrences);
    document.querySelector("#vocc").textContent = JSON.stringify(occurrences, null, 2);
    document.querySelector("#nvocc").textContent = nonVars.toString();

    // using Jison-generated SPARQL-parser
    if (document.querySelector("#sparqlJsToggle").checked) /*console.log(
        "sparqlJsParse result:", */sparqlJsParse(sparqlInput);

    // using ad-freiburg/text-utils
    if (document.querySelector("#text-utilsToggle").checked) await textUtilsParse(sparqlInput);
}

/** Parse a SPARQL-query using the SPARQL.js module
 * @param {string} sparqlInput - the parser input
 * @param {boolean} silent - don't print anything to console or the document
 * @returns the parser output */
function sparqlJsParse (sparqlInput, silent = false) {
    console.log("SPARQL.js: ");
    const parser = new SparqlParser();
    try {
        let startTime = performance.now();
        let result = parser.parse(sparqlInput).result;
        let endTime = performance.now();
        let sparqlJsTime = endTime - startTime;
        if (!silent) {
            document.querySelector("#sparqlJsOutput").textContent = JSON.stringify(result, null, 2);
            // console.log("parsed: ", JSON.stringify(result, null, 2));
            console.log("sparql.js time: ", sparqlJsTime);
            document.querySelector("#query-input").style.borderColor = "green";
        }
        return result;
    } catch (e) {
        if (!silent) {
            document.querySelector("#sparqlJsOutput").innerHTML
                = `<span class="error">Parse Error (see console)</span>`;
            document.querySelector("#query-input").style.borderColor = "gray";
            console.log(e);
        }
    }
}

/** Parse a SPARQL-query using the ad-freiburg/text-utils module
 * @param {string} sparqlInput the parser input */
async function textUtilsParse (sparqlInput) {
    console.log("text-utils:");
    const gResponse= await fetch("src/sparql.y");
    const sparqlGrammar = await gResponse.text();
    const lResponse = await fetch("src/sparql.l");
    const sparqlLexer = await lResponse.text();
    init().then(() => {
        try {
            let startTime = performance.now();
            let parsed = parse(sparqlInput, sparqlGrammar, sparqlLexer);
            let endTime = performance.now();
            let textUtilsTime = endTime - startTime;
            if (parsed === undefined) {
                throw new Error("Parse Error (undefined response)");
            } else {
                // console.log(parsed);
                document.querySelector("#text-utilsOutput").textContent = parsed;
                console.log("text-utils time: ", textUtilsTime);
            }
        } catch (e) {
            document.querySelector("#text-utilsOutput").innerHTML
                = `<span class="error">Parse Error</span>`;
            console.log(e);
        }
    });
}

/** Find fitting suggestions for the cursor position and print them */
async function autoSuggestion () {
    // console.log("autoSuggestion:");
    let sparqlInputElement = document.querySelector("#query-input");
    const sparqlInput = sparqlInputElement.value;
    parser.update(sparqlInput);
    let slicedInput;
    let lastCharsBeforeCursor = "";
    let pos = sparqlInputElement.selectionStart;
    let char = sparqlInput[pos];
    while (/\S/.test(char) && pos >= 0) {
        pos -= 1;
        char = sparqlInput[pos];
    }
    console.log("pos:", pos);
    console.log("errorpos:", parser.errorpos)
    if (!parser.accepted && parser.errorpos < pos) {
        slicedInput = sparqlInput.slice(0, parser.errorpos);
        lastCharsBeforeCursor = sparqlInput.slice(parser.errorpos, sparqlInputElement.selectionStart);
    } else {
        slicedInput = sparqlInput.slice(0, pos + 1);
        lastCharsBeforeCursor = sparqlInput.slice(pos + 1, sparqlInputElement.selectionStart);
    }
    console.debug('lastCharsBeforeCursor: "' + lastCharsBeforeCursor + '"');
    console.debug('slicedInput: "' + slicedInput + '"');
    let col = slicedInput.split("\n").at(-1).trimEnd().length;
    let line = slicedInput.split("\n").length; // 1-based (like parser)
    // skip blank lines
    while (col === 0 && line > 1) {
        col = getPreviousLineEndColumnNumber(sparqlInputElement);
        line = line - 1;
    }
    parser.update(slicedInput);
    console.debug("updated parser:", Object.assign({}, parser));
    let suggestions = getSuggestions(sparqlInput, [line, col], lastCharsBeforeCursor); // is sparqlInput better than slicedInput?
    printSuggestions(suggestions, lastCharsBeforeCursor);
    document.querySelector("#suggestions").scrollTop = 0;
    document.querySelector("#context-sensitive-suggestions").innerHTML =
        '<img src="src/ajax-loader.gif" alt="loading...">';
    await requestQleverSuggestions(lastCharsBeforeCursor);
    sparqlInputElement.focus();
}


/** Find fitting suggestions for the cursor position in a (potentially unfinished) query
 * @param {String} sparqlInput - the parser input
 * @param {[]} cursorPosition - the position of the cursor in the input field [line, col]
 * @param {String} lastChars
 * @returns [String] - Array containing the suggestions
 */
function getSuggestions (sparqlInput, cursorPosition, lastChars) {
    let expectedAtCursor = parser.expected[cursorPosition];
    // console.log("expectedAtCursor", cursorPosition, expectedAtCursor.slice());
    // let completionSuggestions = [];
    let otherSuggestions = [];
    const prefixes = Object.keys(parser.prefixes);
    // let generatedInput;
    // const RandExp = require("randexp");
    if (expectedAtCursor === undefined) return [];
    for (let e of expectedAtCursor) {
        let suggestions = [];
        if (e === "VAR") {
            // generatedTerminal = new RandExp(/[?$]\w/).gen();
            suggestions = vars.concat(["?"]);
        } else if (e === "PNAME_NS") {
            suggestions = (prefixes.length > 0 ? prefixes.map(p => p + ":") : ["rdfs:"]);
        } else if (e === "IRIREF") {
            suggestions = ["<"];
        } else if (keywords.concat(".{}();,.".split("")).includes(e)) {
            // "literal"/trivial terminals
            suggestions = [e];
        } else {
            continue;
        }
        /*generatedInput = inputCopy.slice(0, sparqlInputElement.selectionStart)
            + suggestions[0]
            + inputCopy.slice(sparqlInputElement.selectionEnd);
        // console.log("generatedInput: ", generatedInput);
        let parseResult = sparqlJsParse(generatedInput, true);
        if (parseResult !== undefined) {
            completionSuggestions = completionSuggestions.concat(suggestions);
        } else {*/
            otherSuggestions = otherSuggestions.concat(suggestions);
        //}
    }
    otherSuggestions = otherSuggestions.filter(s => s.toLowerCase().startsWith(lastChars.toLowerCase()));
    return /*[completionSuggestions, */otherSuggestions/*]*/;
}

function getPreviousLineEndColumnNumber (textArea) {
    return textArea.value.slice(0, textArea.selectionStart).split("\n").at(-2).trimEnd().length;
}

/** Print out a suggestion list to the suggestions-<div>
 * @param {Array<string>} suggestions - The list of suggestions
 * @param {String} lastChars - last chars of the input - first chars of the currently typed literal
 * @param {boolean} primary - makes the suggestions printed out primarily
 */
function printSuggestions (suggestions, lastChars, primary = false) {
    let divId = (primary ? "#primary-suggestions" : "#secondary-suggestions");
    let suggestionDiv = document.querySelector(divId);
    suggestionDiv.innerHTML = "";
    for (let suggestion of suggestions) {
        let suggestionElement = document.createElement(`div`);
        suggestionElement.classList.add("suggestion");
        if (primary) suggestionElement.classList.add("primary-suggestion");
        suggestionElement.innerText = suggestion;
        suggestionElement.addEventListener("click",
            async function () {
                let queryInput = document.querySelector("#query-input");
                queryInput.setRangeText(suggestion, queryInput.selectionStart - lastChars.length,
                    queryInput.selectionEnd, "end");
                document.querySelector("#query-input").focus();
                suggestionDiv.innerHTML = "";
                await autoSuggestion();
            });
        suggestionDiv.appendChild(suggestionElement);
    }
}

/** Print out a suggestion list to the context-sensitive suggestions-<div>
 * @param {Array<string>} suggestions - The list of suggestions
 * @param lastChars - last chars of the input - first chars of the currently typed literal
 * @param {Object} prefixes - The known prefixes
 */
function printContextSensitiveSuggestions (suggestions, lastChars, prefixes) {
    let divId = "#context-sensitive-suggestions";
    let suggestionDiv = document.querySelector(divId);
    suggestionDiv.innerHTML = "";
    for (let suggestion of suggestions) {
        let suggestionElement = document.createElement(`div`);
        let suggestionNameElement = document.createElement(`span`);
        let suggestionUriElement = document.createElement(`span`);
        suggestionElement.classList.add("suggestion");
        let iri = suggestion.qui_entity.value;
        for (const prefix in prefixes) {
            if (iri.startsWith(prefixes[prefix])) {
                iri = prefix + ":" + iri.slice(prefixes[prefix].length);
                break;
            }
        }
        suggestionUriElement.innerText = iri;
        suggestionNameElement.innerText =
            (suggestion.qui_name !== undefined ? suggestion.qui_name.value : suggestion.qui_alias.value);
        suggestionNameElement.style.fontWeight = "bold";
        suggestionNameElement.style.float = "right";
        suggestionElement.addEventListener("click",
            async function () {
                let queryInput = document.querySelector("#query-input");
                // todo deal with non-http-iris
                if (suggestion.qui_entity.type === "uri" && iri.startsWith("http://")) iri = "<" + iri + ">";
                else if (suggestion.qui_entity.type === "literal") iri = '"' + iri + '"';
                queryInput.setRangeText(iri, queryInput.selectionStart - lastChars.length,
                    queryInput.selectionEnd, "end");
                document.querySelector("#query-input").focus();
                suggestionDiv.innerHTML = "";
                await autoSuggestion();
            });
        suggestionElement.appendChild(suggestionUriElement);
        suggestionElement.appendChild(suggestionNameElement);
        suggestionDiv.appendChild(suggestionElement);
    }
}

let timeout = null;
let qleverRequestCounter = 0;
let lastQleverRequest = -1;

/** Request wikidata entry suggestions from QLever and print them
 * */
async function requestQleverSuggestions (lastChars) {
    let response;
    const currentCounter = qleverRequestCounter++;
    if (timeout !== null) {
        clearTimeout(timeout);
        console.debug("clearing timeout", timeout);
    }
    timeout = setTimeout(async function () {
        console.debug("starting timeout", timeout + ", request", currentCounter);
        try {
            let value = "";
            let requestPrefixes= "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
            const vstack = parser.vstack;
            console.log("vstack: ", vstack.slice());
            if (vstack.length < 8) {
                printContextSensitiveSuggestions([], "", {})
                return;
            }
            document.querySelector("#context-sensitive-suggestions").innerHTML =
                '<img src="src/ajax-loader.gif" alt="loading...">';
            // const previousTriples = vstack[6];
            const previousTriples = parser.contextTriples;
            console.log("previousTriples:", previousTriples);
            console.log("previousTriples (vstack):", vstack[6]);
            let previousTriplesString = "";
            for (let triple of previousTriples) {
                // console.log(triple);
                previousTriplesString +=
                    `${termToString(triple.subject)} ${termToString(triple.predicate)} ${termToString(triple.object)} .\n`;
            }
            const subject = vstack[7];
            let subjectString = termToString(subject);
            const verb = vstack[8];
            // console.log("subject: ", subject, "\nverb: ", verb);
            // "?query=PREFIX+wd%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology-beta%23%3E%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX+wds%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2Fstatement%2F%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology%23%3E%0A%0APREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0APREFIX+ontolex%3A+%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Flemon%2Fontolex%23%3E%0APREFIX+dct%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology%23%3E%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0APREFIX+schema%3A+%3Chttp%3A%2F%2Fschema.org%2F%3E%0APREFIX+cc%3A+%3Chttp%3A%2F%2Fcreativecommons.org%2Fns%23%3E%0APREFIX+geo%3A+%3Chttp%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23%3E%0APREFIX+geof%3A+%3Chttp%3A%2F%2Fwww.opengis.net%2Fdef%2Ffunction%2Fgeosparql%2F%3E%0APREFIX+prov%3A+%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Fprov%23%3E%0APREFIX+wd%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX+data%3A+%3Chttps%3A%2F%2Fwww.wikidata.org%2Fwiki%2FSpecial%3AEntityData%2F%3E%0APREFIX+s%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2Fstatement%2F%3E%0APREFIX+ref%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Freference%2F%3E%0APREFIX+v%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fvalue%2F%3E%0APREFIX+wdt%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0APREFIX+wdtn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect-normalized%2F%3E%0APREFIX+p%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2F%3E%0APREFIX+ps%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2F%3E%0APREFIX+psv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2Fvalue%2F%3E%0APREFIX+psn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2Fvalue-normalized%2F%3E%0APREFIX+pq%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2F%3E%0APREFIX+pqv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2Fvalue%2F%3E%0APREFIX+pqn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2Fvalue-normalized%2F%3E%0APREFIX+pr%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2F%3E%0APREFIX+prv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2Fvalue%2F%3E%0APREFIX+prn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2Fvalue-normalized%2F%3E%0APREFIX+wdno%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fnovalue%2F%3E%0APREFIX+imdb%3A+%3Chttps%3A%2F%2Fwww.imdb.com%2F%3E%0APREFIX+qfn%3A+%3Chttp%3A%2F%2Fqlever.cs.uni-freiburg.de%2Ffunction%23%3E%0APREFIX+ql%3A+%3Chttp%3A%2F%2Fqlever.cs.uni-freiburg.de%2Fbuiltin-functions%2F%3E%0ASELECT+%3Fqui_entity+%28SAMPLE%28%3Fname%29+as+%3Fqui_name%29+%28SAMPLE%28%3Falias%29+as+%3Fqui_alias%29+%28SAMPLE%28%3Fcount%29+as+%3Fqui_count%29+WHERE+%7B%0A++%7B+SELECT+%3Fqui_entity+%28COUNT%28%3Fqui_entity%29+AS+%3Fcount%29+WHERE+%7B%0A++++wd%3AQ90+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2FP47%3E+%3Fo+.+%3Fo+%3Fp+%3Fqui_entity+.%0A++%7D+GROUP+BY+%3Fqui_entity+%7D%0A++%0A++OPTIONAL+%7B+%3Fqui_entity+%40en%40rdfs%3Alabel+%3Fname+%7D%0A++BIND+%28%3Fqui_entity+AS+%3Falias%29%0A++%0A%7D+GROUP+BY+%3Fqui_entity+ORDER+BY+DESC%28%3Fqui_count%29%0ALIMIT+40%0AOFFSET+0&timeout=5000ms"

            // console.log("typeof", subject);
            if (subject === undefined || Array.isArray(subject) ) {
                // subject suggestion
                if (lastChars.length > 2) {
                    requestPrefixes += "PREFIX wikibase: <http://wikiba.se/ontology#>\n" +
                        "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                        "PREFIX schema: <http://schema.org/>";
                    value +=
                        "SELECT ?qui_entity (SAMPLE(?name) AS ?qui_name) (SAMPLE(?alias) AS ?qui_alias) (SAMPLE(?sitelinks) AS ?qui_count) WHERE {\n" +
                        "  { SELECT ?qui_entity ?name ?alias WHERE {\n" +
                        "      ?qui_entity @en@rdfs:label ?name .\n" +
                        "      ?qui_entity @en@skos:altLabel ?alias .\n" +
                        `      FILTER (REGEX(STR(?name), "^${lastChars}") || REGEX(STR(?alias), "^${lastChars}")) } }\n` +
                        "  ?qui_entity ^schema:about ?m . ?m wikibase:sitelinks ?sitelinks\n"
                } else {
                    printContextSensitiveSuggestions([], "", {});
                    return;
                }
            } else {
                value += "SELECT ?qui_entity (SAMPLE(?name) as ?qui_name) (SAMPLE(?alias) as ?qui_alias) (SAMPLE(?count) as ?qui_count) WHERE {\n";
                if (verb === undefined) {
                    // predicate suggestion
                    let x = (subject.termType === "Variable" ? `DISTINCT ?${subject.value}`: "?qui_object");
                    value +=
                        `{ SELECT ?qui_entity (COUNT(${x}) AS ?count) WHERE {\n` +
                        previousTriplesString +
                        `${subjectString} ?qui_entity ?qui_object }\n` +
                        "GROUP BY ?qui_entity }\n" +
                        "?qui_tmp_1 ?qui_tmp_2 ?qui_entity .\n" +
                        "?qui_tmp_1 @en@rdfs:label ?name .\n" +
                        "BIND (?name AS ?alias)\n"
                } else {
                    // object suggestion
                    let verbString = termToString(verb);
                    value +=
                        "{ SELECT ?qui_entity (COUNT(?qui_entity) AS ?count) WHERE {\n" +
                        previousTriplesString +
                        `${subjectString} ${verbString} ?qui_entity .\n` +
                        "} GROUP BY ?qui_entity }\n" +
                        "OPTIONAL { ?qui_entity @en@rdfs:label ?name }\n" +
                        "BIND (?qui_entity AS ?alias)\n"
                }
                if (lastChars.length > 0) {
                    value += `FILTER (REGEX(STR(?name), "^${lastChars}", "i") || REGEX(STR(?alias), "^${lastChars}", "i"))`
                }
            }
            console.debug("lastChars", lastChars, lastChars.length);
            value += "} GROUP BY ?qui_entity ORDER BY DESC(?qui_count)\n" +
                "LIMIT 40\n"
                // + "OFFSET 0"
            let requestQuery = requestPrefixes + value;
            // console.debug("request #" + currentCounter,  "to qlever backend:\n" + requestQuery);
            response = await fetch("https://qlever.cs.uni-freiburg.de/api/wikidata?query="
                + encodeURIComponent(requestQuery))
               .then(r => r.json());
            // console.debug("currentCounter", currentCounter, "lastQleverRequest", currentCounter);
            // console.debug(response);
            if (currentCounter > lastQleverRequest) {
                lastQleverRequest = currentCounter;
                console.log("suggestions #" + currentCounter, response.results.bindings)
                printContextSensitiveSuggestions(response.results.bindings, lastChars, parser.prefixes);
            }
        } catch (e) {
            printContextSensitiveSuggestions([], "", {});
            console.log(e);
        }
    }, 150);
}

function termToString (term) {
    let termString;
    if (term.type && term.type === "path") {
        if (term.pathType === "/"){
            termString = term.items.map(termToString).join("/");
        } else {
            termString = term.items.map(termToString).join("") + term.pathType;
        }
    } else {
        switch (term.termType) {
            case "Variable":
                termString = "?" + term.value;
                break;
            case "NamedNode":
                termString = "<" + term.value + ">";
                break;
        }
    }
    return termString;
}