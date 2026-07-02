export const CURRENCIES = ["USD", "CNY", "IQD"] as const;
export type AppCurrency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<AppCurrency, { ar: string; en: string }> = {
  USD: { ar: "دولار ($)", en: "USD ($)" },
  CNY: { ar: "يوان (¥)", en: "CNY (¥)" },
  IQD: { ar: "دينار عراقي (د.ع)", en: "IQD (د.ع)" },
};

/** Convert CNY amount to USD using rate: 1 USD = usdToCnyRate CNY */
export function cnyToUsd(amount: number, usdToCnyRate: number): number {
  if (usdToCnyRate <= 0) return amount;
  return Math.round((amount / usdToCnyRate) * 100) / 100;
}

/** Convert USD amount to IQD using rate: 1 USD = usdToIqdRate IQD */
export function usdToIqd(amount: number, usdToIqdRate: number): number {
  if (usdToIqdRate <= 0) return amount;
  return Math.round(amount * usdToIqdRate);
}

export function normalizeCurrency(value?: string | null): AppCurrency {
  if (value === "CNY") return "CNY";
  if (value === "IQD") return "IQD";
  return "USD";
}

/** Convert IQD amount to USD using rate: 1 USD = usdToIqdRate IQD */
export function iqdToUsd(amount: number, usdToIqdRate: number): number {
  if (usdToIqdRate <= 0) return amount;
  return Math.round((amount / usdToIqdRate) * 100) / 100;
}

export function toAppCurrency(currency: string): AppCurrency {
  return normalizeCurrency(currency);
}
