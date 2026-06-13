import { useState } from "react";
import { MembersManager } from "./MembersManager";
import { CategoryManager } from "./CategoryManager";
import { DataTools } from "./DataTools";
import { useAuth } from "../context/AuthContext";
import { isValidPinFormat, setPin } from "../services/pinService";

/** Settings hub: members, categories, data records, and security (PIN). */
export function SettingsView() {
  const { reset } = useAuth();
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  const changePin = async () => {
    if (!isValidPinFormat(newPin)) {
      setPinMsg("PIN must be 4 to 8 digits.");
      return;
    }
    await setPin(newPin);
    setNewPin("");
    setPinMsg("PIN updated.");
  };

  return (
    <div className="settings">
      <section className="card">
        <h2>👨‍👩‍👧 Members</h2>
        <p className="muted">Everyone who can have expenses attributed to them.</p>
        <MembersManager />
      </section>

      <section className="card">
        <h2>🏷️ Categories</h2>
        <p className="muted">Built-in categories plus any you add.</p>
        <CategoryManager />
      </section>

      <section className="card">
        <h2>💾 Data &amp; records</h2>
        <DataTools />
      </section>

      <section className="card">
        <h2>🔒 Security</h2>
        <div className="add-row">
          <input
            type="password"
            inputMode="numeric"
            placeholder="New PIN (4-8 digits)"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            aria-label="New PIN"
          />
          <button className="btn btn-primary" onClick={changePin}>Change PIN</button>
        </div>
        {pinMsg && <p className="info-msg" role="status">{pinMsg}</p>}
        <p className="muted small" style={{ marginTop: "1rem" }}>
          Resetting clears the PIN only (your expenses stay). You'll be asked to set a new one.
        </p>
        <button className="btn btn-ghost btn-sm" onClick={reset}>Reset PIN</button>
      </section>
    </div>
  );
}
