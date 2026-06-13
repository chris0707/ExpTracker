# 💰 Household Expense Tracker

A friendly, fast React app for tracking a household's monthly spending — PIN‑protected, multi‑member, categorized, and built to be genuinely nicer to use than a spreadsheet.

---

## 1. Use case — what this is for

This app is for a **household** (a family, roommates, a couple) that wants to answer everyday money questions without wrestling with a spreadsheet:

- *"How much did we spend this month, and on what?"*
- *"Who bought what?"*
- *"Are groceries creeping up compared to last month?"*

It is designed for a **general audience — from teens to grandparents**. The screens use large text, high contrast, plain language, and a single always‑visible "quick add" bar instead of fiddly pop‑ups.

### Why it beats a spreadsheet

| Spreadsheet pain | What this app does instead |
|---|---|
| Manual SUM formulas, broken ranges | Live monthly total + per‑category / per‑member breakdown, always correct |
| Hard to read with many rows | Search, filter by category/member, click‑to‑sort columns, color‑coded chips |
| Slow data entry (click cell, type, tab…) | One inline bar: type item + amount, press **Enter**, focus jumps back for the next item |
| Easy to fat‑finger a wrong cell | Inline edit on the row itself, delete asks for confirmation |
| No structure | Members and categories are first‑class, with sensible defaults |
| "Which file is the real one?" | Single source of truth in‑app, with one‑click **CSV export** for backups/records |

### Real‑life scenario

> Maria gets home from the supermarket. She opens the app on the kitchen tablet, taps in the PIN the family shares, and types `Weekly groceries` → `84.20` → picks **🛒 Groceries** → **Maria** → **Enter**. The total card updates instantly. She adds the pharmacy receipt the same way in five seconds. At the end of the month she taps **Export CSV** to keep a copy in the family's shared drive. No formulas, no "which tab was it on", no transitions to lose her place.

---

## 2. Features

- **Shared household PIN** (4–8 digits). Stored only as a SHA‑256 hash, never in plain text.
- **Dynamic members** — add, rename, recolor, or remove people anytime. No fixed limit.
- **Categories** — ten sensible defaults (Groceries, Rent/Mortgage, Utilities, Transport, Dining Out, Health, Education, Entertainment, Household, Other) plus your own.
- **Fast inline entry** — no modals; an always‑present quick‑add bar.
- **Itemized monthly view** — sortable, searchable, filterable table that stays readable even with a long month.
- **At‑a‑glance summary** — month total, top category, and breakdown bars by category and by member.
- **Month navigation** — step back/forward, jump to the current month, or jump to any month that has data.
- **CSV records** — export anytime (opens in Excel/Sheets), and import a CSV back in (unknown members/categories are created automatically; bad rows are skipped, not fatal).
- **Printable receipt / PDF** — a "🧾 Print / Save PDF" button renders a modern thermal‑receipt‑style summary (totals + category/member breakdowns, with an optional itemized list) and opens the browser print dialog, where you can print on paper or **Save as PDF**. It reflects the month you're viewing and any active filter (toggle **Itemized** for summary‑only vs. full line items).
- **Responsive** — works on a phone, a tablet, or a laptop.

---

## 3. Project structure

