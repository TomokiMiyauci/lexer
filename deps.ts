export { isString } from "https://deno.land/x/isx@1.0.0-beta.21/mod.ts";
export { maxBy } from "https://deno.land/std@0.153.0/collections/max_by.ts";
export { mapValues } from "https://deno.land/std@0.163.0/collections/map_values.ts";
export { distinct } from "https://deno.land/std@0.153.0/collections/distinct.ts";
export { filterValues } from "https://deno.land/std@0.153.0/collections/filter_values.ts";

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

// deno-lint-ignore ban-types
export type ExtendArg<F extends Function, Arg> = F extends
  (...args: infer Args) => infer X ? (...args: [...Args, Arg]) => X : never;

export type ValueOf<T> = T[keyof T];
