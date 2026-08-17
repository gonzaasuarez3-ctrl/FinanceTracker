"use client";

import { useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { newId } from "@/lib/storage";
import type { FixedExpense } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { categoryOptions, categoryLabel } from "@/lib/categories";

const CATEGORIES = [
  "Vivienda", "Seguros", "Transporte", "Servicios", "Telefonía",
  "Préstamos", "Cuidado personal", "Mascotas", "Otro",
];

interface FormState {
  id: string | null;
  name: string;
  amount: string;
  day: string;
  category: string;
}

const emptyForm: FormState = { id: null, name: "", amount: "", day: "1", category: CATEGORIES[0] };

export default function FixedExpensesPage() {
  const { state, update, hydrated } = useFinance();
  const { t, tVars, lang, locale } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);

  if (!hydrated) return null;
  const currency = state.profile.currency || "EUR";
  const monthlyTotal = state.fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + f.amountMinor, 0);

  function startEdit(fe: FixedExpense) {
    const day = fe.dueDayRule.type === "fixed" || fe.dueDayRule.type === "approximate" ? fe.dueDayRule.day : 1;
    setForm({ id: fe.id, name: fe.name, amount: String(fe.amountMinor / 100), day: String(day), category: fe.category });
  }

  function cancelEdit() {
    setForm(emptyForm);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    if (form.id) {
      update({
        fixedExpenses: state.fixedExpenses.map((fe) =>
          fe.id === form.id
            ? {
                ...fe,
                name: form.name,
                amountMinor: Math.round(parseFloat(form.amount) * 100),
                category: form.category,
                dueDayRule: { type: "fixed", day: parseInt(form.day || "1") },
              }
            : fe
        ),
      });
    } else {
      update({
        fixedExpenses: [
          ...state.fixedExpenses,
          {
            id: newId(),
            name: form.name,
            amountMinor: Math.round(parseFloat(form.amount) * 100),
            currency,
            frequency: "monthly",
            dueDayRule: { type: "fixed", day: parseInt(form.day || "1") },
            category: form.category,
            active: true,
          },
        ],
      });
    }
    setForm(emptyForm);
  }

  function removeFixed(id: string) {
    update({ fixedExpenses: state.fixedExpenses.filter((f) => f.id !== id) });
  }

  function toggleActive(id: string) {
    update({
      fixedExpenses: state.fixedExpenses.map((f) => (f.id === id ? { ...f, active: !f.active } : f)),
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">{t("fixed_monthly_total")}</p>
        <p className="font-display text-2xl">{formatMoney(monthlyTotal, currency, locale)}</p>
      </div>

      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-display text-lg">{form.id ? t("edit_fixed_expense") : t("new_fixed_expense")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input col-span-2"
            placeholder={t("fixed_name_placeholder")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder={t("monthly_amount_placeholder")}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min={1}
            max={31}
            placeholder={t("payment_day_placeholder")}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
          />
          <select
            className="input col-span-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categoryOptions(CATEGORIES, lang).map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium">
            {form.id ? t("save_changes") : t("add_word")}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-ink/50 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-mist/50"
            >
              {t("cancel_word")}
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <ul className="divide-y divide-mist">
          {state.fixedExpenses.map((fe) => {
            const day = fe.dueDayRule.type === "fixed" || fe.dueDayRule.type === "approximate" ? fe.dueDayRule.day : "-";
            return (
              <li key={fe.id} className="py-2.5 flex justify-between items-center text-sm gap-3">
                <div className="flex-1">
                  <p className={`font-medium ${!fe.active ? "text-ink/40 line-through" : ""}`}>{fe.name}</p>
                  <p className="text-ink/40 text-xs">
                    {categoryLabel(fe.category, lang)} · {tVars("day_of_month", { d: day })}
                  </p>
                </div>
                <span className="font-mono whitespace-nowrap">{formatMoney(fe.amountMinor, currency, locale)}/mes</span>
                <button onClick={() => toggleActive(fe.id)} className="text-ink/40 hover:text-moss text-xs whitespace-nowrap">
                  {fe.active ? t("deactivate_word") : t("activate_word")}
                </button>
                <button onClick={() => startEdit(fe)} className="text-ink/40 hover:text-ink text-xs">
                  {t("edit_word")}
                </button>
                <button onClick={() => removeFixed(fe.id)} className="text-ink/30 hover:text-alert text-xs">
                  {t("delete_word")}
                </button>
              </li>
            );
          })}
          {state.fixedExpenses.length === 0 && (
            <p className="text-ink/50 text-sm py-2">{t("no_fixed_expenses_yet")}</p>
          )}
        </ul>
      </div>
    </div>
  );
}
