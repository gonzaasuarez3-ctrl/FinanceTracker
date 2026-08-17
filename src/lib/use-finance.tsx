"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Expense, FinancialState } from "./types";
import { emptyState, loadState, newId, saveState } from "./storage";
import { computeSafeToSpend, computeHealthScore, type HealthScoreResult } from "./calc-engine";
import type { CalcResult } from "./types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// The "cycle start" is a simplification for the MVP: the 1st of the
// current calendar month. The full architecture materializes real
// FinancialCycle rows anchored to the user's actual pay date; that
// logic slots in here once a backend exists.
function cycleStartISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

interface FinanceContextValue {
  state: FinancialState;
  update: (patch: Partial<FinancialState>) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;
  calc: CalcResult;
  health: HealthScoreResult;
  hydrated: boolean;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

/**
 * Single source of truth for the app's financial state, shared via
 * React Context. This matters specifically because components like
 * NavBar live in the root layout and mount only ONCE for the whole
 * session (Next.js doesn't remount layouts on navigation) — if every
 * component kept its own independent copy of state (as a plain hook
 * would), NavBar would never see updates made from other screens
 * (e.g. changing the language in Settings) without a full page reload.
 * Routing through one Provider fixes that: every consumer re-renders
 * from the same state the moment it changes, anywhere in the app.
 */
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinancialState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<FinancialState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      expenses: [
        { ...expense, id: newId(), createdAt: new Date().toISOString() },
        ...prev.expenses,
      ],
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
  }, []);

  const calc = useMemo(() => computeSafeToSpend(state, todayISO(), cycleStartISO()), [state]);
  const health = useMemo(() => computeHealthScore(state, calc), [state, calc]);

  const value: FinanceContextValue = {
    state,
    update,
    addExpense,
    deleteExpense,
    calc,
    health,
    hydrated,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within a <FinanceProvider>");
  }
  return ctx;
}
