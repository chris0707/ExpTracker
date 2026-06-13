/**
 * Central app configuration, sourced from environment variables (Vite `import.meta.env`).
 * Keeping every env lookup here means the rest of the code never touches `import.meta.env`
 * directly - one place to change, easy to test, and no magic strings scattered around.
 */

type StorageProvider = "local" | "googleSheets";

interface AppConfig {
  storageProvider: StorageProvider;
  currency: string;
  locale: string;
  appName: string;
  googleSheets: {
    sheetId: string;
    apiBase: string;
  };
}

function readEnv(key: string, fallback: string): string {
  // `import.meta.env` is injected by Vite at build time. Guard against it being
  // absent (e.g. unit tests or other runtimes) so config never throws on import.
  const meta = import.meta as any;
  const env = (meta && meta.env ? meta.env : {}) as Record<string, string | undefined>;
  const value = env[key];
  return value && value.trim().length > 0 ? value : fallback;
}

export const config: AppConfig = {
  storageProvider: readEnv("VITE_STORAGE_PROVIDER", "local") as StorageProvider,
  currency: readEnv("VITE_CURRENCY", "USD"),
  locale: readEnv("VITE_LOCALE", "en-US"),
  appName: readEnv("VITE_APP_NAME", "Household Expense Tracker"),
  googleSheets: {
    sheetId: readEnv("VITE_GOOGLE_SHEETS_ID", ""),
    apiBase: readEnv("VITE_GOOGLE_SHEETS_API_BASE", ""),
  },
};
