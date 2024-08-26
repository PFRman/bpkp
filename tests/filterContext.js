function filterContext (triples, subject, predicate, sparql) {
    if (subject?.node.type !== "var" && predicate?.node.type !== "var") {
        return [];
    }
    let vars = new Set();
    let triplesToCheck = triples.slice();
    let contextTriples = []
    if (subject?.node.type === "var") vars.add(subject.node.text);
    if (predicate?.node.type === "var") vars.add(predicate.node.text);

    let c = 0;
    while (triplesToCheck.length > 0 && c < triples.length) {
        let freeTriples = [];
        for (const triple of triplesToCheck) {
            let query = sparql.query(`(triples_same_subject
                (var)? @svar  
                (_(_(var)? @pvar 
                (_ (var)? @ovar))) )`);
            let tripleVars = query.captures(triple.node).map(v => v.node.text);
            if (tripleVars.some(v => vars.has(v))) {
                tripleVars.forEach(v => vars.add(v));
                contextTriples.push(triple);
            } else {
                freeTriples.push(triple);
            }
        }
        triplesToCheck = freeTriples.slice();
        c++;
    }
    return contextTriples;
}

module.exports = filterContext;