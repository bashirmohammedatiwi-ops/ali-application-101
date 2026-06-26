import { getSessionUser } from "@/lib/session-user";
import { getOrderItems } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { ListToolbar } from "@/components/ui/action-tile";
import { SearchBar } from "@/components/ui/search-bar";
import { PricingQueueCard } from "@/components/pricing/pricing-queue-card";
import { PricerPageHeader } from "@/components/pricing/pricer-page-header";
import { PricerEmptyState } from "@/components/pricing/pricer-empty-state";
import { PricingQueueFilters } from "@/components/pricing/pricing-queue-filters";
import { Suspense } from "react";
import { DollarSign, Inbox } from "lucide-react";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;
  const overdueCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const allItems = await getOrderItems({
    status: "PRICING",
    search: params.q,
  });

  const urgentCount = allItems.filter((i) => i.priority === "URGENT").length;
  const overdueCount = allItems.filter((i) => i.updatedAt < overdueCutoff).length;

  let items = allItems;
  if (params.filter === "urgent") {
    items = items.filter((i) => i.priority === "URGENT");
  } else if (params.filter === "overdue") {
    items = items.filter((i) => i.updatedAt < overdueCutoff);
  }

  return (
    <div className="page-container">
      <PricerPageHeader
        icon={<DollarSign className="h-6 w-6 text-white" />}
        title={t("pendingPricing", locale)}
        subtitle={
          locale === "en"
            ? `${allItems.length} orders in queue`
            : `${allItems.length} طلب في الانتظار`
        }
      />

      <Suspense>
        <PricingQueueFilters
          locale={locale}
          counts={{ all: allItems.length, urgent: urgentCount, overdue: overdueCount }}
        />
      </Suspense>

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
      </ListToolbar>

      <div className="card-list-grid">
        {items.length === 0 ? (
          <PricerEmptyState
            icon={Inbox}
            locale={locale}
            title={locale === "en" ? "Queue is clear" : "القائمة فارغة"}
            message={
              params.filter
                ? locale === "en"
                  ? "No orders match this filter"
                  : "لا طلبات تطابق الفلتر"
                : locale === "en"
                  ? "No orders waiting — check back later"
                  : "لا طلبات معلقة — عد لاحقاً"
            }
            actionHref={params.filter ? "/pricing" : undefined}
            actionLabel={params.filter ? (locale === "en" ? "Show all" : "عرض الكل") : undefined}
          />
        ) : (
          items.map((item) => (
            <PricingQueueCard
              key={item.id}
              item={item}
              locale={locale}
              overdue={item.updatedAt < overdueCutoff}
            />
          ))
        )}
      </div>
    </div>
  );
}
