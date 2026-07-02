import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Works on HTTP (non-secure) contexts where crypto.randomUUID may be unavailable. */
export function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // non-secure context (HTTP)
    }
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function formatCurrency(amount: number, currency = "USD") {
  if (currency === "IQD") {
    return new Intl.NumberFormat("ar-IQ", {
      style: "currency",
      currency: "IQD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  const code = currency === "CNY" ? "CNY" : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(date: Date | string, locale = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string, locale = "en") {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (locale === "ar") {
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} د`;
    if (hours < 48) return `منذ ${hours} س`;
    return `منذ ${days} ي`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 48) return `${hours}h ago`;
  return `${days}d ago`;
}

export function generateRef(prefix: string, seq: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function calculateCbm(lengthCm?: number | null, widthCm?: number | null, heightCm?: number | null) {
  if (!lengthCm || !widthCm || !heightCm) return null;
  return (lengthCm * widthCm * heightCm) / 1_000_000;
}

export function buildWhatsAppMessage(params: {
  customerName: string;
  productNameAr: string;
  productNameEn?: string | null;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  grandTotal: number;
  currency: string;
  weightKg?: number | null;
  volumeCbm?: number | null;
  moq?: number | null;
  invoiceNumber: string;
}) {
  const {
    customerName,
    productNameAr,
    quantity,
    unitLabel,
    unitPrice,
    grandTotal,
    currency,
    weightKg,
    volumeCbm,
    moq,
    invoiceNumber,
  } = params;

  let msg = `السلام عليكم ${customerName}،\n\n`;
  msg += `تم تسعير طلبكم:\n\n`;
  msg += `📦 ${productNameAr}\n`;
  msg += `الكمية: ${quantity} ${unitLabel}\n`;
  msg += `سعر الوحدة: ${unitPrice} ${currency}\n`;
  msg += `المجموع الكلي: ${grandTotal} ${currency}\n`;
  if (weightKg) msg += `الوزن: ${weightKg} kg\n`;
  if (volumeCbm) msg += `الحجم: ${volumeCbm} cbm\n`;
  if (moq) msg += `MOQ: ${moq} ${unitLabel}\n`;
  msg += `\nرقم الفاتورة: ${invoiceNumber}\n`;
  msg += `مرفق ملف PDF للفاتورة.`;
  return msg;
}
