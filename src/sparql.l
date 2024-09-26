
/* lexical grammar */
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
"{"                      return '{'
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
