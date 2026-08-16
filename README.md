# tree-sitter-ulb

A tree-sitter grammar for the `ulb` build DSL. Handles presentation —
highlighting, folding, indentation — for editors.

This grammar mirrors the language spec ([`Uliab/docs/grammar.md`](https://github.com/Ulite-Team/Uliab) in the Uliab repository)
one rule per non-terminal, so an editor tree and the evaluator's AST stay
structurally comparable. Semantic analysis, diagnostics, and navigation
are handled by [`Ulite-Team/ulb-lsp`](https://github.com/Ulite-Team/ulb-lsp),
which uses the real `ulb-lang` parser; this repo deliberately does not
evaluate anything.

## Repository layout

```
grammar.js           The grammar (hand-written; source of truth for syntax)
src/scanner.c        External C scanner for identifiers + reserved words
src/                 Generated: parser.c, grammar.json, node-types.json, tree_sitter/
queries/             highlights.scm, folds.scm, indents.scm
test/corpus/         The grammar's executable spec
docs/                Documentation, including the language spec (grammar.md)
```

## Quick start

```sh
npm install
npm run generate     # regenerate src/parser.c from grammar.js
npm test             # corpus tests
npm run parse < file.ulb
```

Requires Node/npm and a C toolchain. The `tree-sitter` CLI is a
devDependency.

## Key design points

- **Reserved words cannot be identifiers.** The generated lexer only
  recognizes a keyword where the grammar expects one; `src/scanner.c`
  lexes identifiers and the seven reserved words in every parse state, so
  `x else` and `convention if { }` are parse errors, not named nodes.
- **Comments are extras with negative precedence**, so `//` and `/*`
  inside a string lex as string content rather than opening a comment.
- **Statement dispatch follows the spec (§5.1)**: an identifier-led
  statement is read as a `path`, then decided by the next token — `{`,
  `=`, `(`, or a value.
- **Contextual identifiers** (`android`, `compileSdk`, `implementation`,
  …) are plain `identifier` nodes; their role comes from position via
  `queries/highlights.scm`.

## Documentation

Everything lives in [`docs/`](docs/index.md): the
[language spec](docs/grammar.md), [`grammar.js` explained](docs/grammar-js.md),
the [external scanner](docs/scanner.md), [queries](docs/queries.md),
[generated files and the sync contract](docs/generated-files.md),
the [corpus suite](docs/corpus.md), and [tooling](docs/tooling.md).

## License

GPL-3.0. See `LICENSE`.
