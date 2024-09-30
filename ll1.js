const JisonLex = require('jison-lex');
const ebnfParser = require('ebnf-parser');

/** Represents a context-free grammar
 *
 * @constructor
 * @param {Array<String>} terminals - An array with all terminal symbols in the grammar
 * @param {Object} productions
 * @param start - the start symbol of the grammar
 * @constructor
 */
function Grammar (terminals, productions, start) {
    this.terminals = terminals;
    this.productions = productions;
    this.start = start;
}

/** Represents an EBNF-Expression
 *
 */
class EBNFExpression {}

class Optional extends EBNFExpression {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    first (firsts) {
        return new Set([...this.expression.first(firsts), emptyString]);
    }
    follow (firsts, follows, parentFollow) {
        return this.expression.follow(firsts, follows, parentFollow);
    }
    parse (input, grammar, parent) {
        return this.expression.parse(input, grammar, parent) ?? [];
    }
    transform (grammar, namePrefix) {
        this.name = `${namePrefix}Optional`;
        const childName = this.expression.transform(grammar, this.name);
        grammar.productions[this.name] = [emptyString, [childName]];
        return this.name;
    }
}

class OneOrMore extends EBNFExpression {
    constructor (expression) {
        super();
        this.expression = expression;
    }
    first (firsts) {
        return this.expression.first(firsts);
    }
    follow (firsts, follows, parentFollow) {
        // Repetition: add FIRST(A) to FOLLOW(A)
        return this.expression.follow(firsts, follows, parentFollow.union(this.expression.first(firsts)));
    }
    parse (input, grammar, parent) {
        let result = [];
        let res = this.expression.parse(input, grammar, parent);
        if (res) {
            while (res) {
                result.push(res);
                res = this.expression.parse(input, grammar, parent)
            }
            return result;
        }
        return null;
    }
    transform (grammar, namePrefix) {
        this.name = `${namePrefix}OneOrMore`;
        const childName = this.expression.transform(grammar, this.name);
        const nullableName = `${this.name}Opt`;
        grammar.productions[this.name] = [[childName, nullableName]];
        grammar.productions[nullableName] = [emptyString, [childName]];
        return this.name;
    }
}

class ZeroOrMore extends EBNFExpression {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    first (firsts) {
        return new Set([...this.expression.first(firsts), emptyString]);
    }
    follow (firsts, follows, parentFollow) {
        // Repetition: add FIRST(A) to FOLLOW(A)
        return this.expression.follow(firsts, follows, parentFollow.union(this.expression.first(firsts)));
    }
    parse (input, grammar, parent) {
        let result = [];
        let res;
        while (res = this.expression.parse(input, grammar, parent)) result.push(res);
        return result.flat();
    }
    transform (grammar, namePrefix) {
        this.name = `${namePrefix}ZeroOrMore`;
        const childName = this.expression.transform(grammar, this.name);
        grammar.productions[this.name] = [emptyString, [childName, this.name]];
        return this.name;
    }
}

class Choice extends EBNFExpression {
    constructor(...expressions) {
        super();
        this.expressions = expressions;
    }
    first (firsts) {
        return new Set(Array.from(this.expressions).reduce((f, e) => f.union(e.first(firsts)), new Set()));
    }
    follow (firsts, follows, parentFollow) {
        return this.expressions.some(e => e.follow(firsts, follows, parentFollow));
    }
    parse (input, grammar, parent) {
        for (let expression of this.expressions) {
            let res = expression.parse(input, grammar, parent);
            if (res) return res;
        };
        return null;
    }
    transform (grammar, namePrefix) {
        this.name = `${namePrefix}Choice`;
        grammar.productions[this.name] = []
        this.expressions.forEach((e, i) => {
            const childName = e.transform(grammar, this.name.concat(String(i)));
            grammar.productions[this.name].push([childName]);
        });
        return this.name;
    }
}

