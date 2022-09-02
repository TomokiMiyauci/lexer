# lexer

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/lexer)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/lexer/mod.ts)

Lexical analyzer for JavaScript.

## Features

- Tiny
- Simple / Lean
- Regex ready
- Maximum munch algorithm
- Composable

## Basic usage

Example of simple addition.

```ts
import { Lexer } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

enum TokenType {
  LET = "Let",
  NUMBER = "Number",
  IDENT = "Ident",
  ASSIGN = "Assign",
  PLUS = "Plus",
  SEMICOLON = "Semicolon",
}

const lexer = new Lexer({
  [TokenType.LET]: "let",
  [TokenType.NUMBER]: /\d+/,
  [TokenType.IDENT]: /[a-z]+/i,
  [TokenType.ASSIGN]: "=",
  [TokenType.PLUS]: "+",
  [TokenType.SEMICOLON]: ";",

  "WS": {
    pattern: /[\s\t]+/,
    ignore: true,
  },
});
const input = `let sum = 100 + 200;`;
const result = lexer.lex(input);
assertEquals(result, {
  tokens: [
    { type: "Let", literal: "let", offset: 0 },
    { type: "Ident", literal: "sum", offset: 3 },
    // ...,
    { type: "Semicolon", literal: ";", offset: 19 },
  ],
  done: true,
  offset: 20,
});
```

## Map of token type and patterns

The lexer is configured by map of token type and a token patterns.

Several expressions are supported for token patterns.

- string
- regex
- above with options

### string pattern

String pattern recognizes strings as they are as patterns.

```ts
import { TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";

const tokenMap: TokenMap = {
  IMPORT: "import",
  FROM: "from",
  SEMICOLON: ";",
};
```

String patterns can be used for various tokens such as keywords, separators,
etc., and are the most readable and perform the best.

### regex pattern

The regex pattern defines a regular expression as a `RegExp` object.

```ts
import { TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";
const tokenMap: TokenMap = {
  IDENT: /[a-z]+/i,
  NUMBER: /\d+/,
};
```

Note that regular expressions cannot be defined as string patterns.

```ts
import { TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";
const tokenMap: TokenMap = {
  NOT_REGEX_OBJECT: "\\s+",
};
```

In this case, matching is performed as the string `\s+`.

Also, `RegExp` flags of `g` is restricted to use. This is because it matches
inputs with Left to Right.

If you use the `g` flag, an error is thrown before execution.

### Pattern with options

The two patterns above allow almost any token to be represented.

For more fine-grained control over the generation of tokens, optional patterns
can be defined.

```ts
import { TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";

const tokenMap: TokenMap = {
  WS: {
    pattern: /[\s\t]+/,
    ignore: true,
  },
};
```

| Name    |      Required      | Description                                          |
| ------- | :----------------: | ---------------------------------------------------- |
| pattern | :white_check_mark: | `string` &#124; `RegExp`<br> Token matching pattern. |
| ignore  |                    | `boolean`Whether the token ignore or not.            |

If `ignore` is set to `true`, then even if the pattern matches, it will not be
added to the generated token stream.

## EOF token

Scan inputs from left to right. Therefore, EOF cannot be represented as a string
or regular expression.

If you want an EOF token at the end of your token stream, you must add the EOF
symbol to your pattern.

The lexer treats only EOF symbols "specially".

```ts
import {
  EOF,
  Lexer,
  TokenMap,
} from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const tokenMap: TokenMap = {
  "<EOF>": EOF, // or Symbol("EOF"),
};
const { tokens } = new Lexer(tokenMap).lex("");
assertEquals(tokens, [{ type: "<EOF>", literal: "", offset: 0 }]);
```

The EOF token will only be included if all inputs can be parsed.

```ts
import {
  EOF,
  Lexer,
  TokenMap,
} from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const tokenMap: TokenMap = {
  "<EOF>": EOF,
};
const result = new Lexer(tokenMap).lex("a");
assertEquals(result, { tokens: [], done: false, offset: 0 });
```

## Maximum munch

The maximum munch is used in the matching algorithm.

This identifies the longest matching pattern as the token, **not** in the order
of definition in the token map.

```ts
import { Lexer, TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const tokenMap: TokenMap = {
  "A": "A",
  "AAA": "AAA",
  "AA": "AA",
};
const { tokens } = new Lexer(tokenMap).lex("AAAAA");
assertEquals(tokens, [
  { type: "AAA", literal: "AAA", offset: 0 },
  { type: "AA", literal: "AA", offset: 3 },
]);
```

The maximum munch eliminates the need to worry about definition order and
reduces the potential for many bugs.

The same is true for the regex pattern.

### Pattern priority

String patterns take precedence over regex patterns. If there is a match in the
string pattern, no match is made in the regex pattern.

```ts
import { Lexer, TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const tokenMap: TokenMap = {
  CONST: "const",
  IDENT: /.+/,
};
const { tokens } = new Lexer(tokenMap).lex("constant");
assertEquals(tokens, [
  { type: "CONST", literal: "const", offset: 0 },
  { type: "IDENT", literal: "ant", offset: 5 },
]);
```

Conclusion:

long string > short string >> long regex > short regex

## Lexical analyzing result

The input is converted to a token stream by the lexer.

The result has the following structure:

| Name   | Description                                                          |
| ------ | -------------------------------------------------------------------- |
| tokens | `Token[]` <br> Token streams.                                        |
| done   | `boolean`<br> Whether the lex has done or not.                       |
| offset | `number`<br> Final offset. Same as the last index of the last token. |

`Token` structure is:

| Name    | Description                                            |
| ------- | ------------------------------------------------------ |
| type    | `string` <br> Defined token type.                      |
| literal | `string`<br> Actual token literal value.               |
| offset  | `number`<br> FStart index of the matched in the input. |

If a character not matching the pattern is encountered, it is aborted and `done`
is returned as `false` along with the token stream up to that point.

### Generic token types

The `type` of a token matches the token type defined in the token map.

The `type` of the token is narrowed by generics.

```ts
import { Lexer, TokenMap } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const tokenMap: TokenMap = {
  CONST: "const",
  IDENT: /.+/,
};
const { tokens } = new Lexer(tokenMap).lex("constant");
tokens.forEach(({ type }) => {
  type; // infer "CONST" | "INDENT"
});
```

## Benchmark

Benchmark script with comparison to several popular schema library is available.

```bash
deno bench --unstable
```

## License

Copyright © 2022-present [TomokiMiyauci](https://github.com/TomokiMiyauci).

Released under the [MIT](./LICENSE) license
