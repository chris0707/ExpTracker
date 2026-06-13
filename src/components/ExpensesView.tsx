import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { currentMonthKey, formatMonthLabel, shiftMonthKey, todayIso } from "../utils/date";
import { downloadExpensesCsv } from "../services/csvService";
import { expensesForMonth, monthsWithData } from "../utils/selectors";
import { useExpenseView } from "../hooks/useExpenseView";
import { MonthNavigator } from "./MonthNavigator";
import { ExpenseEntryRow } from "./ExpenseEntryRow";
import { ExpenseTable } from "./ExpenseTable";
import { SummaryPanel } from "./SummaryPanel";
import { ReceiptDocument } from "./ReceiptDocument";

/** The main screen: quick-add bar, month navigation, summary, and the list. */
export function ExpensesView() {
  const { data, copyMonthInto, keepMigratedInMonth, discardMigratedInMonth } = useAppData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [includeItems, setIncludeItems] = useState(true);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [showExportNudge, setShowExportNudge] = useState(false);

  // After the print/PDF dialog closes, softly remind the user to back up their
  // records to a CSV (printing isn't a backup). The banner auto-dismisses.
  useEffect(() => {
    const onAfterPrint = () => setShowExportNudge(true);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  useEffect(() => {
    if (!showExportNudge) return;
    const t = window.setTimeout(() => setShowExportNudge(false), 12000);
    return () => window.clearTimeout(t);
  }, [showExportNudge]);

  const monthExpenses = useMemo(
    () => expensesForMonth(data.expenses, monthKey),
    [data.expenses, monthKey]
  );
  const months = useMemo(() => monthsWithData(data.expenses), [data.expenses]);

  // "Copy last month" pulls from the month before the one being viewed.
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const prevMonthCount = useMemo(
    () => expensesForMonth(data.expenses, prevMonthKey).length,
    [data.expenses, prevMonthKey]
  );

  // Rows in this month still awaiting a Keep/Remove decision.
  const pending = monthExpenses.filter((e) => e.migratedFrom);
  const pendingSource = pending[0]?.migratedFrom;

  const handleCopy = () => {
    const copied = copyMonthInto(prevMonthKey, monthKey);
    setCopyMsg(
      copied > 0
        ? `Copied ${copied} item${copied === 1 ? "" : "s"} from ${formatMonthLabel(
            prevMonthKey
          )} — review each below.`
        : `Items from ${formatMonthLabel(prevMonthKey)} are already waiting for review below.`
    );
  };

  // Shared filter/sort view - the table and the printable receipt use the same rows.
  const view = useExpenseView(data, monthExpenses);

  return (
    <div className="expenses-view">
      {showExportNudge && data.expenses.length > 0 && (
        <div className="export-nudge no-print" role="status">
          <span className="export-nudge-text">
            💾 Printing isn’t a backup. Export a CSV so your records are safe.
          </span>
          <span className="export-nudge-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                downloadExpensesCsv(data, todayIso());
                setShowExportNudge(false);
              }}
            >
              Export CSV
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowExportNudge(false)}
              aria-label="Dismiss"
            >
              Not now
            </button>
          </span>
        </div>
      )}

      <ExpenseEntryRow />

      <div className="view-toolbar">
        <div className="toolbar-left">
          <MonthNavigator monthKey={monthKey} onChange={setMonthKey} monthsWithData={months} />
          <button
            className="btn btn-ghost btn-sm copy-month-btn no-print"
            onClick={handleCopy}
            disabled={prevMonthCount === 0}
            title={
              prevMonthCount === 0
                ? `No items in ${formatMonthLabel(prevMonthKey)} to copy`
                : `Copy ${prevMonthCount} item(s) from ${formatMonthLabel(prevMonthKey)} into this month`
            }
          >
            ⧉ Copy from {formatMonthLabel(prevMonthKey)}
          </button>
        </div>
        <div className="print-controls no-print">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={includeItems}
              onChange={(e) => setIncludeItems(e.target.checked)}
            />
            Itemized
          </label>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            disabled={view.rows.length === 0}
            title={view.rows.length === 0 ? "Nothing to print for this view" : "Print or save as PDF"}
          >
            🧾 Print / Save PDF
          </button>
        </div>
      </div>

      {copyMsg && (
        <p className="info-msg no-print" role="status">
          {copyMsg}
        </p>
      )}

      {pending.length > 0 && (
        <div className="migrate-banner no-print" role="region" aria-label="Copied items to review">
          <span className="migrate-banner-text">
            ⚠️ {pending.length} item{pending.length === 1 ? "" : "s"} copied
            {pendingSource ? ` from ${formatMonthLabel(pendingSource)}` : ""} — keep the ones you
            still spend on, remove the rest.
          </span>
          <span className="migrate-banner-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                keepMigratedInMonth(monthKey);
                setCopyMsg(null);
              }}
            >
              Keep all
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                discardMigratedInMonth(monthKey);
                setCopyMsg(null);
              }}
            >
              Remove all
            </button>
          </span>
        </div>
      )}

      <div className="expenses-layout">
        <ExpenseTable monthExpenses={monthExpenses} view={view} />
        <SummaryPanel monthExpenses={monthExpenses} />
      </div>

      {/* Off-screen; revealed only by the print stylesheet. */}
      <ReceiptDocument
        data={data}
        monthKey={monthKey}
        rows={view.rows}
        includeItems={includeItems}
        isFiltered={view.isFiltered}
        filter={view.filter}
      />
    </div>
  );
}
