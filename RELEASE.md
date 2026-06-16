# Release Notes

## v1.1.1 — Receipt & split-row tweaks (2026-06-15)

1. **Cleaner grouped item titles** — in the receipt's "ITEMS BY MEMBER" view, split items no longer repeat the `(split[N])` tag in the item title (e.g. "Wild rice" instead of "Wild rice (split[2])"); the split detail remains on the sub-line (`· split[N] · full $X.XX`).
2. **Collapsed splits in the item list** — on the home/items list, a split across 3+ members now collapses to a compact `Split[n]` badge instead of a tall stack of member chips; hovering (or focusing) the badge reveals each member and their share. Two-way splits still show inline.
3. **Expand-splits toggle** — the Member column header shows an "Expand splits" checkbox (only when the current view has a 3+ way split) to expand every member's share or collapse back to the `Split[n]` badge.
4. **Sticky Actions column** — the Date…Amount columns can be wider than the viewport while editing a row (extra split controls); the Actions column (Save/Cancel, edit/delete) is now pinned to the right edge so it stays clickable without scrolling sideways or down to the bottom horizontal scrollbar.
5. **Notes on quick-add** — the inline "quick add" bar now has an optional notes field. Notes already flowed through CSV export/import and the printed receipt; this completes the loop so notes can be captured at entry time, not just via Edit.

## v1.1.0 — Printable receipt (2026-06-11)

1. **Print / Save-as-PDF receipt** — new "🧾 Print / Save PDF" button opens the browser's native print dialog (print on paper or choose "Save as PDF"); no extra dependencies.
2. **Modern receipt layout** — thermal-receipt style (monospace, 80mm width, dashed dividers, dotted leaders, faux barcode): header, month, print timestamp, category and member breakdowns with %, and a bold grand total.
3. **Itemized toggle** — an "Itemized" checkbox includes/excludes the full line-item list, giving both a summary-only and a summary + itemized receipt.
4. **What-you-see-is-what-you-print** — the receipt reflects the currently viewed month and any active search/filter, and labels the filter on the printout.
5. **Refactor** — filter/sort state lifted into a new `useExpenseView` hook shared by the table and the receipt (removes duplicated filtering logic); `ExpenseTable` is now a controlled component.
6. **Print stylesheet** — `@media print` hides the live app and reveals only the receipt (rendered via a body portal); `.no-print` utility for screen-only controls.

## v1.0.0 — Initial release (2026-06-11)

First working version of the Household Expense Tracker.

1. **PIN login** — shared 4–8 digit household PIN, stored as a SHA‑256 hash; first‑run setup flow and lock/unlock.
2. **Storage abstraction** — `IDataStore` interface with a browser `LocalStorageRepository` and a `GoogleSheetsRepository` stub, selected via a factory and the `VITE_STORAGE_PROVIDER` env var (swap to Google Sheets later with no UI changes).
3. **Dynamic members** — add, rename, recolor, and remove household members (no fixed limit).
4. **Categories** — ten built‑in defaults plus user‑added categories, each with an icon and color.
5. **Fast inline entry** — always‑visible quick‑add bar (no modals); Enter submits and refocuses for rapid multi‑item entry.
6. **Itemized monthly view** — searchable, filterable (by category/member), click‑to‑sort table with a live filtered total.
7. **Inline edit & delete** — edit a row in place; delete asks for confirmation.
8. **Summary panel** — month total, top category, and breakdown bars by category and by member.
9. **Month navigation** — prev/next stepper, "jump to this month", and a dropdown of months that have data.
10. **CSV records** — export to CSV (resolves ids to readable names, RFC‑4180 quoting) and import from CSV (auto‑creates unknown members/categories, skips malformed rows).
11. **Responsive, accessible UI** — large text, high contrast, and layouts that adapt from phone to desktop, aimed at all ages.
12. **Configuration via env vars** — currency, locale, app name, and storage provider read centrally in `config.ts`.
13. **Unit tests** — Vitest coverage for money parsing, date/month math, CSV round‑trip + malformed handling, and the selector/aggregation logic (`[Theory]`‑style `it.each` cases).
14. **Documentation** — README with use case, project structure, run/build instructions, and manual server deployment guides (static host, Nginx, Apache).
