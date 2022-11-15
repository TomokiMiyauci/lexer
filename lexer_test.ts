import { Lexer } from "./lexer.ts";
import { assertEquals, assertThrows } from "./dev_deps.ts";

const eof = { type: "EOF", value: "" } as const;
const unknown = { type: "UNKNOWN" } as const;

Deno.test("should return done true when the input is empty string", () => {
  const lexer = new Lexer({});

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [{ ...eof, offset: 0, column: 0, line: 1 }],
  });
});

Deno.test("should change eof token", () => {
  const lexer = new Lexer({}, { eof: "<eof>" });

  const result = lexer.analyze(``);

  assertEquals(result, {
    values: [{ type: "<eof>", value: "", offset: 0, column: 0, line: 1 }],
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
    values: [{ ...eof, offset: 0, column: 0, line: 1 }],
  });
});

Deno.test("should return tokens with unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(` `);

  assertEquals(result, {
    values: [
      { type: "UNKNOWN", value: " ", offset: 0, line: 1, column: 0 },
      { ...eof, offset: 1, column: 1, line: 1 },
    ],
  });
});

Deno.test(
  "should return tokens with merged unknown token type",
  () => {
    const lexer = new Lexer({});
    const result = lexer.analyze(` a`);

    assertEquals(result, {
      values: [
        { type: "UNKNOWN", value: " a", offset: 0, line: 1, column: 0 },
        { ...eof, offset: 2, line: 1, column: 2 },
      ],
    });
  },
);

Deno.test(
  "should return tokens when it exist unknown token and ignore token",
  () => {
    const lexer = new Lexer({ a: "a", b: "b", c: "c", d: "d" });
    const result = lexer.analyze(`abcd`);

    assertEquals(result, {
      values: [
        { type: "a", value: "a", offset: 0, line: 1, column: 0 },
        { type: "b", value: "b", offset: 1, line: 1, column: 1 },
        { type: "c", value: "c", offset: 2, line: 1, column: 2 },
        { type: "d", value: "d", offset: 3, line: 1, column: 3 },
        { ...eof, offset: 4, line: 1, column: 4 },
      ],
    });
  },
);

Deno.test(
  "should return tokens when it exist unknown token and ignore token",
  () => {
    const lexer = new Lexer({ b: "b" });
    const result = lexer.analyze(`abcd`);

    assertEquals(result, {
      values: [
        { ...unknown, value: "a", offset: 0, line: 1, column: 0 },
        { type: "b", value: "b", offset: 1, line: 1, column: 1 },
        { ...unknown, value: "cd", offset: 2, line: 1, column: 2 },
        { ...eof, offset: 4, line: 1, column: 4 },
      ],
    });
  },
);

Deno.test(
  "should return tokens when it exist unknown token and ignore token",
  () => {
    const lexer = new Lexer({ b: { pattern: "b", ignore: true } });
    const result = lexer.analyze(`abcd`);

    assertEquals(result, {
      values: [
        { ...unknown, value: "a", offset: 0, line: 1, column: 0 },
        { ...unknown, value: "cd", offset: 2, line: 1, column: 2 },
        { ...eof, offset: 4, line: 1, column: 4 },
      ],
    });
  },
);

Deno.test("should change unknown tokens", () => {
  const lexer = new Lexer({}, { unknown: "?" });
  const result = lexer.analyze(` a`);

  assertEquals(result, {
    values: [
      { type: "?", value: " a", offset: 0, line: 1, column: 0 },
      { ...eof, offset: 2, line: 1, column: 2 },
    ],
  });
});

Deno.test("should return tokens with merged unknown token type", () => {
  const lexer = new Lexer({});
  const result = lexer.analyze(`  `);

  assertEquals(result, {
    values: [{ type: "UNKNOWN", value: "  ", offset: 0, line: 1, column: 0 }, {
      ...eof,
      offset: 2,
      line: 1,
      column: 2,
    }],
  });
});

Deno.test("should return return tokens when match string rule", () => {
  const lexer = new Lexer({
    "RPAREN": ")",
  });

  const result = lexer.analyze(`)`);

  assertEquals(result, {
    values: [{ type: "RPAREN", value: ")", offset: 0, line: 1, column: 0 }, {
      ...eof,
      line: 1,
      offset: 1,
      column: 1,
    }],
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
      { type: "LET", value: "let", offset: 0, column: 0, line: 1 },
      { type: "RPAREN", value: ")", offset: 3, column: 3, line: 1 },
      { type: "LET", value: "let", offset: 4, column: 4, line: 1 },
      { ...eof, offset: 7, column: 7, line: 1 },
    ],
  });
});

