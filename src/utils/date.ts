/** Date helpers. A "month key" is the string "YYYY-MM" used to group expenses. */

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-06-11" -> "2026-06" */
export function monthKeyOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  return todayIso().slice(0, 7);
}

/** Shift a "YYYY-MM" key by N months (positive = forward). */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split("-");
  const date = new Date(Number(yStr), Number(mStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Number of days in a "YYYY-MM" month (handles leap years). */
export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  // Day 0 of the next month is the last day of this one.
  return new Date(y, m, 0).getDate();
}

/**
 * Move an ISO date onto a different month, keeping the day-of-month but
 * clamping it to that month's length (e.g. Jan 31 -> Feb 28). Used when copying
 * last month's items into the current month.
 */
export function remapDateToMonth(isoDate: string, monthKey: string): string {
  const day = Number(isoDate.slice(8, 10)) || 1;
  const clamped = Math.min(day, daysInMonth(monthKey));
  return `${monthKey}-${String(clamped).padStart(2, "0")}`;
}

/** "2026-06" -> "June 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const date = new Date(Number(yStr), Number(mStr) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** "2026-06-11" -> "Jun 11" (compact, for table rows). */
export function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
