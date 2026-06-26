import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { OrderEntryWizard } from "@/components/orders/order-entry-wizard";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user.role, "create_order")) {
    redirect("/dashboard");
  }

  const locale = getLocaleFromRole(user.role);
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
