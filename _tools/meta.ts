import { BuildOptions } from "https://deno.land/x/dnt@0.30.0/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {},
  typeCheck: true,
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "lexer-js",
    version,
    description: "Lexical analyzer for JavaScript",
    keywords: [
      "lexer",
      "lex",
      "lexical-analyzer",
      "tokenizer",
      "tokenize",
      "token",
    ],
    license: "MIT",
    homepage: "https://github.com/TomokiMiyauci/lexer",
    repository: {
      type: "git",
      url: "git+https://github.com/TomokiMiyauci/lexer.git",
    },
    bugs: {
      url: "https://github.com/TomokiMiyauci/lexer/issues",
    },
    sideEffects: false,
    type: "module",
    publishConfig: {
      access: "public",
    },
  },
  packageManager: "pnpm",
});