```
ExpTracker/
├─ index.html                  # App entry HTML
├─ package.json                # Scripts + dependencies
├─ tsconfig.json               # TypeScript config (strict)
├─ vite.config.ts              # Vite + Vitest config
├─ .env.example                # Copy to .env to configure
├─ README.md
├─ RELEASE.md                  # Change log
└─ src/
   ├─ main.tsx                 # React bootstrap
   ├─ App.tsx                  # Providers + lock gate + tab shell
   ├─ index.css                # All styles (theme variables, responsive)
   ├─ config.ts                # Reads env vars (one place, no magic strings)
   ├─ vite-env.d.ts            # Vite/CSS type declarations
   ├─ models/
   │  └─ types.ts              # Member, Category, Expense, AppData
   ├─ services/
   │  ├─ pinService.ts         # PIN hashing/verify
   │  ├─ csvService.ts         # CSV import/export
   │  └─ storage/
   │     ├─ IDataStore.ts            # The persistence interface (the seam)
   │     ├─ LocalStorageRepository.ts# Default: browser storage
   │     ├─ GoogleSheetsRepository.ts# Stub/template for cloud sync
   │     └─ repositoryFactory.ts     # Picks the backend from config
   ├─ context/
   │  ├─ AuthContext.tsx       # Locked/unlocked state
   │  └─ AppDataContext.tsx    # Single source of truth + actions
   ├─ utils/
   │  ├─ money.ts  date.ts  id.ts  defaults.ts  selectors.ts
   ├─ hooks/
   │  └─ useExpenseView.ts     # Shared filter/sort/visible-rows state
   └─ components/
      ├─ PinGate.tsx  Header.tsx  MonthNavigator.tsx
      ├─ ExpenseEntryRow.tsx  ExpenseTable.tsx  ExpenseRow.tsx
      ├─ SummaryPanel.tsx  ExpensesView.tsx
      ├─ ReceiptDocument.tsx      # Print/PDF receipt (portal, print-only)
      ├─ MembersManager.tsx  CategoryManager.tsx
      └─ DataTools.tsx  SettingsView.tsx
   └─ test/                    # Vitest unit tests
```

---

## 4. Running it locally

> Prerequisite: **Node.js 18+** (Node 20/22 recommended). Check with `node -v`.

```bash
# 1. Install dependencies (first time only)
npm install

# 2. (optional) configure — defaults are fine
cp .env.example .env

# 3. Start the dev server (opens http://localhost:5173)
npm run dev
```

Other scripts:

```bash
npm run build      # Type-check + production build into ./dist
npm run preview    # Serve the built ./dist locally to sanity-check it
npm run test       # Run the unit tests once
npm run typecheck  # Type-check only
```

### Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_STORAGE_PROVIDER` | `local` | `local` (browser) or `googleSheets` (see §7) |
| `VITE_CURRENCY` | `USD` | Currency used to format money |
| `VITE_LOCALE` | `en-US` | Locale for number/date formatting |
| `VITE_APP_NAME` | `Household Expense Tracker` | Title shown in the header |
| `VITE_GOOGLE_SHEETS_ID` | *(empty)* | Spreadsheet id (Google Sheets mode only) |
| `VITE_GOOGLE_SHEETS_API_BASE` | *(empty)* | Your proxy API base (Google Sheets mode only) |

---

## 5. Building for production

```bash
npm run build
```

This produces a **static site** in the `dist/` folder — plain HTML, CSS, and JS with **no server‑side code required**. That folder is the thing you publish.

```
dist/
├─ index.html
└─ assets/
   ├─ index-XXXXXXXX.js
   └─ index-XXXXXXXX.css
```

> Note on data: with the default `local` provider, each person's data lives in **their own browser** on the device they use. The app itself is just static files. Use **Export CSV** for backups and to move records between devices. (To make data shared/centralized, wire up the Google Sheets provider — see §7.)

### Portable single‑file build (double‑click, no server)

If you want to **hand someone the app as one file** they can just double‑click — no web server, no internet — use the portable build:

```bash
npm run build:portable
```

This produces a single self‑contained file:

```
dist-portable/
└─ index.html      # all JS + CSS inlined into this one file
```

Send that one `index.html` to anyone; they open it in a browser and the app runs. The standard `npm run build` is unaffected — it still emits the normal `dist/` folder for hosting on a server.

**Why two builds?** The normal build references external `assets/*.js` files with absolute paths, which a browser refuses to load when you open `index.html` directly from disk (the `file://` protocol blocks both absolute paths and external ES‑module scripts). The portable build inlines everything into the HTML and uses relative paths, sidestepping both limits.

**Caveats for the portable file:**

- **Data is per‑file, per‑browser.** It uses the browser's local storage tied to that file's location, so expenses don't sync between people, and a person's data lives in whichever browser they opened it in. It's a personal copy, not shared storage — use **Export CSV** to move records around.
- **Local provider only.** The Google Sheets provider (§7) needs network and a real web origin, so it isn't suited to the double‑click file. Keep the portable build on the default `local` provider.

