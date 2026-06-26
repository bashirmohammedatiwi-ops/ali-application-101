import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { getOrderItem } from "@/lib/queries";
import { getLocaleFromRole } from "@/lib/i18n";
import { hasPermission } from "@/lib/permissions";
import { PricedOrderDetail } from "@/components/pricing/priced-order-detail";

export default async function MyPricedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const { id } = await params;

  if (!hasPermission(user!.role, "view_own_priced")) notFound();

  const item = await getOrderItem(id);
  if (!item || !item.pricedById || item.pricedById !== user!.id) notFound();
  if (!["PRICED", "ARCHIVED"].includes(item.status)) notFound();

  return <PricedOrderDetail item={item} locale={locale} />;
}
