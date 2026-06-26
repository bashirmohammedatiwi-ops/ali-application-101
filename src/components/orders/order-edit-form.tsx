"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/action-tile";
import { PageHeader } from "@/components/ui/page-header";
import { ProductFields } from "@/components/orders/shared/product-fields";
import { updateOrderItem } from "@/actions/orders";
import { parseSpecs } from "@/lib/specs";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { OrderItem, OrderImage } from "@/generated/prisma/client";
import type { ProductFormData } from "@/components/orders/shared/types";

type EditableItem = OrderItem & { images: OrderImage[] };

function itemToProduct(item: EditableItem): ProductFormData {
  const specs = parseSpecs(item.specsJson);
  return {
    id: item.id,
    productNameAr: item.productNameAr,
    quantity: String(item.quantity),
    unit: item.unit,
    productLink: item.productLink ?? "",
    notesAr: item.notesAr ?? "",
    priority: item.priority,
    imageUrls: item.images.map((i) => i.url),
    color: specs.color ?? "",
    size: specs.size ?? "",
    model: specs.model ?? "",
  };
}

export function OrderEditForm({
  item,
  locale,
  returnTo,
}: {
  item: EditableItem;
  locale: Locale;
  returnTo?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [product, setProduct] = useState(() => itemToProduct(item));
  const [error, setError] = useState("");

  const backHref = returnTo ?? `/orders/${item.id}`;

  function handleSave() {
    if (!product.productNameAr.trim()) {
      setError(locale === "en" ? "Product name required" : "اسم المنتج مطلوب");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await updateOrderItem(item.id, {
          productNameAr: product.productNameAr,
          quantity: parseFloat(product.quantity) || 0,
          unit: product.unit,
          productLink: product.productLink || undefined,
          notesAr: product.notesAr || undefined,
          priority: product.priority,
          imageUrls: product.imageUrls,
          specs: {
            color: product.color || undefined,
            size: product.size || undefined,
            model: product.model || undefined,
          },
        });
        toast(t("success", locale));
        router.push(backHref);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("error", locale);
        setError(msg === "CANNOT_EDIT" ? (locale === "en" ? "Cannot edit this order" : "لا يمكن تعديل هذا الطلب") : t("error", locale));
        toast(t("error", locale), "error");
      }
    });
  }

  const BackChevron = locale === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div className="page-container page-with-sticky-bar">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand -mb-2"
      >
        <BackChevron className="h-4 w-4" />
        {item.status === "ARCHIVED"
          ? locale === "en"
            ? "Back to archive"
            : "العودة للأرشيف"
          : locale === "en"
            ? "Back to order"
            : "العودة للطلب"}
      </Link>

      <PageHeader title={t("edit", locale)} subtitle={item.refNumber} />

      {item.status === "PRICING" && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-sm text-amber-800 -mt-2">
          {locale === "en"
            ? "Order is being priced — changes will appear to the pricer."
            : "الطلب قيد التسعير — التعديلات ستظهر للمسعّر."}
        </div>
      )}

      {item.status === "ARCHIVED" && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200/80 px-4 py-3 text-sm text-blue-800 -mt-2">
          {locale === "en"
            ? "Archived order — save changes, then re-send for pricing if needed."
            : "طلب مؤرشف — احفظ التعديلات ثم أعد إرساله للتسعير إن لزم."}
        </div>
      )}

      <ProductFields
        product={product}
        index={0}
        locale={locale}
        onChange={(patch) => setProduct({ ...product, ...patch })}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StickyActionBar>
        <Button fullWidth size="lg" disabled={pending} onClick={handleSave}>
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-5 w-5" />
              {t("save", locale)}
            </>
          )}
        </Button>
      </StickyActionBar>
    </div>
  );
}
