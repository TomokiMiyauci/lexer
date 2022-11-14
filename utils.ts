import { distinct } from "./deps.ts";

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
