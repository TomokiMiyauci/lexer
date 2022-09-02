export { isString } from "https://deno.land/x/isx@1.0.0-beta.21/mod.ts";
export { maxBy } from "https://deno.land/std@0.153.0/collections/max_by.ts";
export { distinct } from "https://deno.land/std@0.153.0/collections/distinct.ts";
export { filterValues } from "https://deno.land/std@0.153.0/collections/filter_values.ts";

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}
