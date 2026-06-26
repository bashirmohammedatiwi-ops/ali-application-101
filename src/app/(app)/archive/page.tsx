import { getSessionUser } from "@/lib/session-user";
import { getOrderItems } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { canEditOrder } from "@/lib/permissions";
import { OrderCard, EmptyState } from "@/components/orders/order-card";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/action-tile";
import { SearchBar } from "@/components/ui/search-bar";
import { ExportArchiveButton } from "@/components/archive/export-button";
import { Suspense } from "react";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;

  const items = await getOrderItems({
    status: "ARCHIVED",
    search: params.q,
    limit: 100,
  });

  return (
    <div className="page-container">
      <PageHeader
        title={locale === "en" ? "Archive" : "الأرشيف"}
        subtitle={
          locale === "en"
            ? `${items.length} records`
            : `${items.length} سجل مؤرشف`
        }
      />

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
      </ListToolbar>

      <ExportArchiveButton locale={locale} />

      <div className="card-list-grid">
        {items.length === 0 ? (
          <EmptyState message={t("noResults", locale)} />
        ) : (
          items.map((item) => (
            <OrderCard
              key={item.id}
              item={item}
              locale={locale}
              href={`/archive/${item.id}`}
              editable={canEditOrder(user!.role, item.status)}
            />
          ))
        )}
      </div>
    </div>
  );
}
