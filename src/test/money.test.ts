import { describe, it, expect } from "vitest";
import { parseAmount, splitEvenly, sumAmounts } from "../utils/money";

describe("parseAmount", () => {
  it.each([
    ["12.50", 12.5],
    ["$1,234.56", 1234.56],
    ["  9 ", 9],
    ["-40", 40], // amounts are stored non-negative
    ["10.999", 11], // rounded to cents
  ])("parses %s -> %s", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "abc", ".", "-", "$"])("returns NaN for %s", (input) => {
    expect(Number.isNaN(parseAmount(input))).toBe(true);
  });
});

describe("sumAmounts", () => {
  it.each([
    [[1, 2, 3], 6],
    [[0.1, 0.2], 0.3],
    [[], 0],
    [[10, NaN, 5], 15],
  ])("sums %j -> %s", (input, expected) => {
    expect(sumAmounts(input as number[])).toBe(expected);
  });
});

describe("splitEvenly", () => {
  it("divides evenly when it divides cleanly", () => {
    expect(splitEvenly(10, 2)).toEqual([5, 5]);
  });

  it("spreads leftover cents across the earliest shares", () => {
    expect(splitEvenly(10, 3)).toEqual([3.34, 3.33, 3.33]);
  });

  it("always sums back to the original total", () => {
    for (const [total, parts] of [
      [100, 7],
      [0.1, 3],
      [12.5, 4],
      [99.99, 6],
    ] as const) {
      expect(sumAmounts(splitEvenly(total, parts))).toBe(total);
    }
  });

  it("returns an empty array for non-positive parts", () => {
    expect(splitEvenly(10, 0)).toEqual([]);
  });
});
