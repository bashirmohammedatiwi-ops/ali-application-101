import {
  Document,
  Page,
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
  CURRENCY_LABELS_AR,
} from "@/lib/pdf-format";
import { PDF_TEMPLATE_VERSION } from "@/lib/pdf-constants";
import { PdfText } from "@/components/pdf/pdf-text";

registerPdfFonts();

const fontFamily = PDF_FONT_FAMILY;

const C = {
  primary: BRAND.primary,
  accent: BRAND.accent,
  accentLight: "#FFF8F4",
  accentSoft: "#FDE8DC",
  muted: "#8A8580",
  border: "#E5E0DA",
  white: "#FFFFFF",
  ink: "#2A2928",
  paper: "#FDFCFB",
};

const styles = StyleSheet.create({
  page: {
    fontFamily,
    fontSize: 8.5,
    color: C.ink,
    backgroundColor: C.white,
    paddingBottom: 28,
    paddingHorizontal: 28,
    paddingTop: 0,
    direction: "rtl",
  },

  /* ── Header band ── */
  headerBand: {
    marginHorizontal: -28,
    marginBottom: 14,
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerAccentLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.accent,
  },
  logoFrame: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: `2 solid ${C.accent}`,
  },
  logoImg: { width: 38, height: 38, objectFit: "contain" },
  logoLetter: { fontSize: 18, fontWeight: 700, color: C.accent },
  headerCenter: { flex: 1, alignItems: "flex-end" },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: C.white,
    textAlign: "right",
    marginBottom: 3,
  },
  companySub: { fontSize: 7.5, color: "#C8C4BE", textAlign: "right", lineHeight: 1.4 },
  titleBadge: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  titleBadgeText: { fontSize: 11, fontWeight: 700, color: C.white },
  titleBadgeSub: { fontSize: 6.5, color: "#FFFFFFCC", marginTop: 2 },

  /* ── Meta chips row ── */
  chipsRow: {
    flexDirection: "row-reverse",
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: C.accentLight,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    border: `1 solid ${C.accentSoft}`,
    alignItems: "flex-end",
  },
  chipLabel: { fontSize: 6.5, color: C.muted, marginBottom: 2 },
  chipValue: { fontSize: 8.5, fontWeight: 700, color: C.ink },

  /* ── Customer strip ── */
  customerStrip: {
    flexDirection: "row-reverse",
    backgroundColor: C.paper,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  customerField: { flex: 1, alignItems: "flex-end" },
  customerLabel: { fontSize: 6.5, color: C.muted, marginBottom: 2 },
  customerValue: { fontSize: 8.5, fontWeight: 700, color: C.ink },

  /* ── Product table ── */
  table: {
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHead: {
    flexDirection: "row-reverse",
    backgroundColor: C.primary,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  th: { fontSize: 7, fontWeight: 700, color: C.white, textAlign: "center" },
  tableBody: {
    flexDirection: "row-reverse",
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: C.white,
    minHeight: 44,
  },
  td: { fontSize: 8, textAlign: "center", color: C.ink },
  tdBold: { fontSize: 8, fontWeight: 700, textAlign: "center", color: C.ink },
  productImg: {
    width: 36,
    height: 36,
    borderRadius: 4,
    objectFit: "cover",
    border: `1 solid ${C.border}`,
  },
  imgPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: C.accentLight,
    alignItems: "center",
    justifyContent: "center",
    border: `1 dashed ${C.accent}`,
  },
  imgPlaceholderTxt: { fontSize: 5.5, color: C.accent },

  colNum: { width: "5%" },
  colImg: { width: "11%" },
  colName: { width: "28%" },
  colQty: { width: "14%" },
  colUnit: { width: "18%" },
  colSum: { width: "24%" },

  /* ── Bottom split ── */
  bottomSplit: {
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 10,
  },
  logisticsBox: {
    flex: 1.1,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    backgroundColor: C.paper,
    padding: 8,
  },
  totalsBox: {
    flex: 0.9,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    backgroundColor: C.white,
    padding: 8,
  },
  boxTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.accent,
    marginBottom: 6,
    textAlign: "right",
    paddingBottom: 4,
    borderBottom: `1 solid ${C.border}`,
  },
  specRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  specPill: {
    backgroundColor: C.white,
    borderRadius: 4,
    border: `1 solid ${C.border}`,
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: "row-reverse",
    gap: 3,
    alignItems: "center",
  },
  specLabel: { fontSize: 6.5, color: C.muted },
  specValue: { fontSize: 7.5, fontWeight: 700, color: C.ink },
  noteLine: { fontSize: 7, color: C.muted, textAlign: "right", lineHeight: 1.35, marginTop: 2 },

  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: `1 dashed ${C.border}`,
  },
  totalLbl: { fontSize: 7.5, color: C.muted },
  totalVal: { fontSize: 7.5, fontWeight: 700, color: C.ink },
  grandBox: {
    marginTop: 4,
    backgroundColor: C.accent,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandLbl: { fontSize: 9, fontWeight: 700, color: C.white },
  grandVal: { fontSize: 11, fontWeight: 700, color: C.white },

  /* ── Footer ── */
  footer: {
    borderTop: `1.5 solid ${C.accent}`,
    paddingTop: 8,
    alignItems: "center",
  },
  thankYou: { fontSize: 9, fontWeight: 700, color: C.accent, marginBottom: 3, textAlign: "center" },
  footerNote: { fontSize: 6.5, color: C.muted, textAlign: "center", lineHeight: 1.3 },
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

function SpecPill({ label, value }: { label: string; value: string }) {
  const numMatch = value.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  return (
    <View style={styles.specPill}>
      <PdfText style={styles.specLabel}>{label}</PdfText>
      {numMatch ? (
        <View style={{ flexDirection: "row-reverse", gap: 2 }}>
          <PdfText style={styles.specValue}>{numMatch[2]}</PdfText>
          <PdfText style={styles.specValue} shape={false}>
            {numMatch[1]}
          </PdfText>
        </View>
      ) : (
        <PdfText style={styles.specValue}>{value}</PdfText>
      )}
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
  const companyName = settings.companyNameAr || BRAND.nameAr;
  const companyAddress = settings.companyAddressAr || BRAND.addressAr;
  const companyPhone = settings.companyPhone || BRAND.phone;
  const fmt = (n: number) => formatPdfAmount(n, currency);
  const fmtDate = (d: Date | string) =>
    new Intl.DateTimeFormat("ar-IQ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(d));

  const customerLocation = [customer.city, customer.address].filter(Boolean).join(" — ");
  const hasSpecs =
    item.weightKg != null ||
    item.volumeCbm != null ||
    item.moq != null ||
    item.leadTimeDays != null;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Header */}
        <View style={styles.headerBand}>
          <View style={styles.headerAccentLine} />
          <View style={styles.logoFrame}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logoImg} />
            ) : (
              <PdfText style={styles.logoLetter}>م</PdfText>
            )}
          </View>
          <View style={styles.headerCenter}>
            <PdfText style={styles.companyName}>{companyName}</PdfText>
            <PdfText style={styles.companySub}>{companyAddress}</PdfText>
            <View style={{ flexDirection: "row-reverse", gap: 2 }}>
              <PdfText style={styles.companySub}>هاتف:</PdfText>
              <PdfText style={styles.companySub} shape={false}>
                {companyPhone}
              </PdfText>
            </View>
          </View>
          <View style={styles.titleBadge}>
            <PdfText style={styles.titleBadgeText}>فاتورة تسعير</PdfText>
            <PdfText style={styles.titleBadgeSub}>عرض سعر رسمي</PdfText>
          </View>
        </View>

        {/* Meta chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <PdfText style={styles.chipLabel}>رقم الفاتورة</PdfText>
            <PdfText style={styles.chipValue} shape={false}>
              {invoice.invoiceNumber}
            </PdfText>
          </View>
          <View style={styles.chip}>
            <PdfText style={styles.chipLabel}>التاريخ</PdfText>
            <PdfText style={styles.chipValue}>{fmtDate(invoice.createdAt)}</PdfText>
          </View>
          <View style={styles.chip}>
            <PdfText style={styles.chipLabel}>رقم الطلب</PdfText>
            <PdfText style={styles.chipValue} shape={false}>
              {item.refNumber}
            </PdfText>
          </View>
          <View style={styles.chip}>
            <PdfText style={styles.chipLabel}>العملة</PdfText>
            <PdfText style={styles.chipValue}>{currencyName}</PdfText>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerStrip}>
          <View style={styles.customerField}>
            <PdfText style={styles.customerLabel}>اسم العميل</PdfText>
            <PdfText style={styles.customerValue}>{customer.name}</PdfText>
          </View>
          <View style={styles.customerField}>
            <PdfText style={styles.customerLabel}>رقم الهاتف</PdfText>
            <PdfText style={styles.customerValue} shape={false}>
              {customer.phone}
            </PdfText>
          </View>
          {customerLocation ? (
            <View style={[styles.customerField, { flex: 1.4 }]}>
              <PdfText style={styles.customerLabel}>العنوان</PdfText>
              <PdfText style={styles.customerValue}>{customerLocation}</PdfText>
            </View>
          ) : null}
        </View>

        {/* Product table */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <PdfText style={[styles.th, styles.colNum]}>#</PdfText>
            <PdfText style={[styles.th, styles.colImg]}>صورة</PdfText>
            <PdfText style={[styles.th, styles.colName]}>اسم المنتج</PdfText>
            <PdfText style={[styles.th, styles.colQty]}>العدد</PdfText>
            <PdfText style={[styles.th, styles.colUnit]}>سعر القطعة</PdfText>
            <PdfText style={[styles.th, styles.colSum]}>المجموع</PdfText>
          </View>
          <View style={styles.tableBody}>
            <PdfText style={[styles.td, styles.colNum]}>1</PdfText>
            <View style={[styles.colImg, { alignItems: "center" }]}>
              {productImageSrc ? (
                <Image src={productImageSrc} style={styles.productImg} />
              ) : (
                <View style={styles.imgPlaceholder}>
                  <PdfText style={styles.imgPlaceholderTxt}>—</PdfText>
                </View>
              )}
            </View>
            <PdfText style={[styles.tdBold, styles.colName]}>{productName}</PdfText>
            <View style={[styles.colQty, { flexDirection: "row-reverse", justifyContent: "center", gap: 3 }]}>
              <PdfText style={styles.td}>{unitLabel}</PdfText>
              <PdfText style={styles.td} shape={false}>
                {String(item.quantity)}
              </PdfText>
            </View>
            <PdfText style={[styles.td, styles.colUnit]} shape={false}>
              {fmt(item.unitPrice ?? 0)}
            </PdfText>
            <PdfText style={[styles.tdBold, styles.colSum]} shape={false}>
              {fmt(invoice.subtotal)}
            </PdfText>
          </View>
        </View>

        {/* Bottom: specs + totals */}
        <View style={styles.bottomSplit}>
          <View style={styles.logisticsBox}>
            <PdfText style={styles.boxTitle}>الوزن والحجم</PdfText>
            {hasSpecs ? (
              <View style={styles.specRow}>
                {item.weightKg != null && (
                  <SpecPill label="الوزن" value={`${item.weightKg} كغ`} />
                )}
                {item.volumeCbm != null && (
                  <SpecPill label="الحجم" value={`${item.volumeCbm} م³`} />
                )}
                {item.moq != null && (
                  <SpecPill
                    label="الحد الأدنى"
                    value={`${item.moq} ${unitLabel}`}
                  />
                )}
                {item.leadTimeDays != null && (
                  <SpecPill label="التجهيز" value={`${item.leadTimeDays} يوم`} />
                )}
              </View>
            ) : (
              <PdfText style={styles.noteLine}>—</PdfText>
            )}
            {item.pricerNotes ? (
              <PdfText style={styles.noteLine}>{`ملاحظة: ${item.pricerNotes}`}</PdfText>
            ) : null}
          </View>

          <View style={styles.totalsBox}>
            <PdfText style={styles.boxTitle}>ملخص المبالغ</PdfText>
            <View style={styles.totalRow}>
              <PdfText style={styles.totalLbl}>تكلفة المنتج</PdfText>
              <PdfText style={styles.totalVal} shape={false}>
                {fmt(invoice.subtotal)}
              </PdfText>
            </View>
            <View style={styles.totalRow}>
              <PdfText style={styles.totalLbl}>أجور الشحن الداخلي</PdfText>
              <PdfText style={styles.totalVal} shape={false}>
                {`+ ${fmt(invoice.shipping)}`}
              </PdfText>
            </View>
            <View style={styles.totalRow}>
              <PdfText style={styles.totalLbl}>
                {invoice.markup > 0
                  ? `عمولة المكتب (${formatMarkupPercent(invoice.markup)})`
                  : "عمولة المكتب"}
              </PdfText>
              <PdfText
                style={[styles.totalVal, invoice.markup > 0 ? { color: C.accent } : {}]}
                shape={false}
              >
                {invoice.markup > 0 ? `+ ${fmt(markupAmount)}` : "—"}
              </PdfText>
            </View>
            <View style={styles.grandBox}>
              <PdfText style={styles.grandLbl}>الإجمالي النهائي</PdfText>
              <PdfText style={styles.grandVal} shape={false}>
                {fmt(invoice.grandTotal)}
              </PdfText>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PdfText style={styles.thankYou}>شكراً لثقتكم بنا — نسعد بخدمتكم دائماً</PdfText>
          <View style={{ flexDirection: "row-reverse", justifyContent: "center", flexWrap: "wrap" }}>
            <PdfText style={styles.footerNote}>
              {`الأسعار لا تشمل الشحن الدولي · ${companyName} · هاتف: `}
            </PdfText>
            <PdfText style={styles.footerNote} shape={false}>
              {companyPhone}
            </PdfText>
          </View>
        </View>
      </Page>
    </Document>
  );
}
