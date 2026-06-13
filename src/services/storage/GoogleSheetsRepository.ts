import type { AppData } from "../../models/types";
import type { IDataStore } from "./IDataStore";
import { config } from "../../config";

/**
 * STUB / TEMPLATE for a Google Sheets backend.
 *
 * This class deliberately implements the same IDataStore interface as the
 * local store. When you are ready to go cloud-backed:
 *
 *   1. Stand up a tiny proxy (Apps Script Web App, or a serverless function)
 *      that exposes two endpoints against your sheet:
 *         GET  {apiBase}/load?sheetId=...   -> returns AppData JSON
 *         POST {apiBase}/save?sheetId=...   -> accepts AppData JSON
 *      (A proxy keeps API keys/OAuth off the client.)
 *   2. Fill in the fetch calls below.
 *   3. Set VITE_STORAGE_PROVIDER=googleSheets and the VITE_GOOGLE_SHEETS_* vars.
 *
 * No other file in the app needs to change - that is the whole point of the
 * IDataStore seam.
 */
export class GoogleSheetsRepository implements IDataStore {
  readonly name = "Google Sheets";

  private readonly sheetId = config.googleSheets.sheetId;
  private readonly apiBase = config.googleSheets.apiBase;

  async load(): Promise<AppData | null> {
    this.assertConfigured();
    // Reference implementation - uncomment and adapt once your proxy is live:
    //
    // const res = await fetch(`${this.apiBase}/load?sheetId=${this.sheetId}`);
    // if (!res.ok) throw new Error(`Sheets load failed: ${res.status}`);
    // return (await res.json()) as AppData;
    throw new Error(
      "GoogleSheetsRepository is a stub. Implement load() against your proxy first."
    );
  }

  async save(_data: AppData): Promise<void> {
    this.assertConfigured();
    // const res = await fetch(`${this.apiBase}/save?sheetId=${this.sheetId}`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(_data),
    // });
    // if (!res.ok) throw new Error(`Sheets save failed: ${res.status}`);
    throw new Error(
      "GoogleSheetsRepository is a stub. Implement save() against your proxy first."
    );
  }

  private assertConfigured(): void {
    if (!this.sheetId || !this.apiBase) {
      throw new Error(
        "Google Sheets is selected but VITE_GOOGLE_SHEETS_ID / VITE_GOOGLE_SHEETS_API_BASE are not set."
      );
    }
  }
}
