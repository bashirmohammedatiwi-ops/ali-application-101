import Link from "next/link";
import { UploadImage } from "@/components/ui/upload-image";
import { PriorityBadge } from "@/components/ui/badge";
import { UNITS } from "@/lib/constants";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { getPricerPriceTotal } from "@/lib/markup";
import type { Locale } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Clock, Package, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

type QueueItem = {
  id: string;
  refNumber: string;
  status: OrderStatus;
  priority: "NORMAL" | "URGENT";
  productNameAr: string;
  productNameEn: string | null;
  quantity: number;
  unit: keyof typeof UNITS;
  currency: string;
  updatedAt: Date;
  pricedAt: Date | null;
  images: { url: string }[];
  invoice: { subtotal: number; shipping: number } | null;
  request: { customer: { name: string } };
};

export function PricingQueueCard({
  item,
  locale,
  href,
  variant = "queue",
  overdue,
}: {
  item: QueueItem;
  locale: Locale;
  href?: string;
  variant?: "queue" | "done";
  overdue?: boolean;
}) {
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const productName =
    locale === "en" ? item.productNameEn ?? item.productNameAr : item.productNameAr;
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const link = href ?? `/pricing/${item.id}`;
  const isDone = variant === "done";

  const timeLabel = formatRelativeTime(
    isDone && item.pricedAt ? item.pricedAt : item.updatedAt,
    locale
  );

  return (
    <Link
      href={link}
      className={cn(
        "pricer-queue-card block group",
        isDone && "pricer-queue-card--done",
        overdue && "pricer-queue-card--overdue"
      )}
    >
      <div className="flex gap-3.5 items-center">
        {item.images[0] ? (
          <div className="relative w-[68px] h-[68px] rounded-2xl overflow-hidden shrink-0 border border-border bg-[var(--field-bg)]">
            <UploadImage src={item.images[0].url} alt="" fill className="object-cover" sizes="68px" fallbackClassName="w-[68px] h-[68px] rounded-2xl" />
            {item.priority === "URGENT" && (
              <span className="absolute top-1 inset-inline-end-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </div>
        ) : (
          <div className="w-[68px] h-[68px] rounded-2xl bg-[var(--field-bg)] border border-border shrink-0 flex items-center justify-center">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {item.priority === "URGENT" && <PriorityBadge urgent locale={locale} />}
            {overdue && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                {locale === "en" ? "Overdue" : "متأخر"}
              </span>
            )}
            {isDone && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {locale === "en" ? "Priced" : "مُسعَّر"}
              </span>
            )}
          </div>
          <p className="font-bold text-brand truncate text-[15px] leading-snug">{productName}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.request.customer.name}</p>
          <div className="flex items-center flex-wrap gap-x-2 mt-1.5 text-[11px] text-gray-400">
            <span className="font-mono font-medium">{item.refNumber}</span>
            <span className="opacity-40">·</span>
            <span>
              {item.quantity} {unitLabel}
            </span>
            {item.invoice && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-accent font-bold tabular-nums">
                  {formatCurrency(
                    getPricerPriceTotal(item.invoice.subtotal, item.invoice.shipping),
                    item.currency
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {!isDone && (
            <span className="pricer-queue-cta">
              {locale === "en" ? "Price" : "تسعير"}
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
          <Chevron className="h-5 w-5 text-gray-300 group-hover:text-accent transition-colors" />
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5" title={formatDate(isDone && item.pricedAt ? item.pricedAt : item.updatedAt, locale)}>
            <Clock className="h-3 w-3" />
            {timeLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
