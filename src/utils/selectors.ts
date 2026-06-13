import type { AppData, Expense } from "../models/types";
import { memberShares } from "../models/types";
import { monthKeyOf, remapDateToMonth } from "./date";
import { sumAmounts } from "./money";

/** Pure, testable data shaping for the views. No React in here. */

export function expensesForMonth(expenses: Expense[], monthKey: string): Expense[] {
  return expenses.filter((e) => monthKeyOf(e.date) === monthKey);
}

/**
 * Build copies of a month's expenses, re-dated into a target month and tagged
 * as migrated (so the UI can show a "from <month>" Keep/Remove mark). Pure:
 * the id factory and timestamp are injected so this is easy to test.
 */
export function migratedCopies(
  source: Expense[],
  sourceMonthKey: string,
  targetMonthKey: string,
  makeId: () => string,
  now: string
): Expense[] {
  return source.map((e) => ({
    ...e,
    id: makeId(),
    date: remapDateToMonth(e.date, targetMonthKey),
    migratedFrom: sourceMonthKey,
    createdAt: now,
  }));
}

/** All month keys that have at least one expense, newest first. */
export function monthsWithData(expenses: Expense[]): string[] {
  const set = new Set(expenses.map((e) => monthKeyOf(e.date)));
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export interface Breakdown {
  key: string;
  label: string;
  color: string;
  icon?: string;
  total: number;
  count: number;
  /** Share of the month total, 0..1. */
  share: number;
}

export function categoryBreakdown(data: AppData, monthExpenses: Expense[]): Breakdown[] {
  const total = sumAmounts(monthExpenses.map((e) => e.amount));
  const byCat = new Map<string, { total: number; count: number }>();
  for (const e of monthExpenses) {
    const cur = byCat.get(e.categoryId) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    byCat.set(e.categoryId, cur);
  }
  const rows: Breakdown[] = [];
  for (const [catId, agg] of byCat) {
    const cat = data.categories.find((c) => c.id === catId);
    rows.push({
      key: catId,
      label: cat?.name ?? "Unknown",
      color: cat?.color ?? "#94a3b8",
      icon: cat?.icon,
      total: Math.round(agg.total * 100) / 100,
      count: agg.count,
      share: total > 0 ? agg.total / total : 0,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

export function memberBreakdown(data: AppData, monthExpenses: Expense[]): Breakdown[] {
  const total = sumAmounts(monthExpenses.map((e) => e.amount));
  const byMem = new Map<string, { total: number; count: number }>();
  for (const e of monthExpenses) {
    // A split item contributes each member's share; the count rises once per
    // member that participates in the item.
    for (const share of memberShares(e)) {
      const cur = byMem.get(share.memberId) ?? { total: 0, count: 0 };
      cur.total += share.amount;
      cur.count += 1;
      byMem.set(share.memberId, cur);
    }
  }
  const rows: Breakdown[] = [];
  for (const [memId, agg] of byMem) {
    const mem = data.members.find((m) => m.id === memId);
    rows.push({
      key: memId,
      label: mem?.name ?? "Unknown",
      color: mem?.color ?? "#94a3b8",
      total: Math.round(agg.total * 100) / 100,
      count: agg.count,
      share: total > 0 ? agg.total / total : 0,
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

export type SortField = "date" | "description" | "category" | "member" | "amount";
export type SortDir = "asc" | "desc";

export interface ExpenseFilter {
  search: string;
  categoryId: string | "all";
  memberId: string | "all";
}

/** Apply search + filters + sort to a month's expenses for the table view. */
export function filterAndSort(
  data: AppData,
  monthExpenses: Expense[],
  filter: ExpenseFilter,
  sortField: SortField,
  sortDir: SortDir
): Expense[] {
  const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));
  const memberName = new Map(data.members.map((m) => [m.id, m.name]));
  const q = filter.search.trim().toLowerCase();

  let rows = monthExpenses.filter((e) => {
    if (filter.categoryId !== "all" && e.categoryId !== filter.categoryId) return false;
    // A split item matches a member filter if that member holds any share.
    const memberIds = memberShares(e).map((s) => s.memberId);
    if (filter.memberId !== "all" && !memberIds.includes(filter.memberId)) return false;
    if (q) {
      const haystack = [
        e.description,
        e.notes,
        categoryName.get(e.categoryId) ?? "",
        ...memberIds.map((id) => memberName.get(id) ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const dir = sortDir === "asc" ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    switch (sortField) {
      case "amount":
        return (a.amount - b.amount) * dir;
      case "description":
        return a.description.localeCompare(b.description) * dir;
      case "category":
        return (categoryName.get(a.categoryId) ?? "").localeCompare(
          categoryName.get(b.categoryId) ?? ""
        ) * dir;
      case "member":
        return (memberName.get(a.memberId) ?? "").localeCompare(
          memberName.get(b.memberId) ?? ""
        ) * dir;
      case "date":
      default:
        return a.date.localeCompare(b.date) * dir;
    }
  });
  return rows;
}
