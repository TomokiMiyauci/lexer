import { filterValues, isRegExp, isString, maxBy } from "./deps.ts";
import { uniqueChar } from "./utils.ts";

/** Result of lex. */
export interface LexResult<T extends string = string> {
  /** Token streams. */
  tokens: Token<T>[];

  /** Whether the lex has done or not. */
  done: boolean;

  /** Final offset. Same as the last index of the last token. */
  offset: number;
}

/** Token object, a result of matching an individual lexing rule. */
export interface Token<T extends string = string> {
  /** Defined token type. */
  type: T;

  /** Actual token literal value. */
  literal: string;

  /** Start index of the matched in the input. */
  offset: number;
}

/** Map of token type and token patterns. */
export type TokenMap<T extends string = string> = {
  readonly [k in T]: string | RegExp | LexRule | typeof EOF;
};

/** Lex rule. */
export interface LexRule {
  /** Token matching pattern. */
  readonly pattern: string | RegExp;

  /** Whether the token ignore or not.  */
  readonly ignore?: boolean;
}

/** The lex options. */
export interface LexOptions {
  /** Initial offset index.
   * @default 0
   */
  readonly offset?: number;
}

/** Lexer Object.
 *
 * ```ts
 * import { Lexer } from "https://deno.land/x/lexer@$VERSION/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";
 *
 * const lexer = new Lexer({
 *   LET: "let",
 *   NUMBER: /\d+/,
 *   IDENT: /[a-z]+/i,
 *   ASSIGN: "=",
 *   PLUS: "+",
 *   SEMICOLON: ";",
 *   WS: {
 *     pattern: /[\s\t]+/,
 *     ignore: true,
 *   },
 * });
 * const input = `let sum = 100 + 200;`;
 * const result = lexer.lex(input);
 * assertEquals(result, {
 *   tokens: [
 *     { type: "Let", literal: "let", offset: 0 },
 *     { type: "Ident", literal: "sum", offset: 3 },
 *     // ...,
 *     { type: "Semicolon", literal: ";", offset: 19 },
 *   ],
 *   done: true,
 *   offset: 20,
 * });
 * ```
 *
 * @throws Error: When the regex pattern has `g` flag.
 */
export class Lexer<T extends string> {
  #strings: StringContext[];
  #regexes: RegexContext[];
  #eofType: string | undefined;

  constructor(private tokenMap: TokenMap<T>) {
    const eofRecord = filterValues(this.tokenMap, isEOF);
    this.#eofType = findEOF(eofRecord as never);

    const tokenMapExceptEof = filterValues(
      this.tokenMap as never,
      (value) => !isEOF(value),
    ) as Record<string, string | RegExp | LexRule>;

    const contexts = Object.entries(tokenMapExceptEof).map(toContext);

    this.#strings = contexts.filter(({ pattern }) =>
      isString(pattern)
    ) as StringContext[];

    const regexContexts = contexts.filter(({ pattern }) =>
      isRegExp(pattern)
    ) as RegexContext[];

    regexContexts.forEach(({ pattern }) => assertRegExpFrag(pattern));

    this.#regexes = regexContexts.map((
      { pattern, ...rest },
    ) => ({
      ...rest,
      pattern: new RegExp(pattern, uniqueChar("y", pattern.flags)),
    }));
  }

  /** Analyze input lexically. */
  lex(input: string, { offset = 0 }: LexOptions = {}): LexResult<T> {
    const tokens: Token<T>[] = [];

    function addToken(
      { type, ignore, literal }: Readonly<Omit<TokenContext, "pattern">>,
    ): void {
      if (!ignore) {
        tokens.push({ type: type as T, literal, offset });
      }
      offset += literal.length;
    }

    while (offset < input.length) {
      const characters = input.substring(offset);
      const tokenFromString = getTokenByString(characters, this.#strings);

      if (tokenFromString) {
        addToken(tokenFromString);
        continue;
      }

      this.#regexes.forEach(({ pattern }) => {
        pattern.lastIndex = offset;
      });

      const tokenFromRegex = getTokenByRegex(input, this.#regexes);

      if (tokenFromRegex) {
        addToken(tokenFromRegex);
        continue;
      }

      break;
    }

    const done: boolean = input.length <= offset;
    if (done && isString(this.#eofType)) {
      addToken({ type: this.#eofType, literal: "" });
    }

    return {
      tokens,
      done,
      offset,
    };
  }
}

type TokenContext = Omit<Token, "offset"> & Context;

function getTokenByRegex(
  input: string,
  ctx: RegexContext[],
): TokenContext | undefined {
  const tokens: TokenContext[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    const result = pattern.exec(input);

    if (result && result[0]) {
      tokens.unshift({
        ...rest,
        pattern,
        literal: result[0],
      });
    }
  });

  const maybeToken = maxBy(tokens, ({ literal }) => literal);

  return maybeToken;
}

function getTokenByString(
  input: string,
  ctx: readonly StringContext[],
): TokenContext | undefined {
  const tokens: TokenContext[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    if (input.startsWith(pattern)) {
      tokens.unshift({
        ...rest,
        pattern,
        literal: pattern,
      });
    }
  });

  const maybeToken = maxBy(tokens, ({ literal }) => literal);

  return maybeToken;
}

export function resolveOptions(options: string | RegExp | LexRule): LexRule {
  if (isString(options) || isRegExp(options)) {
    return {
      pattern: options,
    };
  }
  return options;
}

interface Context<T extends PropertyKey = string> extends LexRule {
  type: T;
}

interface StringContext extends Context {
  pattern: string;
}

interface RegexContext extends Context {
  pattern: RegExp;
}

function toContext(
  [type, options]: [string, string | RegExp | LexRule],
): Context {
  return {
    ...resolveOptions(options),
    type,
  };
}

function assertRegExpFrag(regExp: RegExp): asserts regExp is RegExp {
  if (regExp.global) {
    throw new Error(
      `Global flag is not allowed. ${regExp}`,
    );
  }
}

/** Special EOF match pattern. */
export const EOF = Symbol.for("EOF");

function findEOF(tokenMap: TokenMap): string | undefined {
  const node = Object.entries(tokenMap).findLast(([_, pattern]) =>
    isEOF(pattern)
  );

  return node?.[0];
}

function isEOF(value: unknown): value is typeof EOF {
  return value === EOF;
}
