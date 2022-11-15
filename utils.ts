import { distinct } from "./deps.ts";
import type { Token } from "./types.ts";

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

export function foldToken(
  input: Iterable<Token>,
): (Token) | void {
  const tokens = Array.from(input);

  if (!tokens.length) return;

  const token = Array.from(tokens).reduceRight((acc, cur) => ({
    type: cur.type,
    value: cur.value + acc.value,
    offset: cur.offset,
  }));

  return token;
}
