import type { Subscription } from "./types";
import type { Lang } from "./i18n";
import { categoryLabel } from "./categories";

export interface SubscriptionInsight {
  subscriptionId?: string;
  severity: "info" | "suggestion" | "warning";
  title: string;
  detail: string;
}

const T = {
  lowUsageTitle: {
    es: (name: string) => `Usas poco "${name}"`,
    en: (name: string) => `You rarely use "${name}"`,
    de: (name: string) => `Du nutzt "${name}" selten`,
  },
  lowUsageDetail: {
    es: (m: string, y: string) => `Marcaste esta suscripción como de uso poco frecuente. Cancelarla liberaría ${m}/mes (${y}/año).`,
    en: (m: string, y: string) => `You marked this subscription as rarely used. Cancelling it would free up ${m}/month (${y}/year).`,
    de: (m: string, y: string) => `Du hast dieses Abo als selten genutzt markiert. Eine Kündigung würde ${m}/Monat (${y}/Jahr) freisetzen.`,
  },
  duplicateTitle: {
    es: (cat: string) => `Varias suscripciones en "${cat}"`,
    en: (cat: string) => `Several subscriptions in "${cat}"`,
    de: (cat: string) => `Mehrere Abos in "${cat}"`,
  },
  duplicateDetail: {
    es: (n: number, names: string, total: string) => `Tienes ${n} suscripciones en esta categoría (${names}), juntas suman ${total}/mes. Vale la pena revisar si usas todas activamente.`,
    en: (n: number, names: string, total: string) => `You have ${n} subscriptions in this category (${names}), together totalling ${total}/month. Worth checking if you actively use all of them.`,
    de: (n: number, names: string, total: string) => `Du hast ${n} Abos in dieser Kategorie (${names}), zusammen ${total}/Monat. Es lohnt sich zu prüfen, ob du alle aktiv nutzt.`,
  },
  priciestTitle: {
    es: (name: string) => `"${name}" es tu suscripción más cara`,
    en: (name: string) => `"${name}" is your priciest subscription`,
    de: (name: string) => `"${name}" ist dein teuerstes Abo`,
  },
  priciestDetail: {
    es: (share: number, amt: string) => `Representa ~${share}% de tu gasto total en suscripciones (${amt}/mes). Si buscas un plan anual o familiar, suele ser el primer lugar donde ahorrar.`,
    en: (share: number, amt: string) => `It's ~${share}% of your total subscription spending (${amt}/month). If you're looking for an annual or family plan, this is usually the first place to save.`,
    de: (share: number, amt: string) => `Das sind ~${share}% deiner gesamten Abo-Ausgaben (${amt}/Monat). Wenn du nach einem Jahres- oder Familientarif suchst, ist das meist die erste Sparmöglichkeit.`,
  },
  annualTitle: {
    es: "Costo anual total de tus suscripciones",
    en: "Total annual cost of your subscriptions",
    de: "Jährliche Gesamtkosten deiner Abos",
  },
  annualDetail: {
    es: (amt: string) => `Gastas aproximadamente ${amt}/año en total. Verlo en anual, en vez de mensual, suele cambiar la percepción de si vale la pena.`,
    en: (amt: string) => `You spend approximately ${amt}/year in total. Seeing it annually instead of monthly often changes whether it feels worth it.`,
    de: (amt: string) => `Du gibst insgesamt etwa ${amt}/Jahr aus. Die jährliche statt monatliche Sicht ändert oft die Wahrnehmung, ob es sich lohnt.`,
  },
};

/**
 * Deterministic, rule-based subscription insights.
 * Runs entirely client-side — no external API or API key required.
 *
 * NOTE: this intentionally does NOT try to guess current market prices or
 * name specific competing services, since we don't want to fabricate
 * pricing (see the product spec's §23 requirement: never invent prices).
 * A future upgrade can route these through the AI Consultant (Phase 3),
 * calling the Anthropic API with real web-search-verified pricing — that
 * requires the app owner to configure their own Anthropic API key as an
 * environment variable on the server, since this runs on your own
 * deployment rather than inside Claude.ai.
 */
export function computeSubscriptionInsights(subs: Subscription[], lang: Lang = "es"): SubscriptionInsight[] {
  const insights: SubscriptionInsight[] = [];
  if (subs.length === 0) return insights;

  const totalMonthly = subs.reduce((s, x) => s + x.amountMinor, 0);
  const fmt = (n: number, currency: string) =>
    new Intl.NumberFormat(lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US", {
      style: "currency",
      currency,
    }).format(n / 100);

  // Low-usage subscriptions that still cost meaningfully
  for (const sub of subs) {
    if (sub.usageFrequency === "rarely" && sub.amountMinor > 0) {
      insights.push({
        subscriptionId: sub.id,
        severity: "warning",
        title: T.lowUsageTitle[lang](sub.name),
        detail: T.lowUsageDetail[lang](fmt(sub.amountMinor, sub.currency), fmt(sub.amountMinor * 12, sub.currency)),
      });
    }
  }

  // Category duplicates (e.g. two streaming services)
  const byCategory = new Map<string, Subscription[]>();
  for (const sub of subs) {
    const key = sub.category.toLowerCase();
    byCategory.set(key, [...(byCategory.get(key) ?? []), sub]);
  }
  for (const [, group] of byCategory) {
    if (group.length > 1) {
      const names = group.map((g) => g.name).join(", ");
      const groupTotal = group.reduce((s, g) => s + g.amountMinor, 0);
      const catLabel = categoryLabel(group[0].category, lang);
      insights.push({
        severity: "suggestion",
        title: T.duplicateTitle[lang](catLabel),
        detail: T.duplicateDetail[lang](group.length, names, fmt(groupTotal, group[0].currency)),
      });
    }
  }

  // The single most expensive subscription, framed for visibility
  const priciest = [...subs].sort((a, b) => b.amountMinor - a.amountMinor)[0];
  if (priciest && totalMonthly > 0) {
    const share = Math.round((priciest.amountMinor / totalMonthly) * 100);
    if (share >= 30) {
      insights.push({
        subscriptionId: priciest.id,
        severity: "info",
        title: T.priciestTitle[lang](priciest.name),
        detail: T.priciestDetail[lang](share, fmt(priciest.amountMinor, priciest.currency)),
      });
    }
  }

  // Overall burden framing
  if (totalMonthly > 0) {
    insights.push({
      severity: "info",
      title: T.annualTitle[lang],
      detail: T.annualDetail[lang](fmt(totalMonthly * 12, subs[0].currency)),
    });
  }

  return insights;
}
