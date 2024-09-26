import init, { parse } from "./src/pkg/text_utils_grammar.js";

// const keywords = ["select", "where", "filter", "prefix", "distinct", "order", "by", "desc", "limit", "offset"];
const keywords = await fetch("src/keywords.txt")
    .then(res => res.text())
    .then(text => text.split("\n").map(line => line.trim()));

const builtInCalls = await fetch("src/BuiltInCalls.txt")
    .then(res => res.text())
    .then(text => text.split("\n").map(line => line.trim().concat(" ")));

const aggregates = [ "COUNT(", "SUM(", "MIN(", "MAX(", "AVG(", "SAMPLE(", "GROUP_CONCAT(" ];

const triplePattern =
new RegExp(/(?<subj>\S+)\s+(?<pred>\S+)\s+(?<obj>\S+)\s*\./g);

const QLEVER_TIMEOUT = 15000;

let definedPrefixes = [];

const SJSParser = require('sparqljs').Parser;
let SparqlACParser = sparqlAcParser.Parser;
let sACParser = { // does it have to be global?
    parser: new SparqlACParser(),
    accepted: false,
    update(parseInput) {
        try {
            let results = this.parser.parse(parseInput);
            this.result = results.result;
            this.prefixes = results.result.prefixes;
            this.vstack = [results.result]; // deprecated (not used anymore)
            this.expected = results.allExpected;
            this.accepted = true;
            document.querySelector("#query-input").style.borderColor = "green";
        } catch (e) {
            document.querySelector("#query-input").style.borderColor = "gray";
            if (e.hash === undefined) throw e;
            this.result = undefined;
            this.prefixes = e.hash.prefixes;
            this.vstack = e.hash.vstack; // deprecated (not used anymore)
            this.expected = e.hash.allExpected;
            this.errorpos = e.hash.matched.length - e.hash.text.length;
            this.contextTriples = e.hash.contextTriples ? e.hash.contextTriples : [];
            this.accepted = false;
        }
    }
}

function TSParser () {}

TSParser.prototype.init = async function() {
    const Parser = window.TreeSitter;
    await Parser.init().then(() => { /* ready */ });
    this.parser = new Parser;
    this.sparql = await Parser.Language.load('src/tree-sitter-sparql.wasm');
    this.parser.setLanguage(this.sparql);
}

TSParser.prototype.parse = function(input) {
    this.tree = this.parser.parse(input);
    return this.tree;
}

TSParser.prototype.errorNode = function (tree) {
    const errorQuery = this.sparql.query(`(ERROR) @err`);
    return errorQuery.captures(tree.rootNode)[0].node;
}

let tSParser = new TSParser();
let autoSuggestTSParser = new TSParser();
let suggestionInput;

export default async function documentReady() {
    await tSParser.init();
    await autoSuggestTSParser.init();
    // hard wrap for the textarea, so that line counting works
    document.querySelector("#query-input").wrap = "hard";
    document.querySelector("#query-input").addEventListener("input", processQuery);
    document.querySelector("#query-input").addEventListener("input", autoSuggestion);
    document.querySelector("#text-utilsToggle").addEventListener("change", processQuery);
    document.querySelector("#sparqlJsToggle").addEventListener("change", processQuery);
    document.querySelector("#treeSitterToggle").addEventListener("change", processQuery);
    document.querySelector("#treeSitterQuery").addEventListener("input", processQuery);
    await processQuery();
    // autoSuggestion();
}

async function processQuery() {
    const sparqlInput = document.querySelector("#query-input").value;
    const sparqlLower = sparqlInput.toLowerCase();
    let sparqlOutput = escape(sparqlLower);

    sparqlOutput = syntaxHighlight(sparqlOutput);

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
    document.querySelector("#vocc").textContent = JSON.stringify(occurrences, null, 2);
    document.querySelector("#nvocc").textContent = nonVars.toString();

    // using tree-sitter SPARQL-parser
    if (document.querySelector("#treeSitterToggle").checked) {
        document.querySelector("#tree-sitter").style.display = "block";
        await treeSitterParse(sparqlInput);
        await treeSitterQuery(document.querySelector("#treeSitterQuery").value);
    } else {
        document.querySelector("#tree-sitter").style.display = "none";
    }

    // using Jison-generated SPARQL-parser
    if (document.querySelector("#sparqlJsToggle").checked) {
        document.querySelector("#sparqlJs").style.display = "block";
        /*console.log("sparqlJsParse result:", */sparqlJsParse(sparqlInput);
    } else document.querySelector("#sparqlJs").style.display = "none";

    // using ad-freiburg/text-utils
    if (document.querySelector("#text-utilsToggle").checked) {
        document.querySelector("#text-utils").style.display = "block";
        await textUtilsParse(sparqlInput);
    }
    else document.querySelector("#text-utils").style.display = "none";
}

