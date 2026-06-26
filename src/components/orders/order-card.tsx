import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UNITS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, Pencil, Package, Inbox } from "lucide-react";
import { ImageThumbnail } from "@/components/ui/image-gallery";
import { cn } from "@/lib/utils";

type OrderItemCard = {
  id: string;
  refNumber: string;
  status: OrderStatus;
  priority: "NORMAL" | "URGENT";
  productNameAr: string;
  productNameEn: string | null;
  quantity: number;
  unit: keyof typeof UNITS;
  updatedAt: Date;
  images: { url: string }[];
  invoice: { invoiceNumber: string; grandTotal: number } | null;
  request: {
    customer: { name: string; phone: string };
  };
};

const STRIPE: Record<OrderStatus, string> = {
  RECEIVED: "status-stripe-received",
  PRICING: "status-stripe-pricing",
  PRICED: "status-stripe-priced",
  ARCHIVED: "status-stripe-archived",
};

export function OrderCard({
  item,
  locale,
  href,
  editable,
}: {
  item: OrderItemCard;
  locale: Locale;
  href: string;
  editable?: boolean;
}) {
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const productName =
    locale === "en" ? item.productNameEn ?? item.productNameAr : item.productNameAr;

  return (
    <Card
      className={cn("overflow-hidden p-0 order-card-stripe", STRIPE[item.status])}
      interactive
      padding={false}
    >
      <Link href={href} className="flex gap-3.5 items-center p-4 ps-5">
        {item.images[0] ? (
          <ImageThumbnail
            src={item.images[0].url}
            images={item.images.map((img) => img.url)}
            locale={locale}
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[var(--field-bg)] shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm">
            <Package className="h-6 w-6 text-accent/60" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <StatusBadge status={item.status} locale={locale} />
            {item.priority === "URGENT" && <PriorityBadge urgent locale={locale} />}
          </div>
          <p className="font-bold text-brand truncate leading-snug text-[15px]">
            {productName}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {item.request.customer.name}
          </p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-gray-400">
            <span className="font-mono font-medium">{item.refNumber}</span>
            <span className="opacity-40">·</span>
            <span>
              {item.quantity} {UNITS[item.unit][locale === "en" ? "en" : "ar"]}
            </span>
            {item.invoice && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-accent font-semibold">${item.invoice.grandTotal}</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span>{formatDate(item.updatedAt, locale)}</span>
          </div>
        </div>
        <Chevron className="h-5 w-5 text-gray-300 shrink-0" />
      </Link>
      {editable && (
        <div className="px-4 pb-3.5 pt-0 border-t border-border/50 ms-1">
          <Link href={`/orders/${item.id}/edit`}>
            <Button variant="secondary" size="sm" fullWidth className="mt-3">
              <Pencil className="h-3.5 w-3.5" />
              {t("edit", locale)}
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-[20px] border p-4 text-center transition-all card-elevated",
        accent
          ? "stat-glow border-transparent text-white shadow-lg shadow-accent/25"
          : "bg-white border-border hover:border-accent/25",
        href && "card-interactive cursor-pointer active:scale-[0.98]"
      )}
    >
      <p
        className={cn(
          "text-2xl font-black tabular-nums tracking-tight",
          accent ? "text-white" : "text-brand"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "text-[11px] mt-1.5 font-semibold uppercase tracking-wide",
          accent ? "text-white/80" : "text-gray-400"
        )}
      >
        {label}
      </p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-white/60 text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-[var(--field-bg)] flex items-center justify-center mx-auto mb-4">
        <Inbox className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-gray-400 text-sm font-medium">{message}</p>
    </div>
  );
}
