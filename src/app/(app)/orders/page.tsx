import { getSessionUser } from "@/lib/session-user";
import { getOrderItems } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { canEditOrder } from "@/lib/permissions";
import { OrderCard, EmptyState } from "@/components/orders/order-card";
import { PageHeader } from "@/components/ui/page-header";
import { ListToolbar } from "@/components/ui/action-tile";
import { SearchBar, StatusFilter } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/generated/prisma/client";
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BulkSendToPricingButton } from "@/components/orders/bulk-send-button";
import { prisma } from "@/lib/db";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;

  const statusFilter = params.status as OrderStatus | undefined;
  const [items, receivedCount] = await Promise.all([
    getOrderItems({
      search: params.q,
      status: statusFilter ? statusFilter : ["RECEIVED", "PRICING"],
    }),
    prisma.orderItem.count({ where: { status: "RECEIVED" } }),
  ]);

  const statusOptions = (["RECEIVED", "PRICING"] as OrderStatus[]).map((s) => ({
    value: s,
    labelAr: STATUSES[s].ar,
    labelEn: STATUSES[s].en,
  }));

  return (
    <div className="page-container">
      <PageHeader
        title={t("allOrders", locale)}
        subtitle={
          locale === "en"
            ? `${items.length} in queue`
            : `${items.length} طلب في القائمة`
        }
        action={
          <Link href="/orders/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t("newOrder", locale)}
            </Button>
          </Link>
        }
      />

      <ListToolbar>
        <Suspense>
          <SearchBar locale={locale} />
        </Suspense>
        <Suspense>
          <StatusFilter locale={locale} current={params.status} options={statusOptions} />
        </Suspense>
      </ListToolbar>

      <BulkSendToPricingButton count={receivedCount} locale={locale} />

      <div className="card-list-grid">
        {items.length === 0 ? (
          <EmptyState message={t("noResults", locale)} />
        ) : (
          items.map((item) => (
            <OrderCard
              key={item.id}
              item={item}
              locale={locale}
              href={`/orders/${item.id}`}
              editable={canEditOrder(user!.role, item.status)}
            />
          ))
        )}
      </div>
    </div>
  );
}
