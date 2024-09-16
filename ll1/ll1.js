const JisonLex = require('jison-lex');
const fs = require('fs');

/**
 *
 * @param {Array} terminals - An array with all terminal symbols in the grammar
 * @param {Object} productions
 * @param start - the start symbol of the grammar
 * @constructor
 */
function Grammar (terminals, productions, start) {
    this.terminals = terminals;
    this.productions = productions;
    this.start = start;
}

/** Generate the FIRST-set for each token
 *
 * @param {Grammar} grammar
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getTokenFirstSets (grammar) {
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
                if (production === "€") {
                    firsts[symbol].add("€");
                } else {
                    let hasEpsilon = false;
                    for (const token of production) {
                        firsts[symbol] = firsts[symbol].union(firsts[token]).difference(new Set(["€"]));
                        hasEpsilon = firsts[token].has("€");
                        if (!hasEpsilon) break;
                    }
                    if (hasEpsilon) firsts[symbol].add("€");
                }
            })
            hasUpdated = hasUpdated || oldFirsts.symmetricDifference(firsts[symbol]).size !== 0;
        }
    }
    return firsts;
}

/** Generate the FIRST-set for a string
 *
 * @param {Array<String>} string
 * @param {Object} firsts
 * @returns {Set<String>}
 */
function getStringFirstSet (string, firsts) {
    let first = new Set();
    let hasEpsilon = false;
    for (const symbol of string) {
        hasEpsilon = firsts[symbol].has("€");
        first = first.union(firsts[symbol]).difference(new Set(["€"]));
        if (!hasEpsilon) break;
    }
    if (hasEpsilon) first.add("€");
    return first;
}

/** Generate the FOLLOW-set for each non-terminal symbol
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getFollowSets (grammar, firsts) {
    let follows = {};
    Object.keys(grammar.productions).forEach(t => follows[t] = new Set());
    follows[grammar.start] = new Set("$");
    let hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        for (const symbol in grammar.productions) {
            const productions = grammar.productions[symbol];
            productions.filter(p => p !== "€").forEach(production => {
                production.forEach((token, i) => {
                    const oldFollows = new Set(follows[token]);
                    if (grammar.terminals.includes(token)) { // no FOLLOW-set for terminals
                        return;
                    }
                    if (production[i + 1]) {
                        follows[token] = follows[token]
                            .union(getStringFirstSet(production.slice(i + 1), firsts))
                            .difference(new Set(["€"]));
                    }
                    if (i === production.length - 1 ||
                        (production[i + 1] && getStringFirstSet(production.slice(i + 1), firsts).has("€"))) {
                        follows[token] = follows[token].union(follows[symbol]);
                    }
                    hasUpdated = hasUpdated || oldFollows.symmetricDifference(follows[token]).size !== 0;
                });
            });
        }
    }
    return follows;
}

/** Create a parse table for grammar using firsts and follows
 *
 * @param {Grammar} grammar
 * @param {Object} firsts
 * @param {Object} follows
 * @returns {Object<Object>} - the parse table, each non-terminal has a row, each terminal a column.
 * Access entries with parseTable[non-terminal][terminal].
 */
function getParseTable (grammar, firsts, follows) {
    let parseTable = {};
    for (const symbol in grammar.productions) {
        parseTable[symbol] = {};
        grammar.productions[symbol].forEach(production => {
            if (production === "€") {
                follows[symbol].forEach((terminal) => {
                    parseTable[symbol][terminal] = production;
                });
            } else {
                getStringFirstSet(production, firsts).forEach(token => {
                    if (grammar.terminals.includes(token)) {
                        parseTable[symbol][token] = production;
                    }
                });
            }
        });
    }
    return parseTable;
}

function parse (tokens, parseTable, grammar) {
    let stack = [grammar.start, "$"];
    let input = tokens.concat(["$"]);
    let ip = 0;
    let x = stack[0];
    let log = [];
    while (x !== "$") {
        let token = sparqlLexer.lex();
        console.log(token);
        if (x === input[ip]) {
            log.push(`Consumed ${x}`);
            stack.shift();
            ip++;
        } else if (grammar.terminals.includes(x)) {
            throw new Error(`Unexpected token ${x}`);
        } else if (!(parseTable[x] && parseTable[x][input[ip]])) {
            throw new Error(`Unexpected token ${x}`);
        } else {
            const production = parseTable[x][input[ip]];
            log.push(`Applied ${x} --> ${production}`);
            stack.shift();
            if (production !== "€") stack = production.concat(stack);
        }
        x = stack[0];
    }
    log.push("success");
    return log;
}

// for jest
module.exports = { Grammar, getTokenFirstSets, getStringFirstSet, getFollowSets, getParseTable, parse };

let grammar = fs.readFileSync('bpkp/ll1/sparql.l', 'utf8');
let sparqlLexer = new JisonLex(grammar);
sparqlLexer.setInput("SELECT ?test ?test2 WHERE { ?test1 rdf:type <yoho> }")