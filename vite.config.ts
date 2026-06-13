/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Vite + React config. Tests run under jsdom via Vitest.
//
// Two build modes:
//   `vite build`                 -> standard build into dist/ (hashed assets,
//                                   served by a web server / `npm run preview`).
//   `vite build --mode portable` -> single self-contained dist-portable/index.html
//                                   with all JS+CSS inlined, so it runs by just
//                                   double-clicking the file (no server needed).
export default defineConfig(({ mode }) => {
  const portable = mode === "portable";
  return {
    // Relative asset URLs. Portable mode needs them for file:// opening; the
    // standard build needs them too so the app works when served from a
    // GitHub Pages project subpath (https://user.github.io/ExpTracker/).
    base: "./",
    plugins: [react(), ...(portable ? [viteSingleFile()] : [])],
    build: portable ? { outDir: "dist-portable" } : {},
    server: {
      port: 5173,
      open: true,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
