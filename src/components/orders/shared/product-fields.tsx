"use client";

import { ChevronDown, Trash2, Package, Link2, StickyNote, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/orders/image-uploader";
import { UNITS } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ProductFormData } from "./types";
import type { Unit } from "@/generated/prisma/client";
import { useState } from "react";

function AccordionSection({
  icon: Icon,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-[var(--field-bg)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/60 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-brand">
          <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <Icon className="h-4 w-4 text-accent" />
          </span>
          {title}
          {badge && (
            <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/80">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProductFields({
  product,
  index,
  locale,
  onChange,
  onRemove,
  canRemove,
}: {
  product: ProductFormData;
  index: number;
  locale: Locale;
  onChange: (patch: Partial<ProductFormData>) => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  const [openSpecs, setOpenSpecs] = useState(false);
  const [openPhotos, setOpenPhotos] = useState(true);
  const [openLink, setOpenLink] = useState(!!product.productLink);
  const [openNotes, setOpenNotes] = useState(!!product.notesAr);

  const unitOptions = Object.entries(UNITS).map(([value, labels]) => ({
    value,
    label: locale === "en" ? labels.en : labels.ar,
  }));

  const isUrgent = product.priority === "URGENT";

  return (
    <div
      className={cn(
        "section-card",
        isUrgent && "ring-2 ring-red-200 ring-offset-2"
      )}
    >
      <div className="section-card-header">
        <div className="section-card-icon">
          <Package className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-brand">
            {locale === "en" ? `Product ${index + 1}` : `منتج ${index + 1}`}
          </p>
          {product.productNameAr && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{product.productNameAr}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChange({ priority: isUrgent ? "NORMAL" : "URGENT" })}
            className={cn(
              "text-[11px] font-bold px-3 py-1.5 rounded-full transition-all",
              isUrgent
                ? "bg-red-500 text-white shadow-sm shadow-red-500/30"
                : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
            )}
          >
            {isUrgent ? (locale === "en" ? "URGENT" : "عاجل") : (locale === "en" ? "Normal" : "عادي")}
          </button>
          {canRemove && onRemove && (
            <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      </div>

      <div className="section-card-body space-y-4">
        <Input
          label={t("productName", locale)}
          value={product.productNameAr}
          onChange={(e) => onChange({ productNameAr: e.target.value })}
          required
          placeholder={locale === "en" ? "e.g. LED Strip 5050" : "مثال: شريط LED 5050"}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("quantity", locale)}
            type="number"
            min="0"
            step="any"
            value={product.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
            required
            dir="ltr"
            placeholder="0"
          />
          <Select
            label={t("unit", locale)}
            value={product.unit}
            onChange={(e) => onChange({ unit: e.target.value as Unit })}
            options={unitOptions}
          />
        </div>

        <AccordionSection
          icon={Camera}
          title={t("photos", locale)}
          badge={product.imageUrls.length ? String(product.imageUrls.length) : undefined}
          open={openPhotos}
          onToggle={() => setOpenPhotos(!openPhotos)}
        >
          <ImageUploader
            images={product.imageUrls}
            onChange={(urls) => onChange({ imageUrls: urls })}
            locale={locale}
          />
        </AccordionSection>

        <AccordionSection
          icon={Link2}
          title={t("productLink", locale)}
          open={openLink}
          onToggle={() => setOpenLink(!openLink)}
        >
          <Input
            value={product.productLink}
            onChange={(e) => onChange({ productLink: e.target.value })}
            dir="ltr"
            type="url"
            placeholder="https://1688.com/..."
          />
        </AccordionSection>

        <AccordionSection
          icon={Package}
          title={locale === "en" ? "Specifications" : "المواصفات"}
          open={openSpecs}
          onToggle={() => setOpenSpecs(!openSpecs)}
        >
          <div className="grid grid-cols-3 gap-3">
            <Input
              label={locale === "en" ? "Color" : "اللون"}
              value={product.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
            <Input
              label={locale === "en" ? "Size" : "المقاس"}
              value={product.size}
              onChange={(e) => onChange({ size: e.target.value })}
            />
            <Input
              label={locale === "en" ? "Model" : "الموديل"}
              value={product.model}
              onChange={(e) => onChange({ model: e.target.value })}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          icon={StickyNote}
          title={t("notes", locale)}
          open={openNotes}
          onToggle={() => setOpenNotes(!openNotes)}
        >
          <Textarea
            value={product.notesAr}
            onChange={(e) => onChange({ notesAr: e.target.value })}
            rows={3}
            placeholder={locale === "en" ? "Additional details..." : "تفاصيل إضافية..."}
          />
        </AccordionSection>
      </div>
    </div>
  );
}
