import { PricerPricedHeader } from "@/components/pricing/pricer-priced-header";
import { SectionCard } from "@/components/ui/card";
import { PricingDetailsCard } from "@/components/orders/pricing-details-card";
import { ImageGallery } from "@/components/ui/image-gallery";
import { UNITS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getPricerPriceTotal } from "@/lib/markup";
import { t, type Locale } from "@/lib/i18n";
import type { OrderItem, Invoice, OrderImage } from "@/generated/prisma/client";
import { Receipt, Images } from "lucide-react";

type PricedItem = OrderItem & {
  images: OrderImage[];
  invoice: Invoice | null;
  request: { customer: { name: string } };
};

export function PricedOrderDetail({ item, locale }: { item: PricedItem; locale: Locale }) {
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const invoice = item.invoice;
  const pricerTotal = invoice ? getPricerPriceTotal(invoice.subtotal, invoice.shipping) : 0;

  return (
    <div className="page-container pb-4">
      <PricerPricedHeader item={item} locale={locale} />

      {item.unitPrice != null && <PricingDetailsCard item={item} locale={locale} />}

      {invoice && (
        <SectionCard
          title={locale === "en" ? "Price Breakdown" : "تفصيل الأسعار"}
          icon={<Receipt className="h-5 w-5" />}
        >
          <div className="pricer-receipt-lines">
            <div className="pricer-receipt-line">
              <span className="text-sm text-gray-500">
                {item.quantity} {unitLabel} × {formatCurrency(item.unitPrice ?? 0, item.currency)}
              </span>
              <span className="text-sm font-semibold text-brand tabular-nums">
                {formatCurrency(invoice.subtotal, item.currency)}
              </span>
            </div>
            <div className="pricer-receipt-line">
              <span className="text-sm text-gray-500">{t("internalShipping", locale)}</span>
              <span className="text-sm font-semibold text-brand tabular-nums">
                {formatCurrency(invoice.shipping, item.currency)}
              </span>
            </div>
            <div className="pricer-receipt-line pricer-receipt-line--total">
              <span className="text-sm font-bold text-brand">
                {locale === "en" ? "Total" : "المجموع"}
              </span>
              <span className="text-lg font-black text-accent tabular-nums">
                {formatCurrency(pricerTotal, item.currency)}
              </span>
            </div>
          </div>
        </SectionCard>
      )}

      {item.images.length > 0 && (
        <SectionCard title={t("photos", locale)} icon={<Images className="h-5 w-5" />}>
          <ImageGallery images={item.images} locale={locale} size="lg" />
        </SectionCard>
      )}
    </div>
  );
}
