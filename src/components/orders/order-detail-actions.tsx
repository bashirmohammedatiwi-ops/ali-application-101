"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/action-tile";
import { sendToPricing } from "@/actions/orders";
import { hasPermission } from "@/lib/permissions";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { Role, OrderStatus } from "@/generated/prisma/client";
import { Loader2, Send } from "lucide-react";

export function OrderDetailActions({
  item,
  locale,
  role,
}: {
  item: { id: string; status: OrderStatus };
  locale: Locale;
  role: Role;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (item.status !== "RECEIVED" || !hasPermission(role, "send_to_pricing")) {
    return null;
  }

  return (
    <>
      <div className="rounded-2xl bg-accent-light/50 border border-accent/15 p-4 mb-36">
        <p className="text-xs text-gray-500">
          {locale === "en"
            ? "Ready to send this order to the pricing team?"
            : "جاهز لإرسال هذا الطلب لفريق التسعير؟"}
        </p>
      </div>
      <StickyActionBar>
        <Button
          fullWidth
          size="lg"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await sendToPricing(item.id);
                toast(t("success", locale));
                router.refresh();
              } catch {
                toast(t("error", locale), "error");
              }
            })
          }
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5" />
              {t("sendToPricing", locale)}
            </>
          )}
        </Button>
      </StickyActionBar>
    </>
  );
}
