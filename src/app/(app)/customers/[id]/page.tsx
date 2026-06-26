import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session-user";
import { getCustomerDetail } from "@/lib/queries";
import { getLocaleFromRole, t } from "@/lib/i18n";
import { Avatar, ActionTile } from "@/components/ui/action-tile";
import { SectionCard, Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { PageHeader } from "@/components/ui/page-header";
import { InfoRow, InfoBlock } from "@/components/ui/info-row";
import { StatusBadge } from "@/components/ui/badge";
import { Plus, Phone, MessageCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EditCustomerForm } from "@/components/customers/edit-customer-form";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const { id } = await params;
  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const allItems = customer.requests.flatMap((r) =>
    r.items.map((item) => ({ ...item, requestRef: r.refNumber }))
  );

  const whatsappPhone = customer.whatsapp || customer.phone;

  return (
    <div className="page-container pb-4">
      <PageHeader
        title={customer.name}
        subtitle={
          locale === "en"
            ? `${allItems.length} orders`
            : `${allItems.length} طلب`
        }
      />

      <SectionCard
        title={locale === "en" ? "Contact Info" : "معلومات التواصل"}
        icon={<Phone className="h-5 w-5" />}
      >
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={customer.name} size="lg" />
          <div className="min-w-0">
            <p className="text-sm text-gray-400" dir="ltr">
              {customer.phone}
            </p>
            {customer.whatsapp && customer.whatsapp !== customer.phone && (
              <p className="text-xs text-gray-400 mt-0.5" dir="ltr">
                WhatsApp: {customer.whatsapp}
              </p>
            )}
          </div>
        </div>
        <InfoBlock>
          {customer.city && (
            <InfoRow
              label={t("customerCity", locale)}
              value={
                customer.address
                  ? `${customer.city} · ${customer.address}`
                  : customer.city
              }
            />
          )}
          {customer.notes && (
            <InfoRow label={t("notes", locale)} value={customer.notes} />
          )}
        </InfoBlock>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <ActionTile
            icon={MessageCircle}
            label="WhatsApp"
            sublabel={locale === "en" ? "Open chat" : "فتح المحادثة"}
            href={buildWhatsAppUrl(whatsappPhone, `السلام عليكم ${customer.name}`)}
            external
            variant="whatsapp"
          />
          <ActionTile
            icon={Plus}
            label={t("newOrder", locale)}
            sublabel={locale === "en" ? "For this customer" : "لهذا الزبون"}
            href={`/orders/new?customerId=${customer.id}`}
            variant="accent"
          />
        </div>
      </SectionCard>

      <EditCustomerForm customer={customer} locale={locale} />

      <section>
        <SectionTitle title={locale === "en" ? "Order History" : "سجل الطلبات"} />
        <div className="space-y-3">
          {allItems.length === 0 ? (
            <Card className="text-center py-10 text-gray-400 text-sm">
              {t("noResults", locale)}
            </Card>
          ) : (
            allItems.map((item) => (
              <Link
                key={item.id}
                href={
                  item.status === "PRICING"
                    ? `/pricing/${item.id}`
                    : item.status === "PRICED"
                      ? `/invoices/${item.id}`
                      : item.status === "ARCHIVED"
                        ? `/archive/${item.id}`
                        : `/orders/${item.id}`
                }
              >
                <Card interactive className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <StatusBadge status={item.status} locale={locale} />
                    <span className="text-[10px] font-mono text-gray-400">{item.refNumber}</span>
                  </div>
                  <p className="font-bold text-brand text-sm">{item.productNameAr}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(item.createdAt, locale)}
                    {item.invoice && ` · $${item.invoice.grandTotal}`}
                  </p>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
