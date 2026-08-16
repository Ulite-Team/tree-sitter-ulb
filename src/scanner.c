/*
 * External scanner for the ulb grammar.
 *
 * Identifiers and the reserved words (`if else true false convention fn
 * task apply`, docs/grammar.md §4) are lexed here instead of by the generated
 * lexer so that a reserved word is recognized in *every* parse state.
 * The generated lexer only consults a keyword token in states where the
 * grammar rules make that keyword valid; anywhere else the same text
 * would fall back to the identifier regex and parse as a plain name.
 * Returning the keyword token unconditionally turns such a use into a
 * parse error, which is what docs/grammar.md §4 requires ("cannot appear as
 * IDENT; error if used as one").
 *
 * The scanner is invoked once per token position, *before* the runtime
 * skips whitespace and comments, so it skips those extras itself
 * (matching the internal lexer's behavior) before reading the word.
 *
 * The `TokenType` enum order must match the `externals` array order in
 * grammar.js.
 */

#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

enum TokenType {
  IDENTIFIER,
  IF,
  ELSE,
  TRUE,
  FALSE,
  CONVENTION,
  FN,
  TASK,
  APPLY,
};

void *tree_sitter_ulb_external_scanner_create(void) { return NULL; }

void tree_sitter_ulb_external_scanner_destroy(void *payload) {}

void tree_sitter_ulb_external_scanner_reset(void *payload) {}

unsigned tree_sitter_ulb_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_ulb_external_scanner_deserialize(void *payload, const char *buffer,
                                                  unsigned length) {}

static bool is_whitespace(int32_t c) {
  return c == ' ' || c == '\t' || c == '\n' || c == '\r';
}

static bool is_ident_start(int32_t c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

static bool is_ident_continue(int32_t c) {
  return is_ident_start(c) || (c >= '0' && c <= '9');
}

/*
 * Skip whitespace and comments. On return, `lexer->lookahead` is either
 * the first character of a word or a character that the scanner cannot
 * handle. If the caller then gives up (returns false), the runtime
 * rewinds the lexer to the position before the skipped extras, so any
 * characters consumed here are not lost.
 */
static void skip_extras(TSLexer *lexer) {
  for (;;) {
    while (is_whitespace(lexer->lookahead)) {
      lexer->advance(lexer, true);
    }
    if (lexer->lookahead != '/') {
      return;
    }
    lexer->advance(lexer, true);
    if (lexer->lookahead == '/') {
      while (lexer->lookahead && lexer->lookahead != '\n') {
        lexer->advance(lexer, true);
      }
      continue;
    }
    if (lexer->lookahead == '*') {
      lexer->advance(lexer, true);
      for (;;) {
        if (lexer->lookahead == '*') {
          lexer->advance(lexer, true);
          if (lexer->lookahead == '/') {
            lexer->advance(lexer, true);
            break;
          }
        } else {
          if (!lexer->lookahead) {
            return;
          }
          lexer->advance(lexer, true);
        }
      }
      continue;
    }
    return;
  }
}

static bool keyword_for(const char *word, size_t len, enum TokenType *result) {
  static const struct {
    const char *text;
    enum TokenType type;
  } keywords[] = {
      {"if", IF},
      {"else", ELSE},
      {"true", TRUE},
      {"false", FALSE},
      {"convention", CONVENTION},
      {"fn", FN},
      {"task", TASK},
      {"apply", APPLY},
  };
  for (size_t i = 0; i < sizeof(keywords) / sizeof(keywords[0]); i++) {
    size_t klen = strlen(keywords[i].text);
    if (klen == len && memcmp(word, keywords[i].text, klen) == 0) {
      *result = keywords[i].type;
      return true;
    }
  }
  return false;
}

static bool scan_word(TSLexer *lexer) {
  skip_extras(lexer);
  if (!is_ident_start(lexer->lookahead)) {
    return false;
  }

  char word[16];
  size_t len = 0;
  while (is_ident_continue(lexer->lookahead)) {
    if (len < sizeof(word) - 1) {
      word[len] = (char)lexer->lookahead;
    }
    len++;
    lexer->advance(lexer, false);
  }

  enum TokenType type;
  if (keyword_for(word, len, &type)) {
    lexer->result_symbol = type;
  } else {
    lexer->result_symbol = IDENTIFIER;
  }
  return true;
}

bool tree_sitter_ulb_external_scanner_scan(void *payload, TSLexer *lexer,
                                           const bool *valid_symbols) {
  return scan_word(lexer);
}
