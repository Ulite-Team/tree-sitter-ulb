; Highlights for the ulb build DSL.
;
; GRAMMAR.md §4: reserved words are keyword tokens, contextual identifiers
; are plain `identifier` nodes. The contextual ones get their role from
; their position in the tree — the path leading a `block_statement` is a
; section, the path leading a `pair_statement` is a config key, the target
; of an `assignment` is a catalog alias. Order matters: later patterns win
; over earlier ones, so the generic `identifier` fallback comes first and
; the positional rules override it.

; --- literals and comments -------------------------------------------

(string) @string
(number) @number
(boolean) @boolean
(comment) @comment

; --- identifiers (fallback; positional rules below override) ---------

(identifier) @variable

; --- operators and punctuation ---------------------------------------

"&&" @operator
"||" @operator
"!" @operator
"==" @operator
"!=" @operator
"<" @operator
"<=" @operator
">" @operator
">=" @operator
"@" @operator

"{" @punctuation.bracket
"}" @punctuation.bracket
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"," @punctuation.delimiter
"." @punctuation.delimiter
"=" @punctuation.delimiter

; --- keywords ----------------------------------------------------------

"if" @keyword.control
"else" @keyword.control
"convention" @keyword.function
"fn" @keyword.function
"task" @keyword.function
"apply" @keyword.function

; --- definitions -------------------------------------------------------

(fn_def name: (identifier) @function)
(convention_def name: (identifier) @type)

; --- calls -------------------------------------------------------------

; The callee is the first child of `call`; the anchor keeps argument
; identifiers out of the capture.
(call . (identifier) @function.call)
((call . (identifier) @function.builtin)
  (#match? @function.builtin "^(env|props|ver|copy|exec)$"))

; `props("path").key` member segments (GRAMMAR.md §5.2).
(member_access "." (identifier) @property)

; `exec(command="...", args=[...])` named-argument names.
(named_argument . (identifier) @variable.parameter)

; --- contextual identifiers by position (GRAMMAR.md §4) ---------------

; Block targets: `android {}`, `<sourceSet>.deps {}`, `versions {}`, ...
(block_statement (path (identifier) @type))
; Config keys and deps scope names: `compileSdk 37`, `implementation "g:a:v"`.
(pair_statement (path (identifier) @property))
; `libs.ulb` aliases: `appcompat = "androidx..."`, `coreVersion = "1.2.3"`.
(assignment (path (identifier) @constant))

; --- interpolation -----------------------------------------------------

(interpolation "${" @punctuation.special "}" @punctuation.special)
