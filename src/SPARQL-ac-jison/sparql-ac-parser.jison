%{

// Inverse the jison-generated parser.symbols_ to create a mapping from symbol ID to symbol for all symbols
parser.invertedSymbols = Object.keys(parser.symbols_).reduce((inv, token) => {
        inv[parser.symbols_[token]] = token; return inv;
    }, {});

// Overwrite the jison-parse-function. All modification compared to the original function are marked with //< //> or ///
// also replaced all var with let
parser.parse = function parse(input) {
    let self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    let args = lstack.slice.call(arguments, 1);
    let lexer = Object.create(this.lexer);
    let sharedState = { yy: {} };
    for (let k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    let yyloc = lexer.yylloc;
    lstack.push(yyloc);
    let ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            let token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    let symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    //< Collect Expected always, not just when an error occurs
    let allExpected = {};
    let allExpectedTerminals = {};
    Parser.contextTriples = null;
    //>
    while (true) {
        state = stack[stack.length - 1];
        //<
        let expectedSymbols = [];
        for (p in table[state]) {
            if (p > TERROR) {
                expectedSymbols.push(this.invertedSymbols[p]);
            }
        }
        let expectedTerminals = [];
        for (p in table[state]) {
            if (this.terminals_[p] && p > TERROR) {
                expectedTerminals.push(this.terminals_[p]);
            }
        }
        if (!Object.hasOwn(allExpected, [yyloc.last_line, yyloc.last_column])) {
            allExpected[[yyloc.last_line, yyloc.last_column]] = new Set();
        }
        expectedSymbols.forEach(s => allExpected[[yyloc.last_line, yyloc.last_column]].add(s));
        if (!Object.hasOwn(allExpectedTerminals, [yyloc.last_line, yyloc.last_column])) {
            allExpectedTerminals[[yyloc.last_line, yyloc.last_column]] = new Set();
        }
        expectedTerminals.forEach(s => allExpectedTerminals[[yyloc.last_line, yyloc.last_column]].add(s))
        // console.log(yyloc.last_line, yyloc.last_column, self.invertedSymbols[symbol], expectedSymbols.slice());
        //>
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                let errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push(this.terminals_[p]); /// no need for additional quotes
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol === EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected,
                    //< return additional information for errors
                    matched: lexer.matched,
                    allExpected: allExpected,
                    vstack: vstack,
                    contextTriples: Parser.contextTriples,
                    prefixes: Parser.prefixes ? Parser.prefixes : {},
                    //>
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                //< return expected also in case of successful parsing
                return {
                    result: r,
                    allExpected: allExpected,
                };
                //>
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
};


%}

/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
// [139]
IRIREF                "<"(?:[^<>\"\{\}\|\^`\\\u0000-\u0020])*">"
// [140]
PNAME_NS              {PN_PREFIX}?":"
// [141]
PNAME_LN              {PNAME_NS}{PN_LOCAL}
// [142]
BLANK_NODE_LABEL      "_:"(?:{PN_CHARS_U}|[0-9])(?:(?:{PN_CHARS}|".")*{PN_CHARS})?
// [143]
VAR1                  "?"{VARNAME}
// [144]
VAR2                  "$"{VARNAME}
// [145]
LANGTAG               "@"[a-zA-Z]+(?:"-"[a-zA-Z0-9]+)*
// [146]
INTEGER               [0-9]+
// [147]
DECIMAL               [0-9]*"."[0-9]+
// [148]
DOUBLE                [0-9]+"."[0-9]*{EXPONENT}|"."([0-9])+{EXPONENT}|([0-9])+{EXPONENT}
// [149]
INTEGER_POSITIVE      "+"{INTEGER}
// [150]
DECIMAL_POSITIVE      "+"{DECIMAL}
// [151]
DOUBLE_POSITIVE       "+"{DOUBLE}
// [152]
INTEGER_NEGATIVE      "-"{INTEGER}
// [153]
DECIMAL_NEGATIVE      "-"{DECIMAL}
// [154]
DOUBLE_NEGATIVE       "-"{DOUBLE}
// [155]
EXPONENT              [eE][+-]?[0-9]+
// [156]
STRING_LITERAL1       "'"(?:(?:[^\u0027\u005C\u000A\u000D])|{ECHAR})*"'"
// [157]
STRING_LITERAL2       "\""(?:(?:[^\u0022\u005C\u000A\u000D])|{ECHAR})*'"'
// [158]
STRING_LITERAL_LONG1  "'''"(?:(?:"'"|"''")?(?:[^'\\]|{ECHAR}))*"'''"
// [159]
STRING_LITERAL_LONG2  "\"\"\""(?:(?:"\""|'""')?(?:[^\"\\]|{ECHAR}))*'"""'
// [160]
ECHAR                 "\\"[tbnrf\\\"']|"\\u"{HEX}{HEX}{HEX}{HEX}|"\\U"{HEX}{HEX}{HEX}{HEX}{HEX}{HEX}{HEX}{HEX}
// [161]
NIL                   "("{WS}*")"
// [162]
WS                    \u0020|\u0009|\u000D|\u000A
// [163]
ANON                  "["{WS}*"]"
// [164]
PN_CHARS_BASE         [A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]
// [165]
PN_CHARS_U            (?:{PN_CHARS_BASE}|"_")
// [166]
VARNAME               (?:{PN_CHARS_U}|[0-9])(?:{PN_CHARS_U}|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040])*
// [167]
PN_CHARS              {PN_CHARS_U}|"-"|[0-9]|\u00B7|[\u0300-\u036F\u203F-\u2040]
// [168]
PN_PREFIX             {PN_CHARS_BASE}(?:(?:{PN_CHARS}|".")*{PN_CHARS})?
// [169]
PN_LOCAL              (?:{PN_CHARS_U}|":"|[0-9]|{PLX})(?:(?:{PN_CHARS}|"."|":"|{PLX})*(?:{PN_CHARS}|":"|{PLX}))?
// [170]
PLX                   {PERCENT}|{PN_LOCAL_ESC}
// [171]
PERCENT               "%"{HEX}{HEX}
// [172]
HEX                   [0-9A-Fa-f]
// [173]
PN_LOCAL_ESC          "\\"("_"|"~"|"."|"-"|"!"|"$"|"&"|"'"|"("|")"|"*"|"+"|","|";"|"="|"/"|"?"|"#"|"@"|"%")
COMMENT               "#"[^\n\r]*
SPACES_COMMENTS       (\s+|{COMMENT}\n\r?)+


%options flex case-insensitive

%%

\s+|{COMMENT}            /* ignore */
"BASE"                   return 'BASE'
"PREFIX"                 return 'PREFIX'
"SELECT"                 return 'SELECT'
"DISTINCT"               return 'DISTINCT'
"REDUCED"                return 'REDUCED'
"("                      return '('
"AS"                     return 'AS'
")"                      return ')'
"*"                      return '*'
"CONSTRUCT"              return 'CONSTRUCT'
"WHERE"                  return 'WHERE'
"{"                      { console.log("left brace"); return '{'}
"}"                      return '}'
"DESCRIBE"               return 'DESCRIBE'
"ASK"                    return 'ASK'
"FROM"                   return 'FROM'
"NAMED"                  return 'NAMED'
"GROUP"                  return 'GROUP'
"BY"                     return 'BY'
"HAVING"                 return 'HAVING'
"ORDER"                  return 'ORDER'
"ASC"                    return 'ASC'
"DESC"                   return 'DESC'
"LIMIT"                  return 'LIMIT'
"OFFSET"                 return 'OFFSET'
"VALUES"                 return 'VALUES'
";"                      return ';'
"LOAD"                   return 'LOAD'
"SILENT"                 return 'SILENT'
"INTO"                   return 'INTO'
"CLEAR"                  return 'CLEAR'
"DROP"                   return 'DROP'
"CREATE"                 return 'CREATE'
"ADD"                    return 'ADD'
"TO"                     return 'TO'
"MOVE"                   return 'MOVE'
"COPY"                   return 'COPY'
"INSERT"{SPACES_COMMENTS}"DATA"  return 'INSERTDATA'
"DELETE"{SPACES_COMMENTS}"DATA"  return 'DELETEDATA'
"DELETE"{SPACES_COMMENTS}"WHERE" return 'DELETEWHERE'
"WITH"                   return 'WITH'
"DELETE"                 return 'DELETE'
"INSERT"                 return 'INSERT'
"USING"                  return 'USING'
"DEFAULT"                return 'DEFAULT'
"GRAPH"                  return 'GRAPH'
"ALL"                    return 'ALL'
"."                      return '.'
"OPTIONAL"               return 'OPTIONAL'
"SERVICE"                return 'SERVICE'
"BIND"                   return 'BIND'
"UNDEF"                  return 'UNDEF'
"MINUS"                  return 'MINUS'
"UNION"                  return 'UNION'
"FILTER"                 return 'FILTER'
"<<"                     return '<<'
">>"                     return '>>'
"{|"                     return '{|'
"|}"                     return '|}'
","                      return ','
"a"                      return 'a'
"|"                      return '|'
"/"                      return '/'
"^"                      return '^'
"?"                      return '?'
"+"                      return '+'
"!"                      return '!'
"["                      return '['
"]"                      return ']'
"||"                     return '||'
"&&"                     return '&&'
"="                      return '='
"!="                     return '!='
"<"                      return '<'
">"                      return '>'
"<="                     return '<='
">="                     return '>='
"IN"                     return 'IN'
"NOT"                    return 'NOT'
"-"                      return '-'
"BOUND"                  return 'BOUND'
"BNODE"                  return 'BNODE'
// ("RAND"|"NOW"|"UUID"|"STRUUID") return 'FUNC_ARITY0'
/*("LANG"|"DATATYPE"|"IRI"|"URI"|"ABS"|"CEIL"|"FLOOR"|"ROUND"|"STRLEN"|"STR"|"UCASE"|"LCASE"|"ENCODE_FOR_URI"|"YEAR"|"MONTH"|"DAY"|"HOURS"|"MINUTES"|"SECONDS"|"TIMEZONE"|"TZ"|"MD5"|"SHA1"|"SHA256"|"SHA384"|"SHA512"|"isIRI"|"isURI"|"isBLANK"|"isLITERAL"|"isNUMERIC") return 'FUNC_ARITY1'*/
("SUBJECT"|"PREDICATE"|"OBJECT"|"isTRIPLE") return 'FUNC_ARITY1_SPARQL_STAR'
/*("LANGMATCHES"|"CONTAINS"|"STRSTARTS"|"STRENDS"|"STRBEFORE"|"STRAFTER"|"STRLANG"|"STRDT"|"sameTerm") return 'FUNC_ARITY2'*/
"CONCAT"                 return 'CONCAT'
"COALESCE"               return 'COALESCE'
"TRIPLE"                 return 'FUNC_ARITY3_SPARQL_STAR'
"REGEX"                  return 'REGEX'
"SUBSTR"                 return 'SUBSTR'
"REPLACE"                return 'REPLACE'
"EXISTS"                 return 'EXISTS'
"COUNT"                  return 'COUNT'
"SUM"                    return "SUM"
"MIN"                    return "MIN"
"MAX"                    return "MAX"
"AVG"                    return "AVG"
"SAMPLE"                 return 'SAMPLE'
"GROUP_CONCAT"           return 'GROUP_CONCAT'
"SEPARATOR"              return 'SEPARATOR'
"^^"                     return '^^'
"true"|"false"           return 'BOOLEAN'
"STR"                    return "STR"
"LANG"                   return "LANG"
"LANGMATCHES"            return "LANGMATCHES"
"DATATYPE"               return "DATATYPE"
"BOUND"                  return "BOUND"
"IRI"                    return "IRI"
"URI"                    return "URI"
"BNODE"                  return "BNODE"
"RAND"                   return "RAND"
"ABS"                    return "ABS"
"CEIL"                   return "CEIL"
"FLOOR"                  return "FLOOR"
"ROUND"                  return "ROUND"
"CONCAT"                 return "CONCAT"
"STRLEN"                 return "STRLEN"
"UCASE"                  return "UCASE"
"LCASE"                  return "LCASE"
"ENCODE_FOR_URI"         return "ENCODE_FOR_URI"
"CONTAINS"               return "CONTAINS"
"STRSTARTS"              return "STRSTARTS"
"STRENDS"                return "STRENDS"
"STRBEFORE"              return "STRBEFORE"
"STRAFTER"               return "STRAFTER"
"YEAR"                   return "YEAR"
"MONTH"                  return "MONTH"
"DAY"                    return "DAY"
"HOURS"                  return "HOURS"
"MINUTES"                return "MINUTES"
"SECONDS"                return "SECONDS"
"TIMEZONE"               return "TIMEZONE"
"TZ"                     return "TZ"
"NOW"                    return "NOW"
"UUID"                   return "UUID"
"STRUUID"                return "STRUUID"
"MD5"                    return "MD5"
"SHA1"                   return "SHA1"
"SHA256"                 return "SHA256"
"SHA384"                 return "SHA384"
"SHA512"                 return "SHA512"
"COALESCE"               return "COALESCE"
"IF"                     return "IF"
"STRLANG"                return "STRLANG"
"STRDT"                  return "STRDT"
"sameTerm"               return "sameTerm"
"isIRI"                  return "isIRI"
"isURI"                  return "isURI"
"isBLANK"                return "isBLANK"
"isLITERAL"              return "isLITERAL"
"isNUMERIC"              return "isNUMERIC"
"RAND"                   return "RAND"
"NOW"                    return "NOW"
"UUID"                   return "UUID"
"STRUUID"                return "STRUUID"
{IRIREF}                 return 'IRIREF'
{PNAME_NS}               return 'PNAME_NS'
{PNAME_LN}               return 'PNAME_LN'
{BLANK_NODE_LABEL}       return 'BLANK_NODE_LABEL'
{VAR1}                   return 'VAR1'
{VAR2}                   return 'VAR2'
{LANGTAG}                return 'LANGTAG'
{INTEGER}                return 'INTEGER'
{DECIMAL}                return 'DECIMAL'
{DOUBLE}                 return 'DOUBLE'
{INTEGER_POSITIVE}       return 'INTEGER_POSITIVE'
{DECIMAL_POSITIVE}       return 'DECIMAL_POSITIVE'
{DOUBLE_POSITIVE}        return 'DOUBLE_POSITIVE'
{INTEGER_NEGATIVE}       return 'INTEGER_NEGATIVE'
{DECIMAL_NEGATIVE}       return 'DECIMAL_NEGATIVE'
{DOUBLE_NEGATIVE}        return 'DOUBLE_NEGATIVE'
{EXPONENT}               return 'EXPONENT'
{STRING_LITERAL1}        return 'STRING_LITERAL1'
{STRING_LITERAL2}        return 'STRING_LITERAL2'
{STRING_LITERAL_LONG1}   return 'STRING_LITERAL_LONG1'
{STRING_LITERAL_LONG2}   return 'STRING_LITERAL_LONG2'
{NIL}                    return 'NIL'
{ANON}                   return 'ANON'
<<EOF>>                  return 'EOF'
.                        return 'INVALID'

/lex

%start QueryUnit

%% /* language grammar */

QueryUnit
: Query EOF { return { prefixes: Parser.prefixes }; }
/*| error {console.log("error!", yytext); ;}*/
;

QueryType
    : SelectQuery
| ConstructQuery
| DescribeQuery
| AskQuery
;

Query
    : Prologue QueryType ValuesClause
;

UpdateUnit
    : Update
;

PrologueDecl
    : BaseDecl
| PrefixDecl
;

Prologue
    : %empty
| PrologueDecl Prologue
;

BaseDecl
    : 'BASE' 'IRIREF'
;

PrefixDecl
    : 'PREFIX' 'PNAME_NS' 'IRIREF'
    {
      if (!Parser.prefixes) Parser.prefixes = {};
      $2 = $2.slice(0, $2.length - 1);
      $3 = $3.slice(1, $3.length-1);
      Parser.prefixes[$2] = $3;
    }
;

DatasetClauseOptional
    : DatasetClause
| %empty
;

SelectQuery
    : SelectClause DatasetClauseOptional WhereClause SolutionModifier
;

SubSelect
    : SelectClause WhereClause SolutionModifier ValuesClause
;

DistinctOrReducedOptional
    : DistinctOptional
| 'REDUCED'
;

SelectVar
    : Var
| '(' Expression 'AS' Var ')'
;

SelectVars
    : SelectVar
| SelectVar SelectVars
;

SelectClause
    : 'SELECT' DistinctOrReducedOptional SelectVars
| 'SELECT' DistinctOrReducedOptional '*'
;

TriplesTemplateOptional
    : TriplesTemplate
| %empty
;

ConstructQuery
    : 'CONSTRUCT' ConstructTemplate DatasetClauseOptional WhereClause SolutionModifier
| 'CONSTRUCT' DatasetClauseOptional 'WHERE' '{' TriplesTemplateOptional '}' SolutionModifier
;

WhereClauseOptional
    : WhereClause
| %empty
;

VarsOrIris
    : VarOrIri
| VarOrIri VarsOrIris
;

DescribeQuery
    : 'DESCRIBE' VarsOrIris DatasetClauseOptional WhereClauseOptional SolutionModifier
| 'DESCRIBE' '*' DatasetClauseOptional WhereClauseOptional SolutionModifier
;

AskQuery
    : 'ASK' DatasetClauseOptional WhereClause SolutionModifier
;

DatasetClause
    : 'FROM' DefaultGraphClause
| 'FROM' NamedGraphClause
;

DefaultGraphClause
    : SourceSelector
;

NamedGraphClause
    : 'NAMED' SourceSelector
;

SourceSelector
    : iri
;

WhereClause
    : 'WHERE' GroupGraphPattern
| GroupGraphPattern
;

GroupClauseOptional
    : GroupClause
| %empty
;

HavingClauseOptional
    : HavingClause
| %empty
;

OrderClauseOptional
    : OrderClause
| %empty
;

LimitOffsetClausesOptional
    : LimitOffsetClauses
| %empty
;

SolutionModifier
    : GroupClauseOptional HavingClauseOptional OrderClauseOptional LimitOffsetClausesOptional
;

GroupConditions
    : GroupCondition
| GroupCondition GroupConditions
;

GroupClause
    : 'GROUP' 'BY' GroupConditions
;

GroupCondition
    : BuiltInCall
| FunctionCall
| '(' Expression ')'
| '(' Expression 'AS' Var ')'
| Var
;

HavingConditions
    : HavingCondition
| HavingCondition HavingConditions
;

HavingClause
    : 'HAVING' HavingConditions
;

HavingCondition
    : Constraint
;

OrderConditions
    : OrderCondition
| OrderCondition OrderConditions
;

OrderClause
    : 'ORDER' 'BY' OrderConditions
;

OrderCondition
    : 'ASC' BrackettedExpression
| 'DESC' BrackettedExpression
| Constraint
| Var
;

LimitOffsetClauses
    : LimitClause
| OffsetClause
| LimitClause OffsetClause
| OffsetClause LimitClause
;

LimitClause
    : 'LIMIT' 'INTEGER'
;

OffsetClause
    : 'OFFSET' 'INTEGER'
;

ValuesClause
    : %empty
| 'VALUES' DataBlock
;

Update
    : Prologue
| Prologue Update1
| Prologue Update1 ';' Update
;

Update1
    : Load
| Clear
| Drop
| Add
| Move
| Copy
| Create
| InsertData
| DeleteData
| DeleteWhere
| Modify
;

SilentOptional
    : 'SILENT'
| %empty
;

Load
    : 'LOAD' SilentOptional iri
| 'LOAD' SilentOptional iri 'INTO' GraphRef
;

Clear
    : 'CLEAR' SilentOptional GraphRefAll
;

Drop
    : 'DROP' SilentOptional GraphRefAll
;

Create
    : 'CREATE' SilentOptional GraphRef
;

Add
    : 'ADD' SilentOptional GraphOrDefault 'TO' GraphOrDefault
;

Move
    : 'MOVE' SilentOptional GraphOrDefault 'TO' GraphOrDefault
;

Copy
    : 'COPY' SilentOptional GraphOrDefault 'TO' GraphOrDefault
;

InsertData
    : 'INSERT' 'DATA' QuadData
;

DeleteData
    : 'DELETE' 'DATA' QuadData
;

DeleteWhere
    : 'DELETE' 'WHERE' QuadPattern
;

UsingClausesOptional
    : %empty
| UsingClause UsingClausesOptional
;

DeleteOrInsertClauses
    : DeleteClause
| InsertClause
| DeleteClause InsertClause
;

Modify
    : 'WITH' iri DeleteOrInsertClauses UsingClausesOptional 'WHERE' GroupGraphPattern
| DeleteOrInsertClauses UsingClausesOptional 'WHERE' GroupGraphPattern
;

DeleteClause
    : 'DELETE' QuadPattern
;

InsertClause
    : 'INSERT' QuadPattern
;

UsingClause
    : 'USING' iri
| 'USING' 'NAMED' iri
;

GraphOrDefault
    : 'DEFAULT'
| iri
| 'GRAPH' iri
;

GraphRef
    : 'GRAPH' iri
;

GraphRefAll
    : GraphRef
| 'DEFAULT'
| 'NAMED'
| 'ALL'
;

QuadPattern
    : '{' Quads '}'
;

QuadData
    : '{' Quads '}'
;

DotOptional
    : '.'
| %empty
;

QuadsOptional
    : %empty
| QuadsNotTriples DotOptional TriplesTemplateOptional QuadsOptional
;

Quads
    : TriplesTemplateOptional QuadsOptional
;

QuadsNotTriples
    : 'GRAPH' VarOrIri '{' TriplesTemplateOptional '}'
;

TriplesTemplate
    : TriplesSameSubject
| TriplesSameSubject '.' TriplesTemplateOptional
;

GroupGraphPattern
    : '{' SubSelect '}'
| '{' GroupGraphPatternSub '}'
;

TriplesBlockOptional
    : %empty
| TriplesBlock
;

GroupGraphPatternSubOptional
    : %empty
| GraphPatternNotTriples DotOptional TriplesBlockOptional GroupGraphPatternSubOptional
;

GroupGraphPatternSub
    : TriplesBlockOptional GroupGraphPatternSubOptional
;

TriplesBlock
    : TriplesSameSubjectPath
| TriplesSameSubjectPath '.' TriplesBlockOptional
;

GraphPatternNotTriples
    : GroupOrUnionGraphPattern
| OptionalGraphPattern
| MinusGraphPattern
| GraphGraphPattern
| ServiceGraphPattern
| Filter
| Bind
| InlineData
;

OptionalGraphPattern
    : 'OPTIONAL' GroupGraphPattern
;

GraphGraphPattern
    : 'GRAPH' VarOrIri GroupGraphPattern
;

ServiceGraphPattern
    : 'SERVICE' SilentOptional VarOrIri GroupGraphPattern
;

Bind
    : 'BIND' '(' Expression 'AS' Var ')'
;

InlineData
    : 'VALUES' DataBlock
;

DataBlock
    : InlineDataOneVar
| InlineDataFull
;

DataBlockValuesOptional
    : %empty
| DataBlockValue DataBlockValuesOptional
;

InlineDataOneVar
    : Var '{' DataBlockValuesOptional '}'
;

VarsOptional
    : %empty
| Var VarsOptional
;

NilOrDataBlockValuesOptional
    : %empty
| 'NIL' NilOrDataBlockValuesOptional
| '(' DataBlockValuesOptional ')' NilOrDataBlockValuesOptional
;

InlineDataFull
    : 'NIL' '{' NilOrDataBlockValuesOptional '}'
| '(' VarsOptional ')' '{' NilOrDataBlockValuesOptional '}'
;

DataBlockValue
    : iri
| RDFLiteral
| NumericLiteral
| BooleanLiteral
| 'UNDEF'
;

MinusGraphPattern
    : 'MINUS' GroupGraphPattern
;

GroupOrUnionGraphPattern
    : GroupGraphPattern
| GroupGraphPattern 'UNION' GroupOrUnionGraphPattern
;

Filter
    : 'FILTER' Constraint
;

Constraint
    : BrackettedExpression
| BuiltInCall
| FunctionCall
;

FunctionCall
    : iri ArgList
;

Expressions
    : Expression
| Expression ',' Expressions
;

ArgList
    : 'NIL'
| '(' 'DISTINCT' Expressions ')'
| '(' Expressions ')'
;

ExpressionList
    : 'NIL'
| '(' Expressions ')'
;

ConstructTriplesOptional
    : %empty
| ConstructTriples
;

ConstructTemplate
    : '{' ConstructTriplesOptional '}'
;

ConstructTriples
    : TriplesSameSubject
| TriplesSameSubject '.' ConstructTriplesOptional
;

TriplesSameSubject
    : VarOrTerm PropertyListNotEmpty { console.log("triple", $1, $2) }
| TriplesNode PropertyList
;

PropertyList
    : %empty
| PropertyListNotEmpty
;

PropertyListNotEmpty
    : Verb ObjectList
| Verb ObjectList ';'
| Verb ObjectList ';' PropertyListNotEmpty
;

Verb
    : VarOrIri
| 'a'
;

ObjectList
    : Object
| Object ',' ObjectList
;

Object
    : GraphNode
;

TriplesSameSubjectPath
    : VarOrTerm PropertyListPathNotEmpty { console.log("triple", $1, $2) }
| TriplesNodePath PropertyListPath
;

PropertyListPath
    : %empty
| PropertyListPathNotEmpty
;

VerbPathOrSimple
    : VerbPath
| VerbSimple
;

VerbPathObjectListOptional
    : %empty
| ';' VerbPathObjectListOptional
| ';' VerbPathOrSimple ObjectList VerbPathObjectListOptional
;

PropertyListPathNotEmpty
    : VerbPathOrSimple ObjectListPath VerbPathObjectListOptional
;

VerbPath
    : Path
;

VerbSimple
    : Var
;

ObjectListPath
    : ObjectPath
| ObjectPath ',' ObjectListPath
;

ObjectPath
    : GraphNodePath
;

Path
    : PathAlternative
;

PathAlternative
    : PathSequence
| PathSequence '|' PathAlternative
;

PathSequence
    : PathEltOrInverse
| PathEltOrInverse '/' PathSequence
;

PathElt
    : PathPrimary
| PathPrimary PathMod
;

PathEltOrInverse
    : PathElt
| '^' PathElt
;

PathMod
    : '?'
| '*'
| '+'
;

PathPrimary
    : iri
| 'a'
| '!' PathNegatedPropertySet
| '(' Path ')'
;

PathOneInPropertySets
    : PathOneInPropertySet
| PathOneInPropertySet '|' PathOneInPropertySets
;

PathNegatedPropertySet
    : PathOneInPropertySet
| '(' ')'
| '(' PathOneInPropertySets ')'
;

PathOneInPropertySet
    : iri
| 'a'
| '^' iri
| '^' 'a'
;

TriplesNode
    : Collection
| BlankNodePropertyList
;

BlankNodePropertyList
    : '[' PropertyListNotEmpty ']'
;

TriplesNodePath
    : CollectionPath
| BlankNodePropertyListPath
;

BlankNodePropertyListPath
    : '[' PropertyListPathNotEmpty ']'
;

GraphNodes
    : GraphNode
| GraphNode GraphNodes
;

Collection
    : '(' GraphNodes ')'
;

GraphNodePaths
    : GraphNodePath
| GraphNodePath GraphNodePaths
;

CollectionPath
    : '(' GraphNodePaths ')'
;

GraphNode
    : VarOrTerm
| TriplesNode
;

GraphNodePath
    : VarOrTerm
| TriplesNodePath
;

VarOrTerm
    : Var
| GraphTerm
;

VarOrIri
    : Var
| iri
;

Var
    : 'VAR1'
| 'VAR2'
;

GraphTerm
    : iri
| RDFLiteral
| NumericLiteral
| BooleanLiteral
| BlankNode
| 'NIL'
;

Expression
    : ConditionalOrExpression
;

ConditionalOrExpression
    : ConditionalAndExpression
| ConditionalAndExpression '||' ConditionalOrExpression
;

ConditionalAndExpression
    : ValueLogical
| ValueLogical '&&' ConditionalAndExpression
;

ValueLogical
    : RelationalExpression
;

ComparisonOp
    : '='
| '!='
| '<'
| '>'
| '<='
| '>='
;

ContainmentOp
    : 'IN'
| 'NOT' 'IN'
;

RelationalExpression
    : NumericExpression
| NumericExpression ComparisonOp NumericExpression
| NumericExpression ContainmentOp ExpressionList
;

NumericExpression
    : AdditiveExpression
;

MulOrDiv
    : '*' UnaryExpression
| '/' UnaryExpression
;

MulsOrDivsOptional
    : %empty
| MulOrDiv MulsOrDivsOptional
;

RhsAdditiveExpressionsOptional
    : %empty
| '+' MultiplicativeExpression RhsAdditiveExpressionsOptional
| '-' MultiplicativeExpression RhsAdditiveExpressionsOptional
| NumericLiteralPositive MulsOrDivsOptional RhsAdditiveExpressionsOptional
| NumericLiteralNegative MulsOrDivsOptional RhsAdditiveExpressionsOptional
;

AdditiveExpression
    : MultiplicativeExpression RhsAdditiveExpressionsOptional
;

MultiplicativeExpression
    : UnaryExpression MulsOrDivsOptional
;

UnaryExpression
    : '!' PrimaryExpression
| '+' PrimaryExpression
| '-' PrimaryExpression
| PrimaryExpression
;

PrimaryExpression
    : BrackettedExpression
| BuiltInCall
| iriOrFunction
| RDFLiteral
| NumericLiteral
| BooleanLiteral
| Var
;

BrackettedExpression
    : '(' Expression ')'
;

BuiltInCall
    : Aggregate
| 'STR' '(' Expression ')'
| 'LANG' '(' Expression ')'
| 'LANGMATCHES' '(' Expression ',' Expression ')'
| 'DATATYPE' '(' Expression ')'
| 'BOUND' '(' Var ')'
| 'IRI' '(' Expression ')'
| 'URI' '(' Expression ')'
| 'BNODE' 'NIL'
| 'BNODE' '(' Expression ')'
| 'RAND' 'NIL'
| 'ABS' '(' Expression ')'
| 'CEIL' '(' Expression ')'
| 'FLOOR' '(' Expression ')'
| 'ROUND' '(' Expression ')'
| 'CONCAT' ExpressionList
| SubstringExpression
| 'STRLEN' '(' Expression ')'
| StrReplaceExpression
| 'UCASE' '(' Expression ')'
| 'LCASE' '(' Expression ')'
| 'ENCODE_FOR_URI' '(' Expression ')'
| 'CONTAINS' '(' Expression ',' Expression ')'
| 'STRSTARTS' '(' Expression ',' Expression ')'
| 'STRENDS' '(' Expression ',' Expression ')'
| 'STRBEFORE' '(' Expression ',' Expression ')'
| 'STRAFTER' '(' Expression ',' Expression ')'
| 'YEAR' '(' Expression ')'
| 'MONTH' '(' Expression ')'
| 'DAY' '(' Expression ')'
| 'HOURS' '(' Expression ')'
| 'MINUTES' '(' Expression ')'
| 'SECONDS' '(' Expression ')'
| 'TIMEZONE' '(' Expression ')'
| 'TZ' '(' Expression ')'
| 'NOW' 'NIL'
| 'UUID' 'NIL'
| 'STRUUID' 'NIL'
| 'MD5' '(' Expression ')'
| 'SHA1' '(' Expression ')'
| 'SHA256' '(' Expression ')'
| 'SHA384' '(' Expression ')'
| 'SHA512' '(' Expression ')'
| 'COALESCE' ExpressionList
| 'IF' '(' Expression ',' Expression ',' Expression ')'
| 'STRLANG' '(' Expression ',' Expression ')'
| 'STRDT' '(' Expression ',' Expression ')'
| 'SAMETERM' '(' Expression ',' Expression ')'
| 'ISIRI' '(' Expression ')'
| 'ISURI' '(' Expression ')'
| 'ISBLANK' '(' Expression ')'
| 'ISLITERAL' '(' Expression ')'
| 'ISNUMERIC' '(' Expression ')'
| RegexExpression
| ExistsFunc
| NotExistsFunc
;

RegexExpression
    : 'REGEX' '(' Expression ',' Expression ')'
| 'REGEX' '(' Expression ',' Expression ',' Expression ')'
;

SubstringExpression
    : 'SUBSTR' '(' Expression ',' Expression ')'
| 'SUBSTR' '(' Expression ',' Expression ',' Expression ')'
;

StrReplaceExpression
    : 'REPLACE' '(' Expression ',' Expression ',' Expression ')'
| 'REPLACE' '(' Expression ',' Expression ',' Expression ',' Expression ')'
;

ExistsFunc
    : 'EXISTS' GroupGraphPattern
;

NotExistsFunc
    : 'NOT' 'EXISTS' GroupGraphPattern
;

DistinctOptional
    : 'DISTINCT'
| %empty
;

Aggregate
    : 'COUNT' '(' DistinctOptional Expression ')'
| 'COUNT' '(' DistinctOptional '*' ')'
| 'SUM' '(' DistinctOptional Expression ')'
| 'MIN' '(' DistinctOptional Expression ')'
| 'MAX' '(' DistinctOptional Expression ')'
| 'AVG' '(' DistinctOptional Expression ')'
| 'SAMPLE' '(' DistinctOptional Expression ')'
| 'GROUP_CONCAT' '(' DistinctOptional Expression ')'
| 'GROUP_CONCAT' '(' DistinctOptional Expression ';' 'SEPARATOR' '=' String ')'
;

iriOrFunction
    : iri
| iri ArgList
;

RDFLiteral
    : String
| String 'LANGTAG'
| String '^^' iri
;

NumericLiteral
    : NumericLiteralUnsigned
| NumericLiteralPositive
| NumericLiteralNegative
;

NumericLiteralUnsigned
    : 'INTEGER'
| 'DECIMAL'
| 'DOUBLE'
;

NumericLiteralPositive
    : 'INTEGER_POSITIVE'
| 'DECIMAL_POSITIVE'
| 'DOUBLE_POSITIVE'
;

NumericLiteralNegative
    : 'INTEGER_NEGATIVE'
| 'DECIMAL_NEGATIVE'
| 'DOUBLE_NEGATIVE'
;

BooleanLiteral
    : 'true'
| 'false'
;

String
    : 'STRING_LITERAL1'
| 'STRING_LITERAL2'
| 'STRING_LITERAL_LONG1'
| 'STRING_LITERAL_LONG2'
;

iri
    : 'IRIREF'
| PrefixedName
| 'PREFIX_LANGTAG' 'IRIREF'
| 'PREFIX_LANGTAG' PrefixedName
;

PrefixedName
    : 'PNAME_LN'
| 'PNAME_NS'
;

BlankNode
    : 'BLANK_NODE_LABEL'
| 'ANON'
;
