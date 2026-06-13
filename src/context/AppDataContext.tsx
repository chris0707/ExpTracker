import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Category, Expense, Member } from "../models/types";
import { seedAppData } from "../utils/defaults";
import { createDataStore } from "../services/storage/repositoryFactory";
import { newId } from "../utils/id";
import { pickColor } from "../utils/defaults";
import { expensesForMonth, migratedCopies } from "../utils/selectors";
import { monthKeyOf } from "../utils/date";

/**
 * Single source of truth for application data. Components read derived state
 * and call intent-named actions (addExpense, removeMember, ...) - they never
 * mutate arrays directly. Every change is persisted through the IDataStore.
 */

interface AppDataContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  storeName: string;

  // Expenses
  addExpense(input: Omit<Expense, "id" | "createdAt">): void;
  updateExpense(id: string, patch: Partial<Omit<Expense, "id">>): void;
  removeExpense(id: string): void;
  addExpensesBulk(expenses: Expense[]): void;

  // Copy last month -> this month, with a "keep?" review mark on each copy.
  /** Copy `sourceMonthKey`'s items into `targetMonthKey`, tagged for review.
   *  Returns how many were copied (0 if the source is empty or a prior copy is
   *  still pending review in the target). */
  copyMonthInto(sourceMonthKey: string, targetMonthKey: string): number;
  /** Clear the migrated mark on one row (the user confirmed "Keep"). */
  keepMigratedExpense(id: string): void;
  /** Clear the mark on every pending row in a month ("Keep all"). */
  keepMigratedInMonth(monthKey: string): void;
  /** Delete every pending migrated row in a month ("Remove all"). */
  discardMigratedInMonth(monthKey: string): void;

  // Members
  addMember(name: string): Member;
  updateMember(id: string, patch: Partial<Omit<Member, "id">>): void;
  removeMember(id: string): void;

  // Categories
  addCategory(input: { name: string; icon?: string; color?: string }): Category;
  updateCategory(id: string, patch: Partial<Omit<Category, "id">>): void;
  removeCategory(id: string): void;

  replaceAll(next: AppData): void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const store = createDataStore();

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => seedAppData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);
  // Always-current snapshot so click handlers can read state synchronously
  // (e.g. to compute how many rows a copy produced) without stale closures.
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loaded = await store.load();
        if (!active) return;
        if (loaded && loaded.categories.length > 0) {
          setData(loaded);
        } else {
          const seeded = seedAppData();
          setData(seeded);
          await store.save(seeded);
        }
      } catch (err) {
        console.error("[AppData] load failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        if (active) {
          hydrated.current = true;
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever data changes (after the initial hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    store.save(data).catch((err) => {
      console.error("[AppData] save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save data.");
    });
  }, [data]);

  const addExpense = useCallback((input: Omit<Expense, "id" | "createdAt">) => {
    setData((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        { ...input, id: newId("exp"), createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Omit<Expense, "id">>) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  const addExpensesBulk = useCallback((expenses: Expense[]) => {
    setData((prev) => ({ ...prev, expenses: [...prev.expenses, ...expenses] }));
  }, []);

  const copyMonthInto = useCallback(
    (sourceMonthKey: string, targetMonthKey: string): number => {
      const current = dataRef.current;
      const source = expensesForMonth(current.expenses, sourceMonthKey);
      if (source.length === 0) return 0;
      // Don't copy again while a prior batch from this source is still pending
      // review in the target month - avoids accidental double-imports.
      const pending = current.expenses.some(
        (e) => monthKeyOf(e.date) === targetMonthKey && e.migratedFrom === sourceMonthKey
      );
      if (pending) return 0;

      const copies = migratedCopies(
        source,
        sourceMonthKey,
        targetMonthKey,
        () => newId("exp"),
        new Date().toISOString()
      );
      setData((prev) => ({ ...prev, expenses: [...prev.expenses, ...copies] }));
      return copies.length;
    },
    []
  );

  const keepMigratedExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...e, migratedFrom: undefined } : e
      ),
    }));
  }, []);

  const keepMigratedInMonth = useCallback((monthKey: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        monthKeyOf(e.date) === monthKey && e.migratedFrom
          ? { ...e, migratedFrom: undefined }
          : e
      ),
    }));
  }, []);

  const discardMigratedInMonth = useCallback((monthKey: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter(
        (e) => !(monthKeyOf(e.date) === monthKey && e.migratedFrom)
      ),
    }));
  }, []);

  const addMember = useCallback((name: string): Member => {
    const member: Member = {
      id: newId("mem"),
      name: name.trim(),
      color: pickColor(Math.floor(Math.random() * 10)),
    };
    setData((prev) => ({ ...prev, members: [...prev.members, member] }));
    return member;
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<Omit<Member, "id">>) => {
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const removeMember = useCallback((id: string) => {
    setData((prev) => {
      if (prev.members.length <= 1) return prev; // keep at least one member
      return { ...prev, members: prev.members.filter((m) => m.id !== id) };
    });
  }, []);

  const addCategory = useCallback(
    (input: { name: string; icon?: string; color?: string }): Category => {
      const category: Category = {
        id: newId("cat"),
        name: input.name.trim(),
        icon: input.icon?.trim() || "🏷️",
        color: input.color || pickColor(Math.floor(Math.random() * 10)),
        isDefault: false,
      };
      setData((prev) => ({ ...prev, categories: [...prev.categories, category] }));
      return category;
    },
    []
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id">>) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    []
  );

  const removeCategory = useCallback((id: string) => {
    setData((prev) => {
      if (prev.categories.length <= 1) return prev;
      return { ...prev, categories: prev.categories.filter((c) => c.id !== id) };
    });
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      loading,
      error,
      storeName: store.name,
      addExpense,
      updateExpense,
      removeExpense,
      addExpensesBulk,
      copyMonthInto,
      keepMigratedExpense,
      keepMigratedInMonth,
      discardMigratedInMonth,
      addMember,
      updateMember,
      removeMember,
      addCategory,
      updateCategory,
      removeCategory,
      replaceAll,
    }),
    [
      data,
      loading,
      error,
      addExpense,
      updateExpense,
      removeExpense,
      addExpensesBulk,
      copyMonthInto,
      keepMigratedExpense,
      keepMigratedInMonth,
      discardMigratedInMonth,
      addMember,
      updateMember,
      removeMember,
      addCategory,
      updateCategory,
      removeCategory,
      replaceAll,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
