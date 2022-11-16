import { type ValueOf } from "./deps.ts";

/** Token object, a result of matching an individual lexing rule. */
export interface Token extends Position {
  /** Token type. */
  readonly type: string;

  /** Actual input stream value. */
  readonly value: string;
}

export type FragmentToken = Pick<Token, "offset" | "type" | "value">;

export interface Position {
  /** Position offset from top of token stream. */
  readonly offset: number;

  readonly line: number;

  readonly column: number;
}

/** Map of token type and token patterns. */
export type Rules = {
  readonly [k: string]: Pattern | Rule;
};

export interface Rule {
  readonly pattern: Pattern;
  readonly ignore?: boolean;
}

export interface PatternMap {
  readonly string: string;
  readonly regex: RegExp;
}

export type Pattern = ValueOf<PatternMap>;
