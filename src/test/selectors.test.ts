import { describe, it, expect } from "vitest";
import type { AppData, Expense } from "../models/types";
import {
  categoryBreakdown,
  expensesForMonth,
  filterAndSort,
  memberBreakdown,
  migratedCopies,
  monthsWithData,
} from "../utils/selectors";

function makeExpense(partial: Partial<Expense>): Expense {
  return {
    id: Math.random().toString(),
    date: "2026-06-01",
    description: "x",
    categoryId: "cat_1",
    memberId: "mem_1",
    amount: 10,
    notes: "",
    createdAt: "",
    ...partial,
  };
}

const data: AppData = {
  members: [
    { id: "mem_1", name: "Mom", color: "#000" },
    { id: "mem_2", name: "Dad", color: "#111" },
  ],
  categories: [
    { id: "cat_1", name: "Groceries", color: "#000", icon: "🛒", isDefault: true },
    { id: "cat_2", name: "Transport", color: "#111", icon: "🚗", isDefault: true },
  ],
  expenses: [
    makeExpense({ id: "a", date: "2026-06-01", categoryId: "cat_1", amount: 30 }),
    makeExpense({ id: "b", date: "2026-06-15", categoryId: "cat_2", amount: 10 }),
    makeExpense({ id: "c", date: "2026-05-20", categoryId: "cat_1", amount: 99 }),
  ],
};

describe("expensesForMonth", () => {
  it("returns only that month's rows", () => {
    expect(expensesForMonth(data.expenses, "2026-06").map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("monthsWithData", () => {
  it("lists distinct months newest first", () => {
    expect(monthsWithData(data.expenses)).toEqual(["2026-06", "2026-05"]);
  });
});

describe("categoryBreakdown", () => {
  it("aggregates totals and shares, sorted by total desc", () => {
    const june = expensesForMonth(data.expenses, "2026-06");
    const rows = categoryBreakdown(data, june);
    expect(rows[0].label).toBe("Groceries");
    expect(rows[0].total).toBe(30);
    expect(rows[0].share).toBeCloseTo(0.75);
    expect(rows[1].label).toBe("Transport");
  });
});

describe("memberBreakdown with splits", () => {
  const splitData: AppData = {
    members: data.members,
    categories: data.categories,
    expenses: [
      makeExpense({ id: "s", amount: 30, memberId: "mem_1", date: "2026-06-01" }),
      makeExpense({
        id: "t",
        amount: 30,
        memberId: "mem_1",
        date: "2026-06-02",
        splits: [
          { memberId: "mem_1", amount: 20 },
          { memberId: "mem_2", amount: 10 },
        ],
      }),
    ],
  };

  it("attributes each member their share of a split item", () => {
    const june = expensesForMonth(splitData.expenses, "2026-06");
    const rows = memberBreakdown(splitData, june);
    const mom = rows.find((r) => r.label === "Mom");
    const dad = rows.find((r) => r.label === "Dad");
    expect(mom?.total).toBe(50); // 30 solo + 20 share
    expect(dad?.total).toBe(10); // 10 share
    expect(dad?.count).toBe(1);
  });
});

describe("filterAndSort with splits", () => {
  const june = expensesForMonth(
    [
      makeExpense({ id: "x", memberId: "mem_1" }),
      makeExpense({
        id: "y",
        memberId: "mem_1",
        splits: [
          { memberId: "mem_1", amount: 5 },
          { memberId: "mem_2", amount: 5 },
        ],
      }),
    ],
    "2026-06"
  );

  it("matches a split item when filtering by a non-primary member", () => {
    const rows = filterAndSort(
      data,
      june,
      { search: "", categoryId: "all", memberId: "mem_2" },
      "date",
      "asc"
    );
    expect(rows.map((r) => r.id)).toEqual(["y"]);
  });
});

describe("migratedCopies", () => {
  it("re-dates into the target month and tags each copy for review", () => {
    const source = [
      makeExpense({ id: "a", date: "2026-05-03", amount: 12 }),
      makeExpense({ id: "b", date: "2026-05-31", amount: 8 }),
    ];
    let n = 0;
    const copies = migratedCopies(source, "2026-05", "2026-06", () => `new_${n++}`, "TS");

    expect(copies.map((c) => c.id)).toEqual(["new_0", "new_1"]);
    expect(copies.map((c) => c.date)).toEqual(["2026-06-03", "2026-06-30"]); // clamped
    expect(copies.every((c) => c.migratedFrom === "2026-05")).toBe(true);
    expect(copies.every((c) => c.createdAt === "TS")).toBe(true);
    // Original data (description, amount) carries over.
    expect(copies[0].amount).toBe(12);
  });
});

describe("filterAndSort", () => {
  const june = expensesForMonth(data.expenses, "2026-06");

  it("filters by category", () => {
    const rows = filterAndSort(
      data,
      june,
      { search: "", categoryId: "cat_2", memberId: "all" },
      "date",
      "asc"
    );
    expect(rows.map((r) => r.id)).toEqual(["b"]);
  });

  it("sorts by amount descending", () => {
    const rows = filterAndSort(
      data,
      june,
      { search: "", categoryId: "all", memberId: "all" },
      "amount",
      "desc"
    );
    expect(rows.map((r) => r.amount)).toEqual([30, 10]);
  });
});