class Chain extends EBNFExpression {
    constructor(...expressions) {
        super();
        this.expressions = expressions;
    }
    first (firsts) {
        let expressionFirsts = new Set();
        let hasEpsilon = false;
        for (const expression of this.expressions) {
            // if (includeNonTerminals) firsts[symbol].add(expression);
            let expressionFirst = expression.first(firsts);
            expressionFirsts = expressionFirsts.union(
                expressionFirst.difference(new Set([emptyString]))
            );
            hasEpsilon = expressionFirst.has(emptyString);
            if (!hasEpsilon) break;
        }
        if (hasEpsilon) expressionFirsts.add(emptyString);
        return expressionFirsts;
    }
    follow (firsts, follows, parentFollow) {
        let hasUpdated = false;
        this.expressions.forEach((expression, i) => {
            // is expression the last one in the chain or following first has Epsilon?
            if (i === this.expressions.length - 1 ||
                (this.expressions[i + 1] && (new Chain(...this.expressions.slice(i + 1))).first(firsts).has(emptyString))) {
                hasUpdated = hasUpdated || expression.follow(firsts, follows, parentFollow);
            }
            if (expression.value !== undefined && !expression.isTerminal) {
                const oldFollows = new Set(follows[expression.value]);

                if (this.expressions[i + 1]) {
                    // if (includeNonTerminals) follows[token].add(production[i + 1]);
                    follows[expression.value] = follows[expression.value].union(
                        (new Chain(...this.expressions.slice(i + 1))).first(firsts).difference(new Set([emptyString]))
                    );
                }
                hasUpdated = hasUpdated || oldFollows.symmetricDifference(follows[expression.value]).size !== 0;
            }

        });
        return hasUpdated;
    }
    parse (input, grammar, parent) {
        let result = [];
        for (let expression of this.expressions) {
            const res = expression.parse(input, grammar, parent);
            if (!res) return null;
            result.push(res);
        };
        return result.flat();
    }
    transform (grammar, namePrefix) {
        this.name = `${namePrefix}Chain`;
        grammar.productions[this.name] = [this.expressions.map((e, i) =>
            e.transform(grammar, this.name.concat(String(i)))
        )];
        return this.name;
    }
}

class Token extends EBNFExpression {
    constructor (value) {
        super();
        this.value = value;
    }
    first (firsts) {
        return firsts[this.value];
    }
    follow (firsts, follows, parentFollow) {
        if (this.isTerminal) return false;
        const oldFollows = new Set(follows[this.value]);
        follows[this.value] = follows[this.value].union(parentFollow);
        return oldFollows.symmetricDifference(follows[this.value]).size !== 0;
    }
    parse (input, grammar, parent) {
        const node = new Node(this.value, parent);
        const res = grammar.productions[this.value].parse(input, grammar, node);
        if (!res) return null;
        node.children = res.flat();
        return [node];
    }
    transform (grammar, namePrefix) {
        return this.value;
    }
}

class Terminal extends Token {
    constructor(value) {
        super(value);
        this.isTerminal = true;
    }
    parse (input, grammar, parent) {
        if (input[0] === this.value) {
            input.shift();
            return [new Node(this.value, parent)];
        }
        return null;
    }
}

const emptyString = "€";
const EOF = "EOF"

/** Generate the FIRST-set for each token
 *
 * @param {Grammar} grammar
 * @param {Boolean} includeNonTerminals
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getTokenFirstSets (grammar, includeNonTerminals=false) {
    let firsts = {}
    for (const terminal of grammar.terminals) {
        firsts[terminal] = new Set([terminal]);
    }
    Object.keys(grammar.productions).forEach(t => firsts[t] = new Set());
    let hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        for (const symbol in grammar.productions) {
            const oldFirsts = new Set(firsts[symbol]);
            grammar.productions[symbol].forEach(production => {
                if (production === emptyString) {
                    firsts[symbol].add(emptyString);
                } else {
                    let hasEpsilon = false;
                    for (const token of production) {
                        if (includeNonTerminals) firsts[symbol].add(token);
                        firsts[symbol] = firsts[symbol].union(
                            firsts[token].difference(new Set([emptyString]))
                        );
                        hasEpsilon = firsts[token].has(emptyString);
                        if (!hasEpsilon) break;
                    }
                    if (hasEpsilon) firsts[symbol].add(emptyString);
                }
            })
            hasUpdated = hasUpdated || oldFirsts.symmetricDifference(firsts[symbol]).size !== 0;
        }
    }
    return firsts;
}

/** Generate the FIRST-set for each expression in an EBNF-grammar
 *
 * @param {Grammar} grammar
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getExpressionFirstSets (grammar) {
    let firsts = {}
    for (const terminal of grammar.terminals) {
        firsts[terminal] = new Set([terminal]);
    }
    let id = 0;
    Object.keys(grammar.productions).forEach(t => firsts[t] = new Set());
    let hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        Object.entries(grammar.productions).forEach(([symbol, production]) => {
            // const oldFirsts = new Set(firsts[symbol]);
            firsts[symbol] = production.first(firsts, id);
            // hasUpdated = hasUpdated || oldFirsts.symmetricDifference(firsts[symbol]).size !== 0;
        });
    }
    return firsts;
}

/** Generate the FIRST-set for a string
 *
 * @param {Array<String>|String} string
 * @param {Object} firsts
 * @returns {Set<String>}
 */
