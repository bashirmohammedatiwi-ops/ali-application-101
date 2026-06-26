import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";
import { STATUSES } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";

const DOT_COLORS: Record<OrderStatus, string> = {
  RECEIVED: "bg-blue-500",
  PRICING: "bg-amber-500",
  PRICED: "bg-emerald-500",
  ARCHIVED: "bg-gray-400",
};

export function StatusBadge({
  status,
  locale = "ar",
  className,
}: {
  status: OrderStatus;
  locale?: Locale;
  className?: string;
}) {
  const config = STATUSES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        config.bg,
        config.color,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_COLORS[status])} />
      {locale === "en" ? config.en : config.ar}
    </span>
  );
}

export function PriorityBadge({
  urgent,
  locale = "ar",
}: {
  urgent: boolean;
  locale?: Locale;
}) {
  if (!urgent) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {locale === "en" ? "Urgent" : "عاجل"}
    </span>
  );
}
