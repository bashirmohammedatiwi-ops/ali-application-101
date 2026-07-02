export function formatPdfDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatPdfAmount(amount: number, currency: string) {
  if (currency === "IQD") {
    return `${Math.round(amount).toLocaleString("ar-IQ")} د.ع`;
  }
  if (currency === "CNY") {
    return `${amount.toFixed(2)} ¥`;
  }
  return `${amount.toFixed(2)} $`;
}

export const CURRENCY_LABELS_AR: Record<string, string> = {
  USD: "دولار أمريكي",
  CNY: "يوان صيني",
  IQD: "دينار عراقي",
};
