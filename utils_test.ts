import { uniqueChar } from "./utils.ts";
import { assertEquals } from "./dev_deps.ts";

Deno.test("should return empty when the value is empty only", () => {
  assertEquals(uniqueChar("", "", ""), "");
});

Deno.test("should return empty when the value is empty only", () => {
  assertEquals(uniqueChar("abc", "def", "acf"), "abcdef");
});
