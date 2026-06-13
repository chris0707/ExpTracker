import { config } from "../config";

type View = "expenses" | "settings";

interface Props {
  view: View;
  onView: (v: View) => void;
  onLock: () => void;
}

/** App header with title and the two tabs (Expenses / Settings) + Lock. */
export function Header({ view, onView, onLock }: Props) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-logo" aria-hidden="true">💰</span>
        <span className="brand-name">{config.appName}</span>
      </div>
      <nav className="tabs">
        <button
          className={`tab ${view === "expenses" ? "tab-active" : ""}`}
          onClick={() => onView("expenses")}
        >
          Expenses
        </button>
        <button
          className={`tab ${view === "settings" ? "tab-active" : ""}`}
          onClick={() => onView("settings")}
        >
          Settings
        </button>
        <button className="btn btn-ghost btn-sm lock-btn" onClick={onLock}>
          🔒 Lock
        </button>
      </nav>
    </header>
  );
}
