import { isRegExp, isString, maxBy } from "./deps.ts";

/** Result of lex. */
export interface LexResult {
  /** Tokenized tokens. */
  tokens: Token[];

  /** Whether the lex has done or not. */
  done: boolean;

  /** Final offset. Same as the last index of the last token. */
  offset: number;
}

/** Token object, a result of matching an individual lexing rule. */
export interface Token {
  /** Defined token type. */
  type: string;

  /** Actual token literal value. */
  literal: string;

  /** Start index of the matched in the input. */
  offset: number;
}

/** Map of token type and token patterns. */
export interface TokenMap {
  readonly [k: string]: string | RegExp | LexRule;
}

/** Lex rule. */
export interface LexRule {
  /** Token matching pattern. */
  readonly pattern: string | RegExp;

  /** Whether the token ignore or not.  */
  readonly ignore?: boolean;
}

export class Lexer {
  constructor(private tokenMap: TokenMap) {}

  lex(value: string): LexResult {
    let cursor = 0;
    const tokens: Token[] = [];

    const contexts = Object.entries(this.tokenMap).map(toContext);

    const strings = contexts.filter(({ pattern }) =>
      isString(pattern)
    ) as StringContext[];

    const regexes = contexts.filter(({ pattern }) => isRegExp(pattern)).map((
      { pattern, ...rest },
    ) => ({ ...rest, pattern: new RegExp(pattern, "y") }));

    function addToken({ type, ignore, literal }: Readonly<TokenContext>): void {
      if (!ignore) {
        tokens.push({ type, literal, offset: cursor });
      }
      cursor += literal.length;
    }

    while (cursor < value.length) {
      const characters = value.substring(cursor);
      const tokenFromString = getTokenByString(characters, strings);

      if (tokenFromString) {
        addToken(tokenFromString);
        continue;
      }

      regexes.forEach(({ pattern }) => {
        pattern.lastIndex = cursor;
      });

      const tokenFromRegex = getTokenByRegex(value, regexes);

      if (tokenFromRegex) {
        addToken(tokenFromRegex);
        continue;
      }

      break;
    }

    const done: boolean = value.length <= cursor;

    return {
      tokens,
      done,
      offset: cursor,
    };
  }
}

type TokenContext = Omit<Token, "offset"> & Context;

function getTokenByRegex(
  value: string,
  ctx: RegexContext[],
): TokenContext | undefined {
  const tokens: TokenContext[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    const result = pattern.exec(value);

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
  value: string,
  ctx: readonly StringContext[],
): TokenContext | undefined {
  const tokens: TokenContext[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    if (value.startsWith(pattern)) {
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

function resolveOptions(options: string | RegExp | LexRule): LexRule {
  if (isString(options) || isRegExp(options)) {
    return {
      pattern: options,
    };
  }
  return options;
}

interface Context extends LexRule {
  type: string;
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