function syntaxHighlight (input) {
    // string Syntax highlighting
    let sparqlOutput = input.replaceAll(/"([^\x22\x5C\cA\cD])*"/g, `<span class="string">$&</span>`);

    // keyword syntax highlighting
    for (let keyword of keywords) {
        sparqlOutput = sparqlOutput.replaceAll(new RegExp(
            `((?<![\\w!@#$^%+?])(?=[\\w!@#$^%+?])|(?<=[\\w!@#$^%+?])(?![\\w!@#$^%+?]))${keyword}\\b`, "gi"),
            `<span class="keyword">${keyword}</span>`);
    }

    // variable syntax highlighting
    sparqlOutput = sparqlOutput.replaceAll(/\?\w*/gi, `<span class="variable">$&</span>`);
    return sparqlOutput;
}

/** Parse a SPARQL-query using the SPARQL.js module
 * @param {string} sparqlInput - the parser input
 * @param {boolean} silent - don't print anything to console or the document
 * @returns the parser output */
function sparqlJsParse (sparqlInput, silent = false) {
    console.log("SPARQL.js: ");
    const parser = new SJSParser();
    try {
        let startTime = performance.now();
        let result = parser.parse(sparqlInput);
        let endTime = performance.now();
        let sparqlJsTime = endTime - startTime;
        if (!silent) {
            document.querySelector("#sparqlJsOutput").textContent = JSON.stringify(result, null, 2);
            // console.log("parsed: ", JSON.stringify(result, null, 2));
            console.log("sparql.js time: ", sparqlJsTime);
        }
        return result;
    } catch (e) {
        if (!silent) {
            document.querySelector("#sparqlJsOutput").innerHTML
                = `<span class="error">Parse Error (see console)</span>`;
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

async function treeSitterParse (sparqlInput) {
    let startTime = performance.now();
    tSParser.parse(sparqlInput);
    let endTime = performance.now();
    let treeSitterTime = endTime - startTime;
    console.log("treeSitterTime: ", treeSitterTime);
    document.querySelector("#treeSitterOutput").textContent = tSParser.tree.rootNode.toString();

}

async function treeSitterQuery (queryInput) {
    const query = tSParser.sparql.query(queryInput);
    const captures = query.captures(tSParser.tree.rootNode);
    let output = "";
    captures.forEach(capture => {
        output += `<tr>
                    <td style="color: #6f8c4a">${escape(capture.name)}</td>
                    <td>${escape(capture.node.text)}</td>
                    <td>${capture.node.startPosition.row},${capture.node.startPosition.column}</td>
                   </tr>`;
    })
    document.querySelector("#treeSitterQueryResults").innerHTML = output;
}

function escape (str) {
    return str.replaceAll(/</g, `&lt;`).replaceAll(/>/g, `&gt;`)
}

async function treeSitterContext () {
    const subjectQuery = autoSuggestTSParser.sparql.query(
        `(ERROR [(var) (rdf_literal) (boolean_literal) (nil) (iri_reference) (prefixed_name) (integer) (decimal)
         (double) (blank_node_label) (anon)] @subject)`);
    const predicateQuery = autoSuggestTSParser.sparql.query(
        `(ERROR [(var) (iri_reference) (prefixed_name) (path_element) (binary_path) "a"] @pred)`
    )
    const closedBraces = closeBraces();
    const context = getContextTriples(closedBraces);
    console.debug(`captured Context`, context.map(t => t.node.text));
    const subjectCaptures = subjectQuery.captures(closedBraces.rootNode);
    const predicateCaptures = predicateQuery.captures(closedBraces.rootNode);
    let subject, predicate;
    if (subjectCaptures.length > 0) {
        subject = subjectCaptures[0];
        if (predicateCaptures.length > 0 && predicateCaptures.slice(-1)[0].node.id !== subjectCaptures[0].node.id) {
            predicate = predicateCaptures.slice(-1)[0];
        }
    }
    console.debug(`subject`, subject?.node.type, `predicate`, predicate?.node.type);
    const filteredTriples = filterContext(context, subject, predicate);
    return {
        context: filteredTriples,
        subject: subject,
        predicate: predicate,
    }
}

/** Get a more informative parse tree through adding missing right braces
 *
 * @returns {*} tree-sitter parse tree with all braces closed
 */
function closeBraces () {
    const leftBraceQuery = autoSuggestTSParser.sparql.query(`"{" @lbrace`);
    const rightBraceQuery = autoSuggestTSParser.sparql.query(`("}" @rbrace (#eq? @rbrace "}"))`);
    const notClosedBraces = leftBraceQuery.captures(autoSuggestTSParser.tree.rootNode).length
        - rightBraceQuery.captures(autoSuggestTSParser.tree.rootNode).length;
    const leftParenthesesQuery = autoSuggestTSParser.sparql.query(`"(" @lparan`);
    const rightParenthesesQuery = autoSuggestTSParser.sparql.query(`(")" @rparan (#eq? @rparan ")"))`);
    const notClosedParentheses = leftParenthesesQuery.captures(autoSuggestTSParser.tree.rootNode).length
        - rightParenthesesQuery.captures(autoSuggestTSParser.tree.rootNode).length;
    // insert unknown char (§) to produce an ERROR node (instead of a MISSING-node)
    const enhancedInput = suggestionInput + "§ "
        + ")".repeat(notClosedParentheses) + "}".repeat(notClosedBraces);
    console.debug(enhancedInput)
    return autoSuggestTSParser.parser.parse(enhancedInput);
}

function getContextTriples (tree) {
    // find ancestor SELECT (SelectQuery or SubSelect)
    const errorNode = autoSuggestTSParser.errorNode(tree);

    const SELECTAncestor = getAncestorOfType(errorNode, "where_clause")?.parent;

    if (SELECTAncestor === null) {
        return [];
    }

    // query all triples and SubSelects inside that, that aren't part of a SubSelect
    const triplesQuery = autoSuggestTSParser.sparql.query(
        `(triples_same_subject) @triples (group_graph_pattern (sub_select)) @subs (inline_data) @values`
    )
    let triples = triplesQuery.captures(SELECTAncestor)
        .filter(t => {
            const a = getAncestorOfType(t.node, "sub_select");
            return !(a && a.id !== SELECTAncestor.id);
        });

    // filter UNION 1st block
    // todo also for arbitrary sub-GGPs
    if (errorNode.parent.parent.type === "group_or_union_graph_pattern"
        && errorNode.parent.previousSibling?.text === "UNION") {
        const unionTriples = triplesQuery.captures(errorNode.parent.previousNamedSibling);
        triples = triples.filter(t => !unionTriples.some(u => u.node.id === t.node.id))
    }
    return triples;
}

function getAncestorOfType (node, type) {
    let parent = node.parent;
    while (parent?.type !== type) {
        if (parent === null || parent.type === "unit") return null;
        parent = parent.parent;
    }
    return parent;
}

function filterContext (context, subject, predicate) {
    if (subject?.node.type !== "var" && predicate?.node.type !== "var") {
        return [];
    }
    let contextVars = new Set();
    let contextToCheck = context.slice();
    let contextNodes = []
    if (subject?.node.type === "var") contextVars.add(subject.node.text);
    if (predicate?.node.type === "var") contextVars.add(predicate.node.text);

    let c = 0;
    while (contextToCheck.length > 0 && c < context.length) {
        // todo stop when no changes
        let freeContext = [];
        for (const contextNode of contextToCheck) {
            console.log("type of contextNode:", contextNode.node.firstNamedChild.type);
            if (contextNode.node.type === "triples_same_subject") {
                let query = autoSuggestTSParser.sparql.query(`(triples_same_subject
                    (var)? @svar  
                    (_(_(var)? @pvar 
                    (_ (var)? @ovar))) )`);
                let tripleVars = query.captures(contextNode.node).map(v => v.node.text);
                if (tripleVars.some(v => contextVars.has(v))) {
                    tripleVars.forEach(v => contextVars.add(v));
                    contextNodes.push(contextNode);
                } else {
                    freeContext.push(contextNode);
                }
            } else if (contextNode.node.firstNamedChild.type === "sub_select") {
                const subqueryVars = contextNode.node.firstNamedChild.firstNamedChild
                    .childrenForFieldName("bound_variable");
                if (subqueryVars.some(v => contextVars.has(v.text))) {
                    subqueryVars.forEach(v => contextVars.add(v));
                    contextNodes.push(contextNode);
                } else {
                    freeContext.push(contextNode);
                }
            } else if (contextNode.node.type === "inline_data") {
                const valuesVars = contextNode.node.firstNamedChild
                    .childrenForFieldName("bound_variable");
                if (valuesVars.some(v => contextVars.has(v.text))) {
                    valuesVars.forEach(v => contextVars.add(v));
                    contextNodes.push(contextNode);
                } else {
                    freeContext.push(contextNode);
                }
            }
        }
        contextToCheck = freeContext.slice();
        c++;
    }

    return contextNodes;
}

/** Find fitting suggestions for the cursor position and print them */
async function autoSuggestion () {
    // console.log("autoSuggestion:");
    let sparqlInputElement = document.querySelector("#query-input");
    const sparqlInput = sparqlInputElement.value.slice(0, sparqlInputElement.selectionStart);
    sACParser.update(sparqlInput);
    let slicedInput;
    let lastCharsBeforeCursor;
    let pos = sparqlInputElement.selectionStart;
    let char = sparqlInput[pos];
    while (/[^\s(){}]/.test(char) && pos >= 0) {
        pos -= 1;
        char = sparqlInput[pos];
    }
    // console.log("pos:", pos);
    // console.log("errorpos:", parser.errorpos)
    if (!sACParser.accepted && sACParser.errorpos < pos) {
        slicedInput = sparqlInput.slice(0, sACParser.errorpos);
        lastCharsBeforeCursor = sparqlInput.slice(sACParser.errorpos, sparqlInputElement.selectionStart);
    } else {
        slicedInput = sparqlInput.slice(0, pos + 1);
        lastCharsBeforeCursor = sparqlInput.slice(pos + 1, sparqlInputElement.selectionStart);
    }
    console.debug('lastCharsBeforeCursor: "' + lastCharsBeforeCursor + '"', lastCharsBeforeCursor.length);
    console.debug('slicedInput: "' + slicedInput + '"');
    let col = slicedInput.split("\n").at(-1).trimEnd().length;
    let line = slicedInput.split("\n").length; // 1-based (like parser)
    // skip blank lines
    while (col === 0 && line > 1) {
        col = getPreviousLineEndColumnNumber(sparqlInputElement);
        line = line - 1;
    }
    suggestionInput = slicedInput;
    sACParser.update(slicedInput);
    autoSuggestTSParser.parse(slicedInput);

    console.debug("updated parser:", Object.assign({}, sACParser));
    let suggestions = await getSuggestions(sparqlInput, [line, col], lastCharsBeforeCursor); // is sparqlInput better than slicedInput?
    printSuggestions(suggestions, lastCharsBeforeCursor);
    document.querySelector("#suggestions").scrollTop = 0;
    sparqlInputElement.focus();
}

function isInTripleBlock () {
    const tree = closeBraces();
    const parentType = autoSuggestTSParser.errorNode(tree).parent?.type;
    return (parentType === "triples_block" || parentType === "group_graph_pattern");
}


/** Find fitting suggestions for the cursor position in a (potentially unfinished) query
 * @param {String} sparqlInput - the parser input
 * @param {[]} cursorPosition - the position of the cursor in the input field [line, col]
 * @param {String} lastChars
 * @returns Promise<[]> - Array containing the suggestions
 */
async function getSuggestions (sparqlInput, cursorPosition, lastChars) {
    let expectedAtCursor = sACParser.expected[cursorPosition];
    console.log("expectedAtCursor", cursorPosition, expectedAtCursor);
    // let completionSuggestions = [];
    let otherSuggestions = [];
    const prefixes = Object.keys(sACParser.prefixes);
    const vars = Array.from(new Set(
        autoSuggestTSParser.sparql.query(`(var) @var`).captures(autoSuggestTSParser.tree.rootNode)));
    // let generatedInput;
    let iriExpected = false;
    if (expectedAtCursor === undefined) return [];
    for (let e of expectedAtCursor) {
        let suggestions = [];
        if (e === "Var") {
            suggestions = vars.map(v => v.node.text + " ").concat(["?"]);
        } else if (e === "PNAME_NS") {
            suggestions = (prefixes.length > 0 ? prefixes.map(p => p + ":") : ["rdfs:"]);
        } else if (e === "IRIREF") {
            suggestions = ["<"];
            iriExpected = true;
            await requestQleverSuggestions(lastChars);
            // todo distinguish between general iris and GraphTerms
        } else if (keywords.concat(".{}();,=*a".split("")).includes(e)) {
            // "literal"/trivial terminals
            suggestions = [e+" "];
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
    if (!iriExpected) {
        printContextSensitiveSuggestions([], "", {});
        console.log("no iri suggestion");
    }
    otherSuggestions = otherSuggestions.filter(s => s.toLowerCase().startsWith(lastChars.toLowerCase()));
    return /*[completionSuggestions, */otherSuggestions/*]*/;
}

function getPreviousLineEndColumnNumber (textArea) {
    return textArea.value.slice(0, textArea.selectionStart).split("\n").at(-2).trimEnd().length;
}

let tabComplete;

/** Print out a suggestion list to the suggestions-<div>
 * @param {Array<string>} suggestions - The list of suggestions
 * @param {String} lastChars - last chars of the input - first chars of the currently typed literal
 * @param {boolean} primary - makes the suggestions printed out primarily
 */
function printSuggestions (suggestions, lastChars, primary = false) {
    let divId = (primary ? "#primary-suggestions" : "#secondary-suggestions");
    let suggestionDiv = document.querySelector(divId);
    suggestionDiv.innerHTML = "";
    let queryInputElement = document.querySelector("#query-input");
    tabComplete = async function (event) {
        if (event.key === "Tab" && suggestions.length > 0) {
            console.log(suggestions[0]);
            event.preventDefault();
            queryInputElement.setRangeText(suggestions[0], queryInputElement.selectionStart - lastChars.length,
                queryInputElement.selectionEnd, "end");
            queryInputElement.focus();
            suggestionDiv.innerHTML = "";
            await autoSuggestion();
        }
    }
    queryInputElement.removeEventListener("keydown", tabComplete);
    queryInputElement.addEventListener("keydown", tabComplete, { once: true });
    for (let suggestion of suggestions) {
        let suggestionElement = document.createElement(`div`);
        suggestionElement.classList.add("suggestion");
        if (primary) suggestionElement.classList.add("primary-suggestion");
        suggestionElement.innerText = suggestion;
        suggestionElement.addEventListener("click",
            async function () {
                queryInputElement.setRangeText(suggestion, queryInputElement.selectionStart - lastChars.length,
                    queryInputElement.selectionEnd, "end");
                queryInputElement.focus();
                suggestionDiv.innerHTML = "";
                queryInputElement.removeEventListener("keydown", tabComplete);
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
            if (iri.startsWith(prefixes[prefix]) && !iri.slice(prefixes[prefix].length).includes("/")) {
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
                let queryInputElement = document.querySelector("#query-input");
                // todo deal with non-http-iris
                if (suggestion.qui_entity.type === "uri" && iri.startsWith("http://")) iri = "<" + iri + ">";
                else if (suggestion.qui_entity.type === "literal") iri = '"' + iri + '"';
                iri = iri.concat(" ");
                queryInputElement.setRangeText(iri, queryInputElement.selectionStart - lastChars.length,
                    queryInputElement.selectionEnd, "end");
                queryInputElement.focus();
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
            for (const prefix in sACParser.prefixes) {
                requestPrefixes += `PREFIX ${prefix}: <${sACParser.prefixes[prefix]}>\n`;
            }
            const vstack = sACParser.vstack;
            console.log("vstack: ", vstack.slice());
            /* if (vstack.length < 8) {
                printContextSensitiveSuggestions([], "", {})
                return;
            }*/
            document.querySelector("#context-sensitive-suggestions").innerHTML =
                '<img src="src/ajax-loader.gif" alt="loading...">';
            let subject, verb, previousTriplesString = "";
            if (isInTripleBlock()) {
                const tSContext = await treeSitterContext();
                // const previousTriples = vstack[6];
                const previousTriples = sACParser.contextTriples;
                // console.log("previousTriples (rule application):", previousTriples);
                // console.log("previousTriples (vstack):", vstack[6]);
                // console.log("Context (tree sitter query):", tSContext.context);
                previousTriplesString = "";
                for (let triple of previousTriples) {
                    // console.log(triple);
                    previousTriplesString +=
                        `${termToString(triple.subject)} ${termToString(triple.predicate)} ${termToString(triple.object)} .\n`;
                }
                previousTriplesString = tSContext.context.map(t => t.node.text + " .\n").join("");
                console.debug("previousTriplesString: ", previousTriplesString);
                // const subject = vstack[7];
                subject = tSContext.subject?.node;
                // let subjectString = termToString(subject);
                // const verb = vstack[8];
                verb = tSContext.predicate?.node;
                // console.log("subject: ", subject, "\nverb: ", verb);
                // "?query=PREFIX+wd%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology-beta%23%3E%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX+wds%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2Fstatement%2F%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology%23%3E%0A%0APREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX+xsd%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2001%2FXMLSchema%23%3E%0APREFIX+ontolex%3A+%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Flemon%2Fontolex%23%3E%0APREFIX+dct%3A+%3Chttp%3A%2F%2Fpurl.org%2Fdc%2Fterms%2F%3E%0APREFIX+rdfs%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%0APREFIX+owl%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2002%2F07%2Fowl%23%3E%0APREFIX+wikibase%3A+%3Chttp%3A%2F%2Fwikiba.se%2Fontology%23%3E%0APREFIX+skos%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F2004%2F02%2Fskos%2Fcore%23%3E%0APREFIX+schema%3A+%3Chttp%3A%2F%2Fschema.org%2F%3E%0APREFIX+cc%3A+%3Chttp%3A%2F%2Fcreativecommons.org%2Fns%23%3E%0APREFIX+geo%3A+%3Chttp%3A%2F%2Fwww.opengis.net%2Font%2Fgeosparql%23%3E%0APREFIX+geof%3A+%3Chttp%3A%2F%2Fwww.opengis.net%2Fdef%2Ffunction%2Fgeosparql%2F%3E%0APREFIX+prov%3A+%3Chttp%3A%2F%2Fwww.w3.org%2Fns%2Fprov%23%3E%0APREFIX+wd%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2F%3E%0APREFIX+data%3A+%3Chttps%3A%2F%2Fwww.wikidata.org%2Fwiki%2FSpecial%3AEntityData%2F%3E%0APREFIX+s%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fentity%2Fstatement%2F%3E%0APREFIX+ref%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Freference%2F%3E%0APREFIX+v%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fvalue%2F%3E%0APREFIX+wdt%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect%2F%3E%0APREFIX+wdtn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fdirect-normalized%2F%3E%0APREFIX+p%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2F%3E%0APREFIX+ps%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2F%3E%0APREFIX+psv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2Fvalue%2F%3E%0APREFIX+psn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fstatement%2Fvalue-normalized%2F%3E%0APREFIX+pq%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2F%3E%0APREFIX+pqv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2Fvalue%2F%3E%0APREFIX+pqn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fqualifier%2Fvalue-normalized%2F%3E%0APREFIX+pr%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2F%3E%0APREFIX+prv%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2Fvalue%2F%3E%0APREFIX+prn%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Freference%2Fvalue-normalized%2F%3E%0APREFIX+wdno%3A+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2Fnovalue%2F%3E%0APREFIX+imdb%3A+%3Chttps%3A%2F%2Fwww.imdb.com%2F%3E%0APREFIX+qfn%3A+%3Chttp%3A%2F%2Fqlever.cs.uni-freiburg.de%2Ffunction%23%3E%0APREFIX+ql%3A+%3Chttp%3A%2F%2Fqlever.cs.uni-freiburg.de%2Fbuiltin-functions%2F%3E%0ASELECT+%3Fqui_entity+%28SAMPLE%28%3Fname%29+as+%3Fqui_name%29+%28SAMPLE%28%3Falias%29+as+%3Fqui_alias%29+%28SAMPLE%28%3Fcount%29+as+%3Fqui_count%29+WHERE+%7B%0A++%7B+SELECT+%3Fqui_entity+%28COUNT%28%3Fqui_entity%29+AS+%3Fcount%29+WHERE+%7B%0A++++wd%3AQ90+%3Chttp%3A%2F%2Fwww.wikidata.org%2Fprop%2FP47%3E+%3Fo+.+%3Fo+%3Fp+%3Fqui_entity+.%0A++%7D+GROUP+BY+%3Fqui_entity+%7D%0A++%0A++OPTIONAL+%7B+%3Fqui_entity+%40en%40rdfs%3Alabel+%3Fname+%7D%0A++BIND+%28%3Fqui_entity+AS+%3Falias%29%0A++%0A%7D+GROUP+BY+%3Fqui_entity+ORDER+BY+DESC%28%3Fqui_count%29%0ALIMIT+40%0AOFFSET+0&timeout=5000ms"
            } else console.debug("no triples suggestion");
            document.querySelector("#subject").innerHTML = (subject ? escape(subject.text) : "<i>undefined</i>");
            document.querySelector("#predicate").innerHTML = (verb ? escape(verb.text) : "<i>undefined</i>");
            document.querySelector("#prefix").innerHTML = lastChars;
            document.querySelector("#context").innerHTML = syntaxHighlight(escape(previousTriplesString));

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
                    if (currentCounter > lastQleverRequest) {
                        lastQleverRequest = currentCounter;
                        printContextSensitiveSuggestions([], "", {});
                    }
                    return;
                }
            } else {
                value += "SELECT ?qui_entity (SAMPLE(?name) as ?qui_name) (SAMPLE(?alias) as ?qui_alias) (SAMPLE(?count) as ?qui_count) WHERE {\n";
                if (verb === undefined) {
                    // predicate suggestion
                    let x = (subject.type === "var" ? `DISTINCT ${subject.text}`: "?qui_object");
                    value +=
                        `{ SELECT ?qui_entity (COUNT(${x}) AS ?count) WHERE {\n` +
                        previousTriplesString +
                        `${subject.text} ?qui_entity ?qui_object }\n` +
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
                        `${subject.text} ${verb.text} ?qui_entity .\n` +
                        "} GROUP BY ?qui_entity }\n" +
                        "OPTIONAL { ?qui_entity @en@rdfs:label ?name }\n" +
                        "BIND (?qui_entity AS ?alias)\n"
                }
                if (lastChars.length > 0) {
                    value += `FILTER (REGEX(STR(?name), "^${lastChars}", "i") || REGEX(STR(?alias), "^${lastChars}", "i"))`
                }
            }
            // console.debug("lastChars", lastChars, lastChars.length);
            value += "} GROUP BY ?qui_entity ORDER BY DESC(?qui_count)\n" +
                "LIMIT 40\n"
                // + "OFFSET 0"
            document.querySelector("#qlever-request").innerHTML = syntaxHighlight(escape(value));
            let requestQuery = requestPrefixes + value;
            console.debug("request #" + currentCounter,  "to qlever backend:\n" + requestQuery);
            response = await fetch("https://qlever.cs.uni-freiburg.de/api/wikidata?query="
                + encodeURIComponent(requestQuery), { signal: AbortSignal.timeout(QLEVER_TIMEOUT) })
                .then(r => r.json());
            // console.debug("currentCounter", currentCounter, "lastQleverRequest", currentCounter);
            // console.debug(response);
            if (currentCounter > lastQleverRequest) {
                lastQleverRequest = currentCounter;
                console.log("suggestions #" + currentCounter, response.results.bindings)
                printContextSensitiveSuggestions(response.results.bindings, lastChars, sACParser.prefixes);
            }
        } catch (e) {
            if (currentCounter > lastQleverRequest && currentCounter >= qleverRequestCounter-1) {
                lastQleverRequest = currentCounter;
                printContextSensitiveSuggestions([], "", {});
            }
            console.log(`Qlever request #${currentCounter} error:`);
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