function getStringFirstSet (string, firsts) {
    if (string === emptyString) return new Set([emptyString]);
    let first = new Set();
    let hasEpsilon = false;
    for (const symbol of string) {
        hasEpsilon = firsts[symbol].has(emptyString);
        first = first.union(firsts[symbol].difference(new Set([emptyString])));
        if (!hasEpsilon) break;
    }
    if (hasEpsilon) first.add(emptyString);
    return first;
}

/** Generate the FIRST-set for a (sub) EBNF-expression
 *
 * @param expression
 * @param {Object} firsts
 * @returns {Set<String>}
 */
function getEBNFStringFirstSet (expression, firsts) {
    if (expression === emptyString) return new Set([emptyString]);
    return expression.first();
}

/** Generate the FOLLOW-set for each non-terminal symbol
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @param {Boolean} includeNonTerminals
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getFollowSets (grammar, firsts, includeNonTerminals=false) {
    let follows = {};
    Object.keys(grammar.productions).forEach(t => follows[t] = new Set());
    follows[grammar.start] = new Set([EOF]);
    let hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        for (const symbol in grammar.productions) {
            const productions = grammar.productions[symbol];
            productions.filter(p => p !== emptyString).forEach(production => {
                production.forEach((token, i) => {
                    const oldFollows = new Set(follows[token]);
                    if (grammar.terminals.includes(token)) { // no FOLLOW-set for terminals
                        return;
                    }
                    if (production[i + 1]) {
                        if (includeNonTerminals) follows[token].add(production[i + 1]);
                        follows[token] = follows[token].union(
                            getStringFirstSet(production.slice(i + 1), firsts).difference(new Set([emptyString]))
                        );
                    }
                    if (i === production.length - 1 ||
                        (production[i + 1] && getStringFirstSet(production.slice(i + 1), firsts).has(emptyString))) {
                        follows[token] = follows[token].union(follows[symbol]);
                    }
                    hasUpdated = hasUpdated || oldFollows.symmetricDifference(follows[token]).size !== 0;
                });
            });
        }
    }
    return follows;
}

/** Generate the FOLLOW-set for each non-terminal symbol in an EBNF Grammar
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @param {Boolean} includeNonTerminals
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getEBNFFollowSets (grammar, firsts, includeNonTerminals=false) {
    let follows = {};
    Object.keys(grammar.productions).forEach(t => follows[t] = new Set());
    follows[grammar.start] = new Set([EOF]);
    let hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        Object.entries(grammar.productions).forEach(([symbol, expression]) => {
            const newChanges = expression.follow(firsts, follows, follows[symbol]);
            hasUpdated = hasUpdated || newChanges;
        });
    }
    return follows;
}

/** Create a parse table for grammar using firsts and follows
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @param {Object} follows
 * @returns {Object<String, Object<String, Array>>} - the parse table, each non-terminal has a row, each terminal a column.
 * Access entries with parseTable[non-terminal][terminal].
 */
function getParseTable (grammar, firsts, follows) {
    let parseTable = {};
    for (const symbol in grammar.productions) {
        parseTable[symbol] = {};
        grammar.productions[symbol].forEach(production => {
            getStringFirstSet(production, firsts).forEach(token => {
                if (grammar.terminals.includes(token)) {
                    parseTable[symbol][token] = production;
                } else if (token === emptyString) {
                    follows[symbol].forEach((terminal) => {
                        parseTable[symbol][terminal] = production;
                    });
                }
            });

        });
    }
    return parseTable;
}

/** Create a parse table for grammar using firsts and follows
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @param {Object} follows
 * @returns {Object<String, Object<String, Array>>} - the parse table, each non-terminal has a row, each terminal a column.
 * Access entries with parseTable[non-terminal][terminal].
 */
