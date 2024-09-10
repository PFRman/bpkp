# Autocompletion for SPARQL-queries
This webpage makes text suggestions for SPARQL-queries.

## Usage
To use the webpage, simply start a web server in this directory, e.g.
```$ python3 -m http.server```

You can also containerize the app and let [docker](https://www.docker.com/) do it: <br>
```bash
$ docker build -t bpkp .
$ docker run -d -p 8000:8000 --rm --name bpkp bpkp
```
## Features 
While typing a SPARQL-query, two types of suggestions are given beneath the input field:

In the left column, there are grammar-derived suggestions for the next token. One example:
when the grammar allows a variable next, all variables from the input
so far are suggested (and filtered by the already typed prefix). The first suggestion 
can be inserted by pressing Tab.

In the right column, context-sensitive suggestions for triple creation are given.
They analyze the previously typed context and pose a query to 
[Qlever](https://qlever.cs.uni-freiburg.de/) in order to suggest fitting entities.

## How it works
### 1. Recognize cursor position
In order to give helpful suggestions, one needs to distinguish between the prefix of the actual query and 
the prefix of the currently seeked token. This separating position is either the position of the lexing error, 
or the last whitespace (or, more generally, word boundary). To gather the syntactic and semantic context,
only the part until the separating position is used and then filtered by the typed prefix.

### 2. Next token suggestion
The parsing table (which tells the parser what to do next) holds the information on which tokens 
can come up next. This works similar to generating the list of expected tokens in parsing errors, but including 
more general tokens (this means: not just terminal tokens). Besides that, this token list can be 
gathered for any cursor position and also from a successfully parsed query.
From these tokens, the concrete suggestions can be derived.

This feature is based on a [Jison](https://gerhobbelt.github.io/jison/about/)-generated parser.

### 3. Context-sensitive suggestions
By analyzing the parse tree of the (uncompleted) query, the required context can be extracted. 
This includes "connected" triples and a potential subject and predicate of an uncompleted triple.

This feature uses the [tree-sitter](https://tree-sitter.github.io/)-parser.