import dynamic from "next/dynamic";
import Link from "next/link";
import { getDashboardStats } from "@/lib/cache";
import { getKanbanItems } from "@/lib/queries";
import { t, type Locale } from "@/lib/i18n";
import { StatCard, OrderCard, EmptyState } from "@/components/orders/order-card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionTitle } from "@/components/ui/section-title";
import { Button } from "@/components/ui/button";
import { Plus, Users, Package, DollarSign } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { canEditOrder } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";

const KanbanBoard = dynamic(
  () =>
    import("@/components/dashboard/kanban-board").then((m) => ({
      default: m.KanbanBoard,
    })),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 skeleton rounded-[20px]" />
        ))}
      </div>
    ),
  }
);

export default async function OtherDashboard({
  user,
  locale,
  firstName,
}: {
  user: { id: string; role: Role; name: string };
  locale: Locale;
  firstName: string;
}) {
  const [stats, kanbanItems] = await Promise.all([
    getDashboardStats(),
    user.role === "MANAGER" ? getKanbanItems() : Promise.resolve([]),
  ]);

  return (
    <div className="page-container">
      <PageHeader
        title={`${t("welcome", locale)}, ${firstName}`}
        subtitle={
          locale === "en"
            ? "Here's your overview for today"
            : "نظرة عامة على عملك اليوم"
        }
      />

      {stats.overduePricing > 0 && user.role !== "ORDER_TAKER" && (
        <AlertBanner
          locale={locale}
          title={locale === "en" ? "Overdue Pricing" : "طلبات متأخرة في التسعير"}
          message={
            locale === "en"
              ? `${stats.overduePricing} orders waiting more than 48 hours`
              : `${stats.overduePricing} طلب بانتظار التسعير منذ أكثر من 48 ساعة`
          }
          href="/pricing"
        />
      )}

      {stats.pricedCount > 0 && (
        <AlertBanner
          locale={locale}
          title={locale === "en" ? "Invoices Ready" : "فواتير جاهزة للإرسال"}
          message={
            locale === "en"
              ? `${stats.pricedCount} invoices waiting to be sent`
              : `${stats.pricedCount} فاتورة جاهزة — يرجى التواصل مع الزبائن`
          }
          href="/invoices"
        />
      )}

      <div className="dashboard-actions">
        <Link href="/orders/new">
          <Button fullWidth size="lg">
            <Plus className="h-5 w-5" />
            {t("newOrder", locale)}
          </Button>
        </Link>
        <Link href="/customers">
          <Button variant="secondary" size="lg" className="min-w-[54px] px-4">
            <Users className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {user.role === "MANAGER" && (
        <Link href="/pricing">
          <Button fullWidth size="lg" variant="secondary">
            <DollarSign className="h-5 w-5" />
            {t("pendingPricing", locale)} ({stats.pricingCount})
          </Button>
        </Link>
      )}

      <section>
        <SectionTitle title={locale === "en" ? "Statistics" : "الإحصائيات"} />
        <div className="stats-grid">
          <StatCard label={t("todayOrders", locale)} value={stats.todayCount} />
          <StatCard
            label={t("pendingPricing", locale)}
            value={stats.pricingCount}
            accent={stats.pricingCount > 0}
            href="/pricing"
          />
          <StatCard
            label={t("readyToSend", locale)}
            value={stats.pricedCount}
            href="/invoices"
          />
          {stats.receivedCount > 0 && (
            <StatCard
              label={locale === "en" ? "Received" : "استلام"}
              value={stats.receivedCount}
              href="/orders"
            />
          )}
          {stats.archivedCount > 0 && (
            <StatCard
              label={locale === "en" ? "Archived" : "أرشيف"}
              value={stats.archivedCount}
              href="/archive"
            />
          )}
        </div>
      </section>

      {user.role === "MANAGER" && kanbanItems.length > 0 && (
        <section>
          <SectionTitle title={locale === "en" ? "Pipeline" : "مسار الطلبات"} />
          <KanbanBoard items={kanbanItems} locale={locale} />
        </section>
      )}

      <section>
        <SectionTitle
          title={t("recentActivity", locale)}
          action={
            <Link
              href="/orders"
              className="text-xs font-semibold text-accent flex items-center gap-1"
            >
              <Package className="h-3.5 w-3.5" />
              {locale === "en" ? "View all" : "عرض الكل"}
            </Link>
          }
        />
        <div className="card-list-grid">
          {stats.recentItems.length === 0 ? (
            <EmptyState message={t("noResults", locale)} />
          ) : (
            stats.recentItems.map((item) => (
              <OrderCard
                key={item.id}
                item={item}
                locale={locale}
                href={
                  item.status === "PRICING" || item.status === "RECEIVED"
                    ? user.role === "MANAGER"
                      ? `/pricing/${item.id}`
                      : `/orders/${item.id}`
                    : item.status === "PRICED"
                      ? `/invoices/${item.id}`
                      : `/archive/${item.id}`
                }
                editable={canEditOrder(user.role, item.status)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
