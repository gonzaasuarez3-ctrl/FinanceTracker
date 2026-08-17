"use client";

import { useFinance } from "./use-finance";

export type Lang = "es" | "en" | "de";

const dict = {
  nav_dashboard: { es: "Panel", en: "Dashboard", de: "Übersicht" },
  nav_expenses: { es: "Gastos", en: "Expenses", de: "Ausgaben" },
  nav_goals: { es: "Metas", en: "Goals", de: "Ziele" },
  nav_subscriptions: { es: "Suscripciones", en: "Subscriptions", de: "Abos" },
  nav_settings: { es: "Ajustes", en: "Settings", de: "Einstellungen" },

  safe_to_spend_today: {
    es: "Puedes gastar hoy con seguridad",
    en: "Safe to spend today",
    de: "Heute sicher ausgebbar",
  },
  available_until: { es: "disponibles hasta el", en: "available until", de: "verfügbar bis zum" },
  why_this_number: { es: "Por qué este número", en: "Why this number", de: "Warum diese Zahl" },
  money_you_have: { es: "Dinero que tienes", en: "Money you have", de: "Geld, das du hast" },
  money_coming: { es: "Dinero que llega", en: "Money coming in", de: "Geld, das kommt" },
  money_committed: { es: "Dinero comprometido", en: "Money committed", de: "Gebundenes Geld" },
  money_to_save: { es: "Dinero que quieres ahorrar", en: "Money you want to save", de: "Geld zum Sparen" },

  current_balance: { es: "Saldo actual", en: "Current balance", de: "Aktueller Kontostand" },
  next_income: { es: "Próximo ingreso", en: "Next income", de: "Nächstes Einkommen" },
  upcoming_expenses: { es: "Gastos próximos", en: "Upcoming expenses", de: "Anstehende Ausgaben" },
  reserve_goal: { es: "Meta de reserva", en: "Reserve goal", de: "Rücklagenziel" },
  spent_this_cycle: { es: "Gastado este ciclo", en: "Spent this cycle", de: "In diesem Zyklus ausgegeben" },
  financial_health: { es: "Salud financiera", en: "Financial health", de: "Finanzielle Gesundheit" },
  add_expense: { es: "+ Añadir gasto", en: "+ Add expense", de: "+ Ausgabe hinzufügen" },

  language: { es: "Idioma", en: "Language", de: "Sprache" },

  status_excellent: { es: "Excelente", en: "Excellent", de: "Ausgezeichnet" },
  status_on_track: { es: "En buen camino", en: "On track", de: "Auf Kurs" },
  status_slightly_above: { es: "Ligeramente por encima", en: "Slightly above target", de: "Leicht über dem Ziel" },
  status_at_risk: { es: "En riesgo", en: "At risk", de: "Gefährdet" },
  status_critical: { es: "Crítico", en: "Critical", de: "Kritisch" },

  onboarding_title: { es: "Empecemos por conocer tu situación", en: "Let's start with your situation", de: "Beginnen wir mit deiner Situation" },
  onboarding_body: {
    es: "Necesitamos algunos datos — tu saldo, tu salario y tus gastos fijos — para calcular cuánto puedes gastar hoy con seguridad.",
    en: "We need a few details — your balance, salary, and fixed expenses — to calculate how much you can safely spend today.",
    de: "Wir brauchen ein paar Angaben — Kontostand, Gehalt und feste Ausgaben —, um zu berechnen, wie viel du heute sicher ausgeben kannst.",
  },
  onboarding_cta: { es: "Configurar mi cuenta", en: "Set up my account", de: "Konto einrichten" },

  in_n_days: { es: "en {n} días", en: "in {n} days", de: "in {n} Tagen" },
} satisfies Record<string, Record<Lang, string>>;

export type TranslationKey = keyof typeof dict;

export function translate(key: TranslationKey, lang: Lang): string {
  return dict[key]?.[lang] ?? dict[key]?.es ?? key;
}

/** Translate with {placeholder} interpolation, e.g. t("in_n_days", { n: 12 }) */
export function translateWith(
  key: TranslationKey,
  lang: Lang,
  vars: Record<string, string | number>
): string {
  let out = translate(key, lang);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(`{${k}}`, String(v));
  }
  return out;
}

export function localeFor(lang: Lang): string {
  return { es: "es-ES", en: "en-US", de: "de-DE" }[lang];
}

/** Hook: returns t() bound to the user's stored language preference. */
export function useTranslation() {
  const { state } = useFinance();
  const lang = (state.profile.language ?? "es") as Lang;
  const t = (key: TranslationKey) => translate(key, lang);
  const tVars = (key: TranslationKey, vars: Record<string, string | number>) =>
    translateWith(key, lang, vars);
  return { t, tVars, lang, locale: localeFor(lang) };
}
