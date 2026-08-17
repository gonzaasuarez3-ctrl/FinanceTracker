"use client";

import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { SafeToSpendHero, MiniCard, BreakdownList } from "@/components/DashboardCards";
import Link from "next/link";

export default function DashboardPage() {
  const { state, calc, health, hydrated } = useFinance();

  if (!hydrated) return null;

  if (!state.onboardingComplete) {
    return (
      <div className="card text-center py-16">
        <p className="font-display text-2xl mb-2">Empecemos por conocer tu situación</p>
        <p className="text-ink/60 mb-6 max-w-md mx-auto">
          Necesitamos algunos datos — tu saldo, tu salario y tus gastos fijos — para calcular
          cuánto puedes gastar hoy con seguridad.
        </p>
        <Link
          href="/onboarding"
          className="inline-block bg-ink text-paper px-6 py-3 rounded-full font-medium hover:bg-moss transition-colors"
        >
          Configurar mi cuenta
        </Link>
      </div>
    );
  }

  const currency = state.profile.currency;

  return (
    <div className="space-y-4">
      <SafeToSpendHero calc={calc} currency={currency} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniCard label="Saldo actual" value={formatMoney(calc.currentBalanceMinor, currency)} />
        <MiniCard
          label="Próximo ingreso"
          value={formatMoney(calc.confirmedIncomeBeforeTargetMinor, currency)}
          sub={`en ${calc.daysUntilTarget} días`}
        />
        <MiniCard
          label="Gastos próximos"
          value={formatMoney(calc.committedExpensesBeforeTargetMinor, currency)}
        />
        <MiniCard
          label="Meta de reserva"
          value={formatMoney(calc.desiredReserveMinor, currency)}
        />
        <MiniCard
          label="Gastado este ciclo"
          value={formatMoney(calc.spentSoFarThisCycleMinor, currency)}
        />
        <MiniCard
          label="Salud financiera"
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
          + Añadir gasto
        </Link>
      </div>
    </div>
  );
}