Deno.test("should match with regex pattern", () => {
  const lexer = new Lexer({
    "IDENT": /[a-z]+/,
  });

  const result = lexer.analyze(`count`);

  assertEquals(result, {
    values: [{ type: "IDENT", value: "count", offset: 0, line: 1, column: 0 }, {
      ...eof,
      offset: 5,
      line: 1,
      column: 5,
    }],
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
      { type: "WS", value: " ", offset: 0, column: 0, line: 1 },
      { type: "CONST", value: "const", offset: 1, column: 1, line: 1 },
      { type: "WS", value: " ", offset: 6, column: 6, line: 1 },
      { type: "IDENT", value: "sum", offset: 7, column: 7, line: 1 },
      { type: "WS", value: " ", offset: 10, column: 10, line: 1 },
      { type: "ASSIGN", value: "=", offset: 11, column: 11, line: 1 },
      { type: "WS", value: " ", offset: 12, column: 12, line: 1 },
      { type: "NUMBER", value: "10", offset: 13, column: 13, line: 1 },
      { type: "WS", value: " ", offset: 15, column: 15, line: 1 },
      { type: "PLUS", value: "+", offset: 16, column: 16, line: 1 },
      { type: "WS", value: " ", offset: 17, column: 17, line: 1 },
      { type: "NUMBER", value: "20", offset: 18, column: 18, line: 1 },
      { type: "WS", value: " ", offset: 20, column: 20, line: 1 },
      { type: "SEMICOLON", value: ";", offset: 21, column: 21, line: 1 },
      { type: "WS", value: " ", offset: 22, column: 22, line: 1 },
      { ...eof, offset: 23, column: 23, line: 1 },
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
      { type: "AA", value: "aa", offset: 0, column: 0, line: 1 },
      { type: "AA", value: "aa", offset: 2, column: 2, line: 1 },
      { type: "A", value: "a", offset: 4, column: 4, line: 1 },
      { ...eof, offset: 5, column: 5, line: 1 },
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
      { type: "INT", value: "INT", offset: 0, column: 0, line: 1 },
      { ...eof, offset: 3, column: 3, line: 1 },
    ],
  });
});

Deno.test("should takes precedence the first string when the matching lengths are the same", () => {
  const lexer = new Lexer({ A: "AAA", AA: "AAA" });

  const result = lexer.analyze("AAA");
  assertEquals(result, {
    values: [
      { type: "A", value: "AAA", offset: 0, column: 0, line: 1 },
      { ...eof, offset: 3, column: 3, line: 1 },
    ],
  });
});

Deno.test("should matched with the longest match by string", () => {
  const lexer = new Lexer({ AA: "aa", AAA: "aaa", A: "a" });

  const result = lexer.analyze("aaaaa");
  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa", offset: 0, column: 0, line: 1 },
      { type: "AA", value: "aa", offset: 3, column: 3, line: 1 },
      { ...eof, offset: 5, column: 5, line: 1 },
    ],
  });
});

Deno.test("should matched with the longest match by regex", () => {
  const lexer = new Lexer({ AA: /aa/, AAA: /aaa/, A: /a/ });
  const result = lexer.analyze("aaaaa");

  assertEquals(result, {
    values: [
      { type: "AAA", value: "aaa", offset: 0, column: 0, line: 1 },
      { type: "AA", value: "aa", offset: 3, column: 3, line: 1 },
      { ...eof, offset: 5, column: 5, line: 1 },
    ],
  });
});

Deno.test("should ignore token with ignore props", () => {
  const lexer = new Lexer({
    WS: { pattern: /\s+/, ignore: true },
  });

  assertEquals(lexer.analyze("     "), {
    values: [{ ...eof, offset: 5, column: 5, line: 1 }],
  });
});

Deno.test("should ignore token with ignore props by string", () => {
  const lexer = new Lexer({
    A: { pattern: "A", ignore: true },
  });

  assertEquals(lexer.analyze("AAAAA"), {
    values: [{ ...eof, offset: 5, column: 5, line: 1 }],
  });
});

Deno.test("should ignore longest matched token", () => {
  const lexer = new Lexer({ B: /ABC/, A: { pattern: /.+/, ignore: true } });

  assertEquals(lexer.analyze("ABCAB"), {
    values: [{ ...eof, offset: 5, column: 5, line: 1 }],
  });
});

Deno.test("should throw error when the regex has global flag", () => {
  assertThrows(() => new Lexer({ A: /a/g }));
});

Deno.test("should be available regex flags", () => {
  assertEquals(
    new Lexer({ A: /[a-z]+/iyu }).analyze("Abc"),
    {
      values: [{ type: "A", value: "Abc", offset: 0, column: 0, line: 1 }, {
        ...eof,
        offset: 3,
        column: 3,
        line: 1,
      }],
    },
  );
});

Deno.test("should count up by line break", () => {
  assertEquals(
    new Lexer({
      a: { pattern: "a", ignore: true },
      b: "b",
      c: "c",
      d: "d",
      lb: /\n/,
      sp: " ",
    })
      .analyze(`b
   c
a
`),
    {
      values: [{ type: "b", value: "b", offset: 0, column: 0, line: 1 }, {
        type: "lb",
        value: "\n",
        column: 1,
        line: 1,
        offset: 1,
      }, {
        type: "sp",
        value: " ",
        offset: 2,
        column: 0,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 3,
        column: 1,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 4,
        column: 2,
        line: 2,
      }, {
        type: "c",
        value: "c",
        offset: 5,
        column: 3,
        line: 2,
      }, {
        type: "lb",
        value: "\n",
        offset: 6,
        column: 4,
        line: 2,
      }, {
        type: "lb",
        value: "\n",
        offset: 8,
        column: 1,
        line: 3,
      }, {
        type: "EOF",
        value: "",
        offset: 9,
        column: 0,
        line: 4,
      }],
    },
  );
});

