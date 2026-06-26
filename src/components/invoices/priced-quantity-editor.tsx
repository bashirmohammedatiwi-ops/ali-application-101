"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePricedOrderQuantity } from "@/actions/orders";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { UNITS } from "@/lib/constants";
import type { Unit } from "@/generated/prisma/client";

export function PricedQuantityEditor({
  orderItemId,
  quantity,
  unit,
  locale,
}: {
  orderItemId: string;
  quantity: number;
  unit: Unit;
  locale: Locale;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(String(quantity));
  const unitLabel = UNITS[unit][locale === "en" ? "en" : "ar"];

  function handleSave() {
    const qty = parseFloat(value);
    if (!qty || qty <= 0) {
      toast(locale === "en" ? "Invalid quantity" : "العدد غير صالح", "error");
      return;
    }
    startTransition(async () => {
      try {
        await updatePricedOrderQuantity(orderItemId, qty);
        toast(t("success", locale));
        router.refresh();
      } catch {
        toast(t("error", locale), "error");
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-border p-4 card-elevated">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="h-4 w-4 text-accent" />
        <p className="text-sm font-bold text-brand">
          {locale === "en" ? "Edit Quantity" : "تعديل العدد"}
        </p>
      </div>
      <div className="flex gap-3 items-end">
        <Input
          label={t("quantity", locale)}
          type="number"
          step="any"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          dir="ltr"
          hint={unitLabel}
          className="flex-1"
        />
        <Button size="sm" variant="secondary" disabled={pending} onClick={handleSave}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("save", locale)}
        </Button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        {locale === "en"
          ? "Invoice totals will update automatically"
          : "سيتم تحديث الفاتورة تلقائياً"}
      </p>
    </div>
  );
}
