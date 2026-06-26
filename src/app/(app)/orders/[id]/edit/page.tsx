import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderItem } from "@/lib/queries";
import { getLocaleFromRole } from "@/lib/i18n";
import { canEditOrder } from "@/lib/permissions";
import { OrderEditForm } from "@/components/orders/order-edit-form";

export default async function OrderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const locale = getLocaleFromRole(user.role);
  const { id } = await params;
  const { return: returnPath } = await searchParams;
  const item = await getOrderItem(id);
  if (!item) notFound();

  if (!canEditOrder(user.role, item.status)) {
    redirect(returnPath ?? `/orders/${id}`);
  }

  const returnTo = returnPath ?? `/orders/${id}`;

  return <OrderEditForm item={item} locale={locale} returnTo={returnTo} />;
}
