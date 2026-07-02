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
import { PdfText } from "@/components/pdf/pdf-text";

registerPdfFonts();

const fontFamily = PDF_FONT_FAMILY;

const C = {
  primary: BRAND.primary,
  accent: BRAND.accent,
  accentDark: BRAND.accentDark,
  accentLight: "#FFF6F1",
  accentSoft: "#FCE9DF",
  muted: "#7A756F",
  border: "#E8E2DB",
  white: "#FFFFFF",
  ink: "#1F1E1D",
  paper: "#FAF8F6",
  rowAlt: "#F5F2EF",
};

/** A4 portrait — 595×842 pt. Margins ~14mm. */
const PAGE = {
  padH: 40,
  padV: 32,
};

const styles = StyleSheet.create({
  page: {
    fontFamily,
    fontSize: 9,
    color: C.ink,
    backgroundColor: C.white,
    paddingTop: PAGE.padV,
    paddingBottom: PAGE.padV,
    paddingHorizontal: PAGE.padH,
    direction: "rtl",
    flexDirection: "column",
  },

  body: {
    flex: 1,
    flexDirection: "column",
  },

  /* Header */
  header: {
    marginBottom: 18,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: C.primary,
  },
  headerInner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 22,
    gap: 16,
  },
  headerStripe: {
    height: 4,
    backgroundColor: C.accent,
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    border: `2 solid ${C.accent}`,
  },
  logoImg: { width: 46, height: 46, objectFit: "contain" },
  logoFallback: { fontSize: 22, fontWeight: 700, color: C.accent },
  headerBrand: { flex: 1, alignItems: "flex-end" },
  companyName: {
    fontSize: 15,
    fontWeight: 700,
    color: C.white,
    textAlign: "right",
    marginBottom: 4,
  },
  companyLine: {
    fontSize: 8,
    color: "#D4D0CA",
    textAlign: "right",
    lineHeight: 1.5,
  },
  invoiceBadge: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 108,
    alignItems: "center",
  },
  invoiceBadgeTitle: { fontSize: 12, fontWeight: 700, color: C.white },
  invoiceBadgeSub: { fontSize: 7, color: "#FFFFFFD9", marginTop: 3 },

  /* Meta grid */
  metaGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  metaCard: {
    width: "48.5%",
    backgroundColor: C.paper,
    borderRadius: 8,
    border: `1 solid ${C.border}`,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "flex-end",
  },
  metaLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  metaValue: { fontSize: 10, fontWeight: 700, color: C.ink },

  /* Section */
  section: {
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 16,
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.primary,
  },

  /* Customer */
  customerCard: {
    flexDirection: "row-reverse",
    backgroundColor: C.accentLight,
    borderRadius: 8,
    border: `1 solid ${C.accentSoft}`,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  customerCol: { flex: 1, alignItems: "flex-end" },
  customerLabel: { fontSize: 7, color: C.muted, marginBottom: 3 },
  customerValue: { fontSize: 10, fontWeight: 700, color: C.ink },

  /* Table */
  table: {
    borderRadius: 8,
    border: `1 solid ${C.border}`,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row-reverse",
    backgroundColor: C.primary,
    paddingVertical: 9,
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: C.white,
    minHeight: 58,
    borderTop: `1 solid ${C.border}`,
  },
  td: { fontSize: 9, color: C.ink, textAlign: "center" },
  tdBold: { fontSize: 9, fontWeight: 700, color: C.ink },
  tdName: { fontSize: 9.5, fontWeight: 700, textAlign: "right", color: C.ink, lineHeight: 1.35 },
  colNum: { width: "6%" },
  colImg: { width: "12%" },
  colName: { width: "30%" },
  colQty: { width: "14%" },
  colUnit: { width: "18%" },
  colSum: { width: "20%" },
  productImg: {
    width: 46,
    height: 46,
    borderRadius: 6,
    objectFit: "cover",
    border: `1 solid ${C.border}`,
  },
  imgPh: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: C.rowAlt,
    alignItems: "center",
    justifyContent: "center",
    border: `1 dashed ${C.accent}`,
  },

  /* Bottom */
  bottomRow: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 4,
  },
  panel: {
    flex: 1,
    borderRadius: 8,
    border: `1 solid ${C.border}`,
    backgroundColor: C.paper,
    padding: 12,
  },
  panelTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.accentDark,
    textAlign: "right",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `1 solid ${C.border}`,
  },
  specGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
  },
  specItem: {
    width: "47%",
    backgroundColor: C.white,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "flex-end",
  },
  specLbl: { fontSize: 7, color: C.muted, marginBottom: 2 },
  specVal: { fontSize: 9, fontWeight: 700, color: C.ink },
  noteText: {
    fontSize: 8,
    color: C.muted,
    textAlign: "right",
    lineHeight: 1.4,
    marginTop: 8,
  },

  totalLine: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottom: `1 dashed ${C.border}`,
  },
  totalLbl: { fontSize: 8.5, color: C.muted },
  totalVal: { fontSize: 8.5, fontWeight: 700, color: C.ink },
  grand: {
    marginTop: 10,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `3 solid ${C.accent}`,
  },
  grandLbl: { fontSize: 10, fontWeight: 700, color: C.white },
  grandVal: { fontSize: 14, fontWeight: 700, color: C.accent },

  /* Footer */
  footer: {
    marginTop: "auto",
    paddingTop: 14,
    borderTop: `1 solid ${C.border}`,
    alignItems: "center",
  },
  thankYou: {
    fontSize: 10,
    fontWeight: 700,
    color: C.accentDark,
    marginBottom: 4,
    textAlign: "center",
  },
  footerNote: { fontSize: 7.5, color: C.muted, textAlign: "center", lineHeight: 1.4 },
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