function getEBNFParseTable (grammar, firsts, follows) {
    let parseTable = {};
    Object.entries(grammar.productions).forEach(([symbol, expression]) => {
        parseTable[symbol] = {};
        getEBNFStringFirstSet(expression, firsts).forEach(token => {
            if (grammar.terminals.includes(token)) {
                parseTable[symbol][token] = expression;
            } else if (token === emptyString) {
                follows[symbol].forEach((terminal) => {
                    parseTable[symbol][terminal] = expression;
                });
            }
        });
    })
    return parseTable;
}

/** Recursive descendant parser
 *
 * @param {String[]} input
 * @param {Grammar} grammar
 * @returns {Node}
 */
function parseRecursively (input, grammar) {
    let start = new Token(grammar.start);
    let res = start.parse(input, grammar, null);
    if (res[0] && input[0] === EOF) return res[0];
    return null;
}

/** Parse (and lex) the {@link input} string according to the {@link parseTable}, the {@link grammar} and the
 * {@link lexerRules}
 *
 * @param {String} input
 * @param {{}} parseTable
 * @param {Grammar} grammar
 * @param {(String|Object)} lexerRules
 * @returns {Object} The parsing results
 */
function parse (input, parseTable, grammar, lexerRules) {
    let stack = [grammar.start, EOF];
    const lexer = new JisonLex(lexerRules);
    lexer.setInput(input);
    let x = stack[0];
    let log = [];
    let token = lexer.lex();
    const rootNode = new Node(grammar.start, null);
    let currentNode = rootNode;
    let nodeStack = [currentNode];
    const results = {
        log: log,
        expected: new Set(),
        tree: rootNode,
    }
    Object.keys(collectedNodes).forEach(key => collectedNodes[key] = []);
    while (x !== EOF) {
        log.push('stack: '+ stack);
        log.push('token: '+ token);
        results.expected = results.expected.union(new Set(parseTable[x] ? Object.keys(parseTable[x]) : [x]));
        collectedNodes[x]?.push(currentNode);
        if (x === token) {
            log.push(`Consumed ${x}`);
            currentNode.text = lexer.match;
            currentNode.children = null;
            stack.shift();
            nodeStack.shift();
            token = lexer.lex();
            results.expected.clear();
        } else if (grammar.terminals.includes(x)) {
            log.push(`Unexpected token "${token}", expected: "${x}"`);
            results.currentNode = currentNode;
            results.nodeStack = nodeStack;
            results.stack = stack;
            return results;
        } else if (!(parseTable[x] && parseTable[x][token])) {
            log.push(`Unexpected token "${token}", expected: "${Object.keys(parseTable[x])}"`);
            results.currentNode = currentNode;
            results.nodeStack = nodeStack;
            results.stack = stack;
            return results;
        } else {
            const production = parseTable[x][token];
            log.push(`Applied ${x} --> ${production}`);
            stack.shift();
            nodeStack.shift();
            if (production !== emptyString) {
                stack = production.concat(stack);
                currentNode.children = production.map(s => new Node(s, currentNode));
                nodeStack = currentNode.children.concat(nodeStack);
            } else {
                currentNode.children = [new Node(emptyString, currentNode)];
            }
        }
        x = stack[0];
        currentNode = nodeStack[0];
    }
    log.push("success");
    return results;
}

/** Parse (and lex) the {@link input} string according to the {@link parseTable}, the {@link grammar} and the
 * {@link lexerRules}
 *
 * @param {String} input
 * @param {{}} parseTable
 * @param {Grammar} grammar
 * @param {(String|Object)} lexerRules
 * @returns {Object} The parsing results
 */
