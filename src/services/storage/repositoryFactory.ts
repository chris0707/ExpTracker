import { config } from "../../config";
import type { IDataStore } from "./IDataStore";
import { LocalStorageRepository } from "./LocalStorageRepository";
import { GoogleSheetsRepository } from "./GoogleSheetsRepository";

/**
 * Single place that decides which storage backend the app uses, driven by the
 * VITE_STORAGE_PROVIDER env var. Components ask the factory for an IDataStore
 * and never name a concrete class - so adding a new backend is additive only.
 */
export function createDataStore(): IDataStore {
  switch (config.storageProvider) {
    case "googleSheets":
      return new GoogleSheetsRepository();
    case "local":
    default:
      return new LocalStorageRepository();
  }
}
