# Corpus tests

`test/corpus/` is the grammar's executable spec. Each file contains
`== name ==` cases: a source snippet, a separator, and the expected S-expr
tree. `tree-sitter test` runs them and reports any mismatch.

## Files and what they pin

| File | Coverage |
|---|---|
| `literals.txt` | Strings (escapes, interpolation, unterminated), numbers, booleans, comments |
| `statements.txt` | Path statements, blocks, pairs, assignments — the statement-dispatch matrix (§5.1) |
| `definitions.txt` | `convention NAME {}`, `fn NAME(…) {}`, `task "…" {}` |
| `control-flow.txt` | `if`/`else`, `else if` chains, conditions over expressions |
| `expressions.txt` | The full expression grammar: `||`, `&&`, `!`, comparisons, `@version`, calls, lists, groups, `member_access` |
| `error-recovery.txt` | Invalid programs and the ERROR subtrees they must produce |

## What the error cases pin

`error-recovery.txt` is the place where the grammar's decisions become
observable behavior. It pins, among others:

- a reserved word in a position where only an identifier is legal is an
  **ERROR** — `convention if { }`, `x else`, `x fn(y)`, `convention fn { }`
  (the scanner enforces this, see [scanner.md](scanner.md));
- an unterminated string or block produces a recoverable ERROR subtree
  rather than consuming the rest of the file;
- a missing value after a path or a misplaced `@` produces the expected
  partial tree, so an editor can keep highlighting the rest of the file.

These cases mirror the required diagnostics of `docs/grammar.md` §11, so
the corpus is where the LSP's "mid-edit source must stay useful" contract
is checked against the *other* parser too.

## Adding a case

1. Edit the right file (or add a new `== name ==` block).
2. Run `tree-sitter test` to see the actual tree.
3. Paste the actual tree into the expected section — after you have
   confirmed it is correct, not before.

The tests are round-trip fixtures: any change to `grammar.js` that alters
a tree shows up as a corpus diff, which is the review mechanism for the
grammar itself.
