"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFinance } from "@/lib/use-finance";
import { newId } from "@/lib/storage";
import clsx from "clsx";

const CURRENCIES = ["EUR", "USD", "GBP", "PLN", "RON", "ARS"];
const COUNTRIES = ["DE", "ES", "AR", "RO", "PL", "US", "GB"];

export default function OnboardingPage() {
  const { update } = useFinance();
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
    { name: "Alquiler", amount: "900", day: "5" },
  ]);

  const steps = ["Perfil", "Ingresos", "Situación actual", "Gastos fijos"];

  function addFixedExpense() {
    setFixedExpenses((prev) => [...prev, { name: "", amount: "", day: "1" }]);
  }

  function finish() {
    update({
      profile: { name, country, language: "es", currency },
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
          category: "bills",
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
            <h2 className="font-display text-xl">Cuéntanos sobre ti</h2>
            <Field label="Tu nombre">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana" />
            </Field>
            <Field label="País">
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Moneda">
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
            <h2 className="font-display text-xl">Tu salario</h2>
            <Field label={`Monto aproximado (${currency})`}>
              <input className="input" type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
            </Field>
            <Field label="Día de cobro habitual">
              <input className="input" type="number" min={1} max={31} value={salaryDay} onChange={(e) => setSalaryDay(e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={approximate} onChange={(e) => setApproximate(e.target.checked)} />
              Este día es aproximado (puede variar unos días)
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">Tu situación actual</h2>
            <Field label={`Dinero disponible ahora (${currency})`}>
              <input className="input" type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} />
            </Field>
            <Field label={`Reserva que quieres conservar al final del ciclo (${currency})`}>
              <input className="input" type="number" value={desiredReserve} onChange={(e) => setDesiredReserve(e.target.value)} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl">Tus gastos fijos</h2>
            {fixedExpenses.map((fe, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <input
                  className="input col-span-1"
                  placeholder="Nombre"
                  value={fe.name}
                  onChange={(e) => {
                    const next = [...fixedExpenses];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setFixedExpenses(next);
                  }}
                />
                <input
                  className="input"
                  placeholder="Monto"
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
                  placeholder="Día"
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
              + Añadir otro gasto fijo
            </button>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={clsx("text-sm text-ink/50", step === 0 && "invisible")}
          >
            Atrás
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="bg-ink text-paper px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={finish}
              className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium"
            >
              Terminar
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
