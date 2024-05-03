# Clientside SPARQL-parser
This webpage parses SPARQL-inputs in the browser and makes text suggestions.

### Usage
To use the webpage, simply start a web server in this directory, e.g.
```$ python3 -m https.server```

### Background
This is the first little project in my Bachelor's project, 
supervised by Hannah Bast.

As a first step, I translated, modified and enhanced the SPARQL-parser, which 
I created for exercise sheet no. 12 of the Information Retrieval
lecture. Additionally, I added some syntax highlighting to the
output.

As a second step, I integrated the 
[SPARQL.js](https://github.com/RubenVerborgh/SPARQL.js/) parser as well as the 
[ad-freiburg/text-utils](https://github.com/ad-freiburg/text-utils) SPARQL-parser.