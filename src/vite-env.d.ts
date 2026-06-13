/// <reference types="vite/client" />

// Typed access to our app-specific environment variables (optional, all strings).
interface ImportMetaEnv {
  readonly VITE_STORAGE_PROVIDER?: string;
  readonly VITE_CURRENCY?: string;
  readonly VITE_LOCALE?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_GOOGLE_SHEETS_ID?: string;
  readonly VITE_GOOGLE_SHEETS_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
