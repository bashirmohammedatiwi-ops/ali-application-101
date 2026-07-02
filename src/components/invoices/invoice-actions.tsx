"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Download,
  Check,
  Loader2,
  RotateCcw,
  MessageCircle,
  Archive,
  ArrowRightLeft,
  Send,
  Percent,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionCard } from "@/components/ui/card";
import { ActionTile, StickyActionBar } from "@/components/ui/action-tile";
import { SectionTitle } from "@/components/ui/section-title";
import {
  notifyAndArchive,
  returnToPricing,
  returnFromArchive,
  updateInvoiceMarkup,
  convertInvoiceToUsd,
} from "@/actions/orders";
import { UNITS } from "@/lib/constants";
import { openInvoicePdf } from "@/lib/open-invoice-pdf";
import { buildWhatsAppMessage, formatCurrency } from "@/lib/utils";
import { calculateMarkupAmount, formatMarkupPercent } from "@/lib/markup";
import { cnyToUsd, usdToIqd, iqdToUsd, CURRENCIES, CURRENCY_LABELS, normalizeCurrency, type AppCurrency } from "@/lib/currency";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import type { OrderItem, Invoice, Customer, OrderImage } from "@/generated/prisma/client";
import { hasPermission, canEditOrder, canReturnToPricing } from "@/lib/permissions";
import type { Role } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type InvoiceItem = OrderItem & {
  images: OrderImage[];
  invoice: Invoice | null;
  request: { customer: Customer };
};

