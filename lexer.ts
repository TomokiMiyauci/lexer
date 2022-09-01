import { isRegExp, isString, maxBy } from "./deps.ts";

/** Result of lex. */
export interface LexResult {
  /** Tokenized tokens. */
  tokens: Token[];

  /** Whether the lex has done or not. */
  done: boolean;
}

/** Token object, a result of matching an individual lexing rule. */
export type Token = {
  /** Defined token type. */
  type: string;

  /** Actual token literal value. */
  literal: string;
};

export interface Lexis {
  [k: string]: string | RegExp;
}

export class Lexer {
  constructor(private lexis: Lexis) {}

  lex(value: string): LexResult {
    if (!value) {
      return { tokens: [], done: true };
    }

    let cursor = 0;
    const tokens: Token[] = [];

    const strings = Object.entries(this.lexis).filter(([_, pattern]) =>
      isString(pattern)
    ) as [string, string][];
    const regexes = Object.entries(this.lexis).filter(([_, pattern]) =>
      isRegExp(pattern)
    ).map(([type, pattern]) => [type, new RegExp(pattern, "y")]) as [
      string,
      RegExp,
    ][];

    function addToken(token: Token): void {
      tokens.push(token);
      cursor += token.literal.length;
    }

    while (cursor < value.length) {
      const characters = value.substring(cursor);
      const tokenFromString = getTokenByString(characters, strings);

      if (tokenFromString) {
        addToken(tokenFromString);
        continue;
      }

      regexes.forEach(([_, regex]) => {
        regex.lastIndex = cursor;
      });

      const tokenFromRegex = getTokenByRegex(
        value,
        regexes,
      );

      if (tokenFromRegex) {
        addToken(tokenFromRegex);
        continue;
      }

      return {
        tokens,
        done: false,
      };
    }

    return {
      tokens: tokens,
      done: !!tokens.length,
    };
  }
}

function getTokenByRegex(
  value: string,
  entries: readonly (readonly [string, RegExp])[],
): Token | undefined {
  const tokens: Token[] = [];

  entries.forEach(([type, pattern]) => {
    const result = pattern.exec(value);

    if (result && result[0]) {
      tokens.unshift({
        type,
        literal: result[0],
      });
    }
  });

  const maybeToken = maxBy(tokens, ({ literal }) => literal);

  return maybeToken;
}

function getTokenByString(
  value: string,
  entries: readonly (readonly [string, string])[],
): Token | undefined {
  const tokens: Token[] = [];

  entries.forEach(([type, pattern]) => {
    if (value.startsWith(pattern)) {
      tokens.unshift({
        type,
        literal: pattern,
      });
    }
  });

  const maybeToken = maxBy(tokens, ({ literal }) => literal);

  return maybeToken;
}
