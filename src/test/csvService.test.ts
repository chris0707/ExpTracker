import { describe, it, expect } from "vitest";
import type { AppData } from "../models/types";
import { exportExpensesToCsv, importExpensesFromCsv } from "../services/csvService";

function fixture(): AppData {
  return {
    members: [{ id: "mem_1", name: "Mom", color: "#000" }],
    categories: [
      { id: "cat_1", name: "Groceries", color: "#000", icon: "🛒", isDefault: true },
    ],
    expenses: [
      {
        id: "exp_1",
        date: "2026-06-01",
        description: "Milk, eggs",
        categoryId: "cat_1",
        memberId: "mem_1",
        amount: 12.5,
        notes: "weekly",
        createdAt: "2026-06-01T00:00:00.000Z",
      },
    ],
  };
}

describe("CSV export", () => {
  it("writes a header and resolves ids to names; quotes commas", () => {
    const csv = exportExpensesToCsv(fixture());
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Date,Description,Category,Member,Amount,Notes,Split");
    expect(lines[1]).toBe('2026-06-01,"Milk, eggs",Groceries,Mom,12.50,weekly,');
  });
});

describe("CSV import", () => {
  it("maps known names to ids and counts imports", () => {
    const data = fixture();
    const csv =
      "Date,Description,Category,Member,Amount,Notes\n2026-06-02,Bread,Groceries,Mom,3.20,";
    const result = importExpensesFromCsv(csv, data);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.expenses[0].categoryId).toBe("cat_1");
    expect(result.expenses[0].memberId).toBe("mem_1");
    expect(result.expenses[0].amount).toBe(3.2);
  });

  it("flags unknown category/member names for creation", () => {
    const csv = "2026-06-03,Bus,Transport,Dad,2.00,";
    const result = importExpensesFromCsv(csv, fixture());
    expect(result.newCategoryNames).toContain("Transport");
    expect(result.newMemberNames).toContain("Dad");
    expect(result.expenses[0].categoryId).toBe("name:Transport");
    expect(result.expenses[0].memberId).toBe("name:Dad");
  });

  it("skips malformed rows (bad date or amount) but keeps good ones", () => {
    const csv = [
      "Date,Description,Category,Member,Amount,Notes",
      "not-a-date,Bad,Groceries,Mom,5,",
      "2026-06-04,Good,Groceries,Mom,5,",
      "2026-06-05,NoAmount,Groceries,Mom,abc,",
    ].join("\n");
    const result = importExpensesFromCsv(csv, fixture());
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
  });

  it("round-trips export -> import without loss", () => {
    const data = fixture();
    const csv = exportExpensesToCsv(data);
    const result = importExpensesFromCsv(csv, data);
    expect(result.imported).toBe(1);
    expect(result.expenses[0].description).toBe("Milk, eggs");
    expect(result.expenses[0].amount).toBe(12.5);
  });
});

describe("CSV splits", () => {
  function splitData(): AppData {
    return {
      members: [
        { id: "mem_1", name: "Mom", color: "#000" },
        { id: "mem_2", name: "Dad", color: "#111" },
      ],
      categories: [
        { id: "cat_1", name: "Groceries", color: "#000", icon: "🛒", isDefault: true },
      ],
      expenses: [
        {
          id: "exp_1",
          date: "2026-06-01",
          description: "Dinner",
          categoryId: "cat_1",
          memberId: "mem_1",
          amount: 30,
          notes: "",
          splits: [
            { memberId: "mem_1", amount: 20 },
            { memberId: "mem_2", amount: 10 },
          ],
          createdAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    };
  }

  it("exports split shares to the Split column", () => {
    const csv = exportExpensesToCsv(splitData());
    const line = csv.split("\r\n")[1];
    expect(line.endsWith("Mom:20.00; Dad:10.00")).toBe(true);
  });

  it("round-trips a split expense", () => {
    const data = splitData();
    const csv = exportExpensesToCsv(data);
    const result = importExpensesFromCsv(csv, data);
    expect(result.imported).toBe(1);
    const e = result.expenses[0];
    expect(e.splits).toEqual([
      { memberId: "mem_1", amount: 20 },
      { memberId: "mem_2", amount: 10 },
    ]);
    expect(e.memberId).toBe("mem_1");
  });

  it("flags unknown members named only in the Split column", () => {
    const csv =
      "Date,Description,Category,Member,Amount,Notes,Split\n" +
      "2026-06-02,Pizza,Groceries,Mom,12.00,,Mom:6.00; Kid:6.00";
    const result = importExpensesFromCsv(csv, splitData());
    expect(result.newMemberNames).toContain("Kid");
    expect(result.expenses[0].splits?.[1].memberId).toBe("name:Kid");
  });

  it("treats a single-share or malformed Split cell as not split", () => {
    const csv =
      "Date,Description,Category,Member,Amount,Notes,Split\n" +
      "2026-06-03,Solo,Groceries,Mom,5.00,,Mom:5.00";
    const result = importExpensesFromCsv(csv, splitData());
    expect(result.expenses[0].splits).toBeUndefined();
  });
});
