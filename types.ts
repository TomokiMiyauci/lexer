import { type ValueOf } from "./deps.ts";

/** Token object, a result of matching an individual lexing rule. */
export interface Token extends Position {
  /** Token type. */
  readonly type: string;

  /** Actual input stream value. */
  readonly value: string;
}

export type FragmentToken = Pick<Token, "offset" | "type" | "value">;

// export interface Range {
//   /** Position offset from top of token stream. */
//   readonly offset: number;
// }

// export interface Location {
//   /** Position of the first character of the token. */
//   readonly start: Position;

//   /** Position of the last character of the token. */
//   readonly end: Position;
// }

export interface Position {
  /** Position offset from top of token stream. */
  readonly offset: number;

  readonly line: number;

  readonly column: number;
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
