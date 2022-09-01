import { Lexer } from "./lexer.ts";
import { assertEquals } from "./dev_deps.ts";

Deno.test("should return done true when the input is empty string", () => {
  const lexer = new Lexer({});

  const result = lexer.lex(``);

  assertEquals(result, {
    tokens: [],
    done: true,
  });
});

Deno.test("should match maximum", () => {
  const lexer = new Lexer({
    "LET": "let",
    "L": "l",
    "LE": "le",
  });

  const result = lexer.lex(`lletle`);

  assertEquals(result, {
    tokens: [{ type: "L", literal: "l" }, { type: "LET", literal: "let" }, {
      type: "LE",
      literal: "le",
    }],
    done: true,
  });
});

Deno.test("should match pattern with maximum munch", () => {
  const lexer = new Lexer({
    "LET": "let",
    "LE": "le",
  });

  const result = lexer.lex(`let`);

  assertEquals(result, {
    tokens: [{ type: "LET", literal: "let" }],
    done: true,
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
  });
});

Deno.test("should return interim results when the token is unknown on the way", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.lex(`) let`);

  assertEquals(result, {
    tokens: [{ type: "RPAREN", "literal": ")" }],
    done: false,
  });
});

Deno.test("should return interim results when the token is unknown on the way", () => {
  const lexer = new Lexer({
    "LET": "let",
    "RPAREN": ")",
  });

  const result = lexer.lex(`let)let `);

  assertEquals(result, {
    tokens: [{ type: "LET", literal: "let" }, {
      type: "RPAREN",
      "literal": ")",
    }, { type: "LET", literal: "let" }],
    done: false,
  });
});

Deno.test("should match with regex pattern", () => {
  const lexer = new Lexer({
    "IDENT": /[a-z]+/,
  });

  const result = lexer.lex(`count`);

  assertEquals(result, {
    tokens: [{ type: "IDENT", literal: "count" }],
    done: true,
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
      { type: "WS", literal: " " },
      { type: "CONST", literal: "const" },
      { type: "WS", literal: " " },
      { type: "IDENT", literal: "sum" },
      { type: "WS", literal: " " },
      { type: "ASSIGN", literal: "=" },
      { type: "WS", literal: " " },
      { type: "NUMBER", literal: "10" },
      { type: "WS", literal: " " },
      { type: "PLUS", literal: "+" },
      { type: "WS", literal: " " },
      { type: "NUMBER", literal: "20" },
      { type: "WS", literal: " " },
      { type: "SEMICOLON", literal: ";" },
      { type: "WS", literal: " " },
    ],
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
      { type: "AA", literal: "aa" },
      { type: "AA", literal: "aa" },
      { type: "A", literal: "a" },
    ],
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
      { type: "IDENT", literal: "INT" },
    ],
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
      { type: "AA", literal: "AAA" },
    ],
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
      { type: "AAA", literal: "aaa" },
      { type: "AA", literal: "aa" },
    ],
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
      { type: "AAA", literal: "aaa" },
      { type: "AA", literal: "aa" },
    ],
  });
});
