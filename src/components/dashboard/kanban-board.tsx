import { STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";
import { cn } from "@/lib/utils";

type KanbanItem = {
  id: string;
  refNumber: string;
  productNameAr: string;
  status: OrderStatus;
  request: { customer: { name: string } };
};

const DOT: Record<OrderStatus, string> = {
  RECEIVED: "bg-blue-500",
  PRICING: "bg-amber-500",
  PRICED: "bg-emerald-500",
  ARCHIVED: "bg-gray-400",
};

export function KanbanBoard({
  items,
  locale,
}: {
  items: KanbanItem[];
  locale: Locale;
}) {
  const columns: OrderStatus[] = ["RECEIVED", "PRICING", "PRICED", "ARCHIVED"];

  const hrefFor = (item: KanbanItem) => {
    if (item.status === "RECEIVED") return `/orders/${item.id}`;
    if (item.status === "PRICING") return `/pricing/${item.id}`;
    if (item.status === "PRICED") return `/invoices/${item.id}`;
    return `/archive/${item.id}`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {columns.map((status) => {
        const colItems = items.filter((i) => i.status === status);
        const config = STATUSES[status];
        return (
          <div
            key={status}
            className="rounded-2xl bg-white border border-border overflow-hidden card-elevated"
          >
            <div
              className={cn(
                "px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-bold",
                config.bg,
                config.color
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", DOT[status])} />
              {locale === "en" ? config.en : config.ar}
              <span className="opacity-60">({colItems.length})</span>
            </div>
            <div className="p-2 space-y-1.5 max-h-52 overflow-y-auto">
              {colItems.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={hrefFor(item)}
                  className="block rounded-xl p-2.5 bg-[var(--field-bg)] hover:bg-accent-light/50 transition-colors active:scale-[0.98]"
                >
                  <p className="text-xs font-bold text-brand truncate">
                    {item.productNameAr}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {item.request.customer.name}
                  </p>
                </Link>
              ))}
              {colItems.length === 0 && (
                <p className="text-[11px] text-gray-300 text-center py-4">—</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
