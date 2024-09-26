const { Grammar, getTokenFirstSets, getStringFirstSet, getFollowSets, getParseTable,
    parse, EOF, getEBNFTokenFirstSets, getEBNFFollowSets, Optional, Choice, OneOrMore, ZeroOrMore, Token, Chain,
    transformFromEBNF} = require("../ll1");

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
    expect(getFollowSets(testGrammar, firsts)).toEqual({ "": new Set([EOF])})
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
        "E": new Set([")", EOF].sort()),
        "Ed": new Set([")", EOF].sort()),
        "T": new Set(["+", ")", EOF].sort()),
        "Td": new Set(["+", ")", EOF].sort()),
        "F": new Set(["+", "*", ")", EOF].sort()),
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
        Ed: { "+": ["+", "T", "Ed"], ")": "€", EOF: "€" },
        T: { "id": ["F", "Td"], "(": ["F", "Td"] },
        Td: { "+": "€", "*": ["*", "F", "Td"], ")": "€", EOF: "€" },
        F: { "id": ["id"], "(": ["(", "E", ")"] }
    };
    expect(getParseTable(testGrammar, firsts, follows)).toEqual(expectedParseTable);
})

/*test(`parse0`, () => {
    expect(parse("", {}, new Grammar([], {}, ""), {rules: []}).log.at(-1))
        .toMatch(/Unexpected token/);
})*/

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
        Ed: {"+": ["+", "T", "Ed"], ")": "€", EOF: "€"},
        T: {"id": ["F", "Td"], "(": ["F", "Td"]},
        Td: {"+": "€", "*": ["*", "F", "Td"], ")": "€", EOF: "€"},
        F: {"id": ["id"], "(": ["(", "E", ")"]}
    };
    let lexerRules = {
        rules: [
            ["\\+", "return '+';"],
            ["\\*", "return '*';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
            ["[a-zA-Z][a-zA-Z0-9]*", "return 'id';"],
            ["$", "return 'EOF';"]
        ]
    }
    expect(parse(testInput, testParseTable, testGrammar, lexerRules).log.at(-1)).toEqual("success");
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
        Ed: {"+": ["+", "T", "Ed"], ")": "€", EOF: "€"},
        T: {"id": ["F", "Td"], "(": ["F", "Td"]},
        Td: {"+": "€", "*": ["*", "F", "Td"], ")": "€", EOF: "€"},
        F: {"id": ["id"], "(": ["(", "E", ")"]}
    };
    let lexerRules = {
        rules: [
            ["\\+", "return '+';"],
            ["\\*", "return '*';"],
            ["\\(", "return '(';"],
            ["\\)", "return ')';"],
            ["[a-zA-Z][a-zA-Z0-9]*", "return 'id';"],
            ["$", "return 'EOF';"]
        ]
    }
    expect(parse(testInput, testParseTable, testGrammar, lexerRules).log.at(-1)).toMatch(/Unexpected token /);
})

test(`leftFactorize0`, () => {
    expect(new Grammar([], {}, "").leftFactorize()).toEqual(new Grammar([], {}, ""));
})

test(`leftFactorize1`, () => {
    const testGrammar = new Grammar(
        ["a", "b", "c"],
        {
            A: [["a", "b", "c"], ["a", "c", "b"], ["B", "c"] ],
            B: [["b", "b", "a"], ["b", "b"], ["b", "c"], "€"]
        },
        "A"
    );
    const expectedGrammar = new Grammar(
        ["a", "b", "c"],
        {
            A: [["a", "A_LF0"], ["B", "c"]],
            A_LF0: [["b", "c"], ["c", "b"]],
            B: [["b", "B_LF0"], "€"],
            B_LF0: [["b", "B_LF0_LF0"], ["c"]],
            B_LF0_LF0: [["a"], "€"]
        },
        "A"
    );
    expect(testGrammar.leftFactorize()).toEqual(expectedGrammar);
})


