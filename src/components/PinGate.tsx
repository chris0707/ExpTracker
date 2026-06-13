import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { config } from "../config";

/**
 * Full-screen lock. Two modes:
 *  - First run: create a household PIN (asks twice to confirm).
 *  - Returning: enter the PIN to unlock.
 * Big inputs, big button - friendly for everyone from kids to grandparents.
 */
export function PinGate() {
  const { pinConfigured, createPin, unlock } = useAuth();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (pinConfigured) {
        const ok = await unlock(pin);
        if (!ok) {
          setError("That PIN doesn't match. Try again.");
          setPin("");
        }
      } else {
        if (pin !== confirm) {
          setError("The two PINs don't match.");
          setBusy(false);
          return;
        }
        await createPin(pin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  return (
    <div className="pin-screen">
      <form className="pin-card" onSubmit={onSubmit}>
        <div className="pin-logo" aria-hidden="true">💰</div>
        <h1>{config.appName}</h1>
        <p className="pin-sub">
          {pinConfigured
            ? "Enter your household PIN to continue."
            : "Welcome! Create a PIN to protect your records."}
        </p>

        <label className="field">
          <span>{pinConfigured ? "PIN" : "Choose a PIN (4-8 digits)"}</span>
          <input
            className="pin-input"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            type="password"
            value={pin}
            onChange={(e) => setPin(onlyDigits(e.target.value))}
            placeholder="••••"
          />
        </label>

        {!pinConfigured && (
          <label className="field">
            <span>Confirm PIN</span>
            <input
              className="pin-input"
              inputMode="numeric"
              autoComplete="off"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(onlyDigits(e.target.value))}
              placeholder="••••"
            />
          </label>
        )}

        {error && <p className="pin-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-lg" type="submit" disabled={busy || pin.length < 4}>
          {pinConfigured ? "Unlock" : "Create PIN & Start"}
        </button>

        {!pinConfigured && (
          <p className="pin-hint">
            Tip: pick something the household remembers. You can reset it later in Settings.
          </p>
        )}
      </form>
    </div>
  );
}
