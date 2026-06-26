import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session-user";
import { getOrderItem } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { InfoRow, InfoBlock } from "@/components/ui/info-row";
import { ImageGallery } from "@/components/ui/image-gallery";
import { UNITS, STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { OrderDetailActions } from "@/components/orders/order-detail-actions";
import { PricingDetailsCard } from "@/components/orders/pricing-details-card";
import { parseSpecs, specsToNotes } from "@/lib/specs";
import { canEditOrder } from "@/lib/permissions";
import { ExternalLink, Pencil, Package, Clock, User, Images } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const { id } = await params;
  const item = await getOrderItem(id);
  if (!item) notFound();

  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const specs = parseSpecs(item.specsJson);
  const specsText = specsToNotes(specs, locale);
  const editable = canEditOrder(user!.role, item.status);

  return (
    <div className="page-container pb-4">
      <PageHeader
        title={item.productNameAr}
        subtitle={`${item.refNumber} · ${item.request.refNumber}`}
        action={
          editable ? (
            <Link href={`/orders/${item.id}/edit`}>
              <Button size="sm" variant="secondary">
                <Pencil className="h-4 w-4" />
                {t("edit", locale)}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 flex-wrap -mt-2">
        <StatusBadge status={item.status} locale={locale} />
        <PriorityBadge urgent={item.priority === "URGENT"} locale={locale} />
      </div>

      {item.productNameEn && (
        <p className="text-sm text-gray-400 px-3.5" dir="ltr">
          EN: {item.productNameEn}
        </p>
      )}

      <SectionCard
        title={locale === "en" ? "Order Details" : "تفاصيل الطلب"}
        icon={<Package className="h-5 w-5" />}
      >
        <InfoBlock>
          <InfoRow
            label={t("customer", locale)}
            value={
              <Link
                href={`/customers/${item.request.customer.id}`}
                className="text-accent hover:underline"
              >
                {item.request.customer.name}
              </Link>
            }
          />
          <InfoRow label={t("customerPhone", locale)} value={item.request.customer.phone} />
          <InfoRow
            label={t("quantity", locale)}
            value={`${item.quantity} ${unitLabel}`}
          />
        </InfoBlock>
        {specsText && (
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-border">{specsText}</p>
        )}
        {item.notesAr && (
          <p className="text-sm text-gray-600 bg-[var(--field-bg)] rounded-2xl p-3 mt-3">
            {item.notesAr}
          </p>
        )}
        {item.productLink && (
          <a
            href={item.productLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm mt-4"
          >
            {t("openLink", locale)} <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </SectionCard>

      {item.images.length > 0 && (
        <SectionCard title={t("photos", locale)} icon={<Images className="h-5 w-5" />}>
          <ImageGallery images={item.images} locale={locale} size="lg" />
        </SectionCard>
      )}

      {item.unitPrice && <PricingDetailsCard item={item} locale={locale} />}

      <OrderDetailActions item={item} locale={locale} role={user!.role} />

      {item.statusHistory.length > 0 && (
        <SectionCard
          title={locale === "en" ? "Status History" : "سجل الحالات"}
          icon={<Clock className="h-5 w-5" />}
        >
          <div className="space-y-0">
            {item.statusHistory.map((h, i) => (
              <div
                key={h.id}
                className="flex gap-3 py-3 border-b border-border/60 last:border-0"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1.5" />
                  {i < item.statusHistory.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-1 min-h-[24px]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm font-semibold text-brand">
                    {h.fromStatus
                      ? STATUSES[h.fromStatus][locale === "en" ? "en" : "ar"]
                      : "—"}{" "}
                    → {STATUSES[h.toStatus][locale === "en" ? "en" : "ar"]}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {h.changedBy.name} · {formatDate(h.createdAt, locale)}
                  </p>
                  {h.reason && (
                    <p className="text-xs text-gray-500 mt-1 bg-[var(--field-bg)] rounded-lg px-2 py-1">
                      {h.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
