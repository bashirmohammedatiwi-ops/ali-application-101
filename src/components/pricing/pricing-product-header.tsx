import Image from "next/image";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { UNITS } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";
import type { OrderItem, OrderImage } from "@/generated/prisma/client";
import {
  ExternalLink,
  Languages,
  Package,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderItem = OrderItem & {
  images: OrderImage[];
  request: { customer: { name: string } };
};

export function PricingProductHeader({
  item,
  locale,
  onRetranslate,
  retranslatePending,
}: {
  item: HeaderItem;
  locale: Locale;
  onRetranslate?: () => void;
  retranslatePending?: boolean;
}) {
  const displayName = item.productNameEn?.trim() || item.productNameAr;
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const BackChevron = locale === "ar" ? ChevronRight : ChevronLeft;

  return (
    <section className="pricer-product-header">
      <div className="pricer-page-header-glow" aria-hidden />
      <div className="relative z-10">
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <BackChevron className="h-4 w-4" />
          {locale === "en" ? "Back to queue" : "العودة للقائمة"}
        </Link>
        {onRetranslate && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={retranslatePending}
            onClick={onRetranslate}
          >
            <Languages className="h-4 w-4" />
            {locale === "en" ? "Translate" : "ترجمة"}
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-start">
        {item.images[0] ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md">
            <Image src={item.images[0].url} alt="" fill className="object-cover" sizes="96px" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/15 shrink-0 flex items-center justify-center">
            <Package className="h-10 w-10 text-white/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <StatusBadge status={item.status} locale={locale} />
            {item.priority === "URGENT" && <PriorityBadge urgent locale={locale} />}
          </div>
          <h1 className="text-lg font-black text-white leading-snug line-clamp-2" dir="ltr">
            {displayName}
          </h1>
          <p className="text-xs text-white/50 mt-1 truncate">{item.productNameAr}</p>
          <p className="text-sm text-white/70 mt-2 font-semibold">
            {item.quantity} {unitLabel}
          </p>
          <p className="text-[11px] font-mono text-white/40 mt-1" dir="ltr">
            {item.refNumber} · {item.request.customer.name}
          </p>
        </div>
      </div>

      {item.productLink && (
        <a
          href={item.productLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/15 transition-colors"
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
