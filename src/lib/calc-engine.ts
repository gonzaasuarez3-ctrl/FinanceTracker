import type {
  CalcResult,
  Expense,
  FinancialState,
  FixedExpense,
  IncomeSource,
  InstallmentPlan,
  ISODate,
  LineItem,
  Subscription,
} from "./types";
import { daysBetween, resolveNextOccurrence, toDate } from "./pay-cycle";

/**
 * FINANCIAL CALCULATION ENGINE
 * ------------------------------------------------------------------
 * Pure, deterministic functions. No DB access, no AI, no side effects.
 * This module is the single source of truth for every number shown
 * anywhere in the app (dashboard, AI consultant, notifications).
 * The AI consultant is only ever allowed to READ the output of this
 * module — it must never re-derive or "adjust" these figures itself.
 */

function nextIncomeDate(source: IncomeSource, today: ISODate): ISODate {
  return resolveNextOccurrence(source.dueDayRule, today);
}

function nextExpenseDate(expense: FixedExpense, today: ISODate): ISODate {
  return resolveNextOccurrence(expense.dueDayRule, today);
}

/**
 * Finds the next "relevant income" date — the anchor for the whole
 * safe-to-spend calculation. This is the nearest upcoming active
 * income source occurrence.
 */
export function findNextRelevantIncomeDate(
  incomeSources: IncomeSource[],
  today: ISODate
): ISODate {
  const active = incomeSources.filter((s) => s.isActive);
  if (active.length === 0) {
    // No income configured — fall back to 30 days out so the app still
    // produces a usable (conservative) number instead of crashing.
    const d = toDate(today);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }
  const dates = active.map((s) => nextIncomeDate(s, today));
  return dates.sort()[0];
}

function sumFixedExpensesBefore(
  fixedExpenses: FixedExpense[],
  today: ISODate,
  targetDate: ISODate
): { total: number; items: LineItem[] } {
  const items: LineItem[] = [];
  let total = 0;
  for (const fe of fixedExpenses.filter((f) => f.active)) {
    const due = nextExpenseDate(fe, today);
    if (due <= targetDate) {
      total += fe.amountMinor;
      items.push({ label: fe.name, amountMinor: fe.amountMinor, kind: "must-spend" });
    }
  }
  return { total, items };
}

function sumSubscriptionsBefore(
  subscriptions: Subscription[],
  targetDate: ISODate
): { total: number; items: LineItem[] } {
  const items: LineItem[] = [];
  let total = 0;
  for (const sub of subscriptions) {
    if (sub.nextBillingDate <= targetDate) {
      total += sub.amountMinor;
      items.push({ label: sub.name, amountMinor: sub.amountMinor, kind: "must-spend" });
    }
  }
  return { total, items };
}

function sumInstallmentsBefore(
  installments: InstallmentPlan[],
  today: ISODate,
  targetDate: ISODate
): { total: number; items: LineItem[] } {
  const items: LineItem[] = [];
  let total = 0;
  for (const plan of installments) {
    if (plan.remainingCount > 0 && plan.firstPaymentDate <= targetDate) {
      total += plan.monthlyPaymentMinor;
      items.push({ label: plan.name, amountMinor: plan.monthlyPaymentMinor, kind: "must-spend" });
    }
  }
  return { total, items };
}

function sumConfirmedIncomeBefore(
  incomeSources: IncomeSource[],
  today: ISODate,
  targetDate: ISODate
): { total: number; items: LineItem[] } {
  const items: LineItem[] = [];
  let total = 0;
  for (const src of incomeSources.filter((s) => s.isActive)) {
    const due = nextIncomeDate(src, today);
    if (due <= targetDate) {
      total += src.amountMinor;
      items.push({ label: src.name, amountMinor: src.amountMinor, kind: "coming" });
    }
  }
  return { total, items };
}

function spentSince(expenses: Expense[], cycleStart: ISODate, today: ISODate): number {
  return expenses
    .filter((e) => e.date >= cycleStart && e.date <= today)
    .reduce((sum, e) => sum + e.amountMinor, 0);
}

function classifyStatus(
  safeToSpendMinor: number,
  desiredReserveMinor: number,
  discretionaryBudgetMinor: number
): CalcResult["status"] {
  if (discretionaryBudgetMinor < 0) return "critical";
  if (safeToSpendMinor <= 0) return "at-risk";
  const reserveCushion = desiredReserveMinor > 0 ? discretionaryBudgetMinor / desiredReserveMinor : 1;
  if (reserveCushion >= 1.5) return "excellent";
  if (reserveCushion >= 0.8) return "on-track";
  if (reserveCushion >= 0.3) return "slightly-above";
  return "at-risk";
}

/**
 * THE core function. Computes everything the dashboard, AI consultant,
 * and notifications need — in one deterministic pass.
 */
