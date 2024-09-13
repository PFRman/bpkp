const testGrammar = {
    terminals: ["+", "*", "(", ")", "id"],
    productions: {
        E: [["T", "Ed"]],
        Ed: [["+", "T", "Ed"], "€"],
        T: [["F", "Td"]],
        Td: [["*", "F", "Td"], "€"],
        F: [["(", "E", ")"], ["id"]]
    },
    start: "E",
}

/** Generate the FIRST-set for each token
 *
 * @param {Object} grammar
 * @returns {Object} - An Object where the tokens are the keys and the corresponding Sets are the values.
 */
function getTokenFirstSets (grammar) {
    let firsts = {}
    for (const terminal of grammar.terminals) {
        firsts[terminal] = new Set([terminal]);
    }
    Object.keys(grammar.productions).forEach(t => firsts[t] = new Set());
    let hasUpdated = true;
    let i = 0;
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
        i++;
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

/** Generate the FOLLOW-set for each non-terminal
 *
 * @param {Object} grammar
 * @param {Object} firsts
 * @returns {Object}
 */
function getFollowSets (grammar, firsts) {
    let follow = {};
    Object.keys(grammar.productions).forEach(t => firsts[t] = new Set());
    follow[grammar.start] = new Set("$");
    for (const symbol in grammar.productions) {
        const production = grammar.productions[symbol];
        production.forEach((token, i) => {
            if (grammar.terminals.includes(token)) { // no FOLLOW-set for terminals
                return;
            }
            if (production[i+1]) {
                follow[token] = follow[token]
                    .union(getStringFirstSet(production.slice(i+1), firsts))
                    .difference(new Set(["€"]));
            }
            if (i === production.length - 1 ||
                (production[i+1] && getStringFirstSet(production.slice(i+1), firsts).has("€"))) {
                follow[token] = follow[token].union(follow[symbol]);
            }
        })

    }
    return follow;
}

// for jest
module.exports = { getTokenFirstSets, getStringFirstSet};