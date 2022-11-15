import { Lexer } from "./lexer.ts";
import { assertEquals, assertThrows } from "./dev_deps.ts";

const EofToken = { type: "EOF", value: "" };

function eofToken(offset: number) {
  return { ...EofToken, offset };
}

Deno.test("should return done true when the input is empty string", () => {
  const lexer = new Lexer({});

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [eofToken(0)],
  });
});

Deno.test("should change eof token", () => {
  const lexer = new Lexer({}, { eof: "<eof>" });

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [{ type: "<eof>", value: "", offset: 0 }],
  });
});

Deno.test("should disabled eof token", () => {
  const lexer = new Lexer({}, { eof: false });

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [],
  });
});

Deno.test("should enable eof token", () => {
  const lexer = new Lexer({}, { eof: true });

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [eofToken(0)],
  });
});

Deno.test("should return tokens with unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(` `);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: " ", offset: 0 }, eofToken(1)],
  });
});

Deno.test("should return tokens with merged unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(` a`);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: " a", offset: 0 }, eofToken(2)],
  });
});

Deno.test("should change unknown tokens", () => {
  const lexer = new Lexer({}, { unknown: "?" });
  const result = lexer.analyze(` a`);

  assertEquals(result, {
    values: [{ type: "?", value: " a", offset: 0 }, eofToken(2)],
  });
});

Deno.test("should return tokens with merged unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(`  `);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: "  ", offset: 0 }, eofToken(2)],
  });
});

Deno.test("should return return tokens when match string rule", () => {
  const lexer = new Lexer({
    "RPAREN": ")",
  });

  const result = lexer.analyze(`)`);

  assertEquals(result, {
    values: [{ type: "RPAREN", value: ")", offset: 0 }, eofToken(1)],
  });
});

Deno.test("should return tokens when match multiple string rule", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.analyze(`let)let`);

  assertEquals(result, {
    values: [
      { type: "LET", value: "let", offset: 0 },
      { type: "RPAREN", value: ")", offset: 3 },
      { type: "LET", value: "let", offset: 4 },
      eofToken(7),
    ],
  });
});

Deno.test("should match with regex pattern", () => {
  const lexer = new Lexer({
    "IDENT": /[a-z]+/,
  });

  const result = lexer.analyze(`count`);

  assertEquals(result, {
    values: [{ type: "IDENT", value: "count", offset: 0 }, eofToken(5)],
  });
});

Deno.test("should match with complex pattern", () => {
  const lexer = new Lexer({
    IDENT: /[a-z]+/,
    NUMBER: /[0-9]+/,
    ASSIGN: "=",
    PLUS: "+",
    WS: /[\s\t]+/,
    CONST: "const",
    SEMICOLON: ";",
  });

  const result = lexer.analyze(" const sum = 10 + 20 ; ");
  assertEquals(result, {
    values: [
      { type: "WS", value: " ", offset: 0 },
      { type: "CONST", value: "const", offset: 1 },
      { type: "WS", value: " ", offset: 6 },
      { type: "IDENT", value: "sum", offset: 7 },
      { type: "WS", value: " ", offset: 10 },
      { type: "ASSIGN", value: "=", offset: 11 },
      { type: "WS", value: " ", offset: 12 },
      { type: "NUMBER", value: "10", offset: 13 },
      { type: "WS", value: " ", offset: 15 },
      { type: "PLUS", value: "+", offset: 16 },
      { type: "WS", value: " ", offset: 17 },
      { type: "NUMBER", value: "20", offset: 18 },
      { type: "WS", value: " ", offset: 20 },
      { type: "SEMICOLON", value: ";", offset: 21 },
      { type: "WS", value: " ", offset: 22 },
      eofToken(23),
    ],
  });
});

Deno.test("should strings take precedence over regexes", () => {
  const lexer = new Lexer({
    AAA: /a+/,
    AA: "aa",
    A: "a",
  });

  const result = lexer.analyze("aaaaa");
  assertEquals(result, {
    values: [
      { type: "AA", value: "aa", offset: 0 },
      { type: "AA", value: "aa", offset: 2 },
      { type: "A", value: "a", offset: 4 },
      eofToken(5),
    ],
  });
});

Deno.test("should takes precedence the first regex when the matching lengths are the same", () => {
  const lexer = new Lexer({
    INT: /INT/,
    IDENT: /INT/,
  });

  const result = lexer.analyze("INT");
  assertEquals(result, {
    values: [
      { type: "INT", value: "INT", offset: 0 },
      eofToken(3),
    ],
  });
});

Deno.test("should takes precedence the first string when the matching lengths are the same", () => {
  const lexer = new Lexer({ A: "AAA", AA: "AAA" });

  const result = lexer.analyze("AAA");
  assertEquals(result, {
    values: [
      { type: "A", value: "AAA", offset: 0 },
      eofToken(3),
    ],
  });
});

Deno.test("should matched with the longest match by string", () => {
  const lexer = new Lexer({ AA: "aa", AAA: "aaa", A: "a" });

  const result = lexer.analyze("aaaaa");
  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa", offset: 0 },
      { type: "AA", value: "aa", offset: 3 },
      eofToken(5),
    ],
  });
});

