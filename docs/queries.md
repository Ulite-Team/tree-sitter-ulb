# Queries

Three `.scm` files under `queries/` give editors presentation semantics on
top of the parse tree. They are referenced from `tree-sitter.json`
(`highlights`, `folds`, `indents`).

## `highlights.scm`

Color semantics, with one ordering rule that matters: **later patterns
win over earlier ones**, so the generic `identifier` fallback comes first
and positional rules override it.

| Pattern | Capture |
|---|---|
| `(string)` `(number)` `(boolean)` `(comment)` | `@string` `@number` `@boolean` `@comment` |
| `(identifier)` | `@variable` (fallback) |
| operators `&& \|\| ! == != < <= > >= @` | `@operator` |
| `{ } ( ) [ ]` | `@punctuation.bracket` |
| `, . =` | `@punctuation.delimiter` |
| `if` `else` | `@keyword.control` |
| `convention` `fn` `task` `apply` | `@keyword.function` |
| `fn_def` name | `@function` |
| `convention_def` name | `@type` |
| `call` callee | `@function.call`; builtins `env props ver copy exec` → `@function.builtin` |
| `member_access` members | `@property` (the `props("…").key` case, §5.2) |
| `named_argument` name | `@variable.parameter` (`exec(command="…")`) |
| `block_statement` path | `@type` (the *section* role: `android {}`, `deps {}`) |
| `pair_statement` path | `@property` (the *config key* role: `compileSdk 37`, `implementation "g:a:v"`) |
| `assignment` path | `@constant` (the *catalog alias* role: `appcompat = "androidx…"`) |
| `${` `}` | `@punctuation.special` |

The contextual-identifier rules are the ones that make the DSL readable:
`android` inside `android { }` is a `@type`, `compileSdk` leading a
`pair_statement` is a `@property`, and the same token never gets both.

## `folds.scm`

```scheme
(block) @fold
(list) @fold
(arguments) @fold
(block_comment) @fold
```

Everything that is structurally a region folds: `{}` blocks (including
`convention`/`fn`/`task` bodies), `[]` lists, call argument lists, and
block comments. Pair/assignment statements do not fold.

## `indents.scm`

```scheme
"{" @indent
"}" @outdent
"[" @indent
"]" @outdent
```

Indent the body of every `{}` block and every `[]` list; outdent the
closing token back to the opener's level. There is no other bracket
structure that needs indenting — call argument lists stay on one line per
the style the DSL's worked example uses.
