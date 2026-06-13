import { config } from "../config";

/** Format a number as currency using the configured locale + currency. */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Parse loose user input ("$1,234.50", "  12.5 ", "abc") into a clean,
 * non-negative number. Returns NaN when nothing usable is found so callers
 * can show a validation message.
 */
export function parseAmount(raw: string): number {
  if (typeof raw !== "string") return NaN;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return NaN;
  return Math.abs(Math.round(value * 100) / 100);
}

/** Sum a list of expense amounts safely. */
export function sumAmounts(amounts: number[]): number {
  const total = amounts.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Divide a total into `parts` shares that sum back to exactly the total (to the
 * cent). Any leftover cents from rounding are spread one-per-share across the
 * earliest shares, so e.g. 10.00 / 3 = [3.34, 3.33, 3.33].
 */
export function splitEvenly(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const totalCents = Math.round((Number.isFinite(total) ? total : 0) * 100);
  const base = Math.floor(totalCents / parts);
  let remainder = totalCents - base * parts;
  const shares: number[] = [];
  for (let i = 0; i < parts; i++) {
    const cents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    shares.push(cents / 100);
  }
  return shares;
}