test(`getEBNFTokenFirstSets1`, () => {
    const testGrammar = new Grammar(
        ['SELECT', 'DISTINCT', 'REDUCED', 'VAR', '(', 'AS', ')', '*', '||', 'NUMBER', "="],
        {
            SelectClause: new Chain(
                new Token('SELECT'),
                new Optional(new Choice(new Token('DISTINCT'), new Token('REDUCED'))),
                new Choice(
                    new OneOrMore(new Choice(
                        new Token('Var'),
                        new Chain(new Token('('), new Token('Expression'), new Token('AS'), new Token('Var'), new Token(')'))
                    )),
                    new Token('*')
                )
            ),
            Var: new Token('VAR'),
            Expression: new Chain(
                new Token('ValueLogical'),
                new ZeroOrMore(new Chain(new Token('||'), new Token('ValueLogical')))
            ),
            ValueLogical: new Chain(
                new Token('NUMBER'),
                new ZeroOrMore(new Choice(
                    new Chain(new Token('='), new Token('NUMBER')),
                    new Chain(new Token('='), new Token('NUMBER')),
                ))
            )
        },
        "SelectClause"
    )
    const expectedFirsts = {
        "SelectClause": new Set(['SELECT']),
        "Var": new Set(['VAR']),
        "Expression": new Set(['NUMBER']),
        "ValueLogical": new Set(['NUMBER']),
        'SELECT': new Set(['SELECT']),
        'DISTINCT': new Set(['DISTINCT']),
        'REDUCED': new Set(['REDUCED']),
        'VAR': new Set(['VAR']),
        '(': new Set(['(']),
        'AS': new Set(['AS']),
        ')': new Set([')']),
        '*': new Set(['*']),
        '||': new Set(['||']),
        'NUMBER': new Set(['NUMBER']),
        "=": new Set(["="])
    }
    expect(getEBNFTokenFirstSets(testGrammar)).toEqual(expectedFirsts);
})

test(`getEBNFTokenFirstSets2`, () => {
    const testGrammar = new Grammar(
        ['DISTINCT', 'REDUCED', 'VAR', '(', 'AS', ')', '*', '||', 'NUMBER', "="],
        {
            SelectClause: new Chain(
                new Optional(new Choice(new Token('DISTINCT'), new Token('REDUCED'))),
                new Choice(
                    new OneOrMore(new Choice(
                        new Token('Var'),
                        new Chain(new Token('('), new Token('Expression'), new Token('AS'), new Token('Var'), new Token(')'))
                    )),
                    new Token('*')
                )
            ),
            Var: new Token('VAR'),
            Expression: new Chain(
                new Token('ValueLogical'),
                new ZeroOrMore(new Chain(new Token('||'), new Token('ValueLogical')))
            ),
            ValueLogical: new Chain(
                new Token('NUMBER'),
                new ZeroOrMore(new Choice(
                    new Chain(new Token('='), new Token('NUMBER')),
                    new Chain(new Token('='), new Token('NUMBER')),
                ))
            )
        },
        "SelectClause"
    )
    const expectedFirsts = {
        "SelectClause": new Set(['DISTINCT', 'REDUCED', 'VAR', '(', '*']),
        "Var": new Set(['VAR']),
        "Expression": new Set(['NUMBER']),
        "ValueLogical": new Set(['NUMBER']),
        'DISTINCT': new Set(['DISTINCT']),
        'REDUCED': new Set(['REDUCED']),
        'VAR': new Set(['VAR']),
        '(': new Set(['(']),
        'AS': new Set(['AS']),
        ')': new Set([')']),
        '*': new Set(['*']),
        '||': new Set(['||']),
        'NUMBER': new Set(['NUMBER']),
        "=": new Set(["="])
    }
    expect(getEBNFTokenFirstSets(testGrammar)).toEqual(expectedFirsts);
})

test(`getEBNFTokenFollowSets1`, () => {
    const testTerminals = ['DISTINCT', 'REDUCED', 'VAR', '(', 'AS', ')', '*', '||', 'NUMBER', "="];
    const terminals = {};
    testTerminals.forEach(terminal => {
        terminals[terminal] = new Token(terminal, true);
    })
    const testGrammar = new Grammar(
        testTerminals,
        {
            SelectClause: new Chain(
                new Optional(new Choice(terminals['DISTINCT'], terminals['REDUCED'])),
                new Choice(
                    new OneOrMore(new Choice(
                        new Token('Var'),
                        new Chain(terminals['('], new Token('Expression'), terminals['AS'], new Token('Var'), terminals[')'])
                    )),
                    terminals['*']
                )
            ),
            Var: terminals['VAR'],
            Expression: new Chain(
                new Token('ValueLogical'),
                new ZeroOrMore(new Chain(terminals['||'], new Token('ValueLogical')))
            ),
            ValueLogical: new Chain(
                terminals['NUMBER'],
                new ZeroOrMore(new Choice(
                    new Chain(terminals['='], new Token('NUMBER', true)),
                    new Chain(terminals['='], new Token('NUMBER', true)),
                ))
            )
        },
        "SelectClause"
    )
    const firsts = {
        "SelectClause": new Set(['DISTINCT', 'REDUCED', 'VAR', '(', '*']),
        "Var": new Set(['VAR']),
        "Expression": new Set(['NUMBER']),
        "ValueLogical": new Set(['NUMBER']),
        'DISTINCT': new Set(['DISTINCT']),
        'REDUCED': new Set(['REDUCED']),
        'VAR': new Set(['VAR']),
        '(': new Set(['(']),
        'AS': new Set(['AS']),
        ')': new Set([')']),
        '*': new Set(['*']),
        '||': new Set(['||']),
        'NUMBER': new Set(['NUMBER']),
        "=": new Set(["="])
    }
    const expectedFollows = sortSubSets({
        "SelectClause": new Set([EOF]),
        "Var": new Set(['(', ')', 'VAR', EOF]),
        "Expression": new Set(['AS']),
        "ValueLogical": new Set(['||', 'AS']),
    })
    expect(sortSubSets(getEBNFFollowSets(testGrammar, firsts))).toEqual(expectedFollows);
})

