/**
 * Shared household PIN. We never store the raw PIN - only a SHA-256 hash, so
 * a glance at browser storage doesn't reveal it. This is light protection
 * (suitable for a family device), not bank-grade security.
 */

const PIN_KEY = "het.pinHash.v1";

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isPinSet(): boolean {
  return localStorage.getItem(PIN_KEY) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const hash = await sha256(pin);
  localStorage.setItem(PIN_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  const hash = await sha256(pin);
  return hash === stored;
}

export function clearPin(): void {
  localStorage.removeItem(PIN_KEY);
}

/** Basic format rule: 4-8 digits. Kept here so the UI and tests agree. */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}
