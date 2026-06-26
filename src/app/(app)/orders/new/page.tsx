import dynamic from "next/dynamic";
import { getSessionUser } from "@/lib/session-user";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";

const OrderEntryWizard = dynamic(
  () =>
    import("@/components/orders/order-entry-wizard").then((m) => ({
      default: m.OrderEntryWizard,
    })),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    ),
  }
);

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const params = await searchParams;

  let initialCustomer = null;
  if (params.customerId) {
    initialCustomer = await prisma.customer.findUnique({
      where: { id: params.customerId },
    });
  }

  return (
    <div className="page-container">
      <PageHeader
        title={t("newOrder", locale)}
        subtitle={
          locale === "en"
            ? "Customer → Products → Review"
            : "الزبون ← المنتجات ← المراجعة"
        }
      />
      <OrderEntryWizard locale={locale} initialCustomer={initialCustomer} />
    </div>
  );
}
