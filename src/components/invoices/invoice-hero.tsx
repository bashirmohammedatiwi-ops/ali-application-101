import Image from "next/image";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CURRENCY_LABELS } from "@/lib/currency";
import { UNITS } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";
import type { OrderItem, Invoice, OrderImage } from "@/generated/prisma/client";
import { Receipt, Package } from "lucide-react";

type HeroItem = OrderItem & {
  images: OrderImage[];
  invoice: Invoice | null;
  request: { refNumber: string; customer: { id: string; name: string } };
};

export function InvoiceHero({ item, locale }: { item: HeroItem; locale: Locale }) {
  const invoice = item.invoice;
  if (!invoice) return null;

  const productName =
    locale === "en" && item.productNameEn ? item.productNameEn : item.productNameAr;
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const currencyKey = item.currency === "CNY" ? "CNY" : "USD";
  const currencyLabel = CURRENCY_LABELS[currencyKey][locale === "en" ? "en" : "ar"];

  return (
    <section className="invoice-summary">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={item.status} locale={locale} />
          <PriorityBadge urgent={item.priority === "URGENT"} locale={locale} />
          <span className="text-[11px] font-bold text-gray-500 bg-[var(--field-bg)] border border-border rounded-full px-2.5 py-1">
            {currencyLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 shrink-0" dir="ltr">
          {invoice.invoiceNumber}
        </span>
      </div>

      <div className="flex gap-4 items-start">
        {item.images[0] ? (
          <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-border bg-[var(--field-bg)]">
            <Image
              src={item.images[0].url}
              alt=""
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="shrink-0 w-20 h-20 rounded-2xl bg-[var(--field-bg)] border border-border flex items-center justify-center">
            <Package className="h-9 w-9 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-brand leading-snug line-clamp-2">
            {productName}
          </h1>
          {item.productNameEn && locale === "ar" && (
            <p className="text-xs text-gray-400 mt-1 truncate" dir="ltr">
              {item.productNameEn}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {item.quantity} {unitLabel} · {item.refNumber}
          </p>
          {item.pricedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {t("pricedAt", locale)}: {formatDate(item.pricedAt, locale)}
            </p>
          )}
        </div>
      </div>

      <div className="invoice-total-strip">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <Receipt className="h-4 w-4 text-accent" />
          </span>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t("grandTotal", locale)}
          </p>
        </div>
        <p className="text-2xl font-black text-accent tabular-nums tracking-tight">
          {formatCurrency(invoice.grandTotal, item.currency)}
        </p>
      </div>
    </section>
  );
}
