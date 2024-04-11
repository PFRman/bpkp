const keywords = ["select", "where", "filter", "prefix", "distinct", "order", "by", "desc", "limit"];
const triplePattern =
    new RegExp('\\s?(\\?[^\\s]+|[^\\s]+)\\s+([^\\s]+)\\s+(\\?[^\\s]+|[^\\s]+)');

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
            const tripleTexts = whereText.split(".");
            let triples = []
            for (let tripleText of tripleTexts) {
                let m = tripleText.match(triplePattern);
                const subj = m[1].trim();
                const pred = m[2].trim();
                const obj = m[3].trim();
                triples.push([subj, pred, obj]);
            }

            document.querySelector("#triples").innerHTML = triples.join(`<br>`);

            // Find the (optional) LIMIT clause.
            const limit = sparqlInput.match(/limit\s(?<limit>\d+)\b/)?.groups.limit;
            document.querySelector(`#limit`).innerHTML = (limit ? `Limit: ${limit}` : "");

            // create on object of variable occurrences and a list of non-variable occurrences
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