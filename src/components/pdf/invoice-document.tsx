import { Document, Page, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { Invoice, OrderItem, Customer, AppSettings } from "@/generated/prisma/client";
import { BRAND } from "@/lib/constants";
import { calculateMarkupAmount, formatMarkupPercent } from "@/lib/markup";
import { registerPdfFonts, PDF_FONT_FAMILY } from "@/lib/pdf-fonts";
import { formatPdfAmount, formatPdfDate, CURRENCY_LABELS_AR } from "@/lib/pdf-format";
import { PdfAr, PdfNum, PdfMixed } from "@/components/pdf/pdf-text";

registerPdfFonts();

const C = {
  primary: "#3C3C3B",
  accent: "#E85C24",
  muted: "#8A8580",
  border: "#E5E0DA",
  white: "#FFFFFF",
  ink: "#2A2928",
  paper: "#FAF8F6",
};

const W = 515; // content width (A4 595 - 40*2 padding)

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    color: C.ink,
    backgroundColor: C.white,
    paddingVertical: 36,
    paddingHorizontal: 40,
  },

  header: {
    backgroundColor: C.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRight: { width: 56, alignItems: "center" },
  logo: { width: 48, height: 48, borderRadius: 24, objectFit: "contain" },
  logoPh: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, paddingHorizontal: 12 },
  companyName: { fontSize: 14, fontWeight: 700, color: C.white, textAlign: "right" },
  companySub: { fontSize: 8, color: "#CCCCCC", textAlign: "right", marginTop: 3 },
  headerLeft: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 90,
    alignItems: "center",
  },
  headerTitle: { fontSize: 11, fontWeight: 700, color: C.white },
  headerSub: { fontSize: 7, color: "#FFFFFFCC", marginTop: 2 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  metaBox: {
    width: W / 4 - 6,
    backgroundColor: C.paper,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    padding: 8,
  },
  metaLbl: { fontSize: 7, color: C.muted, textAlign: "right", marginBottom: 4 },
  metaVal: { fontSize: 9, fontWeight: 700, textAlign: "right" },

  blockTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.accent,
    textAlign: "right",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `2 solid ${C.accent}`,
  },

  customerBox: {
    backgroundColor: C.paper,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    padding: 12,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottom: `1 solid ${C.border}`,
  },
  fieldLbl: { fontSize: 8, color: C.muted, width: 80, textAlign: "right" },
  fieldVal: { fontSize: 9, fontWeight: 700, flex: 1, textAlign: "right" },

  table: {
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    marginBottom: 14,
    overflow: "hidden",
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: C.primary,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  th: { fontSize: 7.5, fontWeight: 700, color: C.white, textAlign: "center" },
  tRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    minHeight: 52,
    borderTop: `1 solid ${C.border}`,
  },
  td: { fontSize: 8.5, textAlign: "center" },
  tdName: { fontSize: 9, fontWeight: 700, textAlign: "right", paddingHorizontal: 4 },
  cNum: { width: 28 },
  cImg: { width: 52 },
  cName: { width: 168 },
  cQty: { width: 72 },
  cUnit: { width: 88 },
  cSum: { width: 87 },
  thumb: { width: 40, height: 40, borderRadius: 4, objectFit: "cover" },
  thumbPh: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: C.paper,
    border: `1 dashed ${C.border}`,
    alignItems: "center",
    justifyContent: "center",
  },

  bottom: { flexDirection: "row", gap: 10 },
  panel: {
    flex: 1,
    borderRadius: 6,
    border: `1 solid ${C.border}`,
    padding: 10,
    backgroundColor: C.paper,
  },
  panelTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.accent,
    textAlign: "right",
    marginBottom: 8,
  },
  specLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingBottom: 4,
    borderBottom: `1 dashed ${C.border}`,
  },
  specLbl: { fontSize: 8, color: C.muted },
  specVal: { fontSize: 8.5, fontWeight: 700 },

  moneyLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingBottom: 4,
    borderBottom: `1 dashed ${C.border}`,
  },
  moneyLbl: { fontSize: 8.5, color: C.muted, textAlign: "right", flex: 1 },
  moneyVal: { fontSize: 8.5, fontWeight: 700, width: 100, textAlign: "left" },
  grand: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 6,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandLbl: { fontSize: 10, fontWeight: 700, color: C.white },
  grandVal: { fontSize: 13, fontWeight: 700, color: C.accent },

  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTop: `1 solid ${C.border}`,
    alignItems: "center",
  },
  footerMain: { fontSize: 10, fontWeight: 700, color: C.accent, marginBottom: 4 },
  footerSub: { fontSize: 7.5, color: C.muted, textAlign: "center" },
});

