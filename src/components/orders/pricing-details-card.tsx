import { SectionCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { parseSpecs, specsToNotes } from "@/lib/specs";
import { UNITS } from "@/lib/constants";
import { CURRENCY_LABELS } from "@/lib/currency";
import { t, type Locale } from "@/lib/i18n";
import type { OrderItem } from "@/generated/prisma/client";
import {
  DollarSign,
  Scale,
  Box,
  Layers,
  Clock,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

function SpecPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="pricing-spec-pill">
      <span className="pricing-spec-pill-icon">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-brand tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

export function PricingDetailsCard({
  item,
  locale,
}: {
  item: OrderItem;
  locale: Locale;
}) {
  if (!item.unitPrice) return null;

  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const currencyKey = item.currency === "CNY" ? "CNY" : "USD";
  const currencyLabel = CURRENCY_LABELS[currencyKey][locale === "en" ? "en" : "ar"];
  const specs = parseSpecs(item.specsJson);
  const specsText = specsToNotes(specs, locale);

  const pills: { icon: LucideIcon; label: string; value: string }[] = [
    {
      icon: DollarSign,
      label: t("unitPrice", locale),
      value: `${formatCurrency(item.unitPrice, item.currency)}/${unitLabel}`,
    },
  ];

  if (item.internalShipping != null) {
    pills.push({
      icon: Box,
      label: t("internalShipping", locale),
      value: formatCurrency(item.internalShipping, item.currency),
    });
  }
  if (item.weightKg != null) {
    pills.push({ icon: Scale, label: t("weight", locale), value: `${item.weightKg} kg` });
  }
  if (item.volumeCbm != null) {
    pills.push({ icon: Box, label: t("volume", locale), value: `${item.volumeCbm} cbm` });
  }
  if (item.moq != null) {
    pills.push({ icon: Layers, label: t("moq", locale), value: `${item.moq} ${unitLabel}` });
  }
  if (item.leadTimeDays != null) {
    pills.push({
      icon: Clock,
      label: t("leadTime", locale),
      value: `${item.leadTimeDays} ${locale === "en" ? "days" : "يوم"}`,
    });
  }

  return (
    <SectionCard
      title={locale === "en" ? "Pricing Details" : "تفاصيل التسعير"}
      subtitle={currencyLabel}
      icon={<DollarSign className="h-5 w-5" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {pills.map((pill) => (
          <SpecPill key={pill.label} icon={pill.icon} label={pill.label} value={pill.value} />
        ))}
      </div>
      {specsText && (
        <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-border leading-relaxed">
          {specsText}
        </p>
      )}
      {item.pricerNotes && (
        <div className="mt-3 rounded-2xl bg-[var(--field-bg)] p-3.5 flex gap-2.5">
          <StickyNote className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">{item.pricerNotes}</p>
        </div>
      )}
    </SectionCard>
  );
}
