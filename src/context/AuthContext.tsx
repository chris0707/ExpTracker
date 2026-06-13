import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isPinSet, setPin, verifyPin, isValidPinFormat, clearPin } from "../services/pinService";

/** Holds the unlocked/locked state for the shared household PIN. */
interface AuthContextValue {
  unlocked: boolean;
  pinConfigured: boolean;
  /** Create the PIN for the first time. */
  createPin(pin: string): Promise<void>;
  /** Attempt to unlock; returns true on success. */
  unlock(pin: string): Promise<boolean>;
  lock(): void;
  reset(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(() => isPinSet());

  const value = useMemo<AuthContextValue>(
    () => ({
      unlocked,
      pinConfigured,
      async createPin(pin: string) {
        if (!isValidPinFormat(pin)) {
          throw new Error("PIN must be 4 to 8 digits.");
        }
        await setPin(pin);
        setPinConfigured(true);
        setUnlocked(true);
      },
      async unlock(pin: string) {
        const ok = await verifyPin(pin);
        setUnlocked(ok);
        return ok;
      },
      lock() {
        setUnlocked(false);
      },
      reset() {
        clearPin();
        setPinConfigured(false);
        setUnlocked(false);
      },
    }),
    [unlocked, pinConfigured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
