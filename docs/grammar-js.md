# `grammar.js`

`grammar.js` is the only file you edit by hand for syntax. It mirrors
`docs/grammar.md` §5 (EBNF) one rule per non-terminal, following the
portability notes in §8. The generated `src/parser.c` is never edited
directly — see [generated-files.md](generated-files.md).

## Grammar-level decisions

- **`name: 'ulb'`** — the tree-sitter language id; `tree-sitter.json`
  carries the presentation metadata (`scope: source.ulb`, `file-types:
  ["ulb"]`).
- **Comments as extras** (`extras: [/\s/, $.comment]`), allowed between any
  two tokens — except a comment token has *negative* precedence, so a
  `//` or `/*` sequence inside a string lexes as string content. This is
  the mechanism behind the "comments cannot start inside a string" rule:
  at an adjacent position the single-character `_string_fragment`
  (precedence 0) beats the longer comment token, while `${` still wins
  over a lone `$` fragment on longest match. Outside strings nothing
  competes, so comments lex normally.
- **`word: $.identifier`** — tree-sitter's word token, used for
  keyword-completion features in editors.
- **Reserved words are external and anonymous** (see
  [scanner.md](scanner.md)): `if`, `else`, `true`, `false`, `convention`,
  `fn`, `task`, `apply` plus the `identifier` external. They never appear
  as `identifier` nodes, so `grammar.js` writes them as anonymous string
  tokens (`'if'`, `'convention'`, …) and they are not named node types.

## Statement dispatch (§5.1)

`statement` is a `choice` of seven productions. The interesting overlap
is the **path-led** ones: `block_statement` (`path { … }`),
`assignment` (`path = value`), `pair_statement` (`path value`), and
`call_statement` (`IDENT (… )`). Dispatch happens the way the spec says:
an IDENT-starting statement is read as a `path` first, then decided by the
next token — `{`, `=`, `(`, or a value. Two precedence notes:

- `call` carries `prec(2)` so `IDENT (` is a call, never a pair whose
  value happens to be a group/call. This resolves the overlap both at
  statement level (`call_statement` vs `pair_statement`) and inside
  expressions (`call` vs a bare `path`).
- `if` is its own production (`if_statement`) and never participates in
  path dispatch.

## Rule map

| Spec (docs/grammar.md) | `grammar.js` rule |
|---|---|
| `source_file` | `repeat($.statement)` |
| `if/else` (only control flow) | `if_statement`, with optional `else` → `block` or nested `if_statement` |
| `block` | `seq('{', repeat($.statement), '}')` |
| `path` | `seq($.identifier, repeat(seq('.', $.identifier)))` |
| `convention NAME { }` | `convention_def`, `name` field |
| `fn NAME(ids) { }` | `fn_def`, `name` field, optional comma-separated params |
| `task "name" { }` | `task_def` — target is a **string**, matching the spec |
| `apply "name"` | `apply_statement` — target is a string, not an identifier |
| `path = expr` | `assignment` |
| `path expr` | `pair_statement` |
| `IDENT(args)` | `call_statement` → `call` |
| `props("…").key` | `member_access` — requires `call` + at least one `.member`, so a bare call stays a `call` |
| expression tree | `_expression` → `@version`, `||`, `&&`, `!`, comparisons, `primary` |
| literals | `string` (with `${…}` `interpolation`), `number`, `boolean`, `list`, `group` |
| comments | `line_comment`, `block_comment` |

## Strings

```javascript
string: seq('"', repeat(choice($._string_fragment, $.interpolation)), '"')
_string_fragment: token.immediate(choice(/[^"\\\n]/, /\\["\\nrt]/))
```

- `_string_fragment` is `token.immediate`, so no whitespace is consumed
  before the fragment — the whole string is lexed atomically.
- Fragments cover escaped `"`, `\\`, `\n`, `\r`, and `\t`; an unescaped
  newline ends the token (unterminated string → ERROR, pinned by corpus).
- `${…}` interpolation is a `$` token plus an expression, which is why the
  negative-precedence comment extra (above) cannot collide with it.
- The emitted nodes are `string` and `interpolation`; the fragments
  themselves are anonymous (that is the tree-sitter-idiomatic way to
  keep strings highlightable without a full token stream).

## Definition rules that differ from a "normal" language grammar

- `task_def` and `apply_statement` take `$.string` targets, not
  identifiers — the spec names tasks and conventions with string
  literals.
- `convention_def`/`fn_def` use `field('name', …)` so queries can anchor
  on the name (`highlights.scm` colors `convention` names as `@type` and
  `fn` names as `@function`).
- `fn_def` has no return type, per the spec.
