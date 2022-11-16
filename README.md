# lexer

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/lexer)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/lexer/mod.ts)
[![GitHub](https://img.shields.io/github/license/httpland/http-router)](https://github.com/httpland/http-router/blob/main/LICENSE)

[![test](https://github.com/httpland/http-router/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/http-router/actions/workflows/test.yaml)

Lexical analyzer for JavaScript.

## Features

- Tiny
- Regex ready
- Maximum munch algorithm
- Fast

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
  WS = " ",
}

const lexer = new Lexer({
  [TokenType.LET]: "let",
  [TokenType.NUMBER]: /\d+/,
  [TokenType.IDENT]: /[a-z]+/i,
  [TokenType.ASSIGN]: "=",
  [TokenType.PLUS]: "+",
  [TokenType.SEMICOLON]: ";",
  [TokenType.WS]: { pattern: /[\s\t]+/, ignore: true },
});
const input = `let sum = 100 + 200;`;
const result = lexer.analyze(input);
assertEquals(result, {
  values: [
    { type: "Let", value: "let", offset: 0, column: 0, line: 1 },
    { type: "Ident", value: "sum", offset: 3, column: 3, line: 1 },
    // ...,
    { type: "Semicolon", value: ";", offset: 19, column: 19, line: 1 },
  ],
});
```

## Map of token type and patterns

The lexer is configured by map of token type and a token patterns.

Several expressions are supported for token patterns.

- string
- regex
- above with options

### String patterns

String pattern recognizes strings as they are as patterns.

```ts
import { Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";

const rules: Rules = {
  IMPORT: "import",
  FROM: "from",
  SEMICOLON: ";",
};
```

String patterns can be used for various tokens such as keywords, separators,
etc., and are the most readable and perform the best.

### Regex patterns

The regex pattern defines a regular expression as a `RegExp` object.

```ts
import { Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
const rules: Rules = {
  IDENT: /[a-z]+/i,
  NUMBER: /\d+/,
};
```

Note that regular expressions cannot be defined as string patterns.

```ts
import { Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
const rules: Rules = {
  NOT_REGEX_OBJECT: "\\s+",
};
```

In this case, matching is performed as the string `\s+`.

Also, `RegExp` flags of `g` is restricted to use. This is because it matches
inputs with Left to Right.

If you use the `g` flag, an error is thrown before execution.

### Patterns with options

The two patterns above allow almost any token to be represented.

For more fine-grained control over the generation of tokens, optional patterns
can be defined.

```ts
import { Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";

const rules: Rules = {
  WS: { pattern: /[\s\t]+/, ignore: true },
};
```

| Name    |      Required      | Description                                          |
| ------- | :----------------: | ---------------------------------------------------- |
| pattern | :white_check_mark: | `string` &#124; `RegExp`<br> Token matching pattern. |
| ignore  |                    | `boolean`<br>Whether the token ignore or not.        |

If `ignore` is set to `true`, then even if the pattern matches, it will not be
added to the generated token stream.

## EOF token

The EOF token is automatically added to the end of the token stream.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const { values } = new Lexer({}).analyze("");
assertEquals(values, [{
  type: "EOF",
  value: "",
  offset: 0,
  column: 0,
  line: 1,
}]);
```

The EOF token is automatically added to the end of the token stream.

To customize the type of EOF token, change the `eof` option.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const { values } = new Lexer({}, { eof: "<eof>" }).analyze("");
assertEquals(values, [{
  type: "<eof>",
  value: "",
  offset: 0,
  column: 0,
  line: 1,
}]);
```

If you do not want the EOF token to be added, set the `eof` option to `false`.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const { values } = new Lexer({}, { eof: false }).analyze("");
assertEquals(values, []);
```

## Maximum munch

The maximum munch is used in the matching algorithm.

This identifies the longest matching pattern as the token, **not** in the order
of definition in the token map.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const rules: Rules = {
  A: "A",
  AAA: "AAA",
  AA: "AA",
};
const { values } = new Lexer(rules).analyze("AAAAA");
assertEquals(values, [
  { type: "AAA", value: "AAA", offset: 0, column: 0, line: 1 },
  { type: "AA", value: "AA", offset: 3, column: 3, line: 1 },
]);
```

The maximum munch eliminates the need to worry about definition order and
reduces the potential for many bugs.

The same is true for the regex pattern.

### Pattern priority

String patterns take precedence over regex patterns. If there is a match in the
string pattern, no match is made in the regex pattern.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const rules: Rules = {
  CONST: "const",
  IDENT: /.+/,
};
const { values } = new Lexer(rules).analyze("constant");
assertEquals(values, [
  { type: "CONST", value: "const", offset: 0, column: 0, line: 1 },
  { type: "IDENT", value: "ant", offset: 5, column: 5, line: 1 },
]);
```

Conclusion:

long string > short string >> long regex > short regex

## Lexical analyzing result

The input is converted to a token stream by the lexer.

The result has the following structure:

| Name   | Description                   |
| ------ | ----------------------------- |
| values | `Token[]` <br> Token streams. |

`Token` structure is:

| Name   | Description                                            |
| ------ | ------------------------------------------------------ |
| type   | `string` <br> Defined token type.                      |
| value  | `string`<br> Actual token text value.                  |
| offset | `number`<br> FStart index of the matched in the input. |

If a character not matching the pattern is encountered, it is aborted and `done`
is returned as `false` along with the token stream up to that point.

### Generic token types

The `type` of a token matches the token type defined in the token map.

The `type` of the token is narrowed by generics.

```ts
import { Lexer, Rules } from "https://deno.land/x/lexer@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";

const rules: Rules = {
  CONST: "const",
  IDENT: /.+/,
};
const { values } = new Lexer(rules).analyze("constant");
values.forEach(({ type }) => {
  type; // infer "CONST" | "INDENT"
});
```

## API

All APIs can be found in the
[deno doc](https://doc.deno.land/https/deno.land/x/lexer/mod.ts).

## Benchmark

Benchmark script with comparison to several popular schema library is available.

```bash
deno task bench
```

## License

Copyright © 2022-present [TomokiMiyauci](https://github.com/TomokiMiyauci).

Released under the [MIT](./LICENSE) license
