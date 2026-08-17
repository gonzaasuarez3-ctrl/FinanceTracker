"use client";

import { useFinance } from "@/lib/use-finance";
import { useTranslation, type Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "PLN", "RON", "ARS"];

export default function SettingsPage() {
  const { state, update, hydrated } = useFinance();
  const { t } = useTranslation();
  if (!hydrated) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div className="card space-y-4">
        <h2 className="font-display text-xl">Idioma / Language / Sprache</h2>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => update({ profile: { ...state.profile, language: l.code } })}
              className={
                "px-4 py-2 rounded-full text-sm font-medium border transition-colors " +
                (state.profile.language === l.code
                  ? "bg-ink text-paper border-ink"
                  : "border-mist text-ink/70 hover:bg-mist/50")
              }
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-xl">{t("currency_label")}</h2>
        <select
          className="input"
          value={state.profile.currency}
          onChange={(e) => update({ profile: { ...state.profile, currency: e.target.value } })}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <h2 className="font-display text-xl mb-2">{t("desired_reserve_label")}</h2>
        <input
          className="input"
          type="number"
          value={state.desiredReserveMinor / 100}
          onChange={(e) =>
            update({ desiredReserveMinor: Math.round(parseFloat(e.target.value || "0") * 100) })
          }
        />
      </div>
    </div>
  );
}
