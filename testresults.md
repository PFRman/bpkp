## Results of testing the parsers

> [!NOTE]  
> the grammar used by SPARQL.js and text-utils differs slightly, 
> as text-utils uses some qlever extensions (e.g. prefix langtags)

| Query                                              | SPARQL.js | text-utils |
|:---------------------------------------------------|:----------|:-----------|
| https://qlever.cs.uni-freiburg.de/wikidata/9Srzzy  | 12 ms     | 262 ms     |
| https://qlever.cs.uni-freiburg.de/wikidata/YY7A8s  | 15 ms     | 257 ms     |
| https://qlever.cs.uni-freiburg.de/wikidata/IHVipz  | 78 ms     | 539 ms     |