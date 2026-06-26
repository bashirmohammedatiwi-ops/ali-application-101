"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  DollarSign,
  RotateCcw,
  AlertTriangle,
  Images,
  Pencil,
  Scale,
  Box,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { ImageGallery } from "@/components/ui/image-gallery";
import { getRepricingNote, RepricingNoteBanner } from "@/components/pricing/repricing-note";
import { PricingProductHeader } from "@/components/pricing/pricing-product-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SectionCard } from "@/components/ui/card";
import { StickyActionBar } from "@/components/ui/action-tile";
import { submitPricing, returnToReceived, retranslateOrderItem } from "@/actions/orders";
import { AVAILABILITY_OPTIONS, RETURN_REASONS } from "@/lib/constants";
import { containsArabic } from "@/lib/translation";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { Availability, OrderItem, OrderImage } from "@/generated/prisma/client";
import { calculateCbm, formatCurrency } from "@/lib/utils";

type PricingItem = OrderItem & {
  images: OrderImage[];
  request: { customer: { name: string } };
  statusHistory: {
    fromStatus: OrderItem["status"] | null;
    toStatus: OrderItem["status"];
    reason: string | null;
    createdAt: Date;
    changedBy: { name: string };
  }[];
};

export function PricingForm({
  item,
  locale = "en",
  canEditDetails = false,
}: {
  item: PricingItem;
  locale?: Locale;
  canEditDetails?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS.en[0]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    unitPrice: "",
    internalShipping: "",
    weightKg: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    volumeCbm: "",
    moq: "",
    leadTimeDays: "",
    pricerNotes: "",
    available: "YES" as Availability,
    alternativeLink: "",
    currency: "USD",
  });

  const computedCbm =
    calculateCbm(
      parseFloat(form.lengthCm) || undefined,
      parseFloat(form.widthCm) || undefined,
      parseFloat(form.heightCm) || undefined
    ) ?? undefined;

  const unitPriceNum = parseFloat(form.unitPrice) || 0;
  const shippingNum = parseFloat(form.internalShipping) || 0;
  const previewSubtotal = unitPriceNum * item.quantity;
  const previewTotal = previewSubtotal + shippingNum;

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        await submitPricing(item.id, {
          unitPrice: unitPriceNum,
          internalShipping: shippingNum,
          weightKg: parseFloat(form.weightKg) || undefined,
          lengthCm: parseFloat(form.lengthCm) || undefined,
          widthCm: parseFloat(form.widthCm) || undefined,
          heightCm: parseFloat(form.heightCm) || undefined,
          volumeCbm: parseFloat(form.volumeCbm) || computedCbm,
          moq: parseFloat(form.moq) || undefined,
          leadTimeDays: parseInt(form.leadTimeDays) || undefined,
          pricerNotes: form.pricerNotes || undefined,
          available: form.available,
          alternativeLink: form.alternativeLink || undefined,
          currency: form.currency,
        });
        toast(t("success", locale));
        router.push("/pricing");
        router.refresh();
      } catch {
        toast(t("error", locale), "error");
      }
    });
  }

  function handleReturn() {
    startTransition(async () => {
      await returnToReceived(item.id, returnReason);
      router.push("/pricing");
      router.refresh();
    });
  }

  const availabilityOptions = Object.entries(AVAILABILITY_OPTIONS).map(
    ([value, labels]) => ({
      value,
      label: locale === "en" ? labels.en : labels.ar,
    })
  );

  const repricingNote = getRepricingNote(item.statusHistory);
  const translationMissing =
    !item.productNameEn?.trim() ||
    containsArabic(item.productNameEn) ||
    item.productNameEn.trim() === item.productNameAr.trim();

  function handleRetranslate() {
    startTransition(async () => {
      try {
        await retranslateOrderItem(item.id);
        toast(locale === "en" ? "Translation updated" : "تم تحديث الترجمة");
        router.refresh();
      } catch {
        toast(t("error", locale), "error");
      }
    });
  }

  return (
    <div className="page-container -mt-2">
      <PricingProductHeader
        item={item}
        locale={locale}
        onRetranslate={handleRetranslate}
        retranslatePending={pending}
      />

      {repricingNote && <RepricingNoteBanner note={repricingNote} locale={locale} />}

      {canEditDetails && (
        <Link href={`/orders/${item.id}/edit`}>
          <Button fullWidth variant="secondary">
            <Pencil className="h-4 w-4" />
            {t("editOrderDetails", locale)}
          </Button>
        </Link>
      )}

      {translationMissing && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            {locale === "en"
              ? "Translation may be incomplete. Tap translate above."
              : "الترجمة قد تكون غير مكتملة. اضغط زر الترجمة أعلاه."}
          </p>
        </div>
      )}

      {item.notesEn && (
        <SectionCard
          title={locale === "en" ? "Order Notes" : "ملاحظات الطلب"}
          icon={<StickyNote className="h-5 w-5" />}
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" dir="ltr">
            {item.notesEn}
          </p>
        </SectionCard>
      )}

      {item.images.length > 0 && (
        <SectionCard title={t("photos", locale)} icon={<Images className="h-5 w-5" />}>
          <ImageGallery images={item.images} locale={locale} size="lg" />
        </SectionCard>
      )}

      {unitPriceNum > 0 && (
        <div className="pricer-live-preview">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
              {locale === "en" ? "Live Preview" : "معاينة فورية"}
            </p>
            <p className="text-2xl font-black text-accent tabular-nums mt-0.5">
              {formatCurrency(previewTotal, form.currency)}
            </p>
          </div>
          <div className="text-end text-xs text-gray-400 space-y-0.5">
            <p>
              {locale === "en" ? "Subtotal" : "المجموع"}:{" "}
              <span className="font-semibold text-brand tabular-nums">
                {formatCurrency(previewSubtotal, form.currency)}
              </span>
            </p>
            <p>
              {t("internalShipping", locale)}:{" "}
              <span className="font-semibold text-brand tabular-nums">
                {formatCurrency(shippingNum, form.currency)}
              </span>
            </p>
          </div>
        </div>
      )}

      <SectionCard
        title={locale === "en" ? "Price & Currency" : "السعر والعملة"}
        icon={<DollarSign className="h-5 w-5" />}
        className="pricer-form-section"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("unitPrice", locale)}
              type="number"
              step="any"
              min="0"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              required
              dir="ltr"
            />
            <Select
              label={t("currency", locale)}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "CNY", label: "CNY (¥)" },
              ]}
            />
          </div>
          <Input
            label={t("internalShipping", locale)}
            type="number"
            step="any"
            min="0"
            value={form.internalShipping}
            onChange={(e) => setForm({ ...form, internalShipping: e.target.value })}
            dir="ltr"
          />
          <Select
            label={t("available", locale)}
            value={form.available}
            onChange={(e) =>
              setForm({ ...form, available: e.target.value as Availability })
            }
            options={availabilityOptions}
          />
          {form.available === "ALTERNATIVE" && (
            <Input
              label={t("alternativeLink", locale)}
              value={form.alternativeLink}
              onChange={(e) => setForm({ ...form, alternativeLink: e.target.value })}
              dir="ltr"
            />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={locale === "en" ? "Shipping & Specs" : "الشحن والمواصفات"}
        icon={<Scale className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <Input
            label={`${t("weight", locale)} (kg)`}
            type="number"
            step="any"
            min="0"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            dir="ltr"
          />
          <p className="field-label">{t("dimensions", locale)} (cm)</p>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("length", locale)}
              type="number"
              value={form.lengthCm}
              onChange={(e) => setForm({ ...form, lengthCm: e.target.value })}
              dir="ltr"
            />
            <Input
              label={t("width", locale)}
              type="number"
              value={form.widthCm}
              onChange={(e) => setForm({ ...form, widthCm: e.target.value })}
              dir="ltr"
            />
            <Input
              label={t("height", locale)}
              type="number"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              dir="ltr"
            />
          </div>
          <Input
            label={`${t("volume", locale)} (cbm)`}
            type="number"
            step="any"
            value={form.volumeCbm || (computedCbm ? String(computedCbm.toFixed(4)) : "")}
            onChange={(e) => setForm({ ...form, volumeCbm: e.target.value })}
            dir="ltr"
            placeholder={computedCbm ? `Auto: ${computedCbm.toFixed(4)}` : ""}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("moq", locale)}
              type="number"
              min="0"
              value={form.moq}
              onChange={(e) => setForm({ ...form, moq: e.target.value })}
              dir="ltr"
            />
            <Input
              label={t("leadTime", locale)}
              type="number"
              min="0"
              value={form.leadTimeDays}
              onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t("pricerNotes", locale)}
        icon={<Box className="h-5 w-5" />}
      >
        <Textarea
          label={locale === "en" ? "Notes for the team" : "ملاحظات للفريق"}
          value={form.pricerNotes}
          onChange={(e) => setForm({ ...form, pricerNotes: e.target.value })}
          rows={3}
        />
      </SectionCard>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showReturn && (
        <SectionCard
          title={t("returnForCorrection", locale)}
          icon={<RotateCcw className="h-5 w-5" />}
        >
          <Select
            label={t("reason", locale)}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            options={RETURN_REASONS.en.map((r) => ({ value: r, label: r }))}
          />
          <Button
            fullWidth
            variant="danger"
            className="mt-4"
            disabled={pending}
            onClick={handleReturn}
          >
            {t("confirm", locale)}
          </Button>
        </SectionCard>
      )}

      <StickyActionBar>
        <Button fullWidth size="lg" disabled={pending || !unitPriceNum} onClick={handleSubmit}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : t("markPriced", locale)}
        </Button>
        <Button
          fullWidth
          variant="outline"
          disabled={pending}
          onClick={() => setShowReturn(!showReturn)}
        >
          <RotateCcw className="h-4 w-4" />
          {t("returnForCorrection", locale)}
        </Button>
      </StickyActionBar>
    </div>
  );
}