Deno.test("should matched with the longest match by regex", () => {
  const lexer = new Lexer({ AA: /aa/, AAA: /aaa/, A: /a/ });
  const result = lexer.analyze("aaaaa");

  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa", offset: 0 },
      { type: "AA", value: "aa", offset: 3 },
      eofToken(5),
    ],
  });
});

Deno.test("should ignore token with ignore props", () => {
  const lexer = new Lexer({
    WS: { pattern: /\s+/, ignore: true },
  });

  assertEquals(lexer.analyze("     "), {
    values: [eofToken(5)],
  });
});

Deno.test("should ignore token with ignore props by string", () => {
  const lexer = new Lexer({
    A: { pattern: "A", ignore: true },
  });

  assertEquals(lexer.analyze("AAAAA"), { values: [eofToken(5)] });
});

Deno.test("should ignore longest matched token", () => {
  const lexer = new Lexer({ B: /ABC/, A: { pattern: /.+/, ignore: true } });

  assertEquals(lexer.analyze("ABCAB"), {
    values: [eofToken(5)],
  });
});

Deno.test("should throw error when the regex has global flag", () => {
  assertThrows(() => new Lexer({ A: /a/g }));
});

Deno.test("should be available regex flags", () => {
  assertEquals(
    new Lexer({ A: /[a-z]+/iyu }).analyze("Abc"),
    { values: [{ type: "A", value: "Abc", offset: 0 }, eofToken(3)] },
  );
});

Deno.test("should return complex tokens", () => {
  const enum Type {
    Const = "const",
    Let = "lest",
    Var = "var",
    Eq = "eq",
    Number = "number",
    SEMICOLON = ";",
    PLUS = "+",
    LParen = "(",
    RParen = ")",
    WS = " ",
    Unknown = "???",
  }
  const lexer = new Lexer({
    [Type.Const]: "const",
    [Type.Let]: "let",
    [Type.Eq]: "=",
    [Type.WS]: { pattern: /\s+/, ignore: true },
    [Type.LParen]: "(",
    [Type.RParen]: ")",
    [Type.Number]: /[1-9][0-9]*/,
    [Type.SEMICOLON]: ";",
    [Type.Var]: "var",
    [Type.PLUS]: "+",
  }, { unknown: Type.Unknown });

  assertEquals(
    lexer.analyze(`const a = 1;
let b = 2;
var c = a + b;
console.log(c)
`),
    {
      values: [
        { type: Type.Const, value: "const", offset: 0 },
        { type: Type.Unknown, value: "a", offset: 6 },
        { type: Type.Eq, value: "=", offset: 8 },
        { type: Type.Number, value: "1", offset: 10 },
        { type: Type.SEMICOLON, value: ";", offset: 11 },
        { type: Type.Let, value: "let", offset: 13 },
        { type: Type.Unknown, value: "b", offset: 17 },
        { type: Type.Eq, value: "=", offset: 19 },
        { type: Type.Number, value: "2", offset: 21 },
        { type: Type.SEMICOLON, value: ";", offset: 22 },
        { type: Type.Var, value: "var", offset: 24 },
        { type: Type.Unknown, value: "c", offset: 28 },
        { type: Type.Eq, value: "=", offset: 30 },
        { type: Type.Unknown, value: "a", offset: 32 },
        { type: Type.PLUS, value: "+", offset: 34 },
        { type: Type.Unknown, value: "b", offset: 36 },
        { type: Type.SEMICOLON, value: ";", offset: 37 },
        { type: Type.Unknown, value: "console.log", offset: 39 },
        { type: Type.LParen, value: "(", offset: 50 },
        { type: Type.Unknown, value: "c", offset: 51 },
        { type: Type.RParen, value: ")", offset: 52 },
        eofToken(54),
      ],
    },
  );
});

// Deno.test("should override offset", () => {
//   const lexer = new Lexer({
//     LET: "let",
//     WS: /\s+/,
//   });

//   const result = lexer.lex("let ", {
//     offset: lexer.lex("let").offset,
//   });

//   assertEquals(result, {
//     done: true,
//     tokens: [{
//       type: "WS",
//       offset: 3,
//       literal: " ",
//     }],
//     offset: 4,
//   });
// });

// Deno.test("should end of EOF", () => {
//   const lexer = new Lexer({
//     ["<EOF>"]: EOF,
//     A: "abc",
//   });

//   assertEquals(lexer.lex("abc"), {
//     done: true,
//     tokens: [
//       { literal: "abc", offset: 0, type: "A" },
//       { literal: "", offset: 3, type: "<EOF>" },
//     ],
//     offset: 3,
//   });
// });

// Deno.test("should not includes end of EOF when the lex is failed", () => {
//   const lexer = new Lexer({
//     ["<EOF>"]: EOF,
//     A: "abc",
//   });

//   assertEquals(lexer.lex("ab"), {
//     done: false,
//     tokens: [],
//     offset: 0,
//   });
// });
