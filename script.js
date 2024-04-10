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
            document.querySelector(`#limit`).innerHTML = (limit ? `Limit: `+ limit : "");
            /*
            occurrences = dict([(v, []) for v in variables])
            non_vars = []
            for t, (subj, pred, obj) in enumerate(triples):
            if subj in occurrences:
            occurrences[subj].append(f't{t}.subject')
            elif subj.startswith("?"):
            occurrences[subj] = [f't{t}.subject']
        else:
            non_vars.append(f't{t}.subject="{subj}"')
            if obj in occurrences:
            occurrences[obj].append(f't{t}.object')
            elif obj.startswith("?"):
            occurrences[obj] = [f't{t}.object']
        else:
            non_vars.append(f't{t}.object="{obj}"')
            non_vars.append(f't{t}.predicate="{pred}"')

            select = [occurrences[v][0] for v in variables]
            tables = [f"wikidata AS t{t}" for t in range(len(triples))]
            conditions = non_vars + [v[0] + "=" + o
            for v in occurrences.values()
                for o in v[1:]]
            cnl = ',\n'
            nla = '\nAND '
            sql = (f'SELECT {", ".join(select)}\n'
            f'FROM {cnl.join(tables)}\n'
            f'WHERE {nla.join(conditions)}'
            f'{" LIMIT " + limit if limit else ""};')*/
        })
}