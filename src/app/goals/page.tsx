"use client";

import { useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { formatMoney } from "@/lib/calc-engine";
import { newId } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n";

export default function GoalsPage() {
  const { state, update, hydrated } = useFinance();
  const { t, locale } = useTranslation();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");

  if (!hydrated) return null;
  const currency = state.profile.currency || "EUR";

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !target) return;
    update({
      goals: [
        ...state.goals,
        {
          id: newId(),
          name,
          targetAmountMinor: Math.round(parseFloat(target) * 100),
          currentAmountMinor: Math.round(parseFloat(current || "0") * 100),
          priority: "medium",
        },
      ],
    });
    setName("");
    setTarget("");
    setCurrent("0");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addGoal} className="card space-y-3">
        <h2 className="font-display text-lg">{t("new_goal")}</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="input col-span-3" placeholder={t("goal_name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" placeholder={t("target_placeholder")} value={target} onChange={(e) => setTarget(e.target.value)} />
          <input className="input" type="number" placeholder={t("already_saved_placeholder")} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <button type="submit" className="bg-moss text-paper px-5 py-2.5 rounded-full text-sm font-medium">
          {t("create_goal")}
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        {state.goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmountMinor / g.targetAmountMinor) * 100));
          return (
            <div key={g.id} className="card">
              <div className="flex justify-between items-baseline mb-2">
                <p className="font-display text-lg">{g.name}</p>
                <span className="text-sm text-ink/50">{pct}%</span>
              </div>
              <div className="h-2 bg-mist rounded-full overflow-hidden mb-2">
                <div className="h-full bg-moss" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-ink/60">
                {formatMoney(g.currentAmountMinor, currency, locale)} {t("goal_of")} {formatMoney(g.targetAmountMinor, currency, locale)}
              </p>
            </div>
          );
        })}
        {state.goals.length === 0 && (
          <p className="text-ink/50 text-sm">{t("no_goals_yet")}</p>
        )}
      </div>
    </div>
  );
}