---

## 6. Publishing & moving to a server manually

Because the build output is static files, "deploying" means **copying the `dist/` folder to any web server** and pointing it at a domain or IP. Below are three manual paths, simplest first.

### Option A — Any static web host / shared hosting (drag‑and‑drop)

1. Run `npm run build` on your machine.
2. Open the `dist/` folder.
3. Upload **everything inside `dist/`** (the `index.html` and the `assets/` folder) to your host's web root — e.g. `public_html/` on cPanel hosting, via FTP/SFTP (FileZilla, WinSCP) or the host's file manager.
4. Visit your domain. Done.

### Option B — Your own Linux server with Nginx (manual)

On your machine:

```bash
npm run build
# copy the build to the server (replace user/host/path)
scp -r dist/* user@your-server:/var/www/expense-tracker/
```

On the server, install Nginx and add a site config:

```nginx
# /etc/nginx/sites-available/expense-tracker
server {
    listen 80;
    server_name expenses.example.com;            # your domain or _ for any

    root /var/www/expense-tracker;                # where you copied dist/*
    index index.html;

    # Single-page app: send unknown paths back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-cache the fingerprinted assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/
sudo nginx -t        # test config
sudo systemctl reload nginx
```

Add HTTPS for free with Certbot (recommended, since this is behind a PIN):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d expenses.example.com
```

### Option C — Apache server (manual)

Copy `dist/*` into your Apache web root (e.g. `/var/www/html/expense-tracker`) and add a `.htaccess` so the single‑page app routes correctly:

```apache
# .htaccess inside the app folder
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Make sure `mod_rewrite` is enabled (`sudo a2enmod rewrite && sudo systemctl restart apache2`).

### Quick local "is the build OK?" check before uploading

```bash
npm run build
npm run preview      # serves dist/ at http://localhost:4173
```

### Serving from a sub‑path (e.g. `example.com/expenses/`)

If the app won't live at the domain root, set the base path when building so asset URLs resolve:

```bash
# add to package.json build script or run directly
npx vite build --base=/expenses/
```

Then upload `dist/*` into the matching `/expenses/` folder on the server.

### Deployment checklist

1. `npm run test` passes.
2. `npm run build` succeeds (no type errors).
3. `npm run preview` looks right locally.
4. Upload **the contents of `dist/`** (not the folder itself) to the web root.
5. Configure SPA fallback to `index.html` (Options B/C above).
6. Enable HTTPS — the app is PIN‑gated, so don't serve it over plain HTTP in production.

---

## 7. Moving from browser storage to Google Sheets (later)

The whole app talks to persistence through **one interface**, `IDataStore` (`load()` / `save()`). Browser storage is just one implementation. To centralize data in a Google Sheet:

1. Stand up a tiny proxy (Google Apps Script Web App, or a serverless function) exposing two endpoints against your sheet:
   - `GET  {apiBase}/load?sheetId=…`  → returns the app data as JSON
   - `POST {apiBase}/save?sheetId=…`  → accepts the app data as JSON
   (A proxy keeps credentials off the client.)
2. Fill in the `fetch` calls in `src/services/storage/GoogleSheetsRepository.ts` (a commented reference implementation is already there).
3. Set `VITE_STORAGE_PROVIDER=googleSheets`, `VITE_GOOGLE_SHEETS_ID`, and `VITE_GOOGLE_SHEETS_API_BASE` in `.env`, then rebuild.

**No UI or component code changes** — that is the point of the interface seam.

---

## 8. Security notes (please read)

- The PIN is **light protection** for a shared family device, not bank‑grade security. It's stored as a hash in the browser.
- With the `local` provider, data and PIN live in the browser's storage; clearing site data removes them. **Export CSV regularly.**
- Always serve the production app over **HTTPS**.

---

## 9. Tech stack

React 18 · TypeScript (strict) · Vite · Vitest. No backend required for the default setup.
