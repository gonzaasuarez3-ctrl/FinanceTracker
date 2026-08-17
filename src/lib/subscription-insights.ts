import type { Subscription } from "./types";

export interface SubscriptionInsight {
  subscriptionId?: string;
  severity: "info" | "suggestion" | "warning";
  title: string;
  detail: string;
}

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
export function computeSubscriptionInsights(subs: Subscription[]): SubscriptionInsight[] {
  const insights: SubscriptionInsight[] = [];
  if (subs.length === 0) return insights;

  const totalMonthly = subs.reduce((s, x) => s + x.amountMinor, 0);

  // Low-usage subscriptions that still cost meaningfully
  for (const sub of subs) {
    if (sub.usageFrequency === "rarely" && sub.amountMinor > 0) {
      insights.push({
        subscriptionId: sub.id,
        severity: "warning",
        title: `Usas poco "${sub.name}"`,
        detail: `Marcaste esta suscripción como de uso poco frecuente. Cancelarla liberaría ${(
          sub.amountMinor / 100
        ).toFixed(2)} ${sub.currency}/mes (${((sub.amountMinor * 12) / 100).toFixed(2)} ${sub.currency}/año).`,
      });
    }
  }

  // Category duplicates (e.g. two streaming services)
  const byCategory = new Map<string, Subscription[]>();
  for (const sub of subs) {
    const key = sub.category.toLowerCase();
    byCategory.set(key, [...(byCategory.get(key) ?? []), sub]);
  }
  for (const [category, group] of byCategory) {
    if (group.length > 1) {
      const names = group.map((g) => g.name).join(", ");
      const groupTotal = group.reduce((s, g) => s + g.amountMinor, 0);
      insights.push({
        severity: "suggestion",
        title: `Varias suscripciones en "${category}"`,
        detail: `Tienes ${group.length} suscripciones en esta categoría (${names}), juntas suman ${(
          groupTotal / 100
        ).toFixed(2)} ${group[0].currency}/mes. Vale la pena revisar si usas todas activamente.`,
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
        title: `"${priciest.name}" es tu suscripción más cara`,
        detail: `Representa ~${share}% de tu gasto total en suscripciones (${(
          priciest.amountMinor / 100
        ).toFixed(2)} ${priciest.currency}/mes). Si buscas un plan anual o familiar, suele ser el primer lugar donde ahorrar.`,
      });
    }
  }

  // Overall burden framing
  if (totalMonthly > 0) {
    insights.push({
      severity: "info",
      title: "Costo anual total de tus suscripciones",
      detail: `Gastas aproximadamente ${((totalMonthly * 12) / 100).toFixed(2)} ${
        subs[0].currency
      }/año en total. Verlo en anual, en vez de mensual, suele cambiar la percepción de si vale la pena.`,
    });
  }

  return insights;
}