test(`transformFromEBNF`, () => {
    const testTerminals = ['DISTINCT', 'REDUCED', 'VAR', '(', 'AS', ')', '*', '||', 'NUMBER', '=', '!='];
    const terminals = {};
    testTerminals.forEach(terminal => {
        terminals[terminal] = new Token(terminal, true);
    });
    const testGrammar = new Grammar(
        testTerminals,
        {
            SelectClause: new Chain(
                new Optional(new Choice(terminals['DISTINCT'], terminals['REDUCED'])),
                new Choice(
                    new OneOrMore(new Choice(
                        new Token('Var'),
                        new Chain(terminals['('], new Token('Expression'), terminals['AS'], new Token('Var'), terminals[')'])
                    )),
                    terminals['*']
                )
            ),
            Var: terminals['VAR'],
            Expression: new Chain(
                new Token('ValueLogical'),
                new ZeroOrMore(new Chain(terminals['||'], new Token('ValueLogical')))
            ),
            ValueLogical: new Chain(
                terminals['NUMBER'],
                new ZeroOrMore(new Choice(
                    new Chain(terminals['='], new Token('NUMBER', true)),
                    new Chain(terminals['!='], new Token('NUMBER', true)),
                ))
            )
        },
        "SelectClause"
    );
    const expectedGrammar = new Grammar(
        testGrammar.terminals,
        {
            SelectClause: [["_SelectClauseChain"]],
            _SelectClauseChain: [["_SelectClauseChain0Optional", "_SelectClauseChain1Choice"]],
            _SelectClauseChain0Optional: ["€", ["_SelectClauseChain0OptionalChoice"]],
            _SelectClauseChain0OptionalChoice: [['DISTINCT'], ['REDUCED']],
            _SelectClauseChain1Choice: [["_SelectClauseChain1Choice0OneOrMore"], ['*']],
            _SelectClauseChain1Choice0OneOrMore: [["_SelectClauseChain1Choice0OneOrMoreChoice",
                "_SelectClauseChain1Choice0OneOrMoreOpt"]],
            _SelectClauseChain1Choice0OneOrMoreOpt: ["€", ["_SelectClauseChain1Choice0OneOrMoreChoice"]],
            _SelectClauseChain1Choice0OneOrMoreChoice:[['Var'], ["_SelectClauseChain1Choice0OneOrMoreChoice1Chain"]],
            _SelectClauseChain1Choice0OneOrMoreChoice1Chain: [[`(`, 'Expression', 'AS', 'Var', ')']],
            Var: [['VAR']],
            Expression: [["_ExpressionChain"]],
            _ExpressionChain: [['ValueLogical', "_ExpressionChain1ZeroOrMore"]],
            _ExpressionChain1ZeroOrMore: ["€", ["_ExpressionChain1ZeroOrMoreChain", "_ExpressionChain1ZeroOrMore"]],
            _ExpressionChain1ZeroOrMoreChain: [['||', 'ValueLogical']],
            ValueLogical: [["_ValueLogicalChain"]],
            _ValueLogicalChain: [['NUMBER', "_ValueLogicalChain1ZeroOrMore"]],
            _ValueLogicalChain1ZeroOrMore: ["€", ["_ValueLogicalChain1ZeroOrMoreChoice", "_ValueLogicalChain1ZeroOrMore"]],
            _ValueLogicalChain1ZeroOrMoreChoice: [["_ValueLogicalChain1ZeroOrMoreChoice0Chain"],
                ["_ValueLogicalChain1ZeroOrMoreChoice1Chain"]],
            _ValueLogicalChain1ZeroOrMoreChoice0Chain: [['=', 'NUMBER']],
            _ValueLogicalChain1ZeroOrMoreChoice1Chain: [['!=', 'NUMBER']],
        },
        testGrammar.start
    );
    expect(transformFromEBNF(testGrammar)).toEqual(expectedGrammar);
})