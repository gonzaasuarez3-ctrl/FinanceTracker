"use client";

import { useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";

const CATEGORIES = [
  "Comida", "Supermercado", "Restaurantes", "Transporte", "Compras",
  "Ocio", "Salud", "Deporte", "Facturas", "Suscripciones", "Viajes",
  "Mascotas", "Educación", "Otro",
];

export default function ExpensesPage() {
  const { state, calc, addExpense, deleteExpense, hydrated } = useFinance();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  if (!hydrated) return null;
  const currency = state.profile.currency || "EUR";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    addExpense({
      amountMinor: Math.round(parseFloat(amount) * 100),
      currency,
      category,
      description,
      date,
      paymentMethod: "card",
    });
    setAmount("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">Puedes gastar hoy</p>
        <p className="font-display text-3xl">
          {formatMoney(Math.max(0, calc.recommendedDailySpendingMinor), currency)}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-display text-lg">Añadir gasto</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder={`Monto (${currency})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-moss text-paper py-2.5 rounded-full text-sm font-medium">
          Guardar gasto
        </button>
      </form>

      <div className="card">
        <h2 className="font-display text-lg mb-3">Historial</h2>
        {state.expenses.length === 0 ? (
          <p className="text-ink/50 text-sm">Aún no has registrado gastos.</p>
        ) : (
          <ul className="divide-y divide-mist">
            {state.expenses.map((e) => (
              <li key={e.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-ink font-medium">{e.description || e.category}</p>
                  <p className="text-ink/40 text-xs">
                    {e.category} · {new Date(e.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatMoney(e.amountMinor, e.currency)}</span>
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="text-ink/30 hover:text-alert text-xs"
                    aria-label="Eliminar gasto"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
