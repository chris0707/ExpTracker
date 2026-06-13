import { useMemo, useState } from "react";
import type { AppData, Expense } from "../models/types";
import {
  filterAndSort,
  type ExpenseFilter,
  type SortDir,
  type SortField,
} from "../utils/selectors";

export interface ExpenseView {
  filter: ExpenseFilter;
  setFilter: (f: ExpenseFilter) => void;
  clearFilter: () => void;
  sortField: SortField;
  sortDir: SortDir;
  toggleSort: (field: SortField) => void;
  /** Month rows after search + filters + sort are applied. */
  rows: Expense[];
  isFiltered: boolean;
}

const EMPTY_FILTER: ExpenseFilter = { search: "", categoryId: "all", memberId: "all" };

/**
 * Owns the search/filter/sort state for a month and returns the visible rows.
 * Lifting this out of the table lets the table AND the printable receipt share
 * the exact same view - "what you see is what you print" - with no duplicated
 * filtering logic (DRY).
 */
export function useExpenseView(data: AppData, monthExpenses: Expense[]): ExpenseView {
  const [filter, setFilter] = useState<ExpenseFilter>(EMPTY_FILTER);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(
    () => filterAndSort(data, monthExpenses, filter, sortField, sortDir),
    [data, monthExpenses, filter, sortField, sortDir]
  );

  const isFiltered =
    filter.search.trim() !== "" || filter.categoryId !== "all" || filter.memberId !== "all";

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "amount" || field === "date" ? "desc" : "asc");
    }
  };

  return {
    filter,
    setFilter,
    clearFilter: () => setFilter(EMPTY_FILTER),
    sortField,
    sortDir,
    toggleSort,
    rows,
    isFiltered,
  };
}