export function computeSafeToSpend(
  state: FinancialState,
  today: ISODate,
  cycleStart: ISODate
): CalcResult {
  const targetDate = findNextRelevantIncomeDate(state.incomeSources, today);
  const daysUntilTarget = Math.max(1, daysBetween(today, targetDate));

  const fixed = sumFixedExpensesBefore(state.fixedExpenses, today, targetDate);
  const subs = sumSubscriptionsBefore(state.subscriptions, targetDate);
  const installments = sumInstallmentsBefore(state.installments, today, targetDate);
  const income = sumConfirmedIncomeBefore(state.incomeSources, today, targetDate);

  const committedExpensesBeforeTargetMinor = fixed.total + subs.total + installments.total;
  const confirmedIncomeBeforeTargetMinor = income.total;

  const discretionaryBudgetMinor =
    state.currentBalanceMinor - committedExpensesBeforeTargetMinor - state.desiredReserveMinor;

  const safeToSpendMinor = discretionaryBudgetMinor + confirmedIncomeBeforeTargetMinor;

  const spentSoFarThisCycleMinor = spentSince(state.expenses, cycleStart, today);
  const remainingSafeToSpendMinor = safeToSpendMinor - spentSoFarThisCycleMinor;

  const recommendedDailySpendingMinor = Math.round(
    Math.max(0, remainingSafeToSpendMinor) / daysUntilTarget
  );

  const breakdown: LineItem[] = [
    { label: "Saldo actual", amountMinor: state.currentBalanceMinor, kind: "have" },
    ...income.items,
    ...fixed.items,
    ...subs.items,
    ...installments.items,
    { label: "Reserva deseada", amountMinor: state.desiredReserveMinor, kind: "want-to-save" },
  ];

  const status = classifyStatus(
    remainingSafeToSpendMinor,
    state.desiredReserveMinor,
    discretionaryBudgetMinor
  );

  return {
    today,
    targetDate,
    daysUntilTarget,
    currentBalanceMinor: state.currentBalanceMinor,
    confirmedIncomeBeforeTargetMinor,
    committedExpensesBeforeTargetMinor,
    desiredReserveMinor: state.desiredReserveMinor,
    discretionaryBudgetMinor,
    safeToSpendMinor,
    recommendedDailySpendingMinor,
    spentSoFarThisCycleMinor,
    remainingSafeToSpendMinor,
    breakdown,
    status,
  };
}

/** Financial Health Score — transparent, factor-based, 0-100. */
export interface HealthFactor {
  label: string;
  score: number; // 0-100 contribution
  weight: number; // 0-1
  note: string;
}

export interface HealthScoreResult {
  score: number;
  factors: HealthFactor[];
}

export function computeHealthScore(state: FinancialState, calc: CalcResult): HealthScoreResult {
  const factors: HealthFactor[] = [];

  // Budget adherence: spent vs safe-to-spend pace
  const idealSpend =
    calc.recommendedDailySpendingMinor * Math.max(1, daysBetween(calc.today, calc.today));
  const paceScore = calc.remainingSafeToSpendMinor >= 0 ? 100 : 30;
  factors.push({
    label: "Ritmo de gasto",
    score: paceScore,
    weight: 0.3,
    note:
      calc.remainingSafeToSpendMinor >= 0
        ? "Vas dentro de tu presupuesto seguro."
        : "Has superado tu presupuesto seguro para este ciclo.",
  });

  // Fixed expense ratio vs income
  const totalIncome = state.incomeSources.reduce((s, i) => s + (i.isActive ? i.amountMinor : 0), 0);
  const totalFixed = state.fixedExpenses.reduce((s, f) => s + (f.active ? f.amountMinor : 0), 0);
  const fixedRatio = totalIncome > 0 ? totalFixed / totalIncome : 1;
  const fixedScore = Math.max(0, Math.min(100, Math.round((1 - fixedRatio) * 130)));
  factors.push({
    label: "Peso de gastos fijos",
    score: fixedScore,
    weight: 0.25,
    note: `Tus gastos fijos representan ~${Math.round(fixedRatio * 100)}% de tu ingreso.`,
  });

  // Subscription burden
  const totalSubs = state.subscriptions.reduce((s, x) => s + x.amountMinor, 0);
  const subsRatio = totalIncome > 0 ? totalSubs / totalIncome : 0;
  const subsScore = Math.max(0, Math.min(100, Math.round((1 - subsRatio * 5) * 100)));
  factors.push({
    label: "Carga de suscripciones",
    score: subsScore,
    weight: 0.15,
    note: `Suscripciones: ~${Math.round(subsRatio * 100)}% de tu ingreso.`,
  });

  // Goal progress
  const goalScore =
    state.goals.length === 0
      ? 70
      : Math.round(
          (state.goals.reduce(
            (s, g) => s + Math.min(1, g.currentAmountMinor / Math.max(1, g.targetAmountMinor)),
            0
          ) /
            state.goals.length) *
            100
        );
  factors.push({
    label: "Progreso de metas",
    score: goalScore,
    weight: 0.2,
    note:
      state.goals.length === 0
        ? "Aún no tienes metas configuradas."
        : "Basado en el progreso medio de tus metas activas.",
  });

  // Reserve / emergency cushion
  const reserveScore =
    state.desiredReserveMinor > 0
      ? Math.max(0, Math.min(100, Math.round((state.currentBalanceMinor / state.desiredReserveMinor) * 60)))
      : 50;
  factors.push({
    label: "Colchón de reserva",
    score: reserveScore,
    weight: 0.1,
    note: "Comparado con tu reserva deseada de fin de ciclo.",
  });

  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  return { score: Math.max(0, Math.min(100, score)), factors };
}

export function formatMoney(minor: number, currency: string, locale = "es-ES"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
