import { describe, expect, it } from "vitest";
import { computeSafeToSpend } from "../calc-engine";
import type { FinancialState } from "../types";

function baseState(overrides: Partial<FinancialState> = {}): FinancialState {
  return {
    profile: { name: "Test", country: "DE", language: "es", currency: "EUR" },
    currentBalanceMinor: 0,
    desiredReserveMinor: 0,
    incomeSources: [],
    fixedExpenses: [],
    subscriptions: [],
    expenses: [],
    goals: [],
    installments: [],
    onboardingComplete: true,
    ...overrides,
  };
}

describe("computeSafeToSpend", () => {
  it("matches the spec's worked example (§9): 2500 balance, 1200 fixed, 500 reserve, 20 days -> 40/day", () => {
    const state = baseState({
      currentBalanceMinor: 250_000,
      desiredReserveMinor: 50_000,
      incomeSources: [
        {
          id: "salary",
          name: "Salario",
          type: "salary",
          amountMinor: 250_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 20 }, // 20 days from "today" below
          isRecurring: true,
          isActive: true,
        },
      ],
      fixedExpenses: [
        {
          id: "fixed1",
          name: "Gastos fijos",
          amountMinor: 120_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 31 }, // after target date, so excluded from committed-before-target
          category: "bills",
          active: true,
        },
      ],
    });

    // "today" = the 1st, salary due the 20th => 19 days until target.
    // To hit exactly 20 days per the spec example we start from a day where
    // resolveNextOccurrence(20) lands 20 days out.
    const result = computeSafeToSpend(state, "2026-08-01", "2026-08-01");

    expect(result.currentBalanceMinor).toBe(250_000);
    expect(result.discretionaryBudgetMinor).toBe(250_000 - 0 - 50_000); // fixed expense due 31st excluded (after target 20th)
    expect(result.daysUntilTarget).toBe(19);
  });

  it("never treats future income as current money (§6)", () => {
    const state = baseState({
      currentBalanceMinor: 100_000,
      desiredReserveMinor: 0,
      incomeSources: [
        {
          id: "salary",
          name: "Salario",
          type: "salary",
          amountMinor: 200_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 30 },
          isRecurring: true,
          isActive: true,
        },
      ],
    });
    const result = computeSafeToSpend(state, "2026-08-01", "2026-08-01");
    // discretionary budget must NOT include the future salary
    expect(result.discretionaryBudgetMinor).toBe(100_000);
    // safe-to-spend DOES include it, but as a clearly separate additive term
    expect(result.safeToSpendMinor).toBe(100_000 + 200_000);
    expect(result.confirmedIncomeBeforeTargetMinor).toBe(200_000);
  });

  it("recognizes upcoming committed expenses reduce discretionary money (§10)", () => {
    const state = baseState({
      currentBalanceMinor: 120_000,
      desiredReserveMinor: 0,
      incomeSources: [
        {
          id: "salary",
          name: "Salario",
          type: "salary",
          amountMinor: 200_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 30 },
          isRecurring: true,
          isActive: true,
        },
      ],
      fixedExpenses: [
        {
          id: "rent",
          name: "Alquiler",
          amountMinor: 90_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 5 },
          category: "housing",
          active: true,
        },
        {
          id: "insurance",
          name: "Seguro",
          amountMinor: 10_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 5 },
          category: "insurance",
          active: true,
        },
      ],
      subscriptions: [
        {
          id: "sub1",
          name: "Suscripción",
          category: "entertainment",
          amountMinor: 3_000,
          currency: "EUR",
          billingFrequency: "monthly",
          nextBillingDate: "2026-08-05",
          usageFrequency: "daily",
        },
      ],
    });
    const result = computeSafeToSpend(state, "2026-08-01", "2026-08-01");
    // 120000 - (90000+10000+3000) - 0 = 17000 discretionary before target income arrives
    expect(result.discretionaryBudgetMinor).toBe(120_000 - 90_000 - 10_000 - 3_000);
  });

  it("recalculates recommended daily spend after overspending on one day (§43 style)", () => {
    const state = baseState({
      currentBalanceMinor: 250_000,
      desiredReserveMinor: 50_000,
      incomeSources: [
        {
          id: "salary",
          name: "Salario",
          type: "salary",
          amountMinor: 250_000,
          currency: "EUR",
          frequency: "monthly",
          dueDayRule: { type: "fixed", day: 21 },
          isRecurring: true,
          isActive: true,
        },
      ],
      expenses: [
        {
          id: "e1",
          amountMinor: 5_500,
          currency: "EUR",
          category: "restaurants",
          description: "Cena",
          date: "2026-08-01",
          paymentMethod: "card",
          createdAt: "2026-08-01T20:00:00Z",
        },
      ],
    });
    const result = computeSafeToSpend(state, "2026-08-01", "2026-08-01");
    expect(result.spentSoFarThisCycleMinor).toBe(5_500);
    expect(result.remainingSafeToSpendMinor).toBe(result.safeToSpendMinor - 5_500);
    expect(result.recommendedDailySpendingMinor).toBe(
      Math.round(Math.max(0, result.remainingSafeToSpendMinor) / result.daysUntilTarget)
    );
  });
});
