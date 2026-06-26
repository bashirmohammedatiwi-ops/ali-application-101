import { UploadImage } from "@/components/ui/upload-image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { UNITS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPricerPriceTotal } from "@/lib/markup";
import { t, type Locale } from "@/lib/i18n";
import type { OrderItem, Invoice, OrderImage } from "@/generated/prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  ExternalLink,
  Link2,
} from "lucide-react";

type PricedHeaderItem = OrderItem & {
  images: OrderImage[];
  invoice: Invoice | null;
  request: { customer: { name: string } };
};

export function PricerPricedHeader({ item, locale }: { item: PricedHeaderItem; locale: Locale }) {
  const productName =
    locale === "en" && item.productNameEn ? item.productNameEn : item.productNameAr;
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const BackChevron = locale === "ar" ? ChevronRight : ChevronLeft;
  const invoice = item.invoice;
  const pricerTotal = invoice ? getPricerPriceTotal(invoice.subtotal, invoice.shipping) : 0;

  return (
    <section className="pricer-page-header pricer-page-header--done -mt-2">
      <div className="pricer-page-header-glow pricer-page-header-glow--green" aria-hidden />
      <div className="relative z-10">
        <Link
          href="/priced"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white transition-colors mb-4"
        >
          <BackChevron className="h-4 w-4" />
          {t("myPricedOrders", locale)}
        </Link>

        <div className="flex gap-4 items-start">
          {item.images[0] ? (
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white/25 shadow-lg">
              <UploadImage src={item.images[0].url} alt="" fill className="object-cover" sizes="80px" fallbackClassName="w-full h-full" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 shrink-0 flex items-center justify-center">
              <Package className="h-9 w-9 text-white/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge status={item.status} locale={locale} />
              <span className="text-[10px] font-mono text-white/45" dir="ltr">
                {item.refNumber}
              </span>
            </div>
            <h1 className="text-lg font-black text-white leading-snug line-clamp-2">
              {productName}
            </h1>
            <p className="text-sm text-white/65 mt-2">
              {item.quantity} {unitLabel} · {item.request.customer.name}
            </p>
            {item.pricedAt && (
              <p className="text-xs text-white/45 mt-1">
                {t("pricedAt", locale)}: {formatDate(item.pricedAt, locale)}
              </p>
            )}
          </div>
        </div>

        {invoice && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/15 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                {locale === "en" ? "Total" : "المجموع"}
              </span>
            </div>
            <p className="text-2xl font-black text-white tabular-nums">
              {formatCurrency(pricerTotal, item.currency)}
            </p>
          </div>
        )}

        {item.productLink && (
          <a
            href={item.productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/15 transition-colors"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{t("openLink", locale)}</span>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
          </a>
        )}
      </div>
    </section>
  );
}