Deno.test("should count up by line break with ignore line break token", () => {
  assertEquals(
    new Lexer({
      a: { pattern: "a", ignore: true },
      b: "b",
      c: "c",
      lb: { ignore: true, pattern: /\n/ },
      sp: " ",
    })
      .analyze(`b
   c
a
`),
    {
      values: [{ type: "b", value: "b", offset: 0, column: 0, line: 1 }, {
        type: "sp",
        value: " ",
        offset: 2,
        column: 0,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 3,
        column: 1,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 4,
        column: 2,
        line: 2,
      }, {
        type: "c",
        value: "c",
        offset: 5,
        column: 3,
        line: 2,
      }, {
        type: "EOF",
        value: "",
        offset: 9,
        column: 0,
        line: 4,
      }],
    },
  );
});

Deno.test("should count up by line break with unknown line break token", () => {
  assertEquals(
    new Lexer({
      a: { pattern: "a", ignore: true },
      b: "b",
      c: "c",
      sp: " ",
    })
      .analyze(`b
   c
a
`),
    {
      values: [{ type: "b", value: "b", offset: 0, column: 0, line: 1 }, {
        ...unknown,
        value: "\n",
        column: 1,
        line: 1,
        offset: 1,
      }, {
        type: "sp",
        value: " ",
        offset: 2,
        column: 0,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 3,
        column: 1,
        line: 2,
      }, {
        type: "sp",
        value: " ",
        offset: 4,
        column: 2,
        line: 2,
      }, {
        type: "c",
        value: "c",
        offset: 5,
        column: 3,
        line: 2,
      }, {
        ...unknown,
        value: "\n",
        offset: 6,
        column: 4,
        line: 2,
      }, {
        ...unknown,
        value: "\n",
        offset: 8,
        column: 1,
        line: 3,
      }, {
        type: "EOF",
        value: "",
        offset: 9,
        column: 0,
        line: 4,
      }],
    },
  );
});

Deno.test("should count up by line break with multiple unknown token", () => {
  assertEquals(
    new Lexer({
      a: { pattern: "a", ignore: true },
      b: "b",
      c: "c",
    })
      .analyze(`b
   c
a
`),
    {
      values: [{ type: "b", value: "b", offset: 0, column: 0, line: 1 }, {
        ...unknown,
        value: "\n   ",
        column: 1,
        line: 1,
        offset: 1,
      }, {
        type: "c",
        value: "c",
        offset: 5,
        column: 3,
        line: 2,
      }, {
        ...unknown,
        value: "\n",
        offset: 6,
        column: 4,
        line: 2,
      }, {
        ...unknown,
        value: "\n",
        offset: 8,
        column: 1,
        line: 3,
      }, {
        type: "EOF",
        value: "",
        offset: 9,
        column: 0,
        line: 4,
      }],
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
        { type: Type.Const, value: "const", offset: 0, column: 0, line: 1 },
        { type: Type.Unknown, value: "a", offset: 6, column: 6, line: 1 },
        { type: Type.Eq, value: "=", offset: 8, column: 8, line: 1 },
        { type: Type.Number, value: "1", offset: 10, column: 10, line: 1 },
        { type: Type.SEMICOLON, value: ";", offset: 11, column: 11, line: 1 },
        { type: Type.Let, value: "let", offset: 13, column: 0, line: 2 },
        { type: Type.Unknown, value: "b", offset: 17, column: 4, line: 2 },
        { type: Type.Eq, value: "=", offset: 19, column: 6, line: 2 },
        { type: Type.Number, value: "2", offset: 21, column: 8, line: 2 },
        { type: Type.SEMICOLON, value: ";", offset: 22, column: 9, line: 2 },
        { type: Type.Var, value: "var", offset: 24, column: 0, line: 3 },
        { type: Type.Unknown, value: "c", offset: 28, column: 4, line: 3 },
        { type: Type.Eq, value: "=", offset: 30, column: 6, line: 3 },
        { type: Type.Unknown, value: "a", offset: 32, column: 8, line: 3 },
        { type: Type.PLUS, value: "+", offset: 34, column: 10, line: 3 },
        { type: Type.Unknown, value: "b", offset: 36, column: 12, line: 3 },
        { type: Type.SEMICOLON, value: ";", offset: 37, column: 13, line: 3 },
        {
          type: Type.Unknown,
          value: "console.log",
          offset: 39,
          column: 0,
          line: 4,
        },
        { type: Type.LParen, value: "(", offset: 50, column: 11, line: 4 },
        { type: Type.Unknown, value: "c", offset: 51, column: 12, line: 4 },
        { type: Type.RParen, value: ")", offset: 52, column: 13, line: 4 },
        { ...eof, offset: 54, column: 0, line: 5 },
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
