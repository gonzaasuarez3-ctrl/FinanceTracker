"use client";

import clsx from "clsx";
import { formatMoney } from "@/lib/calc-engine";
import type { CalcResult } from "@/lib/types";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const STATUS_KEY: Record<CalcResult["status"], TranslationKey> = {
  excellent: "status_excellent",
  "on-track": "status_on_track",
  "slightly-above": "status_slightly_above",
  "at-risk": "status_at_risk",
  critical: "status_critical",
};

const STATUS_COLOR: Record<CalcResult["status"], { color: string; dot: string }> = {
  excellent: { color: "text-good", dot: "bg-good" },
  "on-track": { color: "text-moss", dot: "bg-moss" },
  "slightly-above": { color: "text-gold", dot: "bg-gold" },
  "at-risk": { color: "text-clay", dot: "bg-clay" },
  critical: { color: "text-alert", dot: "bg-alert" },
};

export function SafeToSpendHero({ calc, currency }: { calc: CalcResult; currency: string }) {
  const { t, locale } = useTranslation();
  const status = STATUS_COLOR[calc.status];
  return (
    <div className="card bg-ink text-paper relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-paper/60 text-sm mb-1">{t("safe_to_spend_today")}</p>
        <p className="font-display text-5xl md:text-6xl tracking-tight">
          {formatMoney(Math.max(0, calc.recommendedDailySpendingMinor), currency, locale)}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className={clsx("status-dot", status.dot)} />
          <span className="text-sm text-paper/80">{t(STATUS_KEY[calc.status])}</span>
          <span className="text-paper/40 text-sm">·</span>
          <span className="text-sm text-paper/60">
            {formatMoney(Math.max(0, calc.remainingSafeToSpendMinor), currency, locale)}{" "}
            {t("available_until")}{" "}
            {new Date(calc.targetDate).toLocaleDateString(locale, { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full bg-sage/20" />
      <div className="absolute -right-2 -top-10 w-28 h-28 rounded-full bg-gold/10" />
    </div>
  );
}

export function MiniCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card">
      <p className="text-ink/50 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
      {sub && <p className="text-ink/50 text-sm mt-0.5">{sub}</p>}
    </div>
  );
}

export function BreakdownList({ calc, currency }: { calc: CalcResult; currency: string }) {
  const { t, locale } = useTranslation();
  const kindLabel: Record<string, TranslationKey> = {
    have: "money_you_have",
    coming: "money_coming",
    "must-spend": "money_committed",
    "want-to-save": "money_to_save",
  };
  const groups = ["have", "coming", "must-spend", "want-to-save"] as const;

  return (
    <div className="card">
      <p className="font-display text-lg mb-3">{t("why_this_number")}</p>
      <div className="space-y-4">
        {groups.map((kind) => {
          const items = calc.breakdown.filter((i) => i.kind === kind);
          if (items.length === 0) return null;
          return (
            <div key={kind}>
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-1.5">
                {t(kindLabel[kind])}
              </p>
              <ul className="space-y-1">
                {items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-ink/70">{item.label}</span>
                    <span className="font-mono text-ink/90">
                      {formatMoney(item.amountMinor, currency, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
