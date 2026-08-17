"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/lib/use-finance";
import { newId } from "@/lib/storage";
import { useTranslation, type Lang } from "@/lib/i18n";
import clsx from "clsx";

const CURRENCIES = ["EUR", "USD", "GBP", "PLN", "RON", "ARS"];
const COUNTRIES = ["DE", "ES", "AR", "RO", "PL", "US", "GB"];
const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export default function OnboardingPage() {
  const { state, update } = useFinance();
  const { t, tVars, lang } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("DE");
  const [currency, setCurrency] = useState("EUR");

  const [salaryAmount, setSalaryAmount] = useState("2500");
  const [salaryDay, setSalaryDay] = useState("30");
  const [approximate, setApproximate] = useState(true);

  const [currentBalance, setCurrentBalance] = useState("1500");
  const [desiredReserve, setDesiredReserve] = useState("500");

  const [fixedExpenses, setFixedExpenses] = useState([
    { name: "", amount: "", day: "5" },
  ]);

  const steps = [t("step_profile"), t("step_income"), t("step_situation"), t("step_fixed")];

  function selectLanguage(l: Lang) {
    update({ profile: { ...state.profile, language: l } });
  }

  function addFixedExpense() {
    setFixedExpenses((prev) => [...prev, { name: "", amount: "", day: "1" }]);
  }

  function finish() {
    update({
      profile: { name, country, language: lang, currency },
      currentBalanceMinor: Math.round(parseFloat(currentBalance || "0") * 100),
      desiredReserveMinor: Math.round(parseFloat(desiredReserve || "0") * 100),
      incomeSources: [
        {
          id: newId(),
          name: "Salario principal",
          type: "salary",
          amountMinor: Math.round(parseFloat(salaryAmount || "0") * 100),
          currency,
          frequency: "monthly",
          dueDayRule: approximate
            ? { type: "approximate", day: parseInt(salaryDay || "30"), varianceDays: 2 }
            : { type: "fixed", day: parseInt(salaryDay || "30") },
          isRecurring: true,
          isActive: true,
        },
      ],
      fixedExpenses: fixedExpenses
        .filter((f) => f.name && f.amount)
        .map((f) => ({
          id: newId(),
          name: f.name,
          amountMinor: Math.round(parseFloat(f.amount) * 100),
          currency,
          frequency: "monthly" as const,
          dueDayRule: { type: "fixed" as const, day: parseInt(f.day || "1") },
          category: "Otro",
          active: true,
        })),
      onboardingComplete: true,
    });
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={clsx(
                "h-1.5 rounded-full transition-colors",
                i <= step ? "bg-moss" : "bg-mist"
              )}
            />
            <p className={clsx("text-xs mt-1.5", i === step ? "text-ink font-medium" : "text-ink/40")}>
              {s}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">{t("tell_us_about_you")}</h2>
            <Field label="Idioma / Language / Sprache">
              <div className="flex gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => selectLanguage(l.code)}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      lang === l.code
                        ? "bg-ink text-paper border-ink"
                        : "border-mist text-ink/70 hover:bg-mist/50"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("your_name")}>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana" />
            </Field>
            <Field label={t("country_label")}>
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label={t("currency_label")}>
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">{t("your_salary")}</h2>
            <Field label={tVars("approx_amount_with_currency", { c: currency })}>
              <input className="input" type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
            </Field>
            <Field label={t("usual_pay_day")}>
              <input className="input" type="number" min={1} max={31} value={salaryDay} onChange={(e) => setSalaryDay(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={approximate} onChange={(e) => setApproximate(e.target.checked)} />
              {t("approx_day_checkbox")}
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">{t("your_current_situation")}</h2>
            <Field label={tVars("money_available_now_with_currency", { c: currency })}>
              <input className="input" type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} />
            </Field>
            <Field label={tVars("desired_reserve_with_currency", { c: currency })}>
              <input className="input" type="number" value={desiredReserve} onChange={(e) => setDesiredReserve(e.target.value)} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">{t("your_fixed_expenses")}</h2>
            {fixedExpenses.map((fe, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <input
                  className="input col-span-1"
                  placeholder={t("name_placeholder")}
                  value={fe.name}
                  onChange={(e) => {
                    const next = [...fixedExpenses];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setFixedExpenses(next);
                  }}
                />
                <input
                  className="input"
                  placeholder={t("amount_placeholder")}
                  type="number"
                  value={fe.amount}
                  onChange={(e) => {
                    const next = [...fixedExpenses];
                    next[idx] = { ...next[idx], amount: e.target.value };
                    setFixedExpenses(next);
                  }}
                />
                <input
                  className="input"
                  placeholder={t("day_placeholder")}
                  type="number"
                  value={fe.day}
                  onChange={(e) => {
                    const next = [...fixedExpenses];
                    next[idx] = { ...next[idx], day: e.target.value };
                    setFixedExpenses(next);
                  }}
                />
              </div>
            ))}
            <button onClick={addFixedExpense} className="text-sm text-moss font-medium">
              {t("add_another_fixed")}
            </button>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={clsx("text-sm text-ink/50", step === 0 && "invisible")}
          >
            {t("back_word")}
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="bg-ink text-paper px-5 py-2.5 rounded-full text-sm font-medium"
            >
              {t("continue_word")}
            </button>
          ) : (
            <button
              onClick={finish}
              className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium"
            >
              {t("finish_word")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/60 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
