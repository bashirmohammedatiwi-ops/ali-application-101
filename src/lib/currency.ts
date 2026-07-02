export const CURRENCIES = ["USD", "CNY", "IQD"] as const;
export type AppCurrency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<AppCurrency, { ar: string; en: string }> = {
  USD: { ar: "دولار ($)", en: "USD ($)" },
  CNY: { ar: "يوان (¥)", en: "CNY (¥)" },
  IQD: { ar: "دينار عراقي (د.ع)", en: "IQD (د.ع)" },
};

/** Convert USD amount to CNY using rate: 1 USD = usdToCnyRate CNY */
export function usdToCny(amount: number, usdToCnyRate: number): number {
  if (usdToCnyRate <= 0) return amount;
  return Math.round(amount * usdToCnyRate * 100) / 100;
}

/** Convert amount between supported currencies (via USD pivot). */
export function convertCurrencyAmount(
  amount: number,
  from: AppCurrency,
  to: AppCurrency,
  rates: { usdToCnyRate: number; usdToIqdRate: number }
): number {
  if (from === to) return amount;

  let inUsd: number;
  if (from === "USD") inUsd = amount;
  else if (from === "CNY") inUsd = cnyToUsd(amount, rates.usdToCnyRate);
  else inUsd = iqdToUsd(amount, rates.usdToIqdRate);

  if (to === "USD") return inUsd;
  if (to === "CNY") return usdToCny(inUsd, rates.usdToCnyRate);
  return usdToIqd(inUsd, rates.usdToIqdRate);
}

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
