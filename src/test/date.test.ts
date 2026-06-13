import { describe, it, expect } from "vitest";
import { daysInMonth, monthKeyOf, remapDateToMonth, shiftMonthKey } from "../utils/date";

describe("monthKeyOf", () => {
  it.each([
    ["2026-06-11", "2026-06"],
    ["2025-12-31", "2025-12"],
  ])("%s -> %s", (input, expected) => {
    expect(monthKeyOf(input)).toBe(expected);
  });
});

describe("shiftMonthKey", () => {
  it.each([
    ["2026-06", 1, "2026-07"],
    ["2026-06", -1, "2026-05"],
    ["2026-12", 1, "2027-01"], // rolls over the year
    ["2026-01", -1, "2025-12"],
    ["2026-06", -6, "2025-12"],
  ])("shift %s by %i -> %s", (key, delta, expected) => {
    expect(shiftMonthKey(key, delta)).toBe(expected);
  });
});

describe("daysInMonth", () => {
  it.each([
    ["2026-01", 31],
    ["2026-02", 28],
    ["2024-02", 29], // leap year
    ["2026-04", 30],
  ])("%s -> %i days", (key, expected) => {
    expect(daysInMonth(key)).toBe(expected);
  });
});

describe("remapDateToMonth", () => {
  it("keeps the day-of-month when it fits", () => {
    expect(remapDateToMonth("2026-05-15", "2026-06")).toBe("2026-06-15");
  });

  it("clamps to the target month's last day", () => {
    expect(remapDateToMonth("2026-01-31", "2026-02")).toBe("2026-02-28");
    expect(remapDateToMonth("2024-01-31", "2024-02")).toBe("2024-02-29");
  });
});
