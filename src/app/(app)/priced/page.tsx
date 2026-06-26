import { getSessionUser } from "@/lib/session-user";
import { getOrderItems } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { ListToolbar } from "@/components/ui/action-tile";
import { SearchBar } from "@/components/ui/search-bar";
import { PricingQueueCard } from "@/components/pricing/pricing-queue-card";
import { PricerPageHeader } from "@/components/pricing/pricer-page-header";
import { PricerEmptyState } from "@/components/pricing/pricer-empty-state";
import { Suspense } from "react";
import { ClipboardCheck, DollarSign } from "lucide-react";

export default async function MyPricedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;

  const items = await getOrderItems({
    pricedById: user!.id,
    search: params.q,
    limit: 100,
  });

  const pricedCount = items.filter((i) => i.status === "PRICED").length;
  const archivedCount = items.filter((i) => i.status === "ARCHIVED").length;

  return (
    <div className="page-container">
      <PricerPageHeader
        variant="done"
        icon={<ClipboardCheck className="h-6 w-6 text-emerald-300" />}
        title={t("myPricedOrders", locale)}
        subtitle={
          locale === "en"
            ? `${items.length} orders you priced`
            : `${items.length} طلب سعّرتَه`
        }
      >
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {pricedCount > 0 && (
              <span className="pricer-chip">
                {locale === "en" ? `${pricedCount} active` : `${pricedCount} نشط`}
              </span>
            )}
            {archivedCount > 0 && (
              <span className="pricer-chip pricer-chip--muted">
                {locale === "en" ? `${archivedCount} archived` : `${archivedCount} مؤرشف`}
              </span>
            )}
          </div>
        )}
      </PricerPageHeader>

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
      </ListToolbar>

      <div className="card-list-grid">
        {items.length === 0 ? (
          <PricerEmptyState
            icon={ClipboardCheck}
            locale={locale}
            title={locale === "en" ? "No priced orders yet" : "لا طلبات مسعّرة بعد"}
            message={
              locale === "en"
                ? "Orders you price will appear here for quick reference"
                : "الطلبات التي تسعّرها ستظهر هنا للمراجعة السريعة"
            }
            actionHref="/pricing"
            actionLabel={locale === "en" ? "Open pricing queue" : "فتح قائمة التسعير"}
          />
        ) : (
          items.map((item) => (
            <PricingQueueCard
              key={item.id}
              item={item}
              locale={locale}
              href={`/priced/${item.id}`}
              variant="done"
            />
          ))
        )}
      </div>
    </div>
  );
}
