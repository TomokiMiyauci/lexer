import { Lexer } from "./lexer.ts";
import { assertEquals, assertThrows } from "./dev_deps.ts";

const EofToken = { type: "EOF", value: "" };

Deno.test("should return done true when the input is empty string", () => {
  const lexer = new Lexer({});

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [EofToken],
  });
});

Deno.test("should return tokens with unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(` `);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: " " }, EofToken],
  });
});

Deno.test("should return tokens with merged unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(` a`);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: " a" }, EofToken],
  });
});

Deno.test("should change unknown tokens", () => {
  const lexer = new Lexer({}, { unknownType: "?" });
  const result = lexer.analyze(` a`);

  assertEquals(result, {
    values: [{ type: "?", value: " a" }, EofToken],
  });
});

Deno.test("should return tokens with merged unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(`  `);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: "  " }, EofToken],
  });
});

Deno.test("should return return tokens when match string rule", () => {
  const lexer = new Lexer({
    "RPAREN": ")",
  });

  const result = lexer.analyze(`)`);

  assertEquals(result, {
    values: [{ type: "RPAREN", value: ")" }, EofToken],
  });
});

Deno.test("should return tokens when match multiple string rule", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.analyze(`let)let`);

  assertEquals(result, {
    values: [{ type: "LET", value: "let" }, { type: "RPAREN", value: ")" }, {
      type: "LET",
      value: "let",
    }, EofToken],
  });
});

Deno.test("should match with regex pattern", () => {
  const lexer = new Lexer({
    "IDENT": /[a-z]+/,
  });

  const result = lexer.analyze(`count`);

  assertEquals(result, {
    values: [{ type: "IDENT", value: "count" }, EofToken],
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
      { type: "WS", value: " " },
      { type: "CONST", value: "const" },
      { type: "WS", value: " " },
      { type: "IDENT", value: "sum" },
      { type: "WS", value: " " },
      { type: "ASSIGN", value: "=" },
      { type: "WS", value: " " },
      { type: "NUMBER", value: "10" },
      { type: "WS", value: " " },
      { type: "PLUS", value: "+" },
      { type: "WS", value: " " },
      { type: "NUMBER", value: "20" },
      { type: "WS", value: " " },
      { type: "SEMICOLON", value: ";" },
      { type: "WS", value: " " },
      EofToken,
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
      { type: "AA", value: "aa" },
      { type: "AA", value: "aa" },
      { type: "A", value: "a" },
      EofToken,
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
      { type: "INT", value: "INT" },
      EofToken,
    ],
  });
});

Deno.test("should takes precedence the first string when the matching lengths are the same", () => {
  const lexer = new Lexer({
    A: "AAA",
    AA: "AAA",
  });

  const result = lexer.analyze("AAA");
  assertEquals(result, {
    values: [
      { type: "A", value: "AAA" },
      EofToken,
    ],
  });
});

Deno.test("should matched with the longest match by string", () => {
  const lexer = new Lexer({
    AA: "aa",
    AAA: "aaa",
    A: "a",
  });

  const result = lexer.analyze("aaaaa");
  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa" },
      { type: "AA", value: "aa" },
      EofToken,
    ],
  });
});

Deno.test("should matched with the longest match by regex", () => {
  const lexer = new Lexer({
    AA: /aa/,
    AAA: /aaa/,
    A: /a/,
  });

  const result = lexer.analyze("aaaaa");
  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa" },
      { type: "AA", value: "aa" },
      EofToken,
    ],
  });
});

Deno.test("should ignore token with ignore props", () => {
  const lexer = new Lexer({
    WS: {
      pattern: /\s+/,
      ignore: true,
    },
  });

  assertEquals(lexer.analyze("     "), {
    values: [EofToken],
  });
});

Deno.test("should ignore token with ignore props by string", () => {
  const lexer = new Lexer({
    A: {
      pattern: "A",
      ignore: true,
    },
  });

  assertEquals(lexer.analyze("AAAAA"), {
    values: [EofToken],
  });
});

Deno.test("should ignore longest matched token", () => {
  const lexer = new Lexer({
    B: /ABC/,
    A: {
      pattern: /.+/,
      ignore: true,
    },
  });

  assertEquals(lexer.analyze("ABCAB"), {
    values: [EofToken],
  });
});

Deno.test("should throw error when the regex has global flag", () => {
  assertThrows(() =>
    new Lexer({
      A: /a/g,
    })
  );
});

Deno.test("should be available regex flags", () => {
  assertEquals(
    new Lexer({
      A: /[a-z]+/iyu,
    }).analyze("Abc"),
    {
      values: [{ type: "A", value: "Abc" }, EofToken],
    },
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
  });

  assertEquals(
    lexer.analyze(`const a = 1;
let b = 2;
var c = a + b;
console.log(c)
`),
    {
      values: [
        { type: Type.Const, value: "const" },
        { type: "UNKNOWN", value: "a" },
        { type: Type.Eq, value: "=" },
        { type: Type.Number, value: "1" },
        { type: Type.SEMICOLON, value: ";" },
        { type: Type.Let, value: "let" },
        { type: "UNKNOWN", value: "b" },
        { type: Type.Eq, value: "=" },
        { type: Type.Number, value: "2" },
        { type: Type.SEMICOLON, value: ";" },
        { type: Type.Var, value: "var" },
        { type: "UNKNOWN", value: "c" },
        { type: Type.Eq, value: "=" },
        { type: "UNKNOWN", value: "a" },
        { type: Type.PLUS, value: "+" },
        { type: "UNKNOWN", value: "b" },
        { type: Type.SEMICOLON, value: ";" },
        { type: "UNKNOWN", value: "console.log" },
        { type: Type.LParen, value: "(" },
        { type: "UNKNOWN", value: "c" },
        { type: Type.RParen, value: ")" },
        EofToken,
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
