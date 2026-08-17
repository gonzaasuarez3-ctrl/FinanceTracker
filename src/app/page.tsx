"use client";

import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { SafeToSpendHero, MiniCard, BreakdownList } from "@/components/DashboardCards";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

export default function DashboardPage() {
  const { state, calc, health, hydrated } = useFinance();
  const { t, tVars, locale } = useTranslation();

  if (!hydrated) return null;

  if (!state.onboardingComplete) {
    return (
      <div className="card text-center py-16">
        <p className="font-display text-2xl mb-2">{t("onboarding_title")}</p>
        <p className="text-ink/60 mb-6 max-w-md mx-auto">{t("onboarding_body")}</p>
        <Link
          href="/onboarding"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-full font-medium hover:bg-moss transition-colors"
        >
          {t("onboarding_cta")}
        </Link>
      </div>
    );
  }

  const currency = state.profile.currency;

  return (
    <div className="space-y-4">
      <SafeToSpendHero calc={calc} currency={currency} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniCard label={t("current_balance")} value={formatMoney(calc.currentBalanceMinor, currency, locale)} />
        <MiniCard
          label={t("next_income")}
          value={formatMoney(calc.confirmedIncomeBeforeTargetMinor, currency, locale)}
          sub={tVars("in_n_days", { n: calc.daysUntilTarget })}
        />
        <MiniCard
          label={t("upcoming_expenses")}
          value={formatMoney(calc.committedExpensesBeforeTargetMinor, currency, locale)}
        />
        <MiniCard label={t("reserve_goal")} value={formatMoney(calc.desiredReserveMinor, currency, locale)} />
        <MiniCard
          label={t("spent_this_cycle")}
          value={formatMoney(calc.spentSoFarThisCycleMinor, currency, locale)}
        />
        <MiniCard
          label={t("financial_health")}
          value={`${health.score}/100`}
          sub={health.factors[0]?.note}
        />
      </div>

      <BreakdownList calc={calc} currency={currency} />

      <div className="flex justify-end">
        <Link
          href="/expenses"
          className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ink transition-colors"
        >
          {t("add_expense")}
        </Link>
      </div>
    </div>
  );
}
