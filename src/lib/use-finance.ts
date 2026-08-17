"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Expense, FinancialState } from "./types";
import { emptyState, loadState, newId, saveState } from "./storage";
import { computeSafeToSpend, computeHealthScore } from "./calc-engine";

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

export function useFinance() {
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

  const calc = useMemo(
    () => computeSafeToSpend(state, todayISO(), cycleStartISO()),
    [state]
  );

  const health = useMemo(() => computeHealthScore(state, calc), [state, calc]);

  return { state, update, addExpense, deleteExpense, calc, health, hydrated };
}
