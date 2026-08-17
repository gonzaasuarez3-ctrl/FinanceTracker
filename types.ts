// All money amounts are stored in MINOR UNITS (cents) as integers.
// Never use floats for money math — see calc-engine.ts.

export type ISODate = string; // "2026-08-30"

export type Frequency = "monthly" | "biweekly" | "weekly" | "custom";

export type DueDayRule =
  | { type: "fixed"; day: number } // e.g. the 30th
  | { type: "lastWorkday" }
  | { type: "approximate"; day: number; varianceDays: number } // "around the 30th"
  | { type: "custom"; everyDays: number; anchor: ISODate };

export interface UserProfile {
  name: string;
  country: string;
  language: "en" | "es" | "de";
  currency: string; // ISO 4217, e.g. "EUR"
  timezone?: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  type: "salary" | "freelance" | "bonus" | "side" | "other";
  amountMinor: number;
  currency: string;
  frequency: Frequency;
  dueDayRule: DueDayRule;
  isRecurring: boolean;
  isActive: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amountMinor: number;
  currency: string;
  frequency: Frequency;
  dueDayRule: DueDayRule;
  category: string;
  active: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amountMinor: number;
  currency: string;
  billingFrequency: Frequency;
  nextBillingDate: ISODate;
  usageFrequency: "daily" | "weekly" | "monthly" | "rarely";
  notes?: string;
}

export interface Expense {
  id: string;
  amountMinor: number;
  currency: string;
  category: string;
  description: string;
  date: ISODate;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  targetDate?: ISODate;
  priority: "low" | "medium" | "high";
  monthlyContributionMinor?: number;
}

export interface InstallmentPlan {
  id: string;
  name: string;
  totalAmountMinor: number;
  downPaymentMinor: number;
  installmentCount: number;
  monthlyPaymentMinor: number;
  interestRate: number;
  fees: number;
  firstPaymentDate: ISODate;
  remainingCount: number;
}

export interface FinancialState {
  profile: UserProfile;
  currentBalanceMinor: number;
  desiredReserveMinor: number;
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  subscriptions: Subscription[];
  expenses: Expense[];
  goals: FinancialGoal[];
  installments: InstallmentPlan[];
  onboardingComplete: boolean;
}

export interface LineItem {
  label: string;
  amountMinor: number;
  kind: "have" | "coming" | "must-spend" | "want-to-save";
}

export interface CalcResult {
  today: ISODate;
  targetDate: ISODate;
  daysUntilTarget: number;
  currentBalanceMinor: number;
  confirmedIncomeBeforeTargetMinor: number;
  committedExpensesBeforeTargetMinor: number;
  desiredReserveMinor: number;
  discretionaryBudgetMinor: number; // current - committed - reserve (no future income)
  safeToSpendMinor: number; // discretionary + confirmed income before target
  recommendedDailySpendingMinor: number;
  spentSoFarThisCycleMinor: number;
  remainingSafeToSpendMinor: number;
  breakdown: LineItem[];
  status: "excellent" | "on-track" | "slightly-above" | "at-risk" | "critical";
}
