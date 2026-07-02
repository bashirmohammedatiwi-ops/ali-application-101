import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { getOrderItem } from "@/lib/queries";
import { getSettings } from "@/lib/cache";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { canEditPricedQuantity } from "@/lib/permissions";
import { SectionCard } from "@/components/ui/card";
import { ImageGallery } from "@/components/ui/image-gallery";
import { InvoiceHero } from "@/components/invoices/invoice-hero";
import { InvoiceCustomerBar } from "@/components/invoices/invoice-customer-bar";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { PricedQuantityEditor } from "@/components/invoices/priced-quantity-editor";
import { PricingDetailsCard } from "@/components/orders/pricing-details-card";
import { STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Clock, ExternalLink, Images, Link2, User } from "lucide-react";

export async function OrderInvoiceView({
  id,
  allowedStatuses,
}: {
  id: string;
  allowedStatuses: string[];
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const [item, settings] = await Promise.all([
    getOrderItem(id),
    getSettings(),
  ]);
  if (!item || !allowedStatuses.includes(item.status)) notFound();

  const showQuantityEdit = canEditPricedQuantity(user!.role, item.status);

  return (
    <div className="page-container pb-4">
      <InvoiceHero item={item} locale={locale} />

      <InvoiceCustomerBar customer={item.request.customer} locale={locale} />

      {item.productLink && (
        <a
          href={item.productLink}
          target="_blank"
          rel="noopener noreferrer"
          className="invoice-product-link"
        >
          <Link2 className="h-4 w-4 text-accent shrink-0" />
          <span className="text-sm font-semibold text-brand flex-1 truncate">
            {t("openLink", locale)}
          </span>
          <ExternalLink className="h-4 w-4 text-gray-300 shrink-0" />
        </a>
      )}

      <div className="detail-page-grid">
        <div className="space-y-6 min-w-0">
          {item.unitPrice && <PricingDetailsCard item={item} locale={locale} />}

          {showQuantityEdit && (
            <PricedQuantityEditor
              orderItemId={item.id}
              quantity={item.quantity}
              unit={item.unit}
              locale={locale}
            />
          )}

          {item.images.length > 0 && (
            <SectionCard title={t("photos", locale)} icon={<Images className="h-5 w-5" />}>
              <ImageGallery images={item.images} locale={locale} size="lg" />
            </SectionCard>
          )}

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

        <div className="space-y-6 min-w-0 lg:sticky lg:top-24 lg:self-start">
          <InvoiceActions
            item={item}
            locale={locale}
            role={user!.role}
            usdToCnyRate={settings?.usdToCnyRate ?? 7.2}
            usdToIqdRate={settings?.usdToIqdRate ?? 1310}
          />
        </div>
      </div>
    </div>
  );
}
