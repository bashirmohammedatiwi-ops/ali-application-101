"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/card";
import { StickyActionBar } from "@/components/ui/action-tile";
import { updateCustomer } from "@/actions/orders";
import { useToast } from "@/components/ui/toast";
import { t, type Locale } from "@/lib/i18n";
import type { Customer } from "@/generated/prisma/client";

export function EditCustomerForm({
  customer,
  locale,
}: {
  customer: Customer;
  locale: Locale;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone,
    whatsapp: customer.whatsapp ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    notes: customer.notes ?? "",
  });

  function handleSave() {
    startTransition(async () => {
      try {
        await updateCustomer(customer.id, {
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsapp || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          notes: form.notes || undefined,
        });
        toast(t("success", locale));
        setOpen(false);
        router.refresh();
      } catch {
        toast(t("error", locale), "error");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" fullWidth onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        {t("edit", locale)}
      </Button>
    );
  }

  return (
    <>
      <SectionCard
        title={t("edit", locale)}
        icon={<Pencil className="h-5 w-5" />}
        className="mb-36"
      >
        <div className="space-y-4">
          <Input
            label={t("customerName", locale)}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("customerPhone", locale)}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              dir="ltr"
            />
            <Input
              label={t("customerWhatsapp", locale)}
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              dir="ltr"
            />
          </div>
          <Input
            label={t("customerAddress", locale)}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            label={t("customerCity", locale)}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Textarea
            label={t("notes", locale)}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>
      </SectionCard>

      <StickyActionBar>
        <Button fullWidth size="lg" disabled={pending} onClick={handleSave}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : t("save", locale)}
        </Button>
        <Button fullWidth variant="secondary" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
          {t("cancel", locale)}
        </Button>
      </StickyActionBar>
    </>
  );
}
