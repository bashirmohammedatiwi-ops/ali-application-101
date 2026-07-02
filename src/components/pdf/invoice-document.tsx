import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Invoice, OrderItem, Customer, AppSettings } from "@/generated/prisma/client";
import { BRAND } from "@/lib/constants";
import { calculateMarkupAmount, formatMarkupPercent } from "@/lib/markup";
import { registerPdfFonts, PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import {
  formatPdfAmount,
  formatPdfDate,
  CURRENCY_LABELS_AR,
} from "@/lib/pdf-format";

registerPdfFonts();

export const PDF_TEMPLATE_VERSION = "2026-07-v2";

const fontFamily = PDF_FONT_FAMILY;

const C = {
  primary: BRAND.primary,
  accent: BRAND.accent,
  accentLight: BRAND.accentLight,
  accentDark: BRAND.accentDark,
  muted: BRAND.muted,
  border: "#E8E4DF",
  white: "#FFFFFF",
  tableHead: "#3C3C3B",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontFamily,
    fontSize: 10,
    color: C.primary,
    direction: "rtl",
  },
  topBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: C.accent,
  },
  header: {
    marginTop: 20,
    marginBottom: 18,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    border: `2 solid ${C.accent}`,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 56,
    height: 56,
    objectFit: "contain",
  },
  logoFallback: {
    fontSize: 22,
    fontWeight: 700,
    color: C.accent,
  },
  companyBlock: {
    flex: 1,
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: C.primary,
    textAlign: "right",
    marginBottom: 4,
  },
  companyMeta: {
    fontSize: 9,
    color: C.muted,
    textAlign: "right",
    marginBottom: 2,
  },
  invoiceBadge: {
    alignItems: "flex-start",
    minWidth: 120,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: C.accent,
    textAlign: "left",
  },
  invoiceSubtitle: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
    textAlign: "left",
  },
  metaStrip: {
    flexDirection: "row-reverse",
    backgroundColor: C.accentLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    border: `1 solid ${C.border}`,
  },
  metaItem: {
    flex: 1,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 8,
    color: C.muted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
    color: C.primary,
  },
  metaDivider: {
    width: 1,
    backgroundColor: C.border,
    marginHorizontal: 12,
  },
  sectionRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    border: `1 solid ${C.border}`,
    borderRadius: 10,
    padding: 12,
    backgroundColor: C.white,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.accent,
    marginBottom: 8,
    textAlign: "right",
    paddingBottom: 6,
    borderBottom: `1 solid ${C.border}`,
  },
  infoLine: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 5,
    gap: 8,
  },
  infoLabel: {
    fontSize: 9,
    color: C.muted,
    textAlign: "right",
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 700,
    color: C.primary,
    textAlign: "left",
    maxWidth: "60%",
  },
  table: {
    border: `1 solid ${C.border}`,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHead: {
    flexDirection: "row-reverse",
    backgroundColor: C.tableHead,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 8,
    fontWeight: 700,
    color: C.white,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row-reverse",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTop: `1 solid ${C.border}`,
    alignItems: "center",
    backgroundColor: C.white,
  },
  td: {
    fontSize: 9,
    textAlign: "center",
    color: C.primary,
  },
  tdBold: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    color: C.primary,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: 6,
    objectFit: "cover",
    border: `1 solid ${C.border}`,
  },
  imagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: C.accentLight,
    border: `1 dashed ${C.accent}`,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 7,
    color: C.accent,
  },
  bottomRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 14,
  },
  logisticsCard: {
    flex: 1,
    border: `1 solid ${C.border}`,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAF9",
  },
  totalsCard: {
    flex: 1,
    border: `1 solid ${C.border}`,
    borderRadius: 10,
    padding: 12,
    backgroundColor: C.white,
  },
  totalLine: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 7,
    paddingBottom: 7,
    borderBottom: `1 dashed ${C.border}`,
  },
  totalLabel: {
    fontSize: 9,
    color: C.muted,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 700,
    color: C.primary,
    textAlign: "left",
  },
  grandTotalBox: {
    marginTop: 6,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: C.white,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: C.white,
  },
  noteText: {
    fontSize: 8,
    color: C.muted,
    textAlign: "right",
    lineHeight: 1.5,
    marginTop: 4,
  },
  footer: {
    marginTop: 8,
    borderTop: `2 solid ${C.accent}`,
    paddingTop: 12,
    alignItems: "center",
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 700,
    color: C.accent,
    marginBottom: 4,
    textAlign: "center",
  },
  footerNote: {
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    lineHeight: 1.4,
  },
  colIndex: { width: "6%" },
  colImage: { width: "14%" },
  colProduct: { width: "30%" },
  colQty: { width: "12%" },
  colPrice: { width: "18%" },
  colTotal: { width: "20%" },
});

type InvoiceDocProps = {
  invoice: Invoice;
  item: OrderItem & { images?: { url: string }[] };
  customer: Customer;
  settings: AppSettings;
  unitLabel: string;
  logoSrc?: string | null;
  productImageSrc?: string | null;
};

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TotalLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.totalLine}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, accent ? { color: C.accent } : {}]}>{value}</Text>
    </View>
  );
}

