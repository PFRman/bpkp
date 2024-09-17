const JisonLex = require('jison-lex');
const ebnfParser = require('ebnf-parser');
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

const emptyString = "€";
const EOF = "$"

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
                if (production === emptyString) {
                    firsts[symbol].add(emptyString);
                } else {
                    let hasEpsilon = false;
                    for (const token of production) {
                        firsts[symbol] = firsts[symbol].union(
                            firsts[token].difference(new Set(emptyString))
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

/** Generate the FIRST-set for a string
 *
 * @param {Array<String>|String} string
 * @param {Object} firsts
 * @returns {Set<String>}
 */
function getStringFirstSet (string, firsts) {
    if (string === emptyString) return new Set(emptyString);
    let first = new Set();
    let hasEpsilon = false;
    for (const symbol of string) {
        hasEpsilon = firsts[symbol].has(emptyString);
        first = first.union(firsts[symbol].difference(new Set(emptyString)));
        if (!hasEpsilon) break;
    }
    if (hasEpsilon) first.add(emptyString);
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
    follows[grammar.start] = new Set(EOF);
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
                        follows[token] = follows[token]
                            .union(getStringFirstSet(production.slice(i + 1), firsts))
                            .difference(new Set([emptyString]));
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

function parse (input, parseTable, grammar, lexerRules) {
    let stack = [grammar.start, EOF];
    const sparqlLexer = new JisonLex(lexerRules);
    sparqlLexer.setInput(input);
    let x = stack[0];
    let log = [];
    let token = sparqlLexer.lex();
    while (x !== EOF) {
        log.push('stack: '+ stack)
        log.push('token: '+ token);
        if (x === token) {
            log.push(`Consumed ${x}`);
            stack.shift();
            token = sparqlLexer.lex();
        } else if (grammar.terminals.includes(x)) {
            log.push(`Unexpected token ${x}`);
            return log;
        } else if (!(parseTable[x] && parseTable[x][token])) {
            log.push(`Unexpected token ${x}`);
            return log;
        } else {
            const production = parseTable[x][token];
            log.push(`Applied ${x} --> ${production}`);
            stack.shift();
            if (production !== emptyString) stack = production.concat(stack);
        }
        x = stack[0];
    }
    log.push("success");
    return log;
}

function readGrammar(filePath) {
    const grammarInput = fs.readFileSync(filePath, 'utf8');
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

const grammar = readGrammar('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/ll1/sparql.y');
const lexerRules = fs.readFileSync('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/ll1/sparql.l', 'utf8');
const firsts = getTokenFirstSets(grammar);
const follows = getFollowSets(grammar, firsts);
const parseTable = getParseTable(grammar, firsts, follows);
const log = parse("PREFIX wdt: <http://www.wikidata.org/prop/direct/>\nSELECT * WHERE {}", parseTable, grammar, lexerRules);
console.log(log);
// for jest
module.exports = { Grammar, getTokenFirstSets, getStringFirstSet, getFollowSets, getParseTable, parse };
