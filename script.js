const keywords = ["select", "where", "filter", "prefix", "distinct", "order", "by", "desc", "limit", "offset"];
const triplePattern =
    // new RegExp('\\s?(\\?\\S+|\\S+)\\s+(\\S+)\\s+(\\?\\S+|\\S+)');
    new RegExp(/(?<subj>\S+)\s+(?<pred>\S+)\s+(?<obj>\S+)\s+\./g);
    // todo how to deal with spaces in strings in the triples?

function documentReady() {
    document.querySelector("#query-input").addEventListener("input",
        function () {
            const sparqlInput = document.querySelector("#query-input").value;
            const sparqlLower = sparqlInput.toLowerCase();
            let sparqlOutput = sparqlLower;

            // string Syntax highlighting
            sparqlOutput = sparqlOutput.replaceAll(/"\w*"/g, `<span class="string">$&</span>`)

            // keyword syntax highlighting
            for (let keyword of keywords) {
                sparqlOutput = sparqlOutput.replaceAll(keyword,
                    `<span class="keyword">${keyword.toUpperCase()}</span>`);
            }

            // variable syntax highlighting
            sparqlOutput = sparqlOutput.replaceAll(/\?\w*/g, `<span class="variable">$&</span>`);

            // auto indentation
            // sparqlOutput = sparqlOutput.replaceAll(/{\n/g, `$&&nbsp;` + "");

            // replace \n with <br>
            sparqlOutput = sparqlOutput.replaceAll(/\n/g, `<br />`);

            document.querySelector("#text").innerHTML = sparqlOutput;

            // Find all variables in the SPARQL between the SELECT and WHERE clause.
            const select_start = sparqlLower.search(/select\s/    );
            const select_end = sparqlLower.search(/\swhere/);
            const variables = sparqlInput.slice(select_start + 7, select_end).split(" ");

            document.querySelector("#variables").innerHTML = variables.toString()
                .replaceAll(/\?\w*/g, `<span class="variable">$&</span>`);

            // Find all triples between "WHERE {" and "}"
            const whereStart = sparqlLower.search("{") + 1;
            const whereEnd = sparqlLower.search("}");
            const whereText = sparqlInput.slice(whereStart, whereEnd);
            const triples = [...whereText.matchAll(triplePattern)]
                .map(m => [m.groups.subj, m.groups.pred, m.groups.obj]);
            document.querySelector("#triples").innerHTML = triples.join(`<br>`);

            // Find the (optional) filter condition
            const filter = sparqlLower.match(/filter\s\((?<filter>.+)\)/)?.groups.filter;
            document.querySelector(`#filter`).innerHTML = (filter ? `Filter: ${filter}` : "");

            // Find the (optional) LIMIT clause.
            const limit = sparqlInput.match(/limit\s(?<limit>\d+)\b/)?.groups.limit;
            document.querySelector(`#limit`).innerHTML = (limit ? `Limit: ${limit}` : "");

            // Find the (optional) OFFSET clause.
            const offset = sparqlInput.match(/offset\s(?<offset>\d+)\b/)?.groups.offset;
            document.querySelector(`#offset`).innerHTML = (offset ? `Offset: ${offset}` : "");

            // Create an object with the variable occurrences and a list of non-variable occurrences
            let occurrences = Object.fromEntries(variables.map(k => [k, []]));
            let nonVars = [];
            for (let [t,[subj, pred, obj]] of triples.entries()) {
                if (subj in occurrences) occurrences[subj].push(`t${t}.subject`);
                else if (subj.charAt(0) === `?`) occurrences[subj] = [`t${t}.subject`];
                else nonVars.push(`t${t}.subject="${subj}"`);

                if (pred in occurrences) occurrences[pred].push(`t${t}.predicate`);
                else if (pred.charAt(0) === `?`) occurrences[pred] = [`t${t}.pred`];
                else nonVars.push(`t${t}.object="${pred}"`);

                if (obj in occurrences) occurrences[obj].push(`t${t}.object`);
                else if (obj.charAt(0) === `?`) occurrences[obj] = [`t${t}.object`];
                else nonVars.push(`t${t}.object="${obj}"`);
            }

            document.querySelector("#vocc").innerHTML = occurrences.toString();
            document.querySelector("#nvocc").innerHTML = nonVars.toString();
        }
    )
}