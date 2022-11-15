import { type ValueOf } from "./deps.ts";

/** Token object, a result of matching an individual lexing rule. */
export interface Token extends Range {
  /** Token type. */
  readonly type: string;

  /** Actual input stream value. */
  readonly value: string;
}

export interface Range {
  /** Position offset from top of token stream. */
  readonly offset: number;
}

/** Map of token type and token patterns. */
export type Grammar = {
  readonly [k: string]: Rule | RuleOptions;
};

export interface RuleOptions {
  readonly pattern: Rule;
  readonly ignore?: boolean;
}

export interface RuleMap {
  readonly string: string;
  readonly regex: RegExp;
}

export type Rule = ValueOf<RuleMap>;

/** Result of lexical analyze. */
export interface AnalyzeResult {
  readonly values: Token[];
}
