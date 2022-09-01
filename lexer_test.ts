import { Lexer } from "./lexer.ts";
import { assertEquals, assertThrows } from "./dev_deps.ts";

Deno.test("should return done true when the input is empty string", () => {
  const lexer = new Lexer({});

  const result = lexer.lex(``);

  assertEquals(result, {
    tokens: [],
    done: true,
    offset: 0,
  });
});

Deno.test("should empty token when the head token is unknown", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.lex(` )`);

  assertEquals(result, {
    tokens: [],
    done: false,
    offset: 0,
  });
});

Deno.test("should return interim results when the token is unknown on the way", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.lex(`) let`);

  assertEquals(result, {
    tokens: [{ type: "RPAREN", "literal": ")", offset: 0 }],
    done: false,
    offset: 1,
  });
});

Deno.test("should return interim results when the token is unknown on the way", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.lex(`let)let `);

  assertEquals(result, {
    tokens: [
      { type: "LET", literal: "let", offset: 0 },
      { type: "RPAREN", "literal": ")", offset: 3 },
      { type: "LET", literal: "let", offset: 4 },
    ],
    done: false,
    offset: 7,
  });
});

Deno.test("should match with regex pattern", () => {
  const lexer = new Lexer({
    "IDENT": /[a-z]+/,
  });

  const result = lexer.lex(`count`);

  assertEquals(result, {
    tokens: [{ type: "IDENT", literal: "count", offset: 0 }],
    done: true,
    offset: 5,
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

  const result = lexer.lex(" const sum = 10 + 20 ; ");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "WS", literal: " ", offset: 0 },
      { type: "CONST", literal: "const", offset: 1 },
      { type: "WS", literal: " ", offset: 6 },
      { type: "IDENT", literal: "sum", offset: 7 },
      { type: "WS", literal: " ", offset: 10 },
      { type: "ASSIGN", literal: "=", offset: 11 },
      { type: "WS", literal: " ", offset: 12 },
      { type: "NUMBER", literal: "10", offset: 13 },
      { type: "WS", literal: " ", offset: 15 },
      { type: "PLUS", literal: "+", offset: 16 },
      { type: "WS", literal: " ", offset: 17 },
      { type: "NUMBER", literal: "20", offset: 18 },
      { type: "WS", literal: " ", offset: 20 },
      { type: "SEMICOLON", literal: ";", offset: 21 },
      { type: "WS", literal: " ", offset: 22 },
    ],
    offset: 23,
  });
});

Deno.test("should strings take precedence over regexes", () => {
  const lexer = new Lexer({
    AAA: /a+/,
    AA: "aa",
    A: "a",
  });

  const result = lexer.lex("aaaaa");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "AA", literal: "aa", offset: 0 },
      { type: "AA", literal: "aa", offset: 2 },
      { type: "A", literal: "a", offset: 4 },
    ],
    offset: 5,
  });
});

Deno.test("should takes precedence the later regex when the matching lengths are the same", () => {
  const lexer = new Lexer({
    INT: /INT/,
    IDENT: /[A-Z]+/,
  });

  const result = lexer.lex("INT");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "IDENT", literal: "INT", offset: 0 },
    ],
    offset: 3,
  });
});

Deno.test("should takes precedence the later string when the matching lengths are the same", () => {
  const lexer = new Lexer({
    A: "AAA",
    AA: "AAA",
  });

  const result = lexer.lex("AAA");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "AA", literal: "AAA", offset: 0 },
    ],
    offset: 3,
  });
});

Deno.test("should matched with the longest match by string", () => {
  const lexer = new Lexer({
    AA: "aa",
    AAA: "aaa",
    A: "a",
  });

  const result = lexer.lex("aaaaa");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "AAA", literal: "aaa", offset: 0 },
      { type: "AA", literal: "aa", offset: 3 },
    ],
    offset: 5,
  });
});

Deno.test("should matched with the longest match by regex", () => {
  const lexer = new Lexer({
    AA: /aa/,
    AAA: /aaa/,
    A: /a/,
  });

  const result = lexer.lex("aaaaa");
  assertEquals(result, {
    done: true,
    tokens: [
      { type: "AAA", literal: "aaa", offset: 0 },
      { type: "AA", literal: "aa", offset: 3 },
    ],
    offset: 5,
  });
});

Deno.test("should ignore token with ignore props", () => {
  const lexer = new Lexer({
    WS: {
      pattern: /\s+/,
      ignore: true,
    },
  });

  assertEquals(lexer.lex("     "), {
    done: true,
    tokens: [],
    offset: 5,
  });
});

Deno.test("should ignore token with ignore props by string", () => {
  const lexer = new Lexer({
    A: {
      pattern: "A",
      ignore: true,
    },
  });

  assertEquals(lexer.lex("AAAAA"), {
    done: true,
    tokens: [],
    offset: 5,
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

  assertEquals(lexer.lex("ABCAB"), {
    done: true,
    tokens: [],
    offset: 5,
  });
});

Deno.test("should throw error when the regex has global flag", () => {
  assertThrows(() =>
    new Lexer({
      A: /a/g,
    })
  );
});
