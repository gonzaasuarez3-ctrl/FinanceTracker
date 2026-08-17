import type { FinancialState } from "./types";

/**
 * MVP persistence: browser localStorage.
 *
 * This is intentionally isolated behind a small interface so that
 * swapping it for a real backend (PostgreSQL + API, per the full
 * architecture doc) later only requires changing this file — nothing
 * in the UI or calc-engine needs to know where the data lives.
 */
const STORAGE_KEY = "finance-tracker:state:v1";

export const emptyState: FinancialState = {
  profile: { name: "", country: "DE", language: "es", currency: "EUR" },
  currentBalanceMinor: 0,
  desiredReserveMinor: 0,
  incomeSources: [],
  fixedExpenses: [],
  subscriptions: [],
  expenses: [],
  goals: [],
  installments: [],
  onboardingComplete: false,
};

export function loadState(): FinancialState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    return { ...emptyState, ...JSON.parse(raw) };
  } catch {
    return emptyState;
  }
}

export function saveState(state: FinancialState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Loose shape check for imported JSON — enough to reject obviously wrong
 * files (a random JSON, a different app's export) without being a full
 * schema validator. Missing fields are backfilled from emptyState by
 * loadState()/the caller, same as any state read.
 */
export function isValidFinancialState(data: unknown): data is FinancialState {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.profile === "object" &&
    Array.isArray(d.expenses) &&
    Array.isArray(d.fixedExpenses) &&
    Array.isArray(d.incomeSources)
  );
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
