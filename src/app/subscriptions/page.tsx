"use client";

import { useMemo, useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { newId } from "@/lib/storage";
import { computeSubscriptionInsights } from "@/lib/subscription-insights";
import type { Subscription } from "@/lib/types";

const CATEGORIES = ["Streaming", "Música", "Gimnasio", "Software", "Almacenamiento", "Telefonía", "Otro"];
const USAGE_OPTIONS: { value: Subscription["usageFrequency"]; label: string }[] = [
  { value: "daily", label: "Uso diario" },
  { value: "weekly", label: "Uso semanal" },
  { value: "monthly", label: "Uso mensual" },
  { value: "rarely", label: "Uso poco frecuente" },
];

const SEVERITY_STYLE: Record<string, string> = {
  warning: "border-l-4 border-clay bg-clay/5",
  suggestion: "border-l-4 border-gold bg-gold/5",
  info: "border-l-4 border-sage bg-sage/5",
};

export default function SubscriptionsPage() {
  const { state, update, hydrated } = useFinance();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [usage, setUsage] = useState<Subscription["usageFrequency"]>("weekly");
  const [nextBilling, setNextBilling] = useState(new Date().toISOString().slice(0, 10));

  const insights = useMemo(
    () => computeSubscriptionInsights(state.subscriptions),
    [state.subscriptions]
  );

  if (!hydrated) return null;
  const currency = state.profile.currency || "EUR";

  const monthlyTotal = state.subscriptions.reduce((s, x) => s + x.amountMinor, 0);
  const annualTotal = monthlyTotal * 12;

  function addSub(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount) return;
    update({
      subscriptions: [
        ...state.subscriptions,
        {
          id: newId(),
          name,
          category,
          amountMinor: Math.round(parseFloat(amount) * 100),
          currency,
          billingFrequency: "monthly",
          nextBillingDate: nextBilling,
          usageFrequency: usage,
        },
      ],
    });
    setName("");
    setAmount("");
  }

  function removeSub(id: string) {
    update({ subscriptions: state.subscriptions.filter((s) => s.id !== id) });
  }

  function updateUsage(id: string, usageFrequency: Subscription["usageFrequency"]) {
    update({
      subscriptions: state.subscriptions.map((s) => (s.id === id ? { ...s, usageFrequency } : s)),
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">Costo mensual</p>
          <p className="font-display text-2xl">{formatMoney(monthlyTotal, currency)}</p>
        </div>
        <div className="card">
          <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">Costo anual</p>
          <p className="font-display text-2xl text-clay">{formatMoney(annualTotal, currency)}</p>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card">
          <p className="font-display text-lg mb-1">Sugerencias sobre tus suscripciones</p>
          <p className="text-ink/50 text-xs mb-4">
            Basadas en reglas simples sobre lo que registraste (frecuencia de uso, categoría, costo) —
            no en precios de mercado inventados.
          </p>
          <div className="space-y-2">
            {insights.map((ins, idx) => (
              <div key={idx} className={`rounded-lg p-3 ${SEVERITY_STYLE[ins.severity]}`}>
                <p className="text-sm font-medium text-ink">{ins.title}</p>
                <p className="text-sm text-ink/60 mt-0.5">{ins.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={addSub} className="card space-y-3">
        <h2 className="font-display text-lg">Nueva suscripción</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Nombre (ej. Netflix)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" placeholder="Monto mensual" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={usage} onChange={(e) => setUsage(e.target.value as Subscription["usageFrequency"])}>
            {USAGE_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
          <input className="input col-span-2" type="date" value={nextBilling} onChange={(e) => setNextBilling(e.target.value)} />
        </div>
        <button type="submit" className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium">
          Añadir
        </button>
      </form>

      <div className="card">
        <ul className="divide-y divide-mist">
          {state.subscriptions.map((s) => (
            <li key={s.id} className="py-2.5 flex justify-between items-center text-sm gap-3">
              <div className="flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-ink/40 text-xs">
                  {s.category} · Próximo cobro: {new Date(s.nextBillingDate).toLocaleDateString("es-ES")}
                </p>
              </div>
              <select
                className="input !w-auto text-xs py-1.5"
                value={s.usageFrequency}
                onChange={(e) => updateUsage(s.id, e.target.value as Subscription["usageFrequency"])}
              >
                {USAGE_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
              <span className="font-mono whitespace-nowrap">{formatMoney(s.amountMinor, currency)}/mes</span>
              <button onClick={() => removeSub(s.id)} className="text-ink/30 hover:text-alert text-xs">
                Eliminar
              </button>
            </li>
          ))}
          {state.subscriptions.length === 0 && (
            <p className="text-ink/50 text-sm py-2">Aún no tienes suscripciones registradas.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
