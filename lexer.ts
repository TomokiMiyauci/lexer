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
import {
  assertRegExpFrag,
  columnLine,
  foldByType,
  uniqueChar,
} from "./utils.ts";
import type { FragmentToken, PatternMap, Rule, Rules, Token } from "./types.ts";
import { CursorImpl } from "./cursor.ts";
import { Pattern } from "./mod.ts";

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

/** Result of lexical analyze. */
export interface AnalyzeResult {
  readonly values: Token[];
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
 * const result = lexer.analyze(input);
 * assertEquals(result, {
 *   values: [
 *     { type: "Let", value: "let", offset: 0, column: 0, line: 1 },
 *     { type: "Ident", value: "sum", offset: 3, column: 3, line: 1 },
 *     // ...,
 *     { type: "Semicolon", value: ";", offset: 19, column: 19, line: 1 },
 *   ],
 * });
 * ```
 * @throws {Error} When the regex pattern has `g` flag.
 */
export class Lexer {
  #ruleMap: TypePatternContext;
  #unknown: string;
  #eof: string;
  #enableEof: boolean;

  constructor(rules: Rules, options?: LexerOptions) {
    const { eof: _eof = DEFAULT_EOF, unknown = DEFAULT_UNKNOWN } = options ??
      {};
    const eof = isString(_eof) ? _eof : DEFAULT_EOF;
    const detailRules = mapValues(rules, resolvePattern);

    this.#ruleMap = preProcess(detailRules);
    this.#ruleMap.regex.forEach($(prop("pattern"), assertRegExpFrag));
    this.#unknown = unknown;
    this.#eof = eof;
    this.#enableEof = !isFalse(_eof);
  }

  /** Analyze input lexically. */
  analyze(input: string): AnalyzeResult {
    const cursor = new CursorImpl(0);
    const tokens: FragmentToken[] = [];
    const ignoreTypes = new Set<string>();

    while (cursor.current < input.length) {
      const offset = cursor.current;
      const result = resolveRule({
        string: stringResolver,
        regex: regexResolver,
      }, { input, offset: cursor.current, ...this.#ruleMap });

      if (result) {
        if (result.ignore) {
          ignoreTypes.add(result.type);
        }
        tokens.push({ type: result.type, value: result.resolved, offset });
        cursor.next(result.resolved.length);
        continue;
      }

      const current = input.at(offset);
      cursor.next();

      if (current) {
        tokens.push({ type: this.#unknown, value: current, offset });
      }
    }

    if (this.#enableEof) {
      tokens.push({ type: this.#eof, value: "", offset: cursor.current });
    }

    const values = foldByType(columnLine(tokens), this.#unknown).filter(
      isNotIgnoreToken,
    );

    return { values };

    function isNotIgnoreToken(token: Token): boolean {
      return !ignoreTypes.has(token.type);
    }
  }
}

function getTokenByRegex(
  input: string,
  ctx: TypePatternContext["regex"],
): ResolveResult | undefined {
  const tokens: ResolveResult[] = [];

  ctx.forEach(({ pattern, ...rest }) => {
    const result = pattern.exec(input);

    if (result && result[0]) {
      tokens.push({ ...rest, pattern, resolved: result[0] });
    }
  });

  const maybeToken = maxBy(tokens, prop("resolved"));

  return maybeToken;
}

function resolvePattern(pattern: Pattern | Rule): Rule {
  if (isString(pattern) || isRegExp(pattern)) return { pattern };

  return pattern;
}

interface ResolverContext {
  input: string;
  offset: number;
}

function resolveRule(
  resolvers: ResolverMap,
  context: ResolverContext & TypePatternContext,
): ResolveResult | void {
  const r1 = resolvers.string(context, context.string);

  if (r1) return r1;

  const r2 = resolvers.regex(context, context.regex);

  if (r2) return r2;
}

type TypePatternMap = {
  [k in keyof PatternMap]: { pattern: PatternMap[k] } & Rule;
};

type TypePatternContext = {
  [k in keyof TypePatternMap]: (MatchContext & TypePatternMap[k])[];
};

type ResolverMap = {
  [k in keyof TypePatternContext]: ExtendArg<Resolver, TypePatternContext[k]>;
};

interface Typeable {
  type: string;
}

interface MatchContext extends Rule, Typeable {}

interface ResolveResult extends MatchContext {
  resolved: string;
}

interface Resolver {
  (context: ResolverContext): ResolveResult | void;
}

interface PreProcessor {
  (rules: Record<string, Rule>): TypePatternContext;
}

const $pattern = prop("pattern");

const preProcess: PreProcessor = (rules) => {
  const entries = Object.entries(rules);
  const typed = entries.map(([type, value]) => ({ type, ...value }));
  const strings = typed.filter(
    $($pattern, isString),
  ) as (TypePatternMap["string"] & Typeable)[];
  const regexs = typed.filter(
    $($pattern, isRegExp),
  ) as (TypePatternMap["regex"] & Typeable)[];
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

  if (result) return { ...result, resolved: result.pattern };
};

const regexResolver: ResolverMap["regex"] = ({ input, offset }, rules) => {
  const regex = rules.map(({ pattern, ...rest }) => {
    pattern.lastIndex = offset;

    return { ...rest, pattern };
  });
  const result = getTokenByRegex(input, regex);

  return result;
};