function SpecItem({ label, value }: { label: string; value: string }) {
  const m = value.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  return (
    <View style={styles.specItem}>
      <PdfText style={styles.specLbl}>{label}</PdfText>
      {m ? (
        <View style={{ flexDirection: "row-reverse", gap: 3 }}>
          <PdfText style={styles.specVal}>{m[2]}</PdfText>
          <PdfText style={styles.specVal} shape={false}>
            {m[1]}
          </PdfText>
        </View>
      ) : (
        <PdfText style={styles.specVal}>{value}</PdfText>
      )}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionBar} />
      <PdfText style={styles.sectionTitle}>{children}</PdfText>
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
      <Page size="A4" orientation="portrait" style={styles.page} wrap={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <View style={styles.logoWrap}>
              {logoSrc ? (
                <Image src={logoSrc} style={styles.logoImg} />
              ) : (
                <PdfText style={styles.logoFallback}>م</PdfText>
              )}
            </View>
            <View style={styles.headerBrand}>
              <PdfText style={styles.companyName}>{companyName}</PdfText>
              <PdfText style={styles.companyLine}>{companyAddress}</PdfText>
              <View style={{ flexDirection: "row-reverse", gap: 3, marginTop: 2 }}>
                <PdfText style={styles.companyLine}>هاتف:</PdfText>
                <PdfText style={styles.companyLine} shape={false}>
                  {companyPhone}
                </PdfText>
              </View>
            </View>
            <View style={styles.invoiceBadge}>
              <PdfText style={styles.invoiceBadgeTitle}>فاتورة تسعير</PdfText>
              <PdfText style={styles.invoiceBadgeSub}>عرض سعر رسمي</PdfText>
            </View>
          </View>
          <View style={styles.headerStripe} />
        </View>

        <View style={styles.body}>
          {/* ── Meta ── */}
          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <PdfText style={styles.metaLabel}>رقم الفاتورة</PdfText>
              <PdfText style={styles.metaValue} shape={false}>
                {invoice.invoiceNumber}
              </PdfText>
            </View>
            <View style={styles.metaCard}>
              <PdfText style={styles.metaLabel}>التاريخ</PdfText>
              <PdfText style={styles.metaValue}>{fmtDate(invoice.createdAt)}</PdfText>
            </View>
            <View style={styles.metaCard}>
              <PdfText style={styles.metaLabel}>رقم الطلب</PdfText>
              <PdfText style={styles.metaValue} shape={false}>
                {item.refNumber}
              </PdfText>
            </View>
            <View style={styles.metaCard}>
              <PdfText style={styles.metaLabel}>العملة</PdfText>
              <PdfText style={styles.metaValue}>{currencyName}</PdfText>
            </View>
          </View>

          {/* ── Customer ── */}
          <View style={styles.section}>
            <SectionTitle>بيانات العميل</SectionTitle>
            <View style={styles.customerCard}>
              <View style={styles.customerCol}>
                <PdfText style={styles.customerLabel}>اسم العميل</PdfText>
                <PdfText style={styles.customerValue}>{customer.name}</PdfText>
              </View>
              <View style={styles.customerCol}>
                <PdfText style={styles.customerLabel}>رقم الهاتف</PdfText>
                <PdfText style={styles.customerValue} shape={false}>
                  {customer.phone}
                </PdfText>
              </View>
              {customerLocation ? (
                <View style={[styles.customerCol, { flex: 1.5 }]}>
                  <PdfText style={styles.customerLabel}>العنوان</PdfText>
                  <PdfText style={styles.customerValue}>{customerLocation}</PdfText>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Products ── */}
          <View style={styles.section}>
            <SectionTitle>تفاصيل المنتج</SectionTitle>
            <View style={styles.table}>
              <View style={styles.tableHead}>
                <PdfText style={[styles.th, styles.colNum]}>#</PdfText>
                <PdfText style={[styles.th, styles.colImg]}>صورة</PdfText>
                <PdfText style={[styles.th, styles.colName]}>اسم المنتج</PdfText>
                <PdfText style={[styles.th, styles.colQty]}>الكمية</PdfText>
                <PdfText style={[styles.th, styles.colUnit]}>سعر القطعة</PdfText>
                <PdfText style={[styles.th, styles.colSum]}>المجموع</PdfText>
              </View>
              <View style={styles.tableRow}>
                <PdfText style={[styles.td, styles.colNum]} shape={false}>
                  1
                </PdfText>
                <View style={[styles.colImg, { alignItems: "center" }]}>
                  {productImageSrc ? (
                    <Image src={productImageSrc} style={styles.productImg} />
                  ) : (
                    <View style={styles.imgPh}>
                      <PdfText style={{ fontSize: 6, color: C.muted }}>—</PdfText>
                    </View>
                  )}
                </View>
                <PdfText style={[styles.tdName, styles.colName]}>{productName}</PdfText>
                <View
                  style={[
                    styles.colQty,
                    { flexDirection: "row-reverse", justifyContent: "center", gap: 4 },
                  ]}
                >
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
          </View>

          {/* ── Specs + Totals ── */}
          <View style={styles.bottomRow}>
            <View style={styles.panel}>
              <PdfText style={styles.panelTitle}>الوزن والمواصفات</PdfText>
              {hasSpecs ? (
                <View style={styles.specGrid}>
                  {item.weightKg != null && (
                    <SpecItem label="الوزن" value={`${item.weightKg} كغ`} />
                  )}
                  {item.volumeCbm != null && (
                    <SpecItem label="الحجم" value={`${item.volumeCbm} م³`} />
                  )}
                  {item.moq != null && (
                    <SpecItem label="الحد الأدنى" value={`${item.moq} ${unitLabel}`} />
                  )}
                  {item.leadTimeDays != null && (
                    <SpecItem label="مدة التجهيز" value={`${item.leadTimeDays} يوم`} />
                  )}
                </View>
              ) : (
                <PdfText style={styles.noteText}>—</PdfText>
              )}
              {item.pricerNotes ? (
                <PdfText style={styles.noteText}>{`ملاحظة: ${item.pricerNotes}`}</PdfText>
              ) : null}
            </View>

            <View style={styles.panel}>
              <PdfText style={styles.panelTitle}>ملخص المبالغ</PdfText>
              <View style={styles.totalLine}>
                <PdfText style={styles.totalLbl}>تكلفة المنتج</PdfText>
                <PdfText style={styles.totalVal} shape={false}>
                  {fmt(invoice.subtotal)}
                </PdfText>
              </View>
              <View style={styles.totalLine}>
                <PdfText style={styles.totalLbl}>أجور الشحن الداخلي</PdfText>
                <PdfText style={styles.totalVal} shape={false}>
                  {`+ ${fmt(invoice.shipping)}`}
                </PdfText>
              </View>
              <View style={styles.totalLine}>
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
              <View style={styles.grand}>
                <PdfText style={styles.grandLbl}>الإجمالي النهائي</PdfText>
                <PdfText style={styles.grandVal} shape={false}>
                  {fmt(invoice.grandTotal)}
                </PdfText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
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
