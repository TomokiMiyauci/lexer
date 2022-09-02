import { Lexer, TokenMap } from "./mod.ts";
import { isString } from "./deps.ts";
import { fromFileUrl } from "https://deno.land/std@0.153.0/path/mod.ts";
import {
  createLexer,
  RegexRule,
  Rules,
} from "https://deno.land/x/leac@v0.6.0/mod.ts";
import { resolveOptions } from "./lexer.ts";
import { assertEquals } from "./dev_deps.ts";

const source = await Deno.readTextFile(
  fromFileUrl(import.meta.resolve("./lexer.ts")),
);

enum KeywordType {
  CONST = "Const",
  IMPORT = "Import",
  FROM = "From",
  NEW = "New",
  FOR = "For",
  EXPORT = "Export",
  NULL = "Null",
  INTERFACE = "Interface",
  CLASS = "Class",
  EXTENDS = "Extends",
  IMPLEMENTS = "Implements",
  CONSTRUCTOR = "Constructor",
  WHILE = "While",
  BREAK = "Break",
  CONTINUE = "Continue",
}

enum SeparatorType {
  COLON = ":",
  SEMICOLON = ";",
  DQUOTE = `"`,
  BACKQUOTE = "`",
  QUOTE = `'`,
  COMMA = ",",
  LPAREN = `(`,
  RPAREN = ")",
  LBRACE = "{",
  RBRACE = "}",
  BANG = "!",
  SLASH = "/",
  HASH = "#",
  WS = "WhiteSpace",
  CR = "Care",
  LT = ">",
  GT = "<",
  LBRAKET = "[",
  RBRAKET = "]",
  PIPE = "|",
  QUESTION = "?",
  DOT = ".",
  AMP = "&",
  DOLLAR = "$",
  UNDERBAR = "_",
}

enum OperatorType {
  ASSIGN = "=",
  PLUS = "+",
  MINUS = "-",
}

enum IdentifierType {
  NUMBER = "Number",
  CHARACTER = "Character",
  IDENT = "Ident",
}

enum TokenType {
  TYPE,
  PRIVATE,
  AS,
  THIS,
  FUNCTION,
  VOID,
  BOOLEAN,
  UNKNOWN,
  READONLY,
  NEVER,
  ASTERISK,
  COMMENT = "Comment",
}

const tokenMap = {
  // keywords
  [KeywordType.CONST]: "const",
  [KeywordType.BREAK]: "break",
  [KeywordType.CLASS]: "class",
  [KeywordType.IMPORT]: "import",
  [KeywordType.EXPORT]: "export",
  [KeywordType.FROM]: "from",
  [KeywordType.INTERFACE]: "interface",

  // separators
  [SeparatorType.COLON]: ":",
  [SeparatorType.SEMICOLON]: ";",
  [SeparatorType.COMMA]: ",",
  [SeparatorType.LPAREN]: "(",
  [SeparatorType.RPAREN]: ")",
  [SeparatorType.LBRACE]: "{",
  [SeparatorType.RBRACE]: "}",
  [SeparatorType.GT]: "<",
  [SeparatorType.LT]: ">",
  [SeparatorType.LBRAKET]: "[",
  [SeparatorType.RBRAKET]: "]",
  [SeparatorType.HASH]: "#",
  [SeparatorType.PIPE]: "|",
  [SeparatorType.QUESTION]: "?",
  [SeparatorType.BANG]: "!",
  [SeparatorType.DOT]: ".",
  [SeparatorType.AMP]: "&",
  [SeparatorType.BACKQUOTE]: "`",
  [SeparatorType.DOLLAR]: "$",
  [SeparatorType.UNDERBAR]: "_",
  [SeparatorType.WS]: {
    pattern: /[\s\t]+/,
    ignore: true,
  },
  [SeparatorType.CR]: /\n/,

  // identifiers
  [IdentifierType.IDENT]: /[a-zA-Z\d]+/,
  [IdentifierType.CHARACTER]: /"(.*?)"/,
  [IdentifierType.NUMBER]: /\d*/,

  // operators
  [OperatorType.ASSIGN]: "=",
  [OperatorType.PLUS]: "+",
  [OperatorType.MINUS]: "-",

  [TokenType.COMMENT]: /\/\*\*(.+?)\*\//s,
};

function toLeac(tokenMap: TokenMap): Rules {
  return Object.entries(tokenMap).map(([type, pattern]) => {
    if (typeof pattern === "symbol") return { "name": "xxxxxxx" };

    const options = resolveOptions(pattern);

    if (isString(options.pattern)) {
      return {
        name: type,
        discard: options.ignore,
      };
    }

    const rule: RegexRule = {
      name: type,
      regex: options.pattern,
      discard: options.ignore,
    };
    return rule;
  }) as Rules;
}

Deno.bench("lexer (maximum munch)", {
  group: "complex lex",
  baseline: true,
}, () => {
  const { done } = new Lexer(tokenMap).lex(source);
  assertEquals(done, true);
});

const rules = toLeac(tokenMap);

Deno.bench("leac (dispatching priority match)", {
  group: "complex lex",
  baseline: true,
}, () => {
  const r = createLexer(rules)(source);
  assertEquals(r.complete, true);
});
