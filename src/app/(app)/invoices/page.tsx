import { getSessionUser } from "@/lib/session-user";
import { getOrderItems } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { OrderCard, EmptyState } from "@/components/orders/order-card";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/action-tile";
import { SearchBar } from "@/components/ui/search-bar";
import { Suspense } from "react";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;

  const items = await getOrderItems({
    status: "PRICED",
    search: params.q,
  });

  return (
    <div className="page-container">
      <PageHeader
        title={t("readyToSend", locale)}
        subtitle={
          locale === "en"
            ? `${items.length} invoices ready`
            : `${items.length} فاتورة جاهزة`
        }
      />

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
      </ListToolbar>

      <div className="card-list-grid">
        {items.length === 0 ? (
          <EmptyState message={t("noResults", locale)} />
        ) : (
          items.map((item) => (
            <OrderCard
              key={item.id}
              item={item}
              locale={locale}
              href={`/invoices/${item.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
