import type { AppData } from "../../models/types";
import { emptyAppData } from "../../models/types";
import type { IDataStore } from "./IDataStore";

const STORAGE_KEY = "het.appData.v1";

/**
 * Default backend: persists the snapshot to the browser's localStorage.
 * Async signatures are kept (even though localStorage is synchronous) so a
 * network-backed store like Google Sheets is a drop-in replacement.
 */
export class LocalStorageRepository implements IDataStore {
  readonly name = "Browser storage (localStorage)";

  async load(): Promise<AppData | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AppData>;
      // Defensive merge: tolerate older/partial snapshots without crashing.
      return {
        ...emptyAppData(),
        ...parsed,
        members: parsed.members ?? [],
        categories: parsed.categories ?? [],
        expenses: parsed.expenses ?? [],
      };
    } catch (err) {
      console.error("[LocalStorageRepository] Failed to load data:", err);
      // Returning null lets the app seed fresh defaults rather than white-screen.
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("[LocalStorageRepository] Failed to save data:", err);
      throw new Error(
        "Could not save your data. Your browser storage may be full or blocked."
      );
    }
  }
}
