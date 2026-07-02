const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/** Arabic month name + day/year — does not rely on server Intl locale data. */
export function formatPdfDate(date: Date | string) {
  const d = new Date(date);
  const day = d.getDate();
  const month = ARABIC_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
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
