import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { getOrderItem } from "@/lib/queries";
import { getLocaleFromRole } from "@/lib/i18n";
import { canEditOrder } from "@/lib/permissions";
import { ensureOrderItemTranslation } from "@/actions/orders";
import { PricingForm } from "@/components/pricing/pricing-form";

export default async function PricingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const { id } = await params;

  let item = await getOrderItem(id);
  if (!item || item.status !== "PRICING") notFound();

  if (!item.productNameEn?.trim()) {
    await ensureOrderItemTranslation(id);
    item = (await getOrderItem(id)) ?? item;
  }

  return (
    <PricingForm
      item={item}
      locale={locale}
      canEditDetails={canEditOrder(user!.role, item.status)}
    />
  );
}
