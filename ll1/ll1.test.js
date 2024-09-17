const { Grammar, getTokenFirstSets, getStringFirstSet, getFollowSets, getParseTable,
    parse} = require("./ll1");

test(`firsts0`, () => {
    const test0 = { terminals: [], productions: [] }
    expect(getTokenFirstSets(test0)).toEqual({});
})


test(`firsts`, () => {
    // example from the dragon book
    const testGrammar = new Grammar (
        ["+", "*", "(", ")", "id"],
        {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
        "E"
    );
    const firsts = sortSubSets(getTokenFirstSets(testGrammar));
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
    expect(firsts).toEqual(sortSubSets(expectedFirsts));
})

test(`firstsAll€`, () => {
    const testGrammar = new Grammar(
        ["+"],
        {
            A: [["+", "B"],"€"],
            B: ["€"],
            C: [["A", "+"], ["A", "B"]]
        },
        "A"
    );
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

test(`firstAll€`, () => {
    const testString = ["A", "B", "C"];
    const testFirsts = {
        "A": new Set(["a", "€"]),
        "B": new Set(["b", "€"]),
        "C": new Set(["c", "€"]),
    };
    expect(getStringFirstSet(testString, testFirsts)).toEqual(new Set("abc€"));
})

test(`follow0`, () => {
    const testGrammar = { terminals: [], productions: [], start: "" };
    const firsts = {};
    expect(getFollowSets(testGrammar, firsts)).toEqual({ "": new Set("$")})
})

test(`follow1`, () => {
    // example from the dragon book
    const testGrammar = new Grammar (
        ["+", "*", "(", ")", "id"],
        {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
        "E"
    );
    const firsts = {
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
    const expectedFollowSets = {
        "E": new Set([")", "$"].sort()),
        "Ed": new Set([")", "$"].sort()),
        "T": new Set(["+", ")", "$"].sort()),
        "Td": new Set(["+", ")", "$"].sort()),
        "F": new Set(["+", "*", ")", "$"].sort()),
    }
    const followSets = sortSubSets(getFollowSets(testGrammar, firsts));
    expect(followSets).toEqual(sortSubSets(expectedFollowSets));
})

function sortSubSets (obj) {
    let newObject = {};
    Object.entries(obj).forEach(([key, value]) => {
        newObject[key] = Array.from(value).sort();
    })
    return newObject;
}

test(`parseTable0`, () => {
    let testGrammar = new Grammar([], {}, "");
    let parseTable = getParseTable(testGrammar, {});
    expect(parseTable).toEqual({});
})

test(`parseTable1`, () => {
    // example from the dragon book
    const testGrammar = new Grammar (
        ["+", "*", "(", ")", "id"],
        {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
        "E"
    );
    const firsts = {
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
    const follows = getFollowSets(testGrammar, firsts);
    const expectedParseTable = {
        E: { "id": ["T", "Ed"], "(": ["T", "Ed"] },
        Ed: { "+": ["+", "T", "Ed"], ")": "€", "$": "€" },
        T: { "id": ["F", "Td"], "(": ["F", "Td"] },
        Td: { "+": "€", "*": ["*", "F", "Td"], ")": "€", "$": "€" },
        F: { "id": ["id"], "(": ["(", "E", ")"] }
    };
    expect(getParseTable(testGrammar, firsts, follows)).toEqual(expectedParseTable);
})

test(`parse0`, () => {
    expect(parse("", {}, new Grammar([], {}, ""), {rules: []}).at(-1))
        .toMatch(/Unexpected token/);
})

test(`parse1`, () => {
    const testInput = "foo+bar*test";
    // example from the dragon book
    const testGrammar = new Grammar (
        ["+", "*", "(", ")", "id"],
        {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
        "E"
    );
    const testParseTable = {
        E: {"id": ["T", "Ed"], "(": ["T", "Ed"]},
        Ed: {"+": ["+", "T", "Ed"], ")": "€", "$": "€"},
        T: {"id": ["F", "Td"], "(": ["F", "Td"]},
        Td: {"+": "€", "*": ["*", "F", "Td"], ")": "€", "$": "€"},
        F: {"id": ["id"], "(": ["(", "E", ")"]}
    };
    let lexerRules = {
        rules: [
            ["\\+", "return '+';"],
            ["\\*", "return '*';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
            ["[a-zA-Z][a-zA-Z0-9]*", "return 'id';"],
            ["$", "return '$';"]
        ]
    }
    expect(parse(testInput, testParseTable, testGrammar, lexerRules).at(-1)).toEqual("success");
})

test(`parse2`, () => {
    const testInput = "id+*id";
    // example from the dragon book
    const testGrammar = new Grammar (
        ["+", "*", "(", ")", "id"],
        {
            E: [["T", "Ed"]],
            Ed: [["+", "T", "Ed"], "€"],
            T: [["F", "Td"]],
            Td: [["*", "F", "Td"], "€"],
            F: [["(", "E", ")"], ["id"]]
        },
        "E"
    );
    const testParseTable = {
        E: {"id": ["T", "Ed"], "(": ["T", "Ed"]},
        Ed: {"+": ["+", "T", "Ed"], ")": "€", "$": "€"},
        T: {"id": ["F", "Td"], "(": ["F", "Td"]},
        Td: {"+": "€", "*": ["*", "F", "Td"], ")": "€", "$": "€"},
        F: {"id": ["id"], "(": ["(", "E", ")"]}
    };
    let lexerRules = {
        rules: [
            ["\\+", "return '+';"],
            ["\\*", "return '*';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
            ["[a-zA-Z][a-zA-Z0-9]*", "return 'id';"],
            ["$", "return '$';"]
        ]
    }
    expect(parse(testInput, testParseTable, testGrammar, lexerRules).at(-1)).toMatch(/Unexpected token /);
})