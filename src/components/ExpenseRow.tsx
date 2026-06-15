import { useState } from "react";
import type { Expense, ExpenseSplit } from "../models/types";
import { isSplit, memberShares } from "../models/types";
import { useAppData } from "../context/AppDataContext";
import { formatMoney, parseAmount, sumAmounts } from "../utils/money";
import { formatDayLabel, formatMonthLabel } from "../utils/date";
import { SplitEditor } from "./SplitEditor";

/**
 * One expense row. Read mode shows a tidy line; clicking Edit turns the SAME
 * row into inputs in place (no modal, no page jump). Delete asks once inline.
 * An item can be split across several members - see the Split toggle in edit
 * mode and the per-member shares shown in the Member column.
 */
export function ExpenseRow({
  expense,
  expandSplits = false,
}: {
  expense: Expense;
  /** When false, splits across 3+ members collapse to a hoverable `Split[n]` badge. */
  expandSplits?: boolean;
}) {
  const { data, updateExpense, removeExpense, keepMigratedExpense } = useAppData();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(expense);
  const [splitOn, setSplitOn] = useState(() => isSplit(expense));
  const [splits, setSplits] = useState<ExpenseSplit[] | null>(
    () => (isSplit(expense) ? (expense.splits as ExpenseSplit[]) : null)
  );
  const [error, setError] = useState<string | null>(null);

  const category = data.categories.find((c) => c.id === expense.categoryId);
  const member = data.members.find((m) => m.id === expense.memberId);
  const memberName = (id: string) => data.members.find((m) => m.id === id)?.name ?? "Unknown";
  const memberColor = (id: string) => data.members.find((m) => m.id === id)?.color ?? "#94a3b8";

  const draftAmount = parseAmount(String(draft.amount));

  const save = () => {
    const value = Number.isNaN(draftAmount) ? expense.amount : draftAmount;
    const useSplit = splitOn && splits && splits.length > 1;
    if (useSplit) {
      const sum = sumAmounts(splits.map((s) => s.amount));
      if (Math.abs(sum - value) >= 0.005) {
        setError(`Split shares add up to ${formatMoney(sum)}, not ${formatMoney(value)}.`);
        return;
      }
    }
    updateExpense(expense.id, {
      date: draft.date,
      description: draft.description.trim() || expense.description,
      categoryId: draft.categoryId,
      memberId: useSplit ? splits[0].memberId : draft.memberId,
      amount: value,
      notes: draft.notes,
      splits: useSplit ? splits : undefined,
    });
    setError(null);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(expense);
    setSplitOn(isSplit(expense));
    setSplits(isSplit(expense) ? (expense.splits as ExpenseSplit[]) : null);
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <>
        <tr className="row-editing">
          <td>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </td>
          <td>
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Description"
            />
            <input
              className="row-notes-input"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Notes (optional)"
            />
          </td>
          <td>
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
            >
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            {splitOn ? (
              <span className="muted small">Split across members ↓</span>
            ) : (
              <select
                value={draft.memberId}
                onChange={(e) => setDraft({ ...draft, memberId: e.target.value })}
              >
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {data.members.length > 1 && (
              <label className="checkbox split-toggle">
                <input
                  type="checkbox"
                  checked={splitOn}
                  onChange={(e) => {
                    setSplitOn(e.target.checked);
                    if (!e.target.checked) setSplits(null);
                  }}
                />
                Split
              </label>
            )}
          </td>
          <td className="num">
            <input
              className="row-amount-input"
              inputMode="decimal"
              value={String(draft.amount)}
              onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) || 0 })}
            />
          </td>
          <td className="row-actions">
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
          </td>
        </tr>
        {splitOn && (
          <tr className="row-editing split-edit-row">
            <td colSpan={6}>
              <SplitEditor
                members={data.members}
                total={Number.isNaN(draftAmount) ? 0 : draftAmount}
                value={splits}
                onChange={setSplits}
              />
              {error && <p className="entry-error" role="alert">{error}</p>}
            </td>
          </tr>
        )}
      </>
    );
  }

  const migrated = !!expense.migratedFrom;

  return (
    <tr className={migrated ? "row-migrated" : undefined}>
      <td className="cell-date">{formatDayLabel(expense.date)}</td>
      <td className="cell-desc">
        <span className="desc-main">{expense.description}</span>
        {expense.notes && <span className="desc-notes">{expense.notes}</span>}
        {migrated && (
          <span className="migrated-badge" title="Copied from a previous month">
            ⚠️ from {formatMonthLabel(expense.migratedFrom as string)} · keep?
          </span>
        )}
      </td>
      <td>
        <span className="chip" style={{ backgroundColor: (category?.color ?? "#94a3b8") + "22", color: category?.color ?? "#475569" }}>
          <span aria-hidden="true">{category?.icon ?? "🏷️"}</span> {category?.name ?? "Unknown"}
        </span>
      </td>
      <td>
        {isSplit(expense) ? (
          !expandSplits && memberShares(expense).length > 2 ? (
            <div className="split-chips">
              <span
                className="split-collapsed"
                tabIndex={0}
                title={memberShares(expense)
                  .map((s) => `${memberName(s.memberId)} ${formatMoney(s.amount)}`)
                  .join(", ")}
              >
                Split[{memberShares(expense).length}]
                <span className="split-popover" role="tooltip">
                  {memberShares(expense).map((s) => (
                    <span className="split-popover-row" key={s.memberId}>
                      <span className="member-dot" style={{ backgroundColor: memberColor(s.memberId) }} aria-hidden="true" />
                      {memberName(s.memberId)}
                      <span className="split-chip-amt">{formatMoney(s.amount)}</span>
                    </span>
                  ))}
                </span>
              </span>
            </div>
          ) : (
            <div className="split-chips">
              <span className="tag-split" title="Split across members">Split</span>
              {memberShares(expense).map((s) => (
                <span className="split-chip" key={s.memberId}>
                  <span className="member-dot" style={{ backgroundColor: memberColor(s.memberId) }} aria-hidden="true" />
                  {memberName(s.memberId)}
                  <span className="split-chip-amt">{formatMoney(s.amount)}</span>
                </span>
              ))}
            </div>
          )
        ) : (
          <>
            <span className="member-dot" style={{ backgroundColor: member?.color ?? "#94a3b8" }} aria-hidden="true" />
            {member?.name ?? "Unknown"}
          </>
        )}
      </td>
      <td className="num cell-amount">{formatMoney(expense.amount)}</td>
      <td className="row-actions">
        {migrated ? (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => keepMigratedExpense(expense.id)}
            >
              Keep
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => removeExpense(expense.id)}
            >
              Remove
            </button>
          </>
        ) : confirmDelete ? (
          <>
            <button className="btn btn-danger btn-sm" onClick={() => removeExpense(expense.id)}>
              Delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} aria-label="Edit">
              ✏️
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)} aria-label="Delete">
              🗑️
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
