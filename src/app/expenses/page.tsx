"use client";

import { useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { useTranslation } from "@/lib/i18n";
import { categoryOptions, categoryLabel } from "@/lib/categories";

const CATEGORIES = [
  "Comida", "Supermercado", "Restaurantes", "Transporte", "Compras",
  "Ocio", "Salud", "Deporte", "Facturas", "Suscripciones", "Viajes",
  "Mascotas", "Educación", "Otro",
];

export default function ExpensesPage() {
  const { state, calc, addExpense, deleteExpense, hydrated } = useFinance();
  const { t, tVars, lang, locale } = useTranslation();
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
        <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">{t("safe_to_spend_short")}</p>
        <p className="font-display text-3xl">
          {formatMoney(Math.max(0, calc.recommendedDailySpendingMinor), currency, locale)}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-display text-lg">{t("add_expense_heading")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder={tVars("amount_with_currency", { c: currency })}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOptions(CATEGORIES, lang).map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder={t("description_placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-moss text-paper py-2.5 rounded-full text-sm font-medium">
          {t("save_expense")}
        </button>
      </form>

      <div className="card">
        <h2 className="font-display text-lg mb-3">{t("history_title")}</h2>
        {state.expenses.length === 0 ? (
          <p className="text-ink/50 text-sm">{t("no_expenses_yet")}</p>
        ) : (
          <ul className="divide-y divide-mist">
            {state.expenses.map((e) => (
              <li key={e.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-ink font-medium">{e.description || categoryLabel(e.category, lang)}</p>
                  <p className="text-ink/40 text-xs">
                    {categoryLabel(e.category, lang)} · {new Date(e.date).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatMoney(e.amountMinor, e.currency, locale)}</span>
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="text-ink/30 hover:text-alert text-xs"
                    aria-label={t("delete_word")}
                  >
                    {t("delete_word")}
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
