import type { Invoice, OrderItem } from "@/generated/prisma/client";
import { calculateMarkupAmount } from "@/lib/markup";
import {
  convertCurrencyAmount,
  normalizeCurrency,
  type AppCurrency,
} from "@/lib/currency";

export function prepareInvoiceForPdfDisplay(
  invoice: Invoice,
  item: OrderItem,
  displayCurrency: AppCurrency,
  rates: { usdToCnyRate: number; usdToIqdRate: number }
) {
  const from = normalizeCurrency(item.currency);
  const to = normalizeCurrency(displayCurrency);
  const convert = (n: number) => convertCurrencyAmount(n, from, to, rates);

  const subtotal = convert(invoice.subtotal);
  const shipping = convert(invoice.shipping);
  const markupAmount = calculateMarkupAmount(subtotal, shipping, invoice.markup);
  const grandTotal = subtotal + shipping + markupAmount;
  const unitPrice = convert(item.unitPrice ?? 0);

  return {
    invoice: { ...invoice, subtotal, shipping, grandTotal },
    item: { ...item, unitPrice, currency: to },
    markupAmount,
  };
}
