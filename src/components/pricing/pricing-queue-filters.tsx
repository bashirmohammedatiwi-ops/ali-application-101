"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle, Flame, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const FILTERS = [
  { value: "", icon: LayoutList, labelEn: "All", labelAr: "الكل" },
  { value: "urgent", icon: Flame, labelEn: "Urgent", labelAr: "عاجل" },
  { value: "overdue", icon: AlertTriangle, labelEn: "Overdue", labelAr: "متأخر" },
] as const;

export function PricingQueueFilters({
  locale,
  counts,
}: {
  locale: Locale;
  counts: { all: number; urgent: number; overdue: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get("filter") ?? "";

  function setFilter(value: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("filter", value);
      else params.delete("filter");
      router.replace(`?${params.toString()}`);
    });
  }

  function countFor(value: string) {
    if (value === "urgent") return counts.urgent;
    if (value === "overdue") return counts.overdue;
    return counts.all;
  }

  return (
    <div className="pricer-filters">
      {FILTERS.map(({ value, icon: Icon, labelEn, labelAr }) => {
        const active = current === value;
        const count = countFor(value);
        return (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setFilter(value)}
            className={cn("pricer-filter-pill", active && "pricer-filter-pill--active")}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{locale === "en" ? labelEn : labelAr}</span>
            {count > 0 && (
              <span className={cn("pricer-filter-count", active && "pricer-filter-count--active")}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
