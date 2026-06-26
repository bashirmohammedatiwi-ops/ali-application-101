import Link from "next/link";
import { Avatar } from "@/components/ui/action-tile";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { t, type Locale } from "@/lib/i18n";
import type { Customer } from "@/generated/prisma/client";
import { Phone, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

export function InvoiceCustomerBar({
  customer,
  locale,
}: {
  customer: Customer;
  locale: Locale;
}) {
  const whatsappPhone = customer.whatsapp || customer.phone;
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="invoice-customer-bar">
      <Link
        href={`/customers/${customer.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <Avatar name={customer.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-brand truncate group-hover:text-accent transition-colors">
            {customer.name}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5" dir="ltr">
            <Phone className="h-3 w-3 shrink-0" />
            {customer.phone}
          </p>
        </div>
        <Chevron className="h-4 w-4 text-gray-300 shrink-0 group-hover:text-accent transition-colors" />
      </Link>
      <a
        href={buildWhatsAppUrl(whatsappPhone, `السلام عليكم ${customer.name}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="invoice-whatsapp-btn shrink-0"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </div>
  );
}
