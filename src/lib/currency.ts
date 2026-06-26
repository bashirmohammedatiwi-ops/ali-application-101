export const CURRENCIES = ["USD", "CNY"] as const;
export type AppCurrency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<AppCurrency, { ar: string; en: string }> = {
  USD: { ar: "دولار ($)", en: "USD ($)" },
  CNY: { ar: "يوان (¥)", en: "CNY (¥)" },
};

/** Convert CNY amount to USD using rate: 1 USD = usdToCnyRate CNY */
export function cnyToUsd(amount: number, usdToCnyRate: number): number {
  if (usdToCnyRate <= 0) return amount;
  return Math.round((amount / usdToCnyRate) * 100) / 100;
}

export function normalizeCurrency(value?: string | null): AppCurrency {
  return value === "CNY" ? "CNY" : "USD";
}
