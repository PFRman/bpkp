import init, { parse } from "./src/pkg/text_utils_grammar.js";

// const keywords = ["select", "where", "filter", "prefix", "distinct", "order", "by", "desc", "limit", "offset"];
const keywords = await fetch("src/keywords.txt")
    .then(res => res.text())
    .then(text => text.split("\n").map(line => line.trim()));

const triplePattern =
new RegExp(/(?<subj>\S+)\s+(?<pred>\S+)\s+(?<obj>\S+)\s*\./g);
// todo how to deal with spaces in strings in the triples?

let vars = [];

export default function documentReady() {
    // hard wrap for the textarea, so that line counting works
    document.querySelector("#query-input").wrap = "hard";

    document.querySelector("#query-input").addEventListener("input", processQuery);
    document.querySelector("#query-input").addEventListener("input", autocomplete);
    document.querySelector("#text-utilsToggle").addEventListener("change", processQuery);
    document.querySelector("#sparqlJsToggle").addEventListener("change", processQuery);
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

    // Find all variables in the SPARQL between the SELECT and WHERE clause.
    const select_start = sparqlLower.search(/select\s/);
    const select_end = sparqlLower.search(/\swhere/);
    const variables = sparqlInput.slice(select_start + 7, select_end).split(" ");

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
    console.log(vars)
    document.querySelector("#vocc").textContent = JSON.stringify(occurrences, null, 2);
    document.querySelector("#nvocc").textContent = nonVars.toString();

    // using Jison-generated SPARQL-parser
    sparqlJsParse(sparqlInput);

    // using ad-freiburg/text-utils
    await textUtilsParse(sparqlInput);
}

/** Parse a SPARQL-query using the SPARQL.js module */
function sparqlJsParse (sparqlInput) {
    if (document.querySelector("#sparqlJsToggle").checked) {
        console.log("SPARQL.js: ");
        let SparqlParser = require('sparqljs').Parser;
        const parser = new SparqlParser();
        try {
            let startTime = performance.now();
            let parsed = parser.parse(sparqlInput);
            let endTime = performance.now();
            let sparqlJsTime = endTime - startTime;
            document.querySelector("#sparqlJsOutput").textContent = JSON.stringify(parsed, null, 2);
            // console.log(JSON.stringify(parsed, null, 2));
            console.log(sparqlJsTime);
        } catch (e) {
            console.log(e);
            document.querySelector("#sparqlJsOutput").innerHTML
                = `<span class="error">Parse Error</span>`;
            return e.hash;
        }
    }
}

/** Parse a SPARQL-query using the ad-freiburg/text-utils module */
async function textUtilsParse (sparqlInput) {
    if (document.querySelector("#text-utilsToggle").checked) {
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
                    console.log(textUtilsTime);
                }
            } catch (e) {
                document.querySelector("#text-utilsOutput").innerHTML
                    = `<span class="error">Parse Error</span>`;
                console.log(e);
            }
        });
    }
}

/** Find fitting suggestions for the cursor position in an unfinished query and print them */
function autocomplete () {
    console.log("autocomplete:");
    let sparqlInput = document.querySelector("#query-input");
    let suggestions = getSuggestions(sparqlInput);
    sparqlInput.focus();
    printSuggestions(suggestions[0], true);
    printSuggestions(suggestions[1]);
}

/** Find fitting suggestions for the cursor position in an unfinished query
 * @param sparqlInput - HTML DOM input <textarea>
 * @returns {*[][]} - Array of two arrays containing (1) completing and (2) other suggestions
 */
function getSuggestions (sparqlInput) {
    let inputCopy = sparqlInput.value;
    let parseError = sparqlJsParse(inputCopy);
    if (parseError === undefined) {
        console.log("no parse error");
        return [[],[]];
    }
    if (Math.abs(parseError.line - getCursorLineNumber(sparqlInput)) > 1) {
        // todo more sophisticated comparison
        console.log("cursor not on faulty position");
        return [[],[]];
    }
    let expected = parseError.expected.map(e => e.slice(1, -1)); // remove additional "'" in error message
    let completionSuggestions = [];
    let otherSuggestions = [];
    let generatedTerminal;
    let generatedInput;
    const RandExp = require("randexp");
    if (parseError.token === "INVALID") return [[],[]];
    for (let e of expected) {
        if (e === "VAR") {
            generatedTerminal = new RandExp(/[?$]\w/).gen();
            // } else if (e === "INTEGER") { generatedTerminal = new RandExp(/\d/).gen();
        } else if (keywords.concat(".{}();,.".split("")).includes(e)) {
            // "literal"/trivial terminals
            generatedTerminal = e;
        } else {
            continue;
        }
        generatedInput = inputCopy.slice(0, sparqlInput.selectionStart)
            + generatedTerminal
            + inputCopy.slice(sparqlInput.selectionEnd);
        let generatedError = sparqlJsParse(generatedInput);
        let suggestions = (e === "VAR" ? vars.concat(["?"]) : [generatedTerminal]);
        if (generatedError === undefined) {
            completionSuggestions = completionSuggestions.concat(suggestions);
        } else {
            otherSuggestions = otherSuggestions.concat(suggestions);
        }
    }
    return [completionSuggestions, otherSuggestions];
}

/** Get the line number of the cursor position in a <textarea> */
function getCursorLineNumber (textArea) {
    return textArea.value.slice(0, textArea.selectionStart).split("\n").length - 1;
}

/** Print out a suggestion list to the suggestions-<div>
 * @param {Array<string>} suggestions - The list of suggestions
 * @param {boolean} primary - makes the suggestions printed out primarily
 */
function printSuggestions (suggestions, primary = false) {
    let divId = (primary ? "#primary-suggestions" : "#suggestions");
    let suggestionDiv = document.querySelector(divId);
    suggestionDiv.innerHTML = "";
    for (let suggestion of suggestions) {
        let suggestionElement = document.createElement(`div`);
        suggestionElement.classList.add("suggestion");
        suggestionElement.innerText = suggestion;
        suggestionElement.addEventListener("click",
            function () {
                let queryInput = document.querySelector("#query-input");
                queryInput.setRangeText(suggestion, queryInput.selectionStart, queryInput.selectionEnd, "end");
                document.querySelector("#query-input").focus();
                suggestionDiv.innerHTML = "";
                autocomplete();
            });
        suggestionDiv.appendChild(suggestionElement);
    }
}