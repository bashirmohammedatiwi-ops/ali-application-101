"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Send,
  Save,
  MessageCircle,
  Phone,
  Package,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/action-tile";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/section-title";
import { StepIndicator } from "@/components/orders/shared/step-indicator";
import { CustomerSection } from "@/components/orders/shared/customer-section";
import { ProductFields } from "@/components/orders/shared/product-fields";
import { createOrderRequest, searchCustomers } from "@/actions/orders";
import { ORDER_SOURCES, UNITS } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { emptyProduct, type CustomerFormData } from "@/components/orders/shared/types";

const STEPS_AR = [
  { id: 1, label: "الزبون" },
  { id: 2, label: "المنتجات" },
  { id: 3, label: "مراجعة" },
];
const STEPS_EN = [
  { id: 1, label: "Customer" },
  { id: 2, label: "Products" },
  { id: 3, label: "Review" },
];

export function OrderEntryWizard({
  locale = "ar",
  initialCustomer,
}: {
  locale?: Locale;
  initialCustomer?: {
    id: string;
    name: string;
    phone: string;
    whatsapp?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    initialCustomer ? "existing" : "new"
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<
    { id: string; name: string; phone: string; city?: string | null }[]
  >(initialCustomer ? [initialCustomer] : []);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomer?.id ?? "");
  const [customer, setCustomer] = useState<CustomerFormData>({
    name: initialCustomer?.name ?? "",
    phone: initialCustomer?.phone ?? "",
    whatsapp: initialCustomer?.whatsapp ?? "",
    address: initialCustomer?.address ?? "",
    city: initialCustomer?.city ?? "",
  });
  const [source, setSource] = useState("whatsapp");
  const [requestNotes, setRequestNotes] = useState("");
  const [products, setProducts] = useState([emptyProduct()]);

  const steps = locale === "en" ? STEPS_EN : STEPS_AR;

  async function handleCustomerSearch(q: string) {
    setCustomerSearch(q);
    if (q.length < 2) {
      setCustomers(initialCustomer ? [initialCustomer] : []);
      return;
    }
    const results = await searchCustomers(q);
    setCustomers(results);
  }

  function validateStep1() {
    if (customerMode === "existing" && !selectedCustomerId) {
      setError(locale === "en" ? "Select a customer" : "اختر زبوناً");
      return false;
    }
    if (customerMode === "new" && (!customer.name.trim() || !customer.phone.trim())) {
      setError(locale === "en" ? "Name and phone required" : "الاسم والهاتف مطلوبان");
      return false;
    }
    return true;
  }

  function validateStep2() {
    const valid = products.filter((p) => p.productNameAr.trim());
    if (!valid.length) {
      setError(locale === "en" ? "Add at least one product" : "أضف منتجاً واحداً على الأقل");
      return false;
    }
    return true;
  }

  function nextStep() {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit(sendToPricing: boolean) {
    setError("");
    if (!validateStep1() || !validateStep2()) return;

    startTransition(async () => {
      try {
        const validProducts = products.filter((p) => p.productNameAr.trim());
        await createOrderRequest({
          customerId: customerMode === "existing" ? selectedCustomerId : undefined,
          newCustomer:
            customerMode === "new"
              ? {
                  name: customer.name,
                  phone: customer.phone,
                  whatsapp: customer.whatsapp || undefined,
                  address: customer.address || undefined,
                  city: customer.city || undefined,
                }
              : undefined,
          notes: requestNotes || undefined,
          source,
          sendToPricing,
          products: validProducts.map((p) => ({
            productNameAr: p.productNameAr,
            quantity: parseFloat(p.quantity) || 0,
            unit: p.unit,
            productLink: p.productLink || undefined,
            notesAr: p.notesAr || undefined,
            priority: p.priority,
            imageUrls: p.imageUrls,
            specs: {
              color: p.color || undefined,
              size: p.size || undefined,
              model: p.model || undefined,
            },
          })),
        });
        toast(
          sendToPricing
            ? locale === "en"
              ? "Sent to pricing!"
              : "تم الإرسال للتسعير!"
            : t("success", locale)
        );
        router.push("/orders");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("error", locale);
        setError(msg);
        toast(t("error", locale), "error");
      }
    });
  }

  const selectedCustomer =
    customerMode === "existing"
      ? customers.find((c) => c.id === selectedCustomerId)
      : null;

  const validProducts = products.filter((p) => p.productNameAr.trim());

  return (
    <div className="pb-28">
      <StepIndicator steps={steps} current={step} />

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <SectionCard
            title={t("customerInfo", locale)}
            subtitle={locale === "en" ? "Select or create customer" : "اختر زبوناً أو أنشئ جديداً"}
            icon={<User className="h-5 w-5" />}
          >
            <CustomerSection
              locale={locale}
              mode={customerMode}
              onModeChange={setCustomerMode}
              customer={customer}
              onCustomerChange={(p) => setCustomer({ ...customer, ...p })}
              searchQuery={customerSearch}
              onSearchChange={handleCustomerSearch}
              searchResults={customers}
              selectedId={selectedCustomerId}
              onSelect={setSelectedCustomerId}
            />
          </SectionCard>

          <SectionCard
            title={t("source", locale)}
            icon={<MessageCircle className="h-5 w-5" />}
          >
            <div className="grid grid-cols-3 gap-3">
              {ORDER_SOURCES.map((s) => {
                const Icon = s.value === "whatsapp" ? MessageCircle : s.value === "call" ? Phone : Package;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSource(s.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 rounded-2xl text-xs font-semibold transition-all active:scale-[0.98]",
                      source === s.value
                        ? "bg-accent text-white shadow-md shadow-accent/25"
                        : "bg-[var(--field-bg)] text-gray-500 hover:bg-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {locale === "en" ? s.labelEn : s.labelAr}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-brand">{t("orderInfo", locale)}</h2>
            <span className="text-xs font-bold text-accent bg-accent-light px-3 py-1.5 rounded-full">
              {products.length} {locale === "en" ? "items" : "منتج"}
            </span>
          </div>

          {products.map((product, index) => (
            <ProductFields
              key={product.id}
              product={product}
              index={index}
              locale={locale}
              onChange={(patch) =>
                setProducts((prev) =>
                  prev.map((p) => (p.id === product.id ? { ...p, ...patch } : p))
                )
              }
              onRemove={() =>
                setProducts((prev) => prev.filter((p) => p.id !== product.id))
              }
              canRemove={products.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={() => setProducts((prev) => [...prev, emptyProduct()])}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-accent/30 text-accent font-semibold text-sm bg-accent-light/30 hover:bg-accent-light transition-colors active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            {t("addProduct", locale)}
          </button>

          <Textarea
            label={t("requestNotes", locale)}
            value={requestNotes}
            onChange={(e) => setRequestNotes(e.target.value)}
            rows={2}
            placeholder={locale === "en" ? "General notes for this request..." : "ملاحظات عامة على الطلب..."}
          />
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <SectionTitle
            title={locale === "en" ? "Review Order" : "مراجعة الطلب"}
          />

          <SectionCard
            title={t("customer", locale)}
            icon={<User className="h-5 w-5" />}
          >
            <p className="font-bold text-brand text-lg">
              {customerMode === "existing" ? selectedCustomer?.name : customer.name}
            </p>
            <p className="text-sm text-gray-400 mt-1" dir="ltr">
              {customerMode === "existing" ? selectedCustomer?.phone : customer.phone}
            </p>
          </SectionCard>

          <div className="space-y-3">
            {validProducts.map((p, i) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white border border-border p-4 card-elevated"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                      {locale === "en" ? `Product ${i + 1}` : `منتج ${i + 1}`}
                      {p.priority === "URGENT" && (
                        <span className="text-red-500 normal-case ms-2">
                          · {locale === "en" ? "URGENT" : "عاجل"}
                        </span>
                      )}
                    </p>
                    <p className="font-bold text-brand">{p.productNameAr}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {p.quantity} {UNITS[p.unit][locale === "en" ? "en" : "ar"]}
                      {p.imageUrls.length > 0 &&
                        ` · ${p.imageUrls.length} ${locale === "en" ? "photos" : "صور"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-accent font-bold shrink-0 px-3 py-1.5 rounded-full bg-accent-light"
                  >
                    {t("edit", locale)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {requestNotes && (
            <div className="rounded-2xl bg-[var(--field-bg)] p-4">
              <p className="text-xs font-bold text-gray-400 mb-1.5">
                {t("requestNotes", locale)}
              </p>
              <p className="text-sm text-gray-700">{requestNotes}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StickyActionBar>
        {step === 3 ? (
          <>
            <Button fullWidth size="lg" disabled={pending} onClick={() => handleSubmit(true)}>
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {t("sendToPricing", locale)}
                </>
              )}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              disabled={pending}
              onClick={() => handleSubmit(false)}
            >
              <Save className="h-4 w-4" />
              {t("save", locale)}
            </Button>
          </>
        ) : (
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" size="lg" onClick={prevStep} className="px-5">
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
            <Button fullWidth size="lg" onClick={nextStep}>
              {locale === "en" ? "Next" : "التالي"}
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        )}
      </StickyActionBar>
    </div>
  );
}