function ebnfParse (input, parseTable, grammar, lexerRules) {
    let stack = [new Token(grammar.start), EOF];
    const lexer = new JisonLex(lexerRules);
    lexer.setInput(input);
    let x = stack[0];
    let log = [];
    let token = lexer.lex();
    const rootNode = new Node(grammar.start, null);
    let currentNode = rootNode;
    let lastNode;
    let nodeStack = [currentNode];
    const results = {
        log: log,
        expected: new Set(),
        tree: rootNode,
    }
    Object.keys(collectedNodes).forEach(key => collectedNodes[key] = []);
    while (x !== EOF) {
        log.push('stack: '+ stack);
        log.push('token: '+ token);
        results.expected = results.expected.union(new Set(parseTable[x] ? Object.keys(parseTable[x]) : [x]));
        collectedNodes[x]?.push(currentNode);
        stack = x.parse(token, stack);
        if (x === token) {
            log.push(`Consumed ${x}`);
            currentNode.text = lexer.match;
            currentNode.children = null;
            stack.shift();
            nodeStack.shift();
            token = lexer.lex();
            results.expected.clear();
        } else if (grammar.terminals.includes(x)) {
            log.push(`Unexpected token "${token}", expected: "${x}"`);
            results.currentNode = currentNode;
            return results;
        } else if (!(parseTable[x] && parseTable[x][token])) {
            log.push(`Unexpected token "${token}", expected: "${Object.keys(parseTable[x])}"`);
            results.currentNode = currentNode;
            return results;
        } else {
            const expression = parseTable[x][token];
            log.push(`Applied ${x} --> ${expression}`);
            stack.shift();
            nodeStack.shift();
            if (expression !== emptyString) {
                stack = expression.concat(stack);
                currentNode.children = expression.map(s => new Node(s, currentNode));
                nodeStack = currentNode.children.concat(nodeStack);
            } else {
                currentNode.children = [new Node(emptyString, currentNode)];
            }
        }
        x = stack[0];
        currentNode = nodeStack[0];
    }
    log.push("success");
    return results;
}

/** Collect all nodes of a specific type/symbol while parsing. The keys have to match exactly the symbol name
 *
 * @type {{Var: *[], TriplesSameSubject: *[]}}
 */
const collectedNodes = {
    Var: [],
    TriplesSameSubjectPath: [],
}

/** Represents a node in a tree (i.e. a parse tree)
 *
 * @param {String} name - the name of the Grammar symbol, this node refers to
 * @param {Node|null} parent
 * @param {Node[]} children
 * @constructor
 */
function Node (name, parent, children=[]) {
    this.name = name;
    this.parent = parent;
    this.children = children;
}

/** Get the closest ancestor with a specific name. Return null if it doesn't exist.
 *
 * @param {String} type
 * @returns {Node|null}
 */
Node.prototype.ancestorOfType = function (type) {
    let parent = this.parent;
    while (parent) {
        if (parent.name === type) return parent;
        parent = parent.parent;
    }
    return null;
}

/** Get all descendents with a specific name
 *
 * @param {String} type - One or more names that should be collected
 * @returns {Node[]}
 */
Node.prototype.descendantsOfType = function (...type) {
    if (!this.children || this.children.length === 0) return [];
    let descendantsOfType = [];
    this.children.forEach(c => {
        if (type.includes(c.name)) descendantsOfType.push(c);
        descendantsOfType = descendantsOfType.concat(c.descendantsOfType(...type));
    })
    return descendantsOfType;
}

/** Get the text of all leaves of the subtree, concatenated from left to right
 *
 * @param {String} separator - a string that separates each leave text
 * @returns {String}
 */
Node.prototype.getText = function(separator="") {
    if (this.text) return this.text.concat(separator);
    let text = "";
    for (const child of this.children) {
        text = text.concat(child.getText(separator));
    }
    return text;
}

/** Read the grammar from filePath and transform it into a {@link Grammar}
 *
 * @param {String} filePath
 * @returns {Grammar}
 */
async function readGrammar(filePath) {
    const grammarInput = await fetch(filePath).then(res => res.text());
    const parsedGrammar = ebnfParser.parse(grammarInput);
    let symbols = new Set();
    let productions = {};
    for (const symbol in parsedGrammar.bnf) {
        productions[symbol] = [];
        parsedGrammar.bnf[symbol].forEach(production => {
            if (production === "") productions[symbol].push(emptyString);
            else {
                let prod = production.split(" ");
                prod.forEach(s => symbols.add(s));
                productions[symbol].push(prod);
            }
        });
    }
    const terminals = Array.from(symbols).filter(t => productions[t] === undefined);
    return new Grammar(
        terminals,
        productions,
        parsedGrammar.start,
    );
}

/** Left-factorizes the grammar in place
 *
 * @returns {Grammar}
 */