type Props = {
  invoice: Invoice;
  item: OrderItem & { images?: { url: string }[] };
  customer: Customer;
  settings: AppSettings;
  unitLabel: string;
  logoSrc?: string | null;
  productImageSrc?: string | null;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.fieldRow}>
      <PdfAr style={styles.fieldLbl}>{label}</PdfAr>
      <View style={styles.fieldVal}>{children}</View>
    </View>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specLine}>
      <PdfAr style={styles.specLbl}>{label}</PdfAr>
      <PdfMixed style={styles.specVal}>{value}</PdfMixed>
    </View>
  );
}

function MoneyRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.moneyLine}>
      <PdfAr style={styles.moneyLbl}>{label}</PdfAr>
      <PdfNum style={[styles.moneyVal, accent ? { color: C.accent } : {}]}>{value}</PdfNum>
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
}: Props) {
  const currency = item.currency;
  const currencyName = CURRENCY_LABELS_AR[currency] ?? currency;
  const markupAmount = calculateMarkupAmount(invoice.subtotal, invoice.shipping, invoice.markup);
  const productName = item.productNameAr || item.productNameEn || "—";
  const companyName = settings.companyNameAr || BRAND.nameAr;
  const companyAddress = settings.companyAddressAr || BRAND.addressAr;
  const companyPhone = settings.companyPhone || BRAND.phone;
  const fmt = (n: number) => formatPdfAmount(n, currency);
  const location = [customer.city, customer.address].filter(Boolean).join(" — ");

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        {/* Header: logo (right) | company | badge (left) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PdfAr style={styles.headerTitle}>فاتورة تسعير</PdfAr>
            <PdfAr style={styles.headerSub}>عرض سعر رسمي</PdfAr>
          </View>
          <View style={styles.headerCenter}>
            <PdfAr style={styles.companyName}>{companyName}</PdfAr>
            <PdfAr style={styles.companySub}>{companyAddress}</PdfAr>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 2 }}>
              <PdfAr style={styles.companySub}>هاتف: </PdfAr>
              <PdfNum style={styles.companySub}>{companyPhone}</PdfNum>
            </View>
          </View>
          <View style={styles.headerRight}>
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <View style={styles.logoPh}>
                <PdfAr style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>م</PdfAr>
              </View>
            )}
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <PdfAr style={styles.metaLbl}>رقم الفاتورة</PdfAr>
            <PdfNum style={styles.metaVal}>{invoice.invoiceNumber}</PdfNum>
          </View>
          <View style={styles.metaBox}>
            <PdfAr style={styles.metaLbl}>التاريخ</PdfAr>
            <PdfAr style={styles.metaVal}>{formatPdfDate(invoice.createdAt)}</PdfAr>
          </View>
          <View style={styles.metaBox}>
            <PdfAr style={styles.metaLbl}>رقم الطلب</PdfAr>
            <PdfNum style={styles.metaVal}>{item.refNumber}</PdfNum>
          </View>
          <View style={styles.metaBox}>
            <PdfAr style={styles.metaLbl}>العملة</PdfAr>
            <PdfAr style={styles.metaVal}>{currencyName}</PdfAr>
          </View>
        </View>

        {/* Customer */}
        <PdfAr style={styles.blockTitle}>بيانات العميل</PdfAr>
        <View style={styles.customerBox}>
          <Field label="الاسم">
            <PdfAr style={{ fontSize: 9, fontWeight: 700, textAlign: "right" }}>{customer.name}</PdfAr>
          </Field>
          <Field label="الهاتف">
            <PdfNum style={{ fontSize: 9, fontWeight: 700, textAlign: "right" }}>{customer.phone}</PdfNum>
          </Field>
          {location ? (
            <Field label="العنوان">
              <PdfAr style={{ fontSize: 9, fontWeight: 700, textAlign: "right" }}>{location}</PdfAr>
            </Field>
          ) : null}
        </View>

        {/* Product table */}
        <PdfAr style={styles.blockTitle}>تفاصيل المنتج</PdfAr>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <PdfAr style={[styles.th, styles.cSum]}>المجموع</PdfAr>
            <PdfAr style={[styles.th, styles.cUnit]}>سعر القطعة</PdfAr>
            <PdfAr style={[styles.th, styles.cQty]}>الكمية</PdfAr>
            <PdfAr style={[styles.th, styles.cName]}>اسم المنتج</PdfAr>
            <PdfAr style={[styles.th, styles.cImg]}>صورة</PdfAr>
            <PdfAr style={[styles.th, styles.cNum]}>#</PdfAr>
          </View>
          <View style={styles.tRow}>
            <View style={styles.cSum}>
              <PdfNum style={styles.td}>{fmt(invoice.subtotal)}</PdfNum>
            </View>
            <View style={styles.cUnit}>
              <PdfNum style={styles.td}>{fmt(item.unitPrice ?? 0)}</PdfNum>
            </View>
            <View style={[styles.cQty, { flexDirection: "row", justifyContent: "center", gap: 4 }]}>
              <PdfAr style={styles.td}>{unitLabel}</PdfAr>
              <PdfNum style={styles.td}>{String(item.quantity)}</PdfNum>
            </View>
            <View style={styles.cName}>
              <PdfMixed style={styles.tdName} wrapStyle={{ justifyContent: "flex-end" }}>
                {productName}
              </PdfMixed>
            </View>
            <View style={[styles.cImg, { alignItems: "center" }]}>
              {productImageSrc ? (
                <Image src={productImageSrc} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPh}>
                  <PdfNum style={{ fontSize: 6, color: C.muted }}>—</PdfNum>
                </View>
              )}
            </View>
            <View style={styles.cNum}>
              <PdfNum style={styles.td}>1</PdfNum>
            </View>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          <View style={styles.panel}>
            <PdfAr style={styles.panelTitle}>الوزن والمواصفات</PdfAr>
            {item.weightKg != null && <Spec label="الوزن" value={`${item.weightKg} كغ`} />}
            {item.volumeCbm != null && <Spec label="الحجم" value={`${item.volumeCbm} م³`} />}
            {item.moq != null && <Spec label="الحد الأدنى" value={`${item.moq} ${unitLabel}`} />}
            {item.leadTimeDays != null && (
              <Spec label="مدة التجهيز" value={`${item.leadTimeDays} يوم`} />
            )}
            {item.pricerNotes ? (
              <View style={{ marginTop: 6 }}>
                <PdfAr style={{ fontSize: 8, color: C.muted, textAlign: "right" }}>
                  {`ملاحظة: ${item.pricerNotes}`}
                </PdfAr>
              </View>
            ) : null}
          </View>

          <View style={styles.panel}>
            <PdfAr style={styles.panelTitle}>ملخص المبالغ</PdfAr>
            <MoneyRow label="تكلفة المنتج" value={fmt(invoice.subtotal)} />
            <MoneyRow label="أجور الشحن الداخلي" value={`+ ${fmt(invoice.shipping)}`} />
            <MoneyRow
              label={
                invoice.markup > 0
                  ? `عمولة المكتب (${formatMarkupPercent(invoice.markup)})`
                  : "عمولة المكتب"
              }
              value={invoice.markup > 0 ? `+ ${fmt(markupAmount)}` : "—"}
              accent={invoice.markup > 0}
            />
            <View style={styles.grand}>
              <PdfAr style={styles.grandLbl}>الإجمالي النهائي</PdfAr>
              <PdfNum style={styles.grandVal}>{fmt(invoice.grandTotal)}</PdfNum>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <PdfAr style={styles.footerMain}>شكراً لثقتكم بنا — نسعد بخدمتكم دائماً</PdfAr>
          <PdfAr style={styles.footerSub}>
            {`الأسعار لا تشمل الشحن الدولي · ${companyName}`}
          </PdfAr>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <PdfAr style={styles.footerSub}>هاتف: </PdfAr>
            <PdfNum style={styles.footerSub}>{companyPhone}</PdfNum>
          </View>
        </View>
      </Page>
    </Document>
  );
}
