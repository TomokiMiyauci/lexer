import { distinct } from "./deps.ts";

export function uniqueChar(...args: readonly string[]): string {
  const characters = args.reduce((acc, cur) => acc + cur, "");
  return distinct(characters.split("")).join("");
}
