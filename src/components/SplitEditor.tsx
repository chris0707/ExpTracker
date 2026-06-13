import { useEffect, useRef, useState } from "react";
import type { ExpenseSplit, Member } from "../models/types";
import { formatMoney, parseAmount, splitEvenly, sumAmounts } from "../utils/money";

type Mode = "even" | "custom";

interface Props {
  members: Member[];
  /** The item's total amount; even shares are derived from it. */
  total: number;
  /** Current splits (2+ entries) or null when the item isn't split. */
  value: ExpenseSplit[] | null;
  /** Emits the new splits, or null when fewer than two members are selected. */
  onChange: (splits: ExpenseSplit[] | null) => void;
}

/**
 * Lets the user share one item across several members. Pick the members, then
 * either split evenly (amounts auto-balance to the total, to the cent) or enter
 * custom amounts. Fewer than two members selected means "not split" and emits
 * null so the caller falls back to a single-member expense.
 */
export function SplitEditor({ members, total, value, onChange }: Props) {
  // Seed local UI state from the incoming value exactly once.
  const [selected, setSelected] = useState<string[]>(() =>
    value && value.length > 1 ? value.map((s) => s.memberId) : []
  );
  // Seed the mode from the incoming split: if its shares already match an even
  // division of the total, start on "even"; otherwise the user set custom
  // amounts, so preserve them rather than re-balancing on mount.
  const [mode, setMode] = useState<Mode>(() => {
    if (!value || value.length < 2) return "even";
    const even = splitEvenly(total, value.length);
    return value.every((s, i) => s.amount === even[i]) ? "even" : "custom";
  });
  const [custom, setCustom] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    if (value) for (const s of value) seed[s.memberId] = String(s.amount);
    return seed;
  });

  // Keep onChange out of the effect deps so re-emitting can't loop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Even shares for the currently selected members, in selection order.
  const evenShares = splitEvenly(total, selected.length);

  // The splits this editor currently represents (null = not a split).
  const splits: ExpenseSplit[] | null =
    selected.length < 2
      ? null
      : selected.map((memberId, i) => ({
          memberId,
          amount:
            mode === "even"
              ? evenShares[i]
              : (() => {
                  const parsed = parseAmount(custom[memberId] ?? "");
                  return Number.isNaN(parsed) ? 0 : parsed;
                })(),
        }));

  // Push changes up. Serialize for a cheap structural compare so we only emit
  // when the result actually changes.
  const serialized = JSON.stringify(splits);
  useEffect(() => {
    onChangeRef.current(splits ? JSON.parse(serialized) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const toggle = (memberId: string) => {
    setSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  // Quick action: share this item evenly across everyone. Selects all members
  // (in their listed order) and forces "even" mode so shares auto-balance.
  const selectAll = () => {
    setSelected(members.map((m) => m.id));
    setMode("even");
  };
  const clearAll = () => setSelected([]);
  const allSelected = selected.length === members.length && members.length > 0;

  const assigned = splits ? sumAmounts(splits.map((s) => s.amount)) : 0;
  const remaining = Math.round((total - assigned) * 100) / 100;
  const balanced = Math.abs(remaining) < 0.005;

  return (
    <div className="split-editor">
      <div className="split-actions">
        <span className="split-actions-label">Share with</span>
        <button
          type="button"
          className={`btn btn-sm ${allSelected ? "btn-secondary" : "btn-ghost"}`}
          onClick={selectAll}
        >
          Everyone (even)
        </button>
        {selected.length > 0 && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={clearAll}>
            Clear
          </button>
        )}
      </div>
      <div className="split-members">
        {members.map((m) => {
          const i = selected.indexOf(m.id);
          const on = i >= 0;
          return (
            <label key={m.id} className={`split-member ${on ? "on" : ""}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(m.id)} />
              <span className="member-dot" style={{ backgroundColor: m.color }} aria-hidden="true" />
              <span className="split-member-name">{m.name}</span>
              {on && (
                <span className="split-member-amt">
                  {mode === "even" ? (
                    formatMoney(evenShares[i] ?? 0)
                  ) : (
                    <input
                      className="split-amt-input"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={custom[m.id] ?? ""}
                      onChange={(e) => setCustom((c) => ({ ...c, [m.id]: e.target.value }))}
                      aria-label={`${m.name} share`}
                    />
                  )}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {selected.length >= 2 && (
        <div className="split-controls">
          <div className="split-mode" role="group" aria-label="Split mode">
            <button
              type="button"
              className={`btn btn-sm ${mode === "even" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() => setMode("even")}
            >
              Even
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === "custom" ? "btn-secondary" : "btn-ghost"}`}
              onClick={() =>
                setMode((prev) => {
                  // Prefill custom inputs from the current even split for easy tweaking.
                  if (prev === "even") {
                    setCustom(() => {
                      const next: Record<string, string> = {};
                      selected.forEach((id, i) => {
                        next[id] = (evenShares[i] ?? 0).toFixed(2);
                      });
                      return next;
                    });
                  }
                  return "custom";
                })
              }
            >
              Custom
            </button>
          </div>
          {mode === "custom" && (
            <span className={`split-remainder ${balanced ? "ok" : "off"}`}>
              {balanced
                ? "Balanced"
                : remaining > 0
                ? `${formatMoney(remaining)} left`
                : `${formatMoney(-remaining)} over`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
