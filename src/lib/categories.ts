import type { Lang } from "./i18n";

/**
 * Categories are stored in Spanish internally (that's what's already saved
 * in everyone's browser from before this file existed). To avoid breaking
 * existing data, we never rename the stored value — we only translate the
 * LABEL shown in the UI, keyed by the canonical Spanish string.
 */
const categoryLabels: Record<string, Record<Lang, string>> = {
  // Expense categories
  "Comida": { es: "Comida", en: "Food", de: "Essen" },
  "Supermercado": { es: "Supermercado", en: "Groceries", de: "Supermarkt" },
  "Restaurantes": { es: "Restaurantes", en: "Restaurants", de: "Restaurants" },
  "Transporte": { es: "Transporte", en: "Transport", de: "Transport" },
  "Compras": { es: "Compras", en: "Shopping", de: "Einkäufe" },
  "Ocio": { es: "Ocio", en: "Entertainment", de: "Freizeit" },
  "Salud": { es: "Salud", en: "Health", de: "Gesundheit" },
  "Deporte": { es: "Deporte", en: "Sports", de: "Sport" },
  "Facturas": { es: "Facturas", en: "Bills", de: "Rechnungen" },
  "Suscripciones": { es: "Suscripciones", en: "Subscriptions", de: "Abos" },
  "Viajes": { es: "Viajes", en: "Travel", de: "Reisen" },
  "Mascotas": { es: "Mascotas", en: "Pets", de: "Haustiere" },
  "Educación": { es: "Educación", en: "Education", de: "Bildung" },
  "Otro": { es: "Otro", en: "Other", de: "Sonstiges" },

  // Subscription categories
  "Streaming": { es: "Streaming", en: "Streaming", de: "Streaming" },
  "Música": { es: "Música", en: "Music", de: "Musik" },
  "Gimnasio": { es: "Gimnasio", en: "Gym", de: "Fitnessstudio" },
  "Software": { es: "Software", en: "Software", de: "Software" },
  "Almacenamiento": { es: "Almacenamiento", en: "Storage", de: "Speicher" },
  "Telefonía": { es: "Telefonía", en: "Phone", de: "Telefon" },

  // Fixed expense categories
  "Vivienda": { es: "Vivienda", en: "Housing", de: "Wohnen" },
  "Seguros": { es: "Seguros", en: "Insurance", de: "Versicherungen" },
  "Servicios": { es: "Servicios", en: "Utilities", de: "Nebenkosten" },
  "Préstamos": { es: "Préstamos", en: "Loans", de: "Kredite" },
  "Cuidado personal": { es: "Cuidado personal", en: "Personal care", de: "Körperpflege" },
};

export function categoryLabel(category: string, lang: Lang): string {
  return categoryLabels[category]?.[lang] ?? category;
}

/** Build a {value, label} list for a <select>, keeping canonical Spanish values. */
export function categoryOptions(categories: string[], lang: Lang): { value: string; label: string }[] {
  return categories.map((c) => ({ value: c, label: categoryLabel(c, lang) }));
}
