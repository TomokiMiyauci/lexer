import { distinct } from "./deps.ts";
import type { FragmentToken, Token } from "./types.ts";

export function uniqueChar(...args: readonly string[]): string {
  const characters = args.reduce((acc, cur) => acc + cur, "");
  return distinct(characters.split("")).join("");
}

/**
 * @param regExp
 */
export function assertRegExpFrag(regExp: RegExp): asserts regExp is RegExp {
  if (regExp.global) {
    throw new TypeError(`global flag can not available. ${regExp}`);
  }
}

export function countLineBreak(input: string): number {
  const matches = input.match(/\n/g);

  return matches && matches.length || 0;
}

export function foldByType(input: Iterable<Token>, type: string): Token[] {
  return Array.from(input).reduceRight(([first, ...rest], cur) => {
    if (!first) return [cur, ...rest];
    if (first.type !== type || cur.type !== type) {
      return [cur, first, ...rest];
    }

    const value = cur.value + first.value;
    const token: Token = {
      type,
      value,
      offset: cur.offset,
      column: cur.column,
      line: cur.line,
    };

    return [token, ...rest];
  }, [] as Token[]);
}

export function* columnLine(input: Iterable<FragmentToken>): Iterable<Token> {
  let line = 1;
  let column = 0;

  for (const { value, ...rest } of input) {
    const lineBreaks = countLineBreak(value);

    yield { value, ...rest, line, column };

    if (lineBreaks) {
      column = 0;
      line += lineBreaks;
    } else {
      column += value.length;
    }
  }
}
