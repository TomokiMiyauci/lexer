import { type ValueOf } from "./deps.ts";

/** Token object, a result of matching an individual lexing rule. */
export interface Token {
  /** Defined token type. */
  type: string;

  /** Actual input stream value. */
  value: string;
}

export interface Location {
  offset: number;
}

/** Map of token type and token patterns. */
export type Grammar = {
  readonly [k: string]: Rule | RuleOptions;
};

export interface RuleOptions {
  pattern: Rule;
  ignore?: boolean;
}

export interface RuleMap {
  string: string;
  regex: RegExp;
}

export type Rule = ValueOf<RuleMap>;

/** Result of lexical analyze. */
export interface AnalyzeResult {
  values: Token[];
}
