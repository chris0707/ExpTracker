import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import { PinGate } from "./components/PinGate";
import { Header } from "./components/Header";
import { ExpensesView } from "./components/ExpensesView";
import { SettingsView } from "./components/SettingsView";

type View = "expenses" | "settings";

/** Inner shell - assumes the app is unlocked and data is loaded. */
function Shell() {
  const [view, setView] = useState<View>("expenses");
  const { lock } = useAuth();
  return (
    <div className="app">
      <Header view={view} onView={setView} onLock={lock} />
      <main className="app-main">
        {view === "expenses" ? <ExpensesView /> : <SettingsView />}
      </main>
      <footer className="app-footer">
        Stored on this device · Export a CSV from Settings for backups.
      </footer>
    </div>
  );
}

/** Decides between the loading state, the PIN gate, and the app. */
function Gate() {
  const { unlocked } = useAuth();
  const { loading, error } = useAppData();

  if (loading) {
    return (
      <div className="splash">
        <div className="spinner" aria-hidden="true" />
        <p>Loading your records…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="splash">
        <p className="pin-error">⚠️ {error}</p>
      </div>
    );
  }
  return unlocked ? <Shell /> : <PinGate />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Gate />
      </AppDataProvider>
    </AuthProvider>
  );
}