export function InvoiceDocument({
  invoice,
  item,
  customer,
  settings,
  unitLabel,
  logoSrc,
  productImageSrc,
}: InvoiceDocProps) {
  const currency = item.currency;
  const currencyName = CURRENCY_LABELS_AR[currency] ?? currency;
  const markupAmount = calculateMarkupAmount(invoice.subtotal, invoice.shipping, invoice.markup);
  const productName = item.productNameAr || item.productNameEn || "—";
  const customerWhatsapp = customer.whatsapp || customer.phone;
  const companyName = settings.companyNameAr || BRAND.nameAr;
  const fmt = (n: number) => formatPdfAmount(n, currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBand} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyMeta}>{BRAND.addressAr}</Text>
            <Text style={styles.companyMeta}>هاتف: {BRAND.phone}</Text>
            <Text style={styles.companyMeta}>واتساب: {BRAND.whatsapp}</Text>
          </View>

          <View style={styles.logoWrap}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoFallback}>م</Text>
            )}
          </View>

          <View style={styles.invoiceBadge}>
            <Text style={styles.invoiceTitle}>فاتورة تسعير</Text>
            <Text style={styles.invoiceSubtitle}>عرض سعر رسمي</Text>
          </View>
        </View>

        {/* Invoice meta */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>رقم الفاتورة</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>التاريخ</Text>
            <Text style={styles.metaValue}>{formatPdfDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>رقم الطلب</Text>
            <Text style={styles.metaValue}>{item.refNumber}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>العملة</Text>
            <Text style={styles.metaValue}>{currencyName}</Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.sectionRow}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>بيانات العميل</Text>
            <InfoLine label="اسم العميل" value={customer.name} />
            <InfoLine label="رقم الهاتف" value={customer.phone} />
            <InfoLine label="واتساب" value={customerWhatsapp} />
            {customer.address ? (
              <InfoLine label="العنوان" value={customer.address} />
            ) : null}
            {customer.city ? <InfoLine label="المدينة" value={customer.city} /> : null}
          </View>
        </View>

        {/* Product table */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colIndex]}>#</Text>
            <Text style={[styles.th, styles.colImage]}>صورة</Text>
            <Text style={[styles.th, styles.colProduct]}>اسم المنتج</Text>
            <Text style={[styles.th, styles.colQty]}>عدد القطع</Text>
            <Text style={[styles.th, styles.colPrice]}>سعر القطعة</Text>
            <Text style={[styles.th, styles.colTotal]}>المجموع</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.td, styles.colIndex]}>1</Text>
            <View style={[styles.colImage, { alignItems: "center" }]}>
              {productImageSrc ? (
                <Image src={productImageSrc} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>بدون صورة</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tdBold, styles.colProduct]}>{productName}</Text>
            <Text style={[styles.td, styles.colQty]}>
              {item.quantity} {unitLabel}
            </Text>
            <Text style={[styles.td, styles.colPrice]}>
              {fmt(item.unitPrice ?? 0)}
            </Text>
            <Text style={[styles.tdBold, styles.colTotal]}>{fmt(invoice.subtotal)}</Text>
          </View>
        </View>

        {/* Bottom: logistics + totals */}
        <View style={styles.bottomRow}>
          <View style={styles.logisticsCard}>
            <Text style={styles.cardTitle}>تفاصيل الشحن والقياس</Text>
            {item.weightKg != null ? (
              <InfoLine label="الوزن" value={`${item.weightKg} كغ`} />
            ) : (
              <InfoLine label="الوزن" value="—" />
            )}
            {item.volumeCbm != null ? (
              <InfoLine label="الحجم (CBM)" value={`${item.volumeCbm} م³`} />
            ) : (
              <InfoLine label="الحجم (CBM)" value="—" />
            )}
            {item.moq != null ? (
              <InfoLine label="الحد الأدنى للطلب" value={`${item.moq} ${unitLabel}`} />
            ) : null}
            {item.leadTimeDays != null ? (
              <InfoLine label="مدة التجهيز" value={`${item.leadTimeDays} يوم`} />
            ) : null}
            {item.pricerNotes ? (
              <Text style={styles.noteText}>ملاحظة: {item.pricerNotes}</Text>
            ) : null}
          </View>

          <View style={styles.totalsCard}>
            <Text style={styles.cardTitle}>ملخص المبالغ</Text>
            <TotalLine label="تكلفة المنتج" value={fmt(invoice.subtotal)} />
            <TotalLine label="أجور الشحن الداخلي" value={`+ ${fmt(invoice.shipping)}`} />
            {invoice.markup > 0 ? (
              <TotalLine
                label={`عمولة المكتب (${formatMarkupPercent(invoice.markup)})`}
                value={`+ ${fmt(markupAmount)}`}
                accent
              />
            ) : (
              <TotalLine label="عمولة المكتب" value="—" />
            )}
            <View style={styles.grandTotalBox}>
              <Text style={styles.grandTotalLabel}>الإجمالي النهائي</Text>
              <Text style={styles.grandTotalValue}>{fmt(invoice.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.thankYou}>شكراً لثقتكم بنا — نسعد بخدمتكم دائماً</Text>
          <Text style={styles.footerNote}>
            الأسعار المذكورة لا تشمل الشحن الدولي ما لم يُذكر خلاف ذلك.
          </Text>
          <Text style={styles.footerNote}>
            {companyName} · واتساب: {BRAND.whatsapp}
          </Text>
          <Text style={[styles.footerNote, { marginTop: 6, fontSize: 7, textAlign: "center" }]}>
            {PDF_TEMPLATE_VERSION}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
