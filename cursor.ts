export interface Cursor {
  /** Current cursor position. */
  current: number;

  /** Move to next cursor position. */
  next: (step?: number) => number;
}

export class CursorImpl implements Cursor {
  constructor(public current: number) {}

  next(step?: number) {
    const incremental = step ? step : 1;

    this.current += incremental;
    return this.current;
  }
}
