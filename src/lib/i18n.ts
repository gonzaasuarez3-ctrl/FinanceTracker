"use client";

import { useFinance } from "./use-finance";

export type Lang = "es" | "en" | "de";

const dict = {
  nav_dashboard: { es: "Panel", en: "Dashboard", de: "Übersicht" },
  nav_expenses: { es: "Gastos", en: "Expenses", de: "Ausgaben" },
  nav_fixed: { es: "Fijos", en: "Fixed", de: "Fixkosten" },
  nav_goals: { es: "Metas", en: "Goals", de: "Ziele" },
  nav_subscriptions: { es: "Suscripciones", en: "Subscriptions", de: "Abos" },
  nav_settings: { es: "Ajustes", en: "Settings", de: "Einstellungen" },

  safe_to_spend_today: {
    es: "Puedes gastar hoy con seguridad",
    en: "Safe to spend today",
    de: "Heute sicher ausgebbar",
  },
  safe_to_spend_short: { es: "Puedes gastar hoy", en: "Safe to spend today", de: "Heute sicher ausgebbar" },
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
  currency_label: { es: "Moneda", en: "Currency", de: "Währung" },

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

  // Generic reusable words
  add_word: { es: "Añadir", en: "Add", de: "Hinzufügen" },
  edit_word: { es: "Editar", en: "Edit", de: "Bearbeiten" },
  delete_word: { es: "Eliminar", en: "Delete", de: "Löschen" },
  cancel_word: { es: "Cancelar", en: "Cancel", de: "Abbrechen" },
  save_changes: { es: "Guardar cambios", en: "Save changes", de: "Änderungen speichern" },
  back_word: { es: "Atrás", en: "Back", de: "Zurück" },
  continue_word: { es: "Continuar", en: "Continue", de: "Weiter" },
  finish_word: { es: "Terminar", en: "Finish", de: "Fertigstellen" },
  activate_word: { es: "Activar", en: "Activate", de: "Aktivieren" },
  deactivate_word: { es: "Desactivar", en: "Deactivate", de: "Deaktivieren" },
  optional_word: { es: "opcional", en: "optional", de: "optional" },

  // Expenses page
  add_expense_heading: { es: "Añadir gasto", en: "Add expense", de: "Ausgabe hinzufügen" },
  amount_with_currency: { es: "Monto ({c})", en: "Amount ({c})", de: "Betrag ({c})" },
  description_placeholder: { es: "Descripción (opcional)", en: "Description (optional)", de: "Beschreibung (optional)" },
  save_expense: { es: "Guardar gasto", en: "Save expense", de: "Ausgabe speichern" },
  history_title: { es: "Historial", en: "History", de: "Verlauf" },
  no_expenses_yet: { es: "Aún no has registrado gastos.", en: "No expenses recorded yet.", de: "Noch keine Ausgaben erfasst." },

  // Goals page
  new_goal: { es: "Nueva meta", en: "New goal", de: "Neues Ziel" },
  goal_name_placeholder: { es: "Nombre (ej. Vacaciones)", en: "Name (e.g. Vacation)", de: "Name (z. B. Urlaub)" },
  target_placeholder: { es: "Objetivo", en: "Target", de: "Ziel" },
  already_saved_placeholder: { es: "Ya ahorrado", en: "Already saved", de: "Bereits gespart" },
  create_goal: { es: "Crear meta", en: "Create goal", de: "Ziel erstellen" },
  no_goals_yet: { es: "Aún no tienes metas. Crea la primera arriba.", en: "You don't have any goals yet. Create your first one above.", de: "Du hast noch keine Ziele. Erstelle oben dein erstes." },
  goal_of: { es: "de", en: "of", de: "von" },

  // Subscriptions page
  monthly_cost: { es: "Costo mensual", en: "Monthly cost", de: "Monatliche Kosten" },
  annual_cost: { es: "Costo anual", en: "Annual cost", de: "Jährliche Kosten" },
  subscription_insights_title: { es: "Sugerencias sobre tus suscripciones", en: "Suggestions about your subscriptions", de: "Vorschläge zu deinen Abos" },
  subscription_insights_note: {
    es: "Basadas en reglas simples sobre lo que registraste (frecuencia de uso, categoría, costo) — no en precios de mercado inventados.",
    en: "Based on simple rules about what you entered (usage frequency, category, cost) — not on invented market prices.",
    de: "Basierend auf einfachen Regeln zu deinen Angaben (Nutzung, Kategorie, Kosten) — nicht auf erfundenen Marktpreisen.",
  },
  new_subscription: { es: "Nueva suscripción", en: "New subscription", de: "Neues Abo" },
  subscription_name_placeholder: { es: "Nombre (ej. Netflix)", en: "Name (e.g. Netflix)", de: "Name (z. B. Netflix)" },
  monthly_amount_placeholder: { es: "Monto mensual", en: "Monthly amount", de: "Monatlicher Betrag" },
  next_billing: { es: "Próximo cobro", en: "Next billing", de: "Nächste Abbuchung" },
  no_subscriptions_yet: { es: "Aún no tienes suscripciones registradas.", en: "No subscriptions recorded yet.", de: "Noch keine Abos erfasst." },
  usage_daily: { es: "Uso diario", en: "Daily use", de: "Tägliche Nutzung" },
  usage_weekly: { es: "Uso semanal", en: "Weekly use", de: "Wöchentliche Nutzung" },
  usage_monthly: { es: "Uso mensual", en: "Monthly use", de: "Monatliche Nutzung" },
  usage_rarely: { es: "Uso poco frecuente", en: "Rarely used", de: "Selten genutzt" },

  // Fixed expenses page
  fixed_monthly_total: { es: "Total mensual (activos)", en: "Monthly total (active)", de: "Monatssumme (aktiv)" },
  new_fixed_expense: { es: "Nuevo gasto fijo", en: "New fixed expense", de: "Neue Fixkosten" },
  edit_fixed_expense: { es: "Editar gasto fijo", en: "Edit fixed expense", de: "Fixkosten bearbeiten" },
  fixed_name_placeholder: { es: "Nombre (ej. Alquiler)", en: "Name (e.g. Rent)", de: "Name (z. B. Miete)" },
  payment_day_placeholder: { es: "Día de pago", en: "Payment day", de: "Zahlungstag" },
  day_of_month: { es: "Día {d} de cada mes", en: "Day {d} of each month", de: "Tag {d} jeden Monats" },
  no_fixed_expenses_yet: { es: "Aún no tienes gastos fijos registrados.", en: "No fixed expenses recorded yet.", de: "Noch keine Fixkosten erfasst." },

  // Settings page
  desired_reserve_label: { es: "Tu reserva deseada", en: "Your desired reserve", de: "Deine gewünschte Rücklage" },

  // Onboarding
  step_profile: { es: "Perfil", en: "Profile", de: "Profil" },
  step_income: { es: "Ingresos", en: "Income", de: "Einkommen" },
  step_situation: { es: "Situación actual", en: "Current situation", de: "Aktuelle Situation" },
  step_fixed: { es: "Gastos fijos", en: "Fixed expenses", de: "Fixkosten" },
  tell_us_about_you: { es: "Cuéntanos sobre ti", en: "Tell us about yourself", de: "Erzähl uns von dir" },
  your_name: { es: "Tu nombre", en: "Your name", de: "Dein Name" },
  country_label: { es: "País", en: "Country", de: "Land" },
  your_salary: { es: "Tu salario", en: "Your salary", de: "Dein Gehalt" },
  approx_amount_with_currency: { es: "Monto aproximado ({c})", en: "Approximate amount ({c})", de: "Ungefährer Betrag ({c})" },
  usual_pay_day: { es: "Día de cobro habitual", en: "Usual payday", de: "Üblicher Zahltag" },
  approx_day_checkbox: { es: "Este día es aproximado (puede variar unos días)", en: "This day is approximate (can vary a few days)", de: "Dieser Tag ist ungefähr (kann um einige Tage variieren)" },
  your_current_situation: { es: "Tu situación actual", en: "Your current situation", de: "Deine aktuelle Situation" },
  money_available_now_with_currency: { es: "Dinero disponible ahora ({c})", en: "Money available now ({c})", de: "Aktuell verfügbares Geld ({c})" },
  desired_reserve_with_currency: {
    es: "Reserva que quieres conservar al final del ciclo ({c})",
    en: "Reserve you want to keep at the end of the cycle ({c})",
    de: "Rücklage, die am Zyklusende übrig bleiben soll ({c})",
  },
  your_fixed_expenses: { es: "Tus gastos fijos", en: "Your fixed expenses", de: "Deine Fixkosten" },
  add_another_fixed: { es: "+ Añadir otro gasto fijo", en: "+ Add another fixed expense", de: "+ Weitere Fixkosten hinzufügen" },
  name_placeholder: { es: "Nombre", en: "Name", de: "Name" },
  amount_placeholder: { es: "Monto", en: "Amount", de: "Betrag" },
  day_placeholder: { es: "Día", en: "Day", de: "Tag" },

  // Export / import
  export_import_title: { es: "Pasar tus datos a otro dispositivo", en: "Move your data to another device", de: "Deine Daten auf ein anderes Gerät übertragen" },
  export_import_note: {
    es: "Tus datos viven solo en este navegador. Para verlos en tu celular u otra computadora, exporta un archivo aquí y luego impórtalo allá.",
    en: "Your data lives only in this browser. To see it on your phone or another computer, export a file here and then import it there.",
    de: "Deine Daten befinden sich nur in diesem Browser. Um sie auf deinem Handy oder einem anderen Computer zu sehen, exportiere hier eine Datei und importiere sie dort.",
  },
  export_button: { es: "Exportar mis datos", en: "Export my data", de: "Meine Daten exportieren" },
  import_button: { es: "Importar datos", en: "Import data", de: "Daten importieren" },
  import_warning: {
    es: "Importar reemplazará todos los datos actuales de este dispositivo.",
    en: "Importing will replace all current data on this device.",
    de: "Der Import ersetzt alle aktuellen Daten auf diesem Gerät.",
  },
  import_success: { es: "Datos importados correctamente.", en: "Data imported successfully.", de: "Daten erfolgreich importiert." },
  import_error: { es: "Ese archivo no parece ser un backup válido de Nuvio.", en: "That file doesn't look like a valid Nuvio backup.", de: "Diese Datei scheint kein gültiges Nuvio-Backup zu sein." },
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
