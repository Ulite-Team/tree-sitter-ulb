# Tooling

Everything you need to work on the grammar.

## Requirements

- Node.js + npm (for the tree-sitter CLI and the JS binding).
- A C toolchain for `tree-sitter build` (parser.c is C).

## Commands

```sh
npm install            # pulls tree-sitter-cli (devDependency)
npm run generate       # tree-sitter generate → src/parser.c, grammar.json, node-types.json
npm test               # tree-sitter test → corpus suite
npm run parse          # tree-sitter parse — parse stdin/file, print the tree
npm run build          # generate + build the native binding
```

The package.json `scripts` block is the canonical list; `generate` must
run before `test` after any `grammar.js`/`scanner.c` change, because the
corpus tests run against the compiled parser.

## Editing loop

1. Edit `grammar.js` and/or `src/scanner.c`.
2. `npm run generate`.
3. `npm test` — expect to see corpus diffs for the rules you touched;
   update the expected trees only after confirming they are correct
   (see [corpus.md](corpus.md)).
4. `npm run parse` on a real `.ulb` file to eyeball the tree.
5. Commit `grammar.js`, `scanner.c`, and the regenerated `src/` together.

## Testing a query change

Highlight/fold/indent queries are `.scm` files; `tree-sitter test` does
not cover them. To validate:

- for highlights, run `tree-sitter highlight <file.ulb>` (colorizes via
  the queries) or open the file in an editor with the grammar installed;
- for folds/indents, `tree-sitter build` and check the editor behavior.

The `queries/` files are intentionally small and the query logic is
documented in [queries.md](queries.md).

## Regenerating vs drift

`src/grammar.json` and `src/node-types.json` are committed outputs. If a
commit touches `grammar.js` but not `src/parser.c`, that is a signal the
generated files were left stale — the sync contract in
[generated-files.md](generated-files.md) is that they always move
together.
