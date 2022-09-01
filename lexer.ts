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
export type Token = {
  /** Defined token type. */
  type: string;

  /** Actual token literal value. */
  literal: string;

  /** Start index of the matched in the input. */
  offset: number;
};

export interface Lexis {
  [k: string]: string | RegExp;
}

export class Lexer {
  constructor(private lexis: Lexis) {}

  lex(value: string): LexResult {
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

    function addToken(token: Readonly<StatelessToken>): void {
      tokens.push({ ...token, offset: cursor });
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

type StatelessToken = Omit<Token, "offset">;

function getTokenByRegex(
  value: string,
  entries: readonly (readonly [string, RegExp])[],
): StatelessToken | undefined {
  const tokens: StatelessToken[] = [];

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
): StatelessToken | undefined {
  const tokens: StatelessToken[] = [];

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
