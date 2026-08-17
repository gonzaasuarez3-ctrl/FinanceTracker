"use client";

import { useRef, useState } from "react";
import { useFinance } from "@/lib/use-finance";
import { useTranslation, type Lang } from "@/lib/i18n";
import { isValidFinancialState } from "@/lib/storage";
import type { FinancialState } from "@/lib/types";

const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "PLN", "RON", "ARS"];

export default function SettingsPage() {
  const { state, update, hydrated } = useFinance();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  if (!hydrated) return null;

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nuvio-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValidFinancialState(parsed)) {
          setImportStatus("error");
          return;
        }
        update(parsed as Partial<FinancialState>);
        setImportStatus("success");
      } catch {
        setImportStatus("error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

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

      <div className="card space-y-3">
        <h2 className="font-display text-xl">{t("export_import_title")}</h2>
        <p className="text-sm text-ink/60">{t("export_import_note")}</p>

        <button
          onClick={exportData}
          className="w-full bg-moss text-paper py-2.5 rounded-full text-sm font-medium"
        >
          {t("export_button")}
        </button>

        <div className="pt-2 border-t border-mist">
          <p className="text-xs text-ink/50 mb-2">{t("import_warning")}</p>
          <button
            onClick={triggerImport}
            className="w-full border border-mist text-ink py-2.5 rounded-full text-sm font-medium hover:bg-mist/50"
          >
            {t("import_button")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            className="hidden"
          />
          {importStatus === "success" && (
            <p className="text-sm text-good mt-2">{t("import_success")}</p>
          )}
          {importStatus === "error" && (
            <p className="text-sm text-alert mt-2">{t("import_error")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
