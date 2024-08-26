const filterContext = require('./filterContext');
const Parser = require('web-tree-sitter');

test(`no subject/predicate`, () => {
    const subject = undefined;
    const predicate = undefined;
    const triples = [{node: "test"}, {node: "test"}, {node: "test"}];
    expect(filterContext(triples, subject, predicate, null)).toEqual([]);
})

test(`subject and predicate var, no triples`, () => {
    const subject = { node: {type: "var", text: "?testsub" }};
    const predicate = { node: {type: "var", text: "?testpred" }};
    const triples = [];
    expect(filterContext(triples, subject, predicate, null)).toEqual([]);
})

test(`subject and predicate var, triples without context`, async () => {
    await Parser.init().then(() => { /* ready */ });
    const parser = new Parser;
    const sparql = await Parser.Language.load('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/src/tree-sitter-sparql.wasm');
    parser.setLanguage(sparql);
    let tree = parser.parse(`
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?astronautLabel ?time_in_space WHERE {
          ?astronaut wdt:P106 wd:Q11631 .
          ?astronaut wdt:P2873 ?time_in_space .
          ?astronaut rdfs:label ?astronautLabel .
          FILTER (LANG(?astronautLabel) = "en") .
        }
        ORDER BY DESC(?time_in_space)
    `);
    const query = sparql.query(`(triples_same_subject) @triples`);
    const triples = query.captures(tree.rootNode);
    const subject = { node: {type: "var", text: "?testsub" }};
    const predicate = { node: {type: "var", text: "?testpred" }};
    expect(filterContext(triples, subject, predicate, sparql)).toEqual([]);
})

test(`subject and predicate var, all triples with context`, async () => {
    await Parser.init().then(() => { /* ready */ });
    const parser = new Parser;
    const sparql = await Parser.Language.load('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/src/tree-sitter-sparql.wasm');
    parser.setLanguage(sparql);
    let tree = parser.parse(`
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?astronautLabel ?time_in_space WHERE {
          ?astronaut wdt:P106 wd:Q11631 .
          ?astronaut wdt:P2873 ?time_in_space .
          ?astronaut rdfs:label ?astronautLabel .
          FILTER (LANG(?astronautLabel) = "en") .
        }
        ORDER BY DESC(?time_in_space)
    `);
    const query = sparql.query(`(triples_same_subject) @triples`);
    const triples = query.captures(tree.rootNode);
    const subject = { node: {type: "var", text: "?astronaut" }};
    const predicate = { node: {type: "var", text: "?testpred" }};
    expect(filterContext(triples, subject, predicate, sparql)).toEqual(triples);
})

test(`subject and predicate var, one triple with context`, async () => {
    await Parser.init().then(() => { /* ready */ });
    const parser = new Parser;
    const sparql = await Parser.Language.load('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/src/tree-sitter-sparql.wasm');
    parser.setLanguage(sparql);
    let tree = parser.parse(`
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?astronautLabel ?time_in_space WHERE {
          ?astronaut wdt:P106 wd:Q11631 .
          ?astronaut wdt:P2873 ?time_in_space .
          ?astronaut rdfs:label ?astronautLabel .
          FILTER (LANG(?astronautLabel) = "en") .
        }
        ORDER BY DESC(?time_in_space)
    `);
    const query = sparql.query(`(triples_same_subject) @triples`);
    const triples = query.captures(tree.rootNode).toSorted(nodeSort);
    const subject = { node: {type: "var", text: "?astronautLabel" }};
    const predicate = { node: {type: "var", text: "?testpred" }};
    const filteredTriples = filterContext(triples, subject, predicate, sparql).toSorted(nodeSort);
    expect(filteredTriples).toEqual(triples);
})

test(`subject var, one triple with context`, async () => {
    await Parser.init().then(() => { /* ready */ });
    const parser = new Parser;
    const sparql = await Parser.Language.load('/Users/wende/Uni/bachelorprojekt/kickoff-parser/bpkp/src/tree-sitter-sparql.wasm');
    parser.setLanguage(sparql);
    let tree = parser.parse(`
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?astronautLabel ?time_in_space WHERE {
          ?astronaut wdt:P106 wd:Q11631 .
          ?astronaut wdt:P2873 ?time_in_space .
          ?astronaut rdfs:label ?astronautLabel .
          FILTER (LANG(?astronautLabel) = "en") .
        }
        ORDER BY DESC(?time_in_space)
    `);
    const query = sparql.query(`(triples_same_subject) @triples`);
    const triples = query.captures(tree.rootNode).toSorted(nodeSort);
    const subject = { node: {type: "var", text: "?astronautLabel" }};
    const predicate = undefined;
    const filteredTriples = filterContext(triples, subject, predicate, sparql).toSorted(nodeSort);
    expect(filteredTriples).toEqual(triples);
})

function nodeSort (a, b) {
    return a.node.id - b.node.id;
}