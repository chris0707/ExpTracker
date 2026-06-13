import type { AppData, Expense, ExpenseSplit } from "../models/types";
import { isSplit } from "../models/types";
import { newId } from "../utils/id";
import { parseAmount } from "../utils/money";

/**
 * CSV import/export for expense records. This is the "file for record
 * purposes" the household keeps: one row per expense, human-readable, and
 * openable in Excel/Sheets. Member and category are written as NAMES (not ids)
 * so the file makes sense on its own.
 *
 * A split item (shared across members) keeps its single row; the per-member
 * shares are written to a trailing "Split" column as "Name:amount; Name:amount"
 * so the file still round-trips. Non-split rows leave that column blank.
 */

const HEADERS = ["Date", "Description", "Category", "Member", "Amount", "Notes", "Split"] as const;

/** Encode an expense's per-member shares for the CSV "Split" column. */
function encodeSplit(e: Expense, memberName: Map<string, string>): string {
  if (!isSplit(e)) return "";
  return (e.splits as ExpenseSplit[])
    .map((s) => `${memberName.get(s.memberId) ?? "Household"}:${s.amount.toFixed(2)}`)
    .join("; ");
}

/** Escape a single CSV cell per RFC 4180 (quote when needed, double inner quotes). */
function escapeCell(value: string): string {
  const v = value ?? "";
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

/** Build a CSV string from the current data, resolving ids to readable names. */
export function exportExpensesToCsv(data: AppData): string {
  const memberName = new Map(data.members.map((m) => [m.id, m.name]));
  const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));

  const rows = [...data.expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) =>
      [
        e.date,
        escapeCell(e.description),
        escapeCell(categoryName.get(e.categoryId) ?? "Other"),
        escapeCell(memberName.get(e.memberId) ?? "Household"),
        e.amount.toFixed(2),
        escapeCell(e.notes ?? ""),
        escapeCell(encodeSplit(e, memberName)),
      ].join(",")
    );

  return [HEADERS.join(","), ...rows].join("\r\n");
}

/** Split one CSV line into fields, honoring quotes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export interface CsvImportResult {
  expenses: Expense[];
  imported: number;
  skipped: number;
  /** Names found in the file that should be created as members/categories. */
  newMemberNames: string[];
  newCategoryNames: string[];
}

/**
 * Parse a CSV string into expenses, mapping category/member names back to ids.
 * Unknown names are reported so the caller can create them. Malformed rows are
 * skipped (counted) rather than aborting the whole import.
 */
export function importExpensesFromCsv(csv: string, data: AppData): CsvImportResult {
  const lines = csv.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  const result: CsvImportResult = {
    expenses: [],
    imported: 0,
    skipped: 0,
    newMemberNames: [],
    newCategoryNames: [],
  };
  if (lines.length === 0) return result;

  // Detect & skip a header row if present.
  const first = parseCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  const hasHeader = first[0] === "date";
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const memberByName = new Map(data.members.map((m) => [m.name.toLowerCase(), m.id]));
  const categoryByName = new Map(
    data.categories.map((c) => [c.name.toLowerCase(), c.id])
  );
  const seenNewMembers = new Set<string>();
  const seenNewCategories = new Set<string>();

  // Resolve a member name to its id, or a "name:" placeholder for the caller,
  // registering unknown names so they get created on import.
  const memberIdFor = (rawName: string): string => {
    const name = rawName.trim() || "Household";
    const key = name.toLowerCase();
    if (memberByName.has(key)) return memberByName.get(key) as string;
    if (!seenNewMembers.has(key)) {
      seenNewMembers.add(key);
      result.newMemberNames.push(name);
    }
    return `name:${name}`;
  };

  for (const line of dataLines) {
    const cells = parseCsvLine(line);
    const [date, description, category, member, amountRaw, notes, splitRaw] = cells;

    const amount = parseAmount(amountRaw ?? "");
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test((date ?? "").trim());
    if (!validDate || Number.isNaN(amount)) {
      result.skipped++;
      continue;
    }

    const catName = (category ?? "Other").trim() || "Other";

    if (!categoryByName.has(catName.toLowerCase()) && !seenNewCategories.has(catName.toLowerCase())) {
      seenNewCategories.add(catName.toLowerCase());
      result.newCategoryNames.push(catName);
    }

    const splits = parseSplitCell(splitRaw ?? "", memberIdFor);
    // For split rows the primary member is the first share; otherwise the
    // Member column. memberIdFor also registers any unknown names.
    const memberId = splits ? splits[0].memberId : memberIdFor(member ?? "Household");

    // ids are resolved later by the caller (after it creates any new
    // members/categories); we stash names in the id fields temporarily via a
    // resolver-friendly shape. To keep this pure, we resolve known ones now and
    // leave unknown ones as the raw name for the caller to fix up.
    result.expenses.push({
      id: newId("exp"),
      date: date.trim(),
      description: (description ?? "").trim(),
      categoryId: categoryByName.get(catName.toLowerCase()) ?? `name:${catName}`,
      memberId,
      amount,
      notes: (notes ?? "").trim(),
      ...(splits ? { splits } : {}),
      createdAt: new Date().toISOString(),
    });
    result.imported++;
  }

  return result;
}

/**
 * Parse a "Name:amount; Name:amount" split cell into shares. Returns undefined
 * when the cell is blank or describes fewer than two valid shares (so the row
 * stays a normal single-member expense). Member ids are resolved via the
 * supplied resolver, which also registers unknown names for creation.
 */
function parseSplitCell(
  raw: string,
  memberIdFor: (name: string) => string
): ExpenseSplit[] | undefined {
  const parts = raw.split(";").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;
  const splits: ExpenseSplit[] = [];
  for (const part of parts) {
    const sep = part.lastIndexOf(":");
    if (sep < 0) return undefined;
    const name = part.slice(0, sep).trim();
    const amount = parseAmount(part.slice(sep + 1));
    if (!name || Number.isNaN(amount)) return undefined;
    splits.push({ memberId: memberIdFor(name), amount });
  }
  return splits.length > 1 ? splits : undefined;
}

export const CSV_HEADERS = HEADERS;

/**
 * Build the CSV and trigger a browser download as `expenses-<dateStamp>.csv`.
 * Shared by the Settings "Export" button and the post-print backup nudge so
 * both produce identical files. (Browser-only - relies on Blob/DOM APIs.)
 */
export function downloadExpensesCsv(data: AppData, dateStamp: string): void {
  const csv = exportExpensesToCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${dateStamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
