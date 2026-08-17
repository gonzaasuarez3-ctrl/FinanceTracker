"use client";

import { useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { newId } from "@/lib/storage";

export default function SubscriptionsPage() {
  const { state, update, hydrated } = useFinance();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [nextBilling, setNextBilling] = useState(new Date().toISOString().slice(0, 10));

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
          category: "Suscripciones",
          amountMinor: Math.round(parseFloat(amount) * 100),
          currency,
          billingFrequency: "monthly",
          nextBillingDate: nextBilling,
          usageFrequency: "weekly",
        },
      ],
    });
    setName("");
    setAmount("");
  }

  function removeSub(id: string) {
    update({ subscriptions: state.subscriptions.filter((s) => s.id !== id) });
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

      <form onSubmit={addSub} className="card space-y-3">
        <h2 className="font-display text-lg">Nueva suscripción</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="input" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" placeholder="Monto mensual" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" type="date" value={nextBilling} onChange={(e) => setNextBilling(e.target.value)} />
        </div>
        <button type="submit" className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium">
          Añadir
        </button>
      </form>

      <div className="card">
        <ul className="divide-y divide-mist">
          {state.subscriptions.map((s) => (
            <li key={s.id} className="py-2.5 flex justify-between items-center text-sm">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-ink/40 text-xs">
                  Próximo cobro: {new Date(s.nextBillingDate).toLocaleDateString("es-ES")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatMoney(s.amountMinor, currency)}/mes</span>
                <button onClick={() => removeSub(s.id)} className="text-ink/30 hover:text-alert text-xs">
                  Eliminar
                </button>
              </div>
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
