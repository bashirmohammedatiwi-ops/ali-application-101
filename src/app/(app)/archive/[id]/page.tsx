import { OrderInvoiceView } from "../../invoices/[id]/invoice-view";

export default async function ArchiveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderInvoiceView id={id} allowedStatuses={["ARCHIVED"]} />;
}
