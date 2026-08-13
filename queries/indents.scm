; Indent the body of every `{}` block and every `[]` list; outdent the
; closing token back to the opener's level. ulb has no other bracket
; structures that need indenting (call argument lists stay on one line).

"{" @indent
"}" @outdent
"[" @indent
"]" @outdent
