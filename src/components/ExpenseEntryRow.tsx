import { useRef, useState, type FormEvent } from "react";
import type { ExpenseSplit } from "../models/types";
import { useAppData } from "../context/AppDataContext";
import { formatMoney, parseAmount, sumAmounts } from "../utils/money";
import { todayIso } from "../utils/date";
import { SplitEditor } from "./SplitEditor";

/**
 * Always-visible inline "quick add" bar - NO modal. Type description + amount,
 * pick category/member, press Enter. Focus snaps back to the description so a
 * whole shopping trip can be entered in seconds. This is the core of being
 * "better than a spreadsheet".
 *
 * An item can also be shared: hit "Split" to divide it across members instead
 * of assigning the whole amount to one person.
 */
export function ExpenseEntryRow({ defaultDate }: { defaultDate?: string }) {
  const { data, addExpense } = useAppData();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id ?? "");
  const [memberId, setMemberId] = useState(data.members[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate ?? todayIso());
  const [splitOn, setSplitOn] = useState(false);
  const [splits, setSplits] = useState<ExpenseSplit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const descRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseAmount(amount);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = parsedAmount;
    if (Number.isNaN(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (!description.trim()) {
      setError("Add a short description.");
      return;
    }
    const useSplit = splitOn && splits && splits.length > 1;
    if (useSplit) {
      const sum = sumAmounts(splits.map((s) => s.amount));
      if (Math.abs(sum - value) >= 0.005) {
        setError(`Split shares add up to ${formatMoney(sum)}, not ${formatMoney(value)}.`);
        return;
      }
    }
    addExpense({
      date,
      description: description.trim(),
      categoryId: categoryId || data.categories[0].id,
      memberId: useSplit ? splits[0].memberId : memberId || data.members[0].id,
      amount: value,
      notes: "",
      splits: useSplit ? splits : undefined,
    });
    // Reset for the next entry, keep category/member/date for fast repeat input.
    setDescription("");
    setAmount("");
    setSplitOn(false);
    setSplits(null);
    setError(null);
    descRef.current?.focus();
  };

  return (
    <form className="entry-bar" onSubmit={submit}>
      <div className="entry-grid">
        <input
          ref={descRef}
          className="entry-desc"
          placeholder="What did you buy?  (e.g. Weekly groceries)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
        />
        <div className="entry-amount-wrap">
          <input
            className="entry-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount"
          />
        </div>
        <select
          className="entry-select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Category"
        >
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {splitOn ? (
          <div className="entry-select entry-split-placeholder">Split across members ↓</div>
        ) : (
          <select
            className="entry-select"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            aria-label="Member"
          >
            {data.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <input
          className="entry-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
        />
        <button className="btn btn-primary entry-add" type="submit">
          + Add
        </button>
      </div>

      {data.members.length > 1 && (
        <div className="entry-split-bar">
          <label className="checkbox split-toggle">
            <input
              type="checkbox"
              checked={splitOn}
              onChange={(e) => {
                setSplitOn(e.target.checked);
                if (!e.target.checked) setSplits(null);
              }}
            />
            Split this item across members
          </label>
        </div>
      )}

      {splitOn && (
        <SplitEditor
          members={data.members}
          total={Number.isNaN(parsedAmount) ? 0 : parsedAmount}
          value={splits}
          onChange={setSplits}
        />
      )}

      {error && <p className="entry-error" role="alert">{error}</p>}
    </form>
  );
}
