import { useAppData } from "../context/AppDataContext";
import type { SortField } from "../utils/selectors";
import type { Expense } from "../models/types";
import type { ExpenseView } from "../hooks/useExpenseView";
import { ExpenseRow } from "./ExpenseRow";
import { formatMoney, sumAmounts } from "../utils/money";

interface Props {
  /** Full month (used only to distinguish "no expenses" from "no matches"). */
  monthExpenses: Expense[];
  /** Shared filter/sort state + visible rows, owned by the parent. */
  view: ExpenseView;
}

const COLUMNS: Array<{ field: SortField; label: string; className?: string }> = [
  { field: "date", label: "Date" },
  { field: "description", label: "Item" },
  { field: "category", label: "Category" },
  { field: "member", label: "Member" },
  { field: "amount", label: "Amount", className: "num" },
];

/**
 * The itemized list. Sortable headers, a search box, and category/member
 * filters keep a busy month readable. Filter/sort state is owned by the parent
 * (via useExpenseView) so the printable receipt shares the same view.
 */
export function ExpenseTable({ monthExpenses, view }: Props) {
  const { data } = useAppData();
  const { filter, setFilter, clearFilter, sortField, sortDir, toggleSort, rows, isFiltered } =
    view;

  const filteredTotal = sumAmounts(rows.map((r) => r.amount));

  return (
    <section className="table-section">
      <div className="filter-bar">
        <input
          className="search-input"
          type="search"
          placeholder="🔍 Search items, notes…"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          aria-label="Search expenses"
        />
        <select
          value={filter.categoryId}
          onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select
          value={filter.memberId}
          onChange={(e) => setFilter({ ...filter, memberId: e.target.value })}
          aria-label="Filter by member"
        >
          <option value="all">All members</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {isFiltered && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilter}>
            Clear filters
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          {monthExpenses.length === 0
            ? "No expenses yet this month. Add your first one above ☝️"
            : "No items match your filters."}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="expense-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.field}
                    className={col.className}
                    onClick={() => toggleSort(col.field)}
                    role="button"
                    aria-sort={
                      sortField === col.field
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {col.label}
                    {sortField === col.field && (
                      <span className="sort-caret">{sortDir === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                ))}
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="foot-label">
                  {isFiltered ? `${rows.length} item(s) shown` : `${rows.length} item(s)`}
                </td>
                <td className="num foot-total">{formatMoney(filteredTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
