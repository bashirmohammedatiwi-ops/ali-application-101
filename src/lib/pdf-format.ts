export function formatPdfDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  }).format(new Date(date));
}

export function formatPdfAmount(amount: number, currency: string): string {
  if (currency === "IQD") {
    return `${Math.round(amount).toLocaleString("en-US")} IQD`;
  }
  if (currency === "CNY") {
    return `CNY ${amount.toFixed(2)}`;
  }
  return `USD ${amount.toFixed(2)}`;
}

export const CURRENCY_LABELS_AR: Record<string, string> = {
  USD: "دولار أمريكي",
  CNY: "يوان صيني",
  IQD: "دينار عراقي",
};
