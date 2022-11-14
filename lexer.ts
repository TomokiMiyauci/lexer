import {
  $,
  type ExtendArg,
  filterValues,
  isRegExp,
  isString,
  mapValues,
  maxBy,
  prop,
} from "./deps.ts";
import { assertRegExpFrag, uniqueChar } from "./utils.ts";
import type {
  AnalyzeResult,
  Grammar,
  RuleMap,
  RuleOptions,
  Token,
} from "./types.ts";
import { CursorImpl } from "./cursor.ts";

export interface LexerOptions {
  /**
   * @default "UNKNOWN"
   */
  readonly unknownType?: string;
}

const DEFAULT_UNKNOWN = "UNKNOWN";

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

  constructor(grammar: Grammar, options?: LexerOptions) {
    const rules = mapValues(grammar, resolveOptions);
    this.#ruleMap = preProcess(rules);

    this.#ruleMap.regex.forEach($(prop("pattern"), assertRegExpFrag));
    this.#unknown = options?.unknownType ?? DEFAULT_UNKNOWN;
  }

  /** Analyze input lexically. */
  analyze(input: string): AnalyzeResult {
    const cursor = new CursorImpl(0);
    const tokens: AnalyzeResult["values"] = [];
    const errorStack: Token[] = [];

    while (cursor.current < input.length) {
      const result = resolveRule({
        string: stringResolver,
        regex: regexResolver,
      }, {
        input,
        offset: cursor.current,
        ...this.#ruleMap,
      });

      if (result) {
        const errorToken = foldToken(errorStack);
        errorStack.length = 0;
        if (errorToken) {
          tokens.push(errorToken);
        }
        if (!result.ignore) {
          tokens.push({
            type: result.type,
            value: result.resolved,
          });
        }
        cursor.next(result.resolved.length);
        continue;
      }

      const current = input.at(cursor.current);
      cursor.next();

      if (current) {
        errorStack.push({
          type: this.#unknown,
          value: current,
        });
      }
    }

    const errorToken = foldToken(errorStack);
    errorStack.length = 0;
    if (errorToken) {
      tokens.push(errorToken);
    }

    return {
      values: tokens,
    };
  }
}

function foldToken(tokens: readonly Token[]): Token | void {
  if (!tokens.length) return;

  const token = Array.from(tokens).reduce((acc, cur) => {
    return {
      type: cur.type,
      value: acc.value + cur.value,
    };
  });

  return token;
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

export function resolveOptions(
  options: string | RegExp | RuleOptions,
): RuleOptions {
  if (isString(options) || isRegExp(options)) {
    return {
      pattern: options,
    };
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

interface MatchContext extends RuleOptions {
  type: string;
}

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
  const stringRules = filterValues(
    rules,
    $($pattern, isString),
  ) as Record<string, TypeRuleMap["string"]>;

  const string = Object.entries(stringRules).map(([type, value]) => {
    return {
      type,
      ...value,
    };
  }).toSorted((a, b) => b.pattern.length - a.pattern.length);

  const regexRules = filterValues(
    rules,
    $($pattern, isRegExp),
  ) as Record<string, TypeRuleMap["regex"]>;

  const result = Object.entries(regexRules).map(([type, value]) => {
    return {
      type,
      ...value,
    };
  });

  const regex = result.map((
    { pattern, ...rest },
  ) => ({
    ...rest,
    pattern: new RegExp(pattern, uniqueChar("y", pattern.flags)),
  }));

  return {
    string,
    regex,
  };
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
    return {
      ...rest,
      pattern,
    };
  });

  const tokenFromRegex = getTokenByRegex(input, regex);

  return tokenFromRegex;
};