function ReceiptLine({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className={cn("invoice-receipt-line", bold && "invoice-receipt-line--bold")}>
      <span className={cn("text-sm", accent ? "text-accent font-semibold" : "text-gray-500")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums",
          bold ? "font-black text-brand text-base" : accent ? "font-bold text-accent" : "font-semibold text-brand"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function InvoiceActions({
  item,
  locale,
  role,
  usdToCnyRate,
  usdToIqdRate,
}: {
  item: InvoiceItem;
  locale: Locale;
  role: Role;
  usdToCnyRate: number;
  usdToIqdRate: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [markup, setMarkup] = useState(String(item.invoice?.markup ?? 0));
  const [returnOpen, setReturnOpen] = useState(false);
  const [repricingOpen, setRepricingOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfCurrency, setPdfCurrency] = useState<AppCurrency>(
    normalizeCurrency(item.currency)
  );

  useEffect(() => {
    setPdfCurrency(normalizeCurrency(item.currency));
  }, [item.currency]);

  const invoice = item.invoice;
  const unitLabel = UNITS[item.unit][locale === "en" ? "en" : "ar"];
  const customer = item.request.customer;
  const whatsappPhone = customer.whatsapp || customer.phone;
  const isCny = item.currency === "CNY";
  const isUsd = item.currency === "USD";
  const isIqd = item.currency === "IQD";

  function getWhatsAppMessage() {
    if (!invoice || !item.unitPrice) return "";
    return buildWhatsAppMessage({
      customerName: customer.name,
      productNameAr: item.productNameAr,
      quantity: item.quantity,
      unitLabel,
      unitPrice: item.unitPrice,
      grandTotal: invoice.grandTotal,
      currency: item.currency,
      weightKg: item.weightKg,
      volumeCbm: item.volumeCbm,
      moq: item.moq,
      invoiceNumber: invoice.invoiceNumber,
    });
  }

  function copyWhatsApp() {
    const msg = getWhatsAppMessage();
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    toast(t("success", locale));
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp() {
    const msg = getWhatsAppMessage();
    if (!msg) return;
    window.open(buildWhatsAppUrl(whatsappPhone, msg), "_blank");
  }

  function handleOpenPdf() {
    if (!invoice || pdfLoading) return;
    setPdfLoading(true);
    openInvoicePdf(invoice.id, invoice.invoiceNumber, invoice.updatedAt, pdfCurrency)
      .catch(() => toast(t("error", locale), "error"))
      .finally(() => setPdfLoading(false));
  }

  function handleArchive() {
    startTransition(async () => {
      await notifyAndArchive(item.id);
      toast(t("success", locale));
      router.push("/archive");
      router.refresh();
    });
  }

  function handleRepricing() {
    startTransition(async () => {
      await returnToPricing(item.id, returnReason || t("resendForPricing", locale));
      setRepricingOpen(false);
      router.push("/pricing");
      router.refresh();
    });
  }

  function handleReturnToPriced() {
    startTransition(async () => {
      await returnFromArchive(item.id, returnReason || t("returnToPriced", locale));
      setReturnOpen(false);
      router.push("/invoices");
      router.refresh();
    });
  }

  function handleMarkupUpdate() {
    if (!invoice) return;
    startTransition(async () => {
      await updateInvoiceMarkup(invoice.id, parseFloat(markup) || 0);
      router.refresh();
    });
  }

  function handleConvertToUsd() {
    if (!invoice) return;
    startTransition(async () => {
      try {
        await convertInvoiceToUsd(invoice.id);
        toast(t("success", locale));
        router.refresh();
      } catch {
        toast(t("error", locale), "error");
      }
    });
  }

  if (!invoice) return null;

  const markupAmount = calculateMarkupAmount(invoice.subtotal, invoice.shipping, invoice.markup);
  const usdEquivalent = isCny ? cnyToUsd(invoice.grandTotal, usdToCnyRate) : null;
  const iqdEquivalent =
    isUsd
      ? usdToIqd(invoice.grandTotal, usdToIqdRate)
      : isCny && usdEquivalent != null
        ? usdToIqd(usdEquivalent, usdToIqdRate)
        : null;
  const usdFromIqd = isIqd ? iqdToUsd(invoice.grandTotal, usdToIqdRate) : null;

  const canArchive = item.status === "PRICED" && hasPermission(role, "archive_order");
  const canEdit = canEditOrder(role, item.status);
  const canRepricing = canReturnToPricing(role, item.status);
  const canReturnToPriced =
    item.status === "ARCHIVED" && hasPermission(role, "return_from_archived");
  const canConvert =
    isCny && hasPermission(role, "edit_markup") && item.status === "PRICED";

  return (
    <div className={canArchive ? "space-y-5" : "space-y-5 pb-4"}>
      {/* Receipt breakdown */}
      <div className="invoice-receipt">
        <div className="invoice-receipt-header">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {locale === "en" ? "Price Breakdown" : "تفصيل الأسعار"}
          </p>
        </div>
        <div className="invoice-receipt-body">
          <ReceiptLine
            label={`${item.quantity} ${unitLabel} × ${formatCurrency(item.unitPrice ?? 0, item.currency)}`}
            value={formatCurrency(invoice.subtotal, item.currency)}
          />
          <ReceiptLine
            label={t("internalShipping", locale)}
            value={formatCurrency(invoice.shipping, item.currency)}
          />
          {invoice.markup > 0 && (
            <ReceiptLine
              label={
                locale === "en"
                  ? `Markup ${formatMarkupPercent(invoice.markup)}`
                  : `هامش ${formatMarkupPercent(invoice.markup)}`
              }
              value={formatCurrency(markupAmount, item.currency)}
              accent
            />
          )}
          <div className="invoice-receipt-divider" />
          <ReceiptLine
            label={t("grandTotal", locale)}
            value={formatCurrency(invoice.grandTotal, item.currency)}
            bold
          />
        </div>

        {hasPermission(role, "edit_markup") && (
          <div className="px-4 pb-4 pt-1 border-t border-dashed border-border">
            <div className="flex gap-3 items-end">
              <Input
                label={t("markup", locale)}
                hint={t("markupHint", locale)}
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                dir="ltr"
                className="flex-1"
              />
              <Button size="sm" variant="secondary" onClick={handleMarkupUpdate} disabled={pending}>
                <Percent className="h-3.5 w-3.5" />
                {t("save", locale)}
              </Button>
            </div>
          </div>
        )}

        {usdEquivalent != null && (
          <div className="mx-4 mb-4 rounded-2xl bg-accent-light/60 border border-accent/15 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500">{t("cnyEquivalent", locale)}</p>
                <p className="text-xl font-black text-accent tabular-nums mt-0.5">
                  {formatCurrency(usdEquivalent, "USD")}
                </p>
                <p className="text-[10px] text-gray-400 mt-1" dir="ltr">
                  1 USD = {usdToCnyRate} CNY
                </p>
              </div>
              {canConvert && (
                <Button size="sm" variant="outline" disabled={pending} onClick={handleConvertToUsd}>
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4" />
                      {t("convertToUsd", locale)}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {iqdEquivalent != null && (
          <div className="mx-4 mb-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 px-4 py-3.5">
            <div>
              <p className="text-xs font-semibold text-gray-500">{t("iqdEquivalent", locale)}</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums mt-0.5">
                {formatCurrency(iqdEquivalent, "IQD")}
              </p>
              <p className="text-[10px] text-gray-400 mt-1" dir="ltr">
                1 USD = {usdToIqdRate.toLocaleString()} IQD
              </p>
            </div>
          </div>
        )}

        {usdFromIqd != null && (
          <div className="mx-4 mb-4 rounded-2xl bg-accent-light/60 border border-accent/15 px-4 py-3.5">
            <div>
              <p className="text-xs font-semibold text-gray-500">{t("cnyEquivalent", locale)}</p>
              <p className="text-xl font-black text-accent tabular-nums mt-0.5">
                {formatCurrency(usdFromIqd, "USD")}
              </p>
              <p className="text-[10px] text-gray-400 mt-1" dir="ltr">
                1 USD = {usdToIqdRate.toLocaleString()} IQD
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Send to customer — primary CTA for priced orders */}
      {item.status === "PRICED" && (
        <div className="space-y-3">
          <SectionTitle title={locale === "en" ? "Send to Customer" : "إرسال للزبون"} />
          <button
            type="button"
            onClick={openWhatsApp}
            className="invoice-whatsapp-cta w-full"
          >
            <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6 text-white" />
            </span>
            <span className="flex-1 text-start">
              <span className="block text-base font-black text-white">
                {locale === "en" ? "Send via WhatsApp" : "إرسال عبر واتساب"}
              </span>
              <span className="block text-xs text-white/70 mt-0.5">{customer.name}</span>
            </span>
            <Send className="h-5 w-5 text-white/60 shrink-0" />
          </button>
        </div>
      )}

      <SectionTitle title={t("actions", locale)} />
      <div className="space-y-1.5">
        <Select
          label={t("pdfCurrency", locale)}
          value={pdfCurrency}
          onChange={(e) => setPdfCurrency(normalizeCurrency(e.target.value))}
          options={CURRENCIES.map((c) => ({
            value: c,
            label: CURRENCY_LABELS[c][locale === "en" ? "en" : "ar"],
          }))}
        />
        <p className="text-[11px] text-gray-400">{t("pdfCurrencyHint", locale)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          icon={pdfLoading ? Loader2 : Download}
          label="PDF"
          sublabel={
            pdfLoading
              ? locale === "en"
                ? "Loading..."
                : "جاري التحميل..."
              : locale === "en"
                ? "Download"
                : "تحميل"
          }
          onClick={handleOpenPdf}
          pending={pdfLoading}
        />
        <ActionTile
          icon={copied ? Check : Copy}
          label={copied ? (locale === "en" ? "Copied!" : "تم النسخ") : t("copyWhatsApp", locale)}
          sublabel="WhatsApp"
          onClick={copyWhatsApp}
          variant={copied ? "success" : "default"}
        />
        {item.status === "ARCHIVED" && (
          <ActionTile
            icon={MessageCircle}
            label={locale === "en" ? "WhatsApp" : "واتساب"}
            sublabel={locale === "en" ? "Open chat" : "فتح المحادثة"}
            onClick={openWhatsApp}
            variant="whatsapp"
          />
        )}
        {canEdit && item.status === "ARCHIVED" && (
          <ActionTile
            icon={Pencil}
            label={t("editOrderDetails", locale)}
            sublabel={locale === "en" ? "Product & photos" : "المنتج والصور"}
            href={`/orders/${item.id}/edit?return=/archive/${item.id}`}
          />
        )}
        {canRepricing && (
          <ActionTile
            icon={RotateCcw}
            label={t("resendForPricing", locale)}
            sublabel={locale === "en" ? "Pricing queue" : "قائمة التسعير"}
            onClick={() => setRepricingOpen(!repricingOpen)}
            variant="accent"
          />
        )}
        {canReturnToPriced && (
          <ActionTile
            icon={RotateCcw}
            label={t("returnToPriced", locale)}
            sublabel={locale === "en" ? "Undo archive" : "إلغاء الأرشفة"}
            onClick={() => setReturnOpen(!returnOpen)}
            variant="default"
          />
        )}
      </div>

      {repricingOpen && canRepricing && (
        <SectionCard title={t("resendForPricing", locale)} icon={<RotateCcw className="h-5 w-5" />}>
          <Input
            label={t("reason", locale)}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <Button
            variant="danger"
            fullWidth
            className="mt-4"
            disabled={pending}
            onClick={handleRepricing}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm", locale)}
          </Button>
        </SectionCard>
      )}

      {returnOpen && canReturnToPriced && (
        <SectionCard title={t("returnToPriced", locale)} icon={<RotateCcw className="h-5 w-5" />}>
          <Input
            label={t("reason", locale)}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <Button
            variant="danger"
            fullWidth
            className="mt-4"
            disabled={pending}
            onClick={handleReturnToPriced}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm", locale)}
          </Button>
        </SectionCard>
      )}

      {canArchive && (
        <StickyActionBar>
          <Button fullWidth size="lg" disabled={pending} onClick={handleArchive}>
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Archive className="h-5 w-5" />
                {t("notifyCustomer", locale)} & {t("archive", locale)}
              </>
            )}
          </Button>
        </StickyActionBar>
      )}
    </div>
  );
}
