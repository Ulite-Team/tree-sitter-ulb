/**
 * tree-sitter grammar for the ulb build DSL.
 *
 * Mirrors GRAMMAR.md §5 (EBNF) one rule per non-terminal, per the
 * portability notes in GRAMMAR.md §8. Statement dispatch follows §5.1:
 * every IDENT-starting statement is read as a `path` first, then decided
 * by the next token (`{` block, `=` assignment, `(` call, else pair).
 * Reserved words (§4) are anonymous tokens so they can never parse as
 * identifiers; contextual identifiers stay plain `identifier` nodes and
 * get their role from `highlights.scm`.
 */

module.exports = grammar({
  name: 'ulb',

  // Comments are extras (allowed between any two tokens), but with a
  // negative precedence so a `//` or `/*` sequence *inside* a string
  // lexes as string content instead: at an adjacent position the
  // single-character `_string_fragment` (precedence 0) beats the longer
  // comment token, while the `${` interpolation opener still wins over a
  // lone `$` fragment on longest match. Outside strings nothing competes,
  // so comments lex normally.
  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  // Reserved words (§4) and `identifier` are lexed by `src/scanner.c`.
  // The scanner always returns the keyword token for a reserved word, in
  // every parse state, so a reserved word can never silently lex as an
  // identifier: in any position where the keyword is not expected, the
  // parser reports a parse error instead. `true`/`false` stay usable as
  // boolean literals because the `boolean` rule expects those keywords.
  externals: ($) => [
    $.identifier,
    'if',
    'else',
    'true',
    'false',
    'convention',
    'fn',
    'task',
    'apply',
  ],

  rules: {
    source_file: ($) => repeat($.statement),

    statement: ($) =>
      choice(
        $.if_statement,
        $.def_statement,
        $.apply_statement,
        $.call_statement,
        $.block_statement,
        $.assignment,
        $.pair_statement,
      ),

    // -- control flow ------------------------------------------------

    if_statement: ($) =>
      seq(
        'if',
        field('condition', $._expression),
        field('consequence', $.block),
        optional(
          seq(
            'else',
            field('alternative', choice($.block, $.if_statement)),
          ),
        ),
      ),

    // -- blocks ------------------------------------------------------

    block_statement: ($) => seq($.path, $.block),

    path: ($) => seq($.identifier, repeat(seq('.', $.identifier))),

    block: ($) => seq('{', repeat($.statement), '}'),

    // -- definitions -------------------------------------------------

    def_statement: ($) => choice($.convention_def, $.fn_def, $.task_def),

    convention_def: ($) =>
      seq('convention', field('name', $.identifier), $.block),

    fn_def: ($) =>
      seq(
        'fn',
        field('name', $.identifier),
        '(',
        optional(seq($.identifier, repeat(seq(',', $.identifier)))),
        ')',
        $.block,
      ),

    task_def: ($) => seq('task', $.string, $.block),

    // -- application -------------------------------------------------

    apply_statement: ($) => seq('apply', $.string),

    // -- assignment and pair -----------------------------------------

    assignment: ($) => seq($.path, '=', $._expression),

    pair_statement: ($) => seq($.path, $._expression),

    // -- call --------------------------------------------------------

    // `IDENT (` after a single-segment path is a call, never a pair whose
    // value happens to be a call/group; GRAMMAR.md §5.1 dispatches the
    // same way. The precedence bump on `call` resolves that overlap both
    // at statement level (call_statement vs pair_statement) and inside
    // expressions (call vs a bare `path`).
    call_statement: ($) => $.call,

    call: ($) => prec(2, seq($.identifier, $.arguments)),

    arguments: ($) =>
      seq('(', optional(seq($._argument, repeat(seq(',', $._argument)))), ')'),

    _argument: ($) => choice($.named_argument, $._expression),

    named_argument: ($) => seq($.identifier, '=', $._expression),

    // `props("path").key` — the only legal member access (GRAMMAR.md
    // §5.2). Requires at least one member so a bare call stays a `call`.
    member_access: ($) => seq($.call, repeat1(seq('.', $.identifier))),

    // -- expressions -------------------------------------------------

    _expression: ($) =>
      seq(
        $._or_expression,
        optional(seq('@', field('version', choice($.string, $.identifier)))),
      ),

    _or_expression: ($) =>
      prec.left(2, seq($._and_expression, repeat(seq('||', $._and_expression)))),

    _and_expression: ($) =>
      prec.left(1, seq($._not_expression, repeat(seq('&&', $._not_expression)))),

    _not_expression: ($) => choice(seq('!', $._not_expression), $._comparison),

    _comparison: ($) =>
      seq($.primary, optional(seq($._compare_operator, $.primary))),

    _compare_operator: ($) => choice('==', '!=', '<', '<=', '>', '>='),

    primary: ($) =>
      choice(
        $.string,
        $.number,
        $.boolean,
        $.path,
        $.call,
        $.member_access,
        $.list,
        $.group,
      ),

    list: ($) =>
      seq('[', optional(seq($._expression, repeat(seq(',', $._expression)))), ']'),

    group: ($) => seq('(', $._expression, ')'),

    // -- literals ----------------------------------------------------

    string: ($) =>
      seq('"', repeat(choice($._string_fragment, $.interpolation)), '"'),

    _string_fragment: ($) =>
      token.immediate(choice(/[^"\\\n]/, /\\["\\nrt]/)),

    interpolation: ($) => seq('${', field('value', $._expression), '}'),

    number: ($) => token(/[0-9]+(?:\.[0-9]+)?/),

    boolean: ($) => choice('true', 'false'),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // -- comments ----------------------------------------------------

    comment: ($) => choice($.line_comment, $.block_comment),

    line_comment: ($) => token(prec(-1, seq('//', /[^\n]*/))),

    block_comment: ($) =>
      token(prec(-1, seq('/*', /[^*]*\*+(?:[^/*][^*]*\*+)*\//))),
  },
});