Grammar.prototype.leftFactorize = function () {
    let hasChanged = true;
    while (hasChanged) {
        hasChanged = false;
        for (const symbol in this.productions) {
            let productions = this.productions[symbol].filter(p => p !== emptyString);
            while (productions[0]) {
                const production = productions.shift();
                let samePrefix = [];
                productions.forEach(otherProd => {
                    if (otherProd.at(0) === production.at(0)) samePrefix.push(otherProd);
                });
                if(samePrefix.length === 0) continue;

                // determine the length of the prefix
                let i;
                for (i = 1; i < production.length; i++) {
                    if (!samePrefix.every(p => p[i] === production[i])) break;
                }

                samePrefix.unshift(production);
                const suffixProductions = samePrefix.map(p => p.slice(i)).map(p => (p.length === 0 ? "€" : p));
                const newSymbol = symbol + '_LF' + this.productions[symbol].indexOf(production);
                const newProductions = [
                    [...production.slice(0, i), newSymbol],
                    ...this.productions[symbol].filter(p => !samePrefix.includes(p))
                ]
                this.productions[newSymbol] = suffixProductions;
                this.productions[symbol] = newProductions;
                productions = productions.filter(p => !samePrefix.includes(p));
                hasChanged = true;
            }
        }
    }
    return this;
}

function transformFromEBNF (ebnfGrammar) {
    const grammar = new Grammar(ebnfGrammar.terminals, {}, ebnfGrammar.start);
    Object.entries(ebnfGrammar.productions).forEach(([symbol, expression]) => {
        const expressionName = expression.transform(grammar, `_${symbol}`);
        grammar.productions[symbol] = [[expressionName]];
    });
    return grammar;
}

// todo Grammar.prototype.checkForLeftRecursion = function (): Boolean
let grammar, lexerRules, parseTable, firsts;
async function initParser () {
    grammar = await readGrammar('src/sparql.y');
    lexerRules = await fetch('src/sparql.l').then(res => res.text());
    grammar.leftFactorize();
    firsts = getTokenFirstSets(grammar);
    const follows = getFollowSets(grammar, firsts);
    parseTable = getParseTable(grammar, firsts, follows);
}

async function parseQuery () {
    const input = document.getElementById("query-input").value;
    const parsed = parse(input, parseTable, grammar, lexerRules);
    suggestion(parsed, firsts);
    console.log("results:", parsed);
    // console.log("collectedNodes:", collectedNodes);
    printSuggestions(parsed.expected, "");
}

async function documentReady () {
    await initParser();
    document.querySelector("#query-input").addEventListener("input", parseQuery);
}

/** Print out a suggestion list to the suggestions-<div>
 * @param {Set<string>} suggestions - The list of suggestions
 * @param {String} lastChars - last chars of the input - first chars of the currently typed literal
 */
function printSuggestions (suggestions, lastChars) {
    let suggestionDiv = document.querySelector("#suggestions");
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
            await parseQuery();
        }
    }
    queryInputElement.removeEventListener("keydown", tabComplete);
    queryInputElement.addEventListener("keydown", tabComplete, { once: true });
    for (let suggestion of suggestions) {
        let suggestionElement = document.createElement(`div`);
        suggestionElement.classList.add("suggestion");
        suggestionElement.innerText = suggestion;
        suggestionElement.addEventListener("click",
            async function () {
                queryInputElement.setRangeText(suggestion, queryInputElement.selectionStart - lastChars.length,
                    queryInputElement.selectionEnd, "end");
                queryInputElement.focus();
                suggestionDiv.innerHTML = "";
                queryInputElement.removeEventListener("keydown", tabComplete);
                await parseQuery();
            });
        suggestionDiv.appendChild(suggestionElement);
    }
}

/**
 *
 * @param parseResults
 * @param {Object} firsts
 */
function suggestion(parseResults, firsts) {
    let currentNode, expected, stack;
    [currentNode, expected, stack] = [parseResults.currentNode, parseResults.expected, parseResults.stack];

    const object = stack.indexOf("ObjectListPath");
    let subjectText, predicateText, context, suggestionType;
    if (currentNode === undefined) return;
    if (currentNode.name === "PropertyListPathNotEmpty" || currentNode.name === "VerbPathObjectListOptional_LF1") {
        suggestionType = "predicate suggestion";
        const subjectNode = currentNode.ancestorOfType("TriplesSameSubjectPath")
            .children.find(n => n.name === "VarOrTerm");
        subjectText = escape(subjectNode.getText());
        context = filterContext(getContext(currentNode), subjectNode, null);
    }
    // todo: Modify grammar, so that every desired information has its dedicated rule (or ebnf)?
    else if (object === 0 || (object > 0 && getStringFirstSet(stack.slice(0, object), firsts).has("€"))) {
        suggestionType = "object suggestion";
        const tripleNode = currentNode.ancestorOfType("TriplesSameSubjectPath");
        const subjectNode = tripleNode.children.find(n => n.name === "VarOrTerm");
        subjectText = escape(subjectNode.getText());
        const propertyNode = currentNode.ancestorOfType("PropertyListPathNotEmpty");
        const predicateNode = propertyNode.children.find(n => n.name === "VerbPathOrSimple");
        predicateText = escape(predicateNode.getText());
        context = filterContext(getContext(currentNode), subjectNode, predicateNode);
    }
    // todo add VALUES suggestion
    else if (Array.from(firsts["iri"]).every(f => expected.has(f))) {
        suggestionType = "agnostic iri suggestion";
    }
    document.querySelector("#suggestion-type").innerText = suggestionType ?? "no suggestions";
    document.querySelector("#subject").innerHTML = subjectText ?? "<i>undefined</i>";
    document.querySelector("#predicate").innerHTML = predicateText ?? "<i>undefined</i>";
    document.querySelector("#context").innerText = context?.map(c => c.getText(" ")).join("\n") ?? "";
}

