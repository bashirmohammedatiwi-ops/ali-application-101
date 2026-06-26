"use client";

import { User, UserPlus, Search, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/action-tile";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n";
import type { CustomerFormData } from "./types";

type ExistingCustomer = { id: string; name: string; phone: string; city?: string | null };

export function CustomerSection({
  locale,
  mode,
  onModeChange,
  customer,
  onCustomerChange,
  searchQuery,
  onSearchChange,
  searchResults,
  selectedId,
  onSelect,
}: {
  locale: Locale;
  mode: "existing" | "new";
  onModeChange: (mode: "existing" | "new") => void;
  customer: CustomerFormData;
  onCustomerChange: (patch: Partial<CustomerFormData>) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: ExistingCustomer[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="segmented">
        <button
          type="button"
          onClick={() => onModeChange("new")}
          className={cn("segmented-btn", mode === "new" && "segmented-btn-active")}
        >
          <UserPlus className="h-4 w-4" />
          {t("newCustomer", locale)}
        </button>
        <button
          type="button"
          onClick={() => onModeChange("existing")}
          className={cn("segmented-btn", mode === "existing" && "segmented-btn-active")}
        >
          <User className="h-4 w-4" />
          {t("existingCustomer", locale)}
        </button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder={t("searchPlaceholder", locale)}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="field-input ps-11"
            />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto -mx-1 px-1">
            {searchResults.length === 0 && searchQuery.length >= 2 && (
              <p className="text-center text-sm text-gray-400 py-8">{t("noResults", locale)}</p>
            )}
            {searchResults.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-start rounded-2xl p-4 transition-all active:scale-[0.99] border-2",
                  selectedId === c.id
                    ? "border-accent bg-accent-light shadow-sm shadow-accent/10"
                    : "border-transparent bg-[var(--field-bg)] hover:bg-white hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-bold text-brand truncate">{c.name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5" dir="ltr">
                      <Phone className="h-3 w-3 shrink-0" />
                      {c.phone}
                    </p>
                    {c.city && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {c.city}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label={t("customerName", locale)}
            value={customer.name}
            onChange={(e) => onCustomerChange({ name: e.target.value })}
            required
            placeholder={locale === "en" ? "Customer full name" : "الاسم الكامل"}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("customerPhone", locale)}
              value={customer.phone}
              onChange={(e) => onCustomerChange({ phone: e.target.value })}
              required
              dir="ltr"
              type="tel"
            />
            <Input
              label={t("customerWhatsapp", locale)}
              value={customer.whatsapp}
              onChange={(e) => onCustomerChange({ whatsapp: e.target.value })}
              dir="ltr"
              type="tel"
            />
          </div>
          <Input
            label={t("customerAddress", locale)}
            value={customer.address}
            onChange={(e) => onCustomerChange({ address: e.target.value })}
            placeholder={locale === "en" ? "Full address" : "العنوان الكامل"}
          />
          <Input
            label={t("customerCity", locale)}
            value={customer.city}
            onChange={(e) => onCustomerChange({ city: e.target.value })}
            placeholder={locale === "en" ? "City" : "المدينة"}
          />
        </div>
      )}
    </div>
  );
}
