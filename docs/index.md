# tree-sitter-ulb — Documentation

A tree-sitter grammar for the `ulb` build DSL. This repository handles
*presentation* — highlighting, folding, indentation, and structure — for
editors. It deliberately does not evaluate anything; semantic analysis is
`Ulite-Team/ulb-lsp`, which uses the real `ulb-lang` AST.

## Documents

| Document | What it covers |
|---|---|
| [grammar.md](grammar.md) | The language spec this grammar mirrors (moved from the repo root; the source of truth for every rule in `grammar.js`) |
| [grammar-js.md](grammar-js.md) | `grammar.js` itself: rule-by-rule how the spec maps to tree-sitter |
| [scanner.md](scanner.md) | The external C scanner: why identifiers and reserved words are lexed in C, not in the generated lexer |
| [queries.md](queries.md) | Highlights, folds, and indents queries |
| [generated-files.md](generated-files.md) | What `tree-sitter generate` produces, what is committed, and the sync contract with the spec |
| [corpus.md](corpus.md) | The corpus test suite and what each file pins |
| [tooling.md](tooling.md) | Building, testing, and regenerating |

## The division of labor

| Concern | Repository |
|---|---|
| Language spec | `Ulite-Team/Uliab/docs/grammar.md` (canonical EBNF) |
| Presentation grammar | this repository (`tree-sitter-ulb`) |
| Semantic analysis, diagnostics, navigation | `Ulite-Team/ulb-lsp` |
| Evaluation and build | `Ulite-Team/Uliab` |

The grammar mirrors the spec one rule per non-terminal, so an editor
tree and an evaluator AST stay structurally comparable. Where a rule would
need GLR behavior the spec has none — no significant whitespace, no
precedence ambiguity — so a standard LALR tree-sitter grammar is
sufficient. Anything the spec could not say and this grammar had to decide
is called out in [grammar-js.md](grammar-js.md).
