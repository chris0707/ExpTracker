/**
 * Domain models shared across the whole app. These are intentionally plain
 * data shapes (no behavior) so they map cleanly to a CSV row or a Google
 * Sheets row when the storage backend is swapped later.
 */

export interface Member {
  id: string;
  name: string;
  /** Hex color used for the member's chip/avatar. */
  color: string;
}

export interface Category {
  id: string;
  name: string;
  /** Hex color used for the category chip and breakdown bars. */
  color: string;
  /** Emoji shown next to the name so the list is scannable at a glance. */
  icon: string;
  /** True for built-in categories so the UI can label them. */
  isDefault: boolean;
}

/** One member's share of a split expense. Shares always sum to the expense amount. */
export interface ExpenseSplit {
  memberId: string;
  /** This member's portion in major currency units, always >= 0. */
  amount: number;
}

export interface Expense {
  id: string;
  /** ISO date string, "YYYY-MM-DD". */
  date: string;
  description: string;
  categoryId: string;
  /**
   * The primary/paying member. Always set. When `splits` is present this is
   * kept for back-compat and defaults to the first split's member.
   */
  memberId: string;
  /** Amount in major currency units (e.g. dollars), always >= 0. */
  amount: number;
  notes: string;
  /**
   * When set (2+ entries), the item is split across multiple members and each
   * share is attributed to its member. When absent/empty, the whole `amount`
   * belongs to `memberId`.
   */
  splits?: ExpenseSplit[];
  /**
   * Set to the source month key ("YYYY-MM") when this row was copied from a
   * previous month and is still awaiting confirmation. The UI shows a "from
   * <month>" mark with Keep/Remove until the user confirms; "Keep" clears this.
   */
  migratedFrom?: string;
  /** ISO timestamp of when the row was created. */
  createdAt: string;
}

/** True when an expense is shared across multiple members. */
export function isSplit(expense: Expense): boolean {
  return Array.isArray(expense.splits) && expense.splits.length > 1;
}

/**
 * The per-member shares of an expense. For a split, returns its `splits`;
 * otherwise the full amount attributed to the single `memberId`. This is the
 * one place that normalizes the two shapes so callers never branch.
 */
export function memberShares(expense: Expense): ExpenseSplit[] {
  if (isSplit(expense)) return expense.splits as ExpenseSplit[];
  return [{ memberId: expense.memberId, amount: expense.amount }];
}

/** The full snapshot the app persists and restores. */
export interface AppData {
  members: Member[];
  categories: Category[];
  expenses: Expense[];
}

export function emptyAppData(): AppData {
  return { members: [], categories: [], expenses: [] };
}
