# The external scanner

`src/scanner.c` is the one piece of C in the grammar. It lexes
`identifier` and the reserved words (`if else true false convention fn
task apply`), which lets the grammar enforce one spec rule that a pure
generated lexer cannot.

## Why the scanner exists

The generated lexer only consults a keyword token in parse states where
the grammar rules make that keyword valid. Everywhere else, the same text
would fall back to the `identifier` regex and parse as a plain name.

The spec says the opposite (docs/grammar.md §4): a reserved word **cannot
appear as IDENT — error if used as one**. So `x fn(y)` must be a parse
error, not a call named `fn`. The scanner returns the keyword token for a
reserved word in *every* parse state, unconditionally; in any position
where the keyword is not expected, the parser reports an error instead of
silently accepting an identifier. `true`/`false` stay usable as boolean
literals because the `boolean` rule expects those keywords.

## How it plugs in

- `grammar.js` declares `externals: [$.identifier, 'if', 'else', 'true',
  'false', 'convention', 'fn', 'task', 'apply']`.
- The `TokenType` enum in `scanner.c` **must match that array order**
  exactly — the comment at the top of the file says so, and a mismatch
  silently mislabels tokens.
- The scanner is stateless: `create`/`destroy`/`reset`/`serialize`/
  `deserialize` are all empty, and `scan` never uses `valid_symbols`.

## Lexing rules

`scan_word` runs **before** the runtime skips whitespace and comments, so
it skips extras itself (matching the internal lexer) before reading the
word:

1. `skip_extras` — whitespace, then `//` line comments and `/* … */`
   block comments. If the scanner gives up after skipping, the runtime
   rewinds the lexer to the pre-skip position, so nothing is lost.
2. If the next char is not `[a-zA-Z_]`, return `false` (the generated
   lexer handles it).
3. Read the word (`[a-zA-Z_][a-zA-Z0-9_]*`), then classify it: exact
   match against the keyword table → keyword token; otherwise
   `IDENTIFIER`.

The word buffer is fixed at 15 bytes + NUL; a longer identifier is still
lexed correctly because classification only needs the keyword table
lookup, and no keyword is longer than the buffer.

## Behavior notes

- **Keywords are not contextual.** `android`, `versions`, `implementation`
  are not reserved and lex as plain identifiers; their role comes from
  position via `highlights.scm` (§4 contextual identifiers). Only the
  seven reserved words are keyword tokens.
- **An identifier named `if` anywhere is an error**, including `convention
  if { }` and `x else` — both pinned in the corpus
  (`test/corpus/error-recovery.txt`).
- The scanner never allocates and never fails, so it adds no measurable
  cost to parsing.
