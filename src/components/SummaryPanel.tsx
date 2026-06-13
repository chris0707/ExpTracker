import { useAppData } from "../context/AppDataContext";
import { categoryBreakdown, memberBreakdown } from "../utils/selectors";
import type { Expense } from "../models/types";
import { formatMoney, sumAmounts } from "../utils/money";

interface Props {
  monthExpenses: Expense[];
}

function BreakdownList({ rows }: { rows: ReturnType<typeof categoryBreakdown> }) {
  if (rows.length === 0) return <p className="muted">No data yet.</p>;
  return (
    <ul className="breakdown">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="breakdown-head">
            <span className="breakdown-label">
              {r.icon && <span aria-hidden="true">{r.icon} </span>}
              {r.label}
            </span>
            <span className="breakdown-amount">{formatMoney(r.total)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(2, r.share * 100)}%`, backgroundColor: r.color }}
            />
          </div>
          <div className="breakdown-sub">
            {(r.share * 100).toFixed(0)}% · {r.count} item{r.count === 1 ? "" : "s"}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** At-a-glance month total plus where the money went, by category and member. */
export function SummaryPanel({ monthExpenses }: Props) {
  const { data } = useAppData();
  const total = sumAmounts(monthExpenses.map((e) => e.amount));
  const cats = categoryBreakdown(data, monthExpenses);
  const members = memberBreakdown(data, monthExpenses);
  const topCat = cats[0];

  return (
    <aside className="summary">
      <div className="total-card">
        <span className="total-label">This month</span>
        <span className="total-value">{formatMoney(total)}</span>
        <span className="total-sub">
          {monthExpenses.length} item{monthExpenses.length === 1 ? "" : "s"}
          {topCat ? ` · Top: ${topCat.icon ?? ""} ${topCat.label}` : ""}
        </span>
      </div>

      <div className="summary-block">
        <h3>By category</h3>
        <BreakdownList rows={cats} />
      </div>

      <div className="summary-block">
        <h3>By member</h3>
        <BreakdownList rows={members} />
      </div>
    </aside>
  );
}
