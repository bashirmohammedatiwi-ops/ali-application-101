"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Zap } from "lucide-react";
import { ListActionRow } from "@/components/ui/action-tile";
import { bulkSendReceivedToPricing } from "@/actions/orders";
import { useToast } from "@/components/ui/toast";
import { t, type Locale } from "@/lib/i18n";

export function BulkSendToPricingButton({
  count,
  locale,
}: {
  count: number;
  locale: Locale;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (count === 0) return null;

  return (
    <ListActionRow
      icon={pending ? Loader2 : Zap}
      label={locale === "en" ? `Send ${count} to Pricing` : `إرسال ${count} للتسعير`}
      sublabel={
        locale === "en"
          ? "Bulk action for received orders"
          : "إجراء جماعي للطلبات المستلمة"
      }
      trailingIcon={Send}
      variant="accent"
      pending={pending}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const sent = await bulkSendReceivedToPricing();
            toast(
              locale === "en"
                ? `${sent} orders sent to pricing`
                : `تم إرسال ${sent} طلب للتسعير`
            );
            router.refresh();
          } catch {
            toast(t("error", locale), "error");
          }
        })
      }
    />
  );
}
