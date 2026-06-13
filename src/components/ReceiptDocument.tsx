import { createPortal } from "react-dom";
import type { AppData, Expense } from "../models/types";
import { isSplit, memberShares } from "../models/types";
import { categoryBreakdown, memberBreakdown } from "../utils/selectors";
import { formatMoney, sumAmounts } from "../utils/money";
import { formatMonthLabel, formatDayLabel } from "../utils/date";
import { config } from "../config";
import type { ExpenseFilter } from "../utils/selectors";

interface Props {
  data: AppData;
  monthKey: string;
  /** The currently visible (filtered/sorted) rows - what-you-see-is-what-you-print. */
  rows: Expense[];
  includeItems: boolean;
  isFiltered: boolean;
  filter: ExpenseFilter;
}

/** Build a short human description of any active filter, for the receipt header. */
function filterSummary(data: AppData, filter: ExpenseFilter): string {
  const parts: string[] = [];
  if (filter.categoryId !== "all") {
    parts.push(data.categories.find((c) => c.id === filter.categoryId)?.name ?? "category");
  }
  if (filter.memberId !== "all") {
    parts.push(data.members.find((m) => m.id === filter.memberId)?.name ?? "member");
  }
  if (filter.search.trim()) parts.push(`"${filter.search.trim()}"`);
  return parts.join(" · ");
}

/**
 * A print-only, thermal-receipt-styled document. It lives in a portal on
 * <body> with id="receipt-print"; CSS hides it on screen and reveals it (and
 * hides the app) when printing. The browser print dialog covers both real
 * printing and "Save as PDF".
 */
export function ReceiptDocument({ data, monthKey, rows, includeItems, isFiltered, filter }: Props) {
  const total = sumAmounts(rows.map((r) => r.amount));
  const cats = categoryBreakdown(data, rows);
  const members = memberBreakdown(data, rows);
  const memberName = new Map(data.members.map((m) => [m.id, m.name]));
  const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));
  const now = new Date();

  return createPortal(
    <div id="receipt-print" aria-hidden="true">
      <div className="rcpt">
        <div className="rcpt-center rcpt-brand">{config.appName.toUpperCase()}</div>
        <div className="rcpt-center rcpt-tagline">EXPENSE RECEIPT</div>
        <div className="rcpt-rule" />

        <div className="rcpt-center rcpt-month">{formatMonthLabel(monthKey)}</div>
        <div className="rcpt-meta">
          <span>Printed</span>
          <span>{now.toLocaleString(config.locale)}</span>
        </div>
        {isFiltered && (
          <div className="rcpt-meta">
            <span>Filtered</span>
            <span>{filterSummary(data, filter) || "view"}</span>
          </div>
        )}
        <div className="rcpt-meta">
          <span>Items</span>
          <span>{rows.length}</span>
        </div>

        <div className="rcpt-rule-dashed" />

        <div className="rcpt-section-title">BY CATEGORY</div>
        {cats.length === 0 ? (
          <div className="rcpt-empty">No expenses.</div>
        ) : (
          cats.map((c) => (
            <div className="rcpt-line" key={c.key}>
              <span className="rcpt-line-name">
                {c.icon ? `${c.icon} ` : ""}
                {c.label}
                <span className="rcpt-pct"> {(c.share * 100).toFixed(0)}%</span>
              </span>
              <span className="rcpt-dots" />
              <span className="rcpt-line-amt">{formatMoney(c.total)}</span>
            </div>
          ))
        )}

        <div className="rcpt-rule-dashed" />

        <div className="rcpt-section-title">BY MEMBER</div>
        {members.map((m) => (
          <div className="rcpt-line" key={m.key}>
            <span className="rcpt-line-name">
              {m.label}
              <span className="rcpt-pct"> {(m.share * 100).toFixed(0)}%</span>
            </span>
            <span className="rcpt-dots" />
            <span className="rcpt-line-amt">{formatMoney(m.total)}</span>
          </div>
        ))}

        {includeItems && rows.length > 0 && (
          <>
            <div className="rcpt-rule-dashed" />
            <div className="rcpt-section-title">ITEMS</div>
            {[...rows]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <div className="rcpt-item" key={e.id}>
                  <div className="rcpt-line">
                    <span className="rcpt-line-name">{e.description}</span>
                    <span className="rcpt-dots" />
                    <span className="rcpt-line-amt">{formatMoney(e.amount)}</span>
                  </div>
                  <div className="rcpt-item-sub">
                    {formatDayLabel(e.date)} · {categoryName.get(e.categoryId) ?? ""} ·{" "}
                    {isSplit(e)
                      ? memberShares(e)
                          .map((s) => `${memberName.get(s.memberId) ?? ""} ${formatMoney(s.amount)}`)
                          .join(", ")
                      : memberName.get(e.memberId) ?? ""}
                    {e.notes ? ` · ${e.notes}` : ""}
                  </div>
                </div>
              ))}
          </>
        )}

        <div className="rcpt-rule" />
        <div className="rcpt-total">
          <span>TOTAL</span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="rcpt-rule" />

        <div className="rcpt-center rcpt-thanks">Keep this for your records</div>
        <div className="rcpt-center rcpt-barcode" aria-hidden="true">
          ||| | |||| || | ||| |||| | || |||
        </div>
        <div className="rcpt-center rcpt-foot">{config.appName}</div>
      </div>
    </div>,
    document.body
  );
}
