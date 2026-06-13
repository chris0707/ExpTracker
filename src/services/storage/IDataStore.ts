import type { AppData } from "../../models/types";

/**
 * The one seam the whole app depends on for persistence.
 *
 * Everything above this interface (React, hooks, components) only ever calls
 * `load()` and `save()`. To move from browser storage to Google Sheets you
 * implement this interface once (see GoogleSheetsRepository) and flip the
 * VITE_STORAGE_PROVIDER env var - no UI code changes. That is the
 * Dependency-Inversion principle doing the heavy lifting.
 */
export interface IDataStore {
  /** Human-readable name, handy for diagnostics/logging. */
  readonly name: string;

  /** Load the full snapshot. Returns `null` when nothing is stored yet. */
  load(): Promise<AppData | null>;

  /** Persist the full snapshot. */
  save(data: AppData): Promise<void>;
}
