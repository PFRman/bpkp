## Results of testing SPARQL.js and text-utils

> [!NOTE]  
> the grammar used by SPARQL.js and text-utils differs slightly, 
> as text-utils uses some qlever extensions (e.g. prefix langtags)

| Query                                              | SPARQL.js | text-utils |
|:---------------------------------------------------|:----------|:-----------|
| https://qlever.cs.uni-freiburg.de/wikidata/9Srzzy  | 12 ms     | 262 ms     |
| https://qlever.cs.uni-freiburg.de/wikidata/YY7A8s  | 15 ms     | 257 ms     |
| https://qlever.cs.uni-freiburg.de/wikidata/IHVipz  | 78 ms     | 539 ms     |

## List of parser generators applicable in JS

| Parser Generator | Languages                 | has lexer          |
|------------------|---------------------------|--------------------|
| **Jison**        | LALR(1)                   | yes (kind of flex) |
| **ANTLR4**       | LL(*)                     | yes                |
| **nearly**       | all context-free grammars | moo                |
| **chevrotrain**  | LL(k)                     | yes                |

https://tomassetti.me/parsing-in-javascript/

## List of lexers applicable in JS

| Lexer           | maximal-munch         |
|-----------------|-----------------------|
| **Jison lexer** | yes (`%options flex`) |
| **ANTLR4**      | yes                   |
| **moo**         | no                    |
| **chevrotrain** | no                    |