/** Get all the Nodes (Triples, SubSelects and InlineData) that might appear in the context of {@link currentNode}
 *
 * @param {Node} currentNode
 * @returns {Node[]}
 */
function getContext (currentNode) {
    const SELECTAncestor = currentNode.ancestorOfType("WhereClause")?.parent;

    if (SELECTAncestor === null) return [];

    const currentTriple = currentNode.ancestorOfType("TriplesSameSubjectPath");
    let context = SELECTAncestor.descendantsOfType("TriplesSameSubjectPath", "SubSelect", "InlineData")
        .filter(t => t !== currentTriple)
        .filter(t => {
            const s = t.ancestorOfType("SubSelect");
            return !(s && s !== SELECTAncestor);
        });

    // remove context from left union block
    const unionBlock = currentNode.ancestorOfType("GroupOrUnionGraphPattern");
    if (unionBlock && unionBlock.parent.children[0].name === "UNION") {
        const unionContext = unionBlock.parent.parent.children[0]
            .descendantsOfType("TriplesSameSubjectPath", "SubSelect", "InlineData");
        context = context.filter(c => unionContext.some(t => t !== c));
    }
    console.log("context", context.map(t => t.getText()));
    return context;
}

/** Filter out context, that is independent of {@link subject} and {@link predicate}
 *
 * @param {Node[]} context
 * @param {Node} subject
 * @param {Node} predicate
 * @returns {Node[]}
 */
function filterContext (context, subject, predicate) {
    const predicateVar = predicate?.descendantsOfType("Var")[0];
    if (subject?.children[0].name !== "Var" && predicateVar === undefined) {
        return [];
    }
    let contextVars = new Set();
    let contextToCheck = context.slice();
    let contextNodes = []
    if (subject?.children[0].name === "Var") contextVars.add(subject.getText());
    if (predicateVar?.name === "Var") contextVars.add(predicateVar.getText());

    let c = 0;
    while (contextToCheck.length > 0 && c < context.length) {
        // todo stop when no changes
        let freeContext = [];
        for (const contextNode of contextToCheck) {
            console.log("type of contextNode:", contextNode.name);
            let nodeVars;
            switch (contextNode.name) {
                case "TriplesSameSubjectPath": case "InlineData":
                    nodeVars = contextNode.descendantsOfType("Var").map(t => t.getText());
                    break;
                case "SubSelect":
                    nodeVars = contextNode.descendantsOfType("SelectVars")[0].descendantsOfType("Var")
                        .map(t => t.getText());
                    break;
            }
            if (nodeVars.some(v => contextVars.has(v))) {
                nodeVars.forEach(v => contextVars.add(v));
                contextNodes.push(contextNode);
            } else {
                freeContext.push(contextNode);
            }
        }
        contextToCheck = freeContext.slice();
        c++;
    }

    return contextNodes;
}

/** Escape angle brackets for HTML printing (i.e. for iris)
 *
 * @param {String} str
 * @returns {String}
 */
function escape (str) {
    return str.replaceAll(/</g, `&lt;`).replaceAll(/>/g, `&gt;`);
}

if (typeof module !== 'undefined') {
    // for jest
    module.exports = { Grammar, getTokenFirstSets, getStringFirstSet, getFollowSets, getParseTable, parse, EOF,
        getEBNFTokenFirstSets: getExpressionFirstSets, getEBNFFollowSets, Optional, Choice, OneOrMore, ZeroOrMore,
        Token, Chain, Terminal, transformFromEBNF, parseRecursively, Node };
}
