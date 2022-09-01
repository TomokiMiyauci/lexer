import { Lexer } from "../mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.153.0/path/mod.ts";

const source = await Deno.readTextFile(
  fromFileUrl(import.meta.resolve("../lexer.ts")),
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

const lexer = new Lexer({
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
  [SeparatorType.WS]: {
    pattern: /[\s\t]+/,
    ignore: true,
  },
  [SeparatorType.CR]: /\n/,

  // identifiers
  [IdentifierType.IDENT]: /[a-zA-Z\d]+/,
  [IdentifierType.CHARACTER]: /"(.+?)"/,
  [IdentifierType.NUMBER]: /\d*/,

  // operators
  [OperatorType.ASSIGN]: "=",
  [OperatorType.PLUS]: "+",
  [OperatorType.MINUS]: "-",

  [TokenType.COMMENT]: /\/\*\*(.+?)\*\//,
});

const result = lexer.lex(source);

console.log(result);
