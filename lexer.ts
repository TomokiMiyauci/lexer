import {
  $,
  type ExtendArg,
  isFalse,
  isRegExp,
  isString,
  mapValues,
  maxBy,
  prop,
} from "./deps.ts";
import { assertRegExpFrag, foldToken, uniqueChar } from "./utils.ts";
import type {
  AnalyzeResult,
  Grammar,
  RuleMap,
  RuleOptions,
  Token,
} from "./types.ts";
import { CursorImpl } from "./cursor.ts";

/** Lexer options. */
export interface LexerOptions {
  /** Unknown token type. If the input stream does not match any grammar, set the token as this type.
   * @default "UNKNOWN"
   */
  readonly unknown?: string;

  /** End of file token. Set the token to eod of token stream as this type.
   * Actual token `value` field will be empty string.
   *
   * - `string` - Set EOF token as this type.
   * - `true` - Set EOF token as default type.
   * - `false` - No set EOF token.
   * @default "EOF"
   */
  readonly eof?: string | boolean;
}

const DEFAULT_UNKNOWN = "UNKNOWN";
const DEFAULT_EOF = "EOF";

/** Lexer Object.
 *
 * @example
 * ```ts
 * import { Lexer } from "https://deno.land/x/lexer@$VERSION/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$VERSION/testing/asserts.ts";
 *
 * const lexer = new Lexer({
 *   LET: "let",
 *   NUMBER: /\d+/,
 *   IDENT: /[a-z]+/i,
 *   ASSIGN: "=",
 *   PLUS: "+",
 *   SEMICOLON: ";",
 *   WS: {
 *     pattern: /[\s\t]+/,
 *     ignore: true,
 *   },
 * });
 * const input = `let sum = 100 + 200;`;
 * const result = lexer.lex(input);
 * assertEquals(result, {
 *   tokens: [
 *     { type: "Let", literal: "let", offset: 0 },
 *     { type: "Ident", literal: "sum", offset: 3 },
 *     // ...,
 *     { type: "Semicolon", literal: ";", offset: 19 },
 *   ],
 *   done: true,
 *   offset: 20,
 * });
 * ```
 * @throws {Error} When the regex pattern has `g` flag.
 */
export class Lexer {
  #ruleMap: Rules;

  #unknown: string;
  #eof: string;
  #enableEof: boolean;

  constructor(grammar: Grammar, options?: LexerOptions) {
    const { eof: _eof = DEFAULT_EOF, unknown = DEFAULT_UNKNOWN } = options ??
      {};
    const eof = isString(_eof) ? _eof : DEFAULT_EOF;
    const rules = mapValues(grammar, resolveOptions);

    this.#ruleMap = preProcess(rules);
    this.#ruleMap.regex.forEach($(prop("pattern"), assertRegExpFrag));
    this.#unknown = unknown;
    this.#eof = eof;
    this.#enableEof = !isFalse(_eof);
  }

  /** Analyze input lexically. */
  analyze(input: string): AnalyzeResult {
    const cursor = new CursorImpl(0);
    const tokens: Token[] = [];
    const errorStack: Token[] = [];

    function dumpErrorToken(): void {
      const errorToken = foldToken(errorStack);
      errorStack.length = 0;

      if (errorToken) {
        tokens.push(errorToken);
      }
    }

    while (cursor.current < input.length) {
      const offset = cursor.current;
      const result = resolveRule({
        string: stringResolver,
        regex: regexResolver,
      }, {
        input,
        offset: cursor.current,
        ...this.#ruleMap,
      });

      if (result) {
        dumpErrorToken();

        if (!result.ignore) {
          tokens.push({
            type: result.type,
            value: result.resolved,
            offset,
          });
        }
        cursor.next(result.resolved.length);
        continue;
      }

      const current = input.at(offset);
      cursor.next();

      if (current) {
        errorStack.push({ type: this.#unknown, value: current, offset });
      }
    }

    dumpErrorToken();

    if (this.#enableEof) {
      tokens.push({ type: this.#eof, value: "", offset: cursor.current });
    }

    return { values: tokens };
  }
}

function getTokenByRegex(
  input: string,
  ctx: Rules["regex"],
): ResolveResult | undefined {
  const tokens: ResolveResult[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    const result = pattern.exec(input);

    if (result && result[0]) {
      tokens.push({
        ...rest,
        pattern,
        resolved: result[0],
      });
    }
  });

  const maybeToken = maxBy(tokens, prop("resolved"));

  return maybeToken;
}

function resolveOptions(
  options: string | RegExp | RuleOptions,
): RuleOptions {
  if (isString(options) || isRegExp(options)) {
    return { pattern: options };
  }
  return options;
}

interface ResolverContext {
  input: string;
  offset: number;
}

function resolveRule(
  resolvers: ResolverMap,
  context: ResolverContext & Rules,
): ResolveResult | void {
  const r1 = resolvers.string(context, context.string);

  if (r1) {
    return r1;
  }

  const r2 = resolvers.regex(context, context.regex);

  if (r2) {
    return r2;
  }
}

type TypeRuleMap = {
  [k in keyof RuleMap]: { pattern: RuleMap[k] } & RuleOptions;
};

type Rules = {
  [k in keyof TypeRuleMap]: (MatchContext & TypeRuleMap[k])[];
};

type ResolverMap = {
  [k in keyof Rules]: ExtendArg<Resolver, Rules[k]>;
};

interface Typeable {
  type: string;
}

interface MatchContext extends RuleOptions, Typeable {}

interface ResolveResult extends MatchContext {
  resolved: string;
}

interface Resolver {
  (context: ResolverContext): ResolveResult | void;
}

interface PreProcessor {
  (rules: Record<string, RuleOptions>): Rules;
}

const preProcess: PreProcessor = (rules) => {
  const $pattern = prop("pattern");
  const entries = Object.entries(rules);
  const typed = entries.map(([type, value]) => ({ type, ...value }));
  const strings = typed.filter(
    $($pattern, isString),
  ) as (TypeRuleMap["string"] & Typeable)[];
  const regexs = typed.filter(
    $($pattern, isRegExp),
  ) as (TypeRuleMap["regex"] & Typeable)[];
  const string = strings.toSorted((a, b) =>
    b.pattern.length - a.pattern.length
  );
  const regex = regexs.map((
    { pattern, ...rest },
  ) => ({
    ...rest,
    pattern: new RegExp(pattern, uniqueChar("y", pattern.flags)),
  }));

  return { string, regex };
};

const stringResolver: ResolverMap["string"] = ({ input, offset }, rules) => {
  const characters = input.substring(offset);
  const result = rules.find(({ pattern }) => characters.startsWith(pattern));

  if (result) {
    return { ...result, resolved: result.pattern };
  }
};

const regexResolver: ResolverMap["regex"] = ({ input, offset }, rules) => {
  const regex = rules.map(({ pattern, ...rest }) => {
    pattern.lastIndex = offset;

    return { ...rest, pattern };
  });
  const result = getTokenByRegex(input, regex);

  return result;
};
