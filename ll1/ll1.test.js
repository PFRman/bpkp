const { getTokenFirstSets, getStringFirstSet } = require("./ll1");

test(`firsts0`, () => {
    const test0 = { terminals: [], productions: [] }
    expect(getTokenFirstSets(test0)).toEqual({});
})


test(`firsts`, () => {
    // example from the dragon book
    const testGrammar = {
        terminals: ["+", "*", "(", ")", "id"],
        productions: {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
    };
    const firsts = getTokenFirstSets(testGrammar);
    const expectedFirsts = {
        "+": new Set(["+"]),
        "*": new Set(["*"]),
        "(": new Set(["("]),
        ")": new Set([")"]),
        "id": new Set(["id"]),
        "F": new Set(["(", "id"]),
        "T": new Set(["(", "id"]),
        "E": new Set(["(", "id"]),
        "Ed": new Set(["+", "€"]),
        "Td": new Set(["*", "€"]),
    };
    expect(firsts).toEqual(expectedFirsts);
})

test(`firstsAll€`, () => {
    const testGrammar = {
        terminals: ["+"],
        productions: {
            A: [["+", "B"],"€"],
            B: ["€"],
            C: [["A", "+"], ["A", "B"]]
        }
    };
    const firsts = getTokenFirstSets(testGrammar);
    const expectedFirsts = {
        "+": new Set(["+"]),
        "A": new Set(["+", "€"]),
        "B": new Set(["€"]),
        "C": new Set(["+", "€"]),
    };
    expect(firsts).toEqual(expectedFirsts);
})

test(`first0`, () => {
    const testString = [];
    const testFirsts = {};
    expect(getStringFirstSet(testString, testFirsts)).toEqual(new Set());
})

test(`first1`, () => {
    const testString = ["A", "B", "C"];
    const testFirsts = {
        "A": new Set(["a", "€"]),
        "B": new Set(["b"]),
        "C": new Set(["c"]),
    };
    expect(getStringFirstSet(testString, testFirsts)).toEqual(new Set("ab"));
})

test(`first1`, () => {
    const testString = ["A", "B", "C"];
    const testFirsts = {
        "A": new Set(["a", "€"]),
        "B": new Set(["b", "€"]),
        "C": new Set(["c", "€"]),
    };
    expect(getStringFirstSet(testString, testFirsts)).toEqual(new Set("abc€"));
})