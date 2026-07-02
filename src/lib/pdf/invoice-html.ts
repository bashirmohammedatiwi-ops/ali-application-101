import type { Invoice, OrderItem, Customer, AppSettings } from "@/generated/prisma/client";
import { BRAND } from "@/lib/constants";
import { formatMarkupPercent } from "@/lib/markup";
import { formatPdfAmount, formatPdfDate, CURRENCY_LABELS_AR } from "@/lib/pdf-format";
import { getEmbeddedFontCss } from "@/lib/pdf/font-embed";

export type InvoiceHtmlInput = {
  invoice: Invoice & { grandTotal: number };
  item: OrderItem;
  customer: Customer;
  settings: AppSettings;
  unitLabel: string;
  markupAmount: number;
  logoDataUri: string | null;
  productImageDataUri: string | null;
};

function esc(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function specRow(label: string, value: string): string {
  return `<div class="spec-row"><span class="spec-label">${esc(label)}</span><span class="spec-value">${esc(value)}</span></div>`;
}

function moneyRow(label: string, value: string, accent = false): string {
  return `<div class="money-row${accent ? " accent" : ""}"><span>${esc(label)}</span><span class="num">${esc(value)}</span></div>`;
}

export async function buildInvoiceHtml(data: InvoiceHtmlInput): Promise<string> {
  const { invoice, item, customer, settings, unitLabel, markupAmount, logoDataUri, productImageDataUri } =
    data;

  const currency = item.currency;
  const currencyName = CURRENCY_LABELS_AR[currency] ?? currency;
  const productName = item.productNameAr || item.productNameEn || "—";
  const productNameEn =
    item.productNameAr && item.productNameEn && item.productNameEn !== item.productNameAr
      ? item.productNameEn
      : null;
  const companyName = settings.companyNameAr || BRAND.nameAr;
  const companyAddress = settings.companyAddressAr || BRAND.addressAr;
  const companyPhone = settings.companyPhone || BRAND.phone;
  const fmt = (n: number) => formatPdfAmount(n, currency);
  const location = [customer.city, customer.address].filter(Boolean).join(" — ");

  const specs: string[] = [];
  if (item.weightKg != null) specs.push(specRow("الوزن", `${item.weightKg} كغ`));
  if (item.volumeCbm != null) specs.push(specRow("الحجم", `${item.volumeCbm} م³`));
  if (item.moq != null) specs.push(specRow("الحد الأدنى", `${item.moq} ${unitLabel}`));
  if (item.leadTimeDays != null) specs.push(specRow("مدة التجهيز", `${item.leadTimeDays} يوم`));

  const markupLabel =
    invoice.markup > 0
      ? `عمولة المكتب (${formatMarkupPercent(invoice.markup)})`
      : "عمولة المكتب";
  const markupValue = invoice.markup > 0 ? `+ ${fmt(markupAmount)}` : "—";

  const fontCss = await getEmbeddedFontCss();
  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="logo">`
    : `<span class="logo-letter">م</span>`;

  const productImgHtml = productImageDataUri
    ? `<img class="thumb" src="${productImageDataUri}" alt="">`
    : `<span class="thumb-ph">—</span>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
${fontCss}
:root {
  --primary: #3C3C3B;
  --accent: #E85C24;
  --accent-soft: #FFF4EF;
  --muted: #8A8580;
  --border: #E8E3DD;
  --ink: #2A2928;
  --paper: #FAF8F6;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  font-family: 'Noto Arabic', 'Segoe UI', Tahoma, sans-serif;
  font-size: 10pt;
  color: var(--ink);
  background: #fff;
  direction: rtl;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.num, .ltr {
  direction: ltr;
  unicode-bidi: isolate;
  font-variant-numeric: tabular-nums;
}
.page { width: 100%; }

/* ── Header ── */
.top-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--accent), #f09060);
  border-radius: 2px;
  margin-bottom: 18px;
}
.header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border);
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logo-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(60,60,59,0.1);
  padding: 8px;
}
.logo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.logo-letter {
  font-size: 22pt;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}
.brand-text { text-align: right; }
.company-name {
  font-size: 15pt;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.3;
  margin-bottom: 4px;
}
.company-line {
  font-size: 8.5pt;
  color: var(--muted);
  line-height: 1.6;
}
.invoice-id {
  text-align: left;
  min-width: 160px;
}
.invoice-id-label {
  font-size: 8pt;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.invoice-id-number {
  font-size: 16pt;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.2;
  margin-bottom: 6px;
}
.invoice-id-date {
  font-size: 9pt;
  color: var(--ink);
  font-weight: 700;
}

/* ── Info strip ── */
.info-strip {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}
.info-card {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
}
.info-card-title {
  font-size: 8.5pt;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.field { text-align: right; }
.field.full { grid-column: 1 / -1; }
.field-label {
  font-size: 7.5pt;
  color: var(--muted);
  margin-bottom: 2px;
}
.field-value {
  font-size: 9.5pt;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
}
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.meta-item { text-align: right; }
.meta-label { font-size: 7.5pt; color: var(--muted); margin-bottom: 2px; }
.meta-value { font-size: 9.5pt; font-weight: 700; }

/* ── Product table ── */
.section-title {
  font-size: 9.5pt;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
  padding-right: 10px;
  border-right: 3px solid var(--accent);
}
table.products {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
table.products thead th {
  background: var(--primary);
  color: #fff;
  font-size: 8pt;
  font-weight: 700;
  padding: 9px 8px;
  text-align: center;
}
table.products tbody td {
  font-size: 9pt;
  padding: 12px 8px;
  text-align: center;
  vertical-align: middle;
  border-top: 1px solid var(--border);
  background: #fff;
}
table.products tbody tr:nth-child(even) td { background: var(--paper); }
.col-name { text-align: right !important; padding-right: 12px !important; }
.product-name {
  font-size: 9.5pt;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}
.product-name-en {
  font-size: 8pt;
  color: var(--muted);
  margin-top: 3px;
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  font-weight: 400;
}
.thumb {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.thumb-ph {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  border: 1px dashed var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 8pt;
  background: var(--paper);
}
.qty-cell { white-space: nowrap; }

/* ── Bottom panels ── */
.bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}
.panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.panel-head {
  background: var(--primary);
  color: #fff;
  font-size: 8.5pt;
  font-weight: 700;
  padding: 8px 12px;
  text-align: right;
}
.panel-body { padding: 10px 12px; background: #fff; }
.spec-row, .money-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  font-size: 8.5pt;
  border-bottom: 1px dashed var(--border);
}
.spec-row:last-of-type, .money-row:last-of-type { border-bottom: none; }
.spec-label, .money-row > span:first-child { color: var(--muted); }
.spec-value, .money-row .num { font-weight: 700; }
.money-row.accent > span:first-child { color: var(--accent); }
.note {
  margin-top: 8px;
  padding: 8px;
  background: var(--accent-soft);
  border-radius: 6px;
  font-size: 8pt;
  color: var(--ink);
  text-align: right;
  line-height: 1.5;
}
.grand-box {
  margin-top: 10px;
  padding: 12px;
  background: var(--accent-soft);
  border: 2px solid var(--accent);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.grand-label { font-size: 11pt; font-weight: 700; color: var(--primary); }
.grand-value { font-size: 13pt; font-weight: 700; color: var(--accent); white-space: nowrap; }

/* ── Footer ── */
.footer {
  text-align: center;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}
.footer-main {
  font-size: 9pt;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 4px;
}
.footer-sub { font-size: 7.5pt; color: var(--muted); line-height: 1.6; }
</style>
</head>
<body>
<div class="page">
  <div class="top-bar"></div>

  <header class="header">
    <div class="brand">
      <div class="logo-wrap">${logoHtml}</div>
      <div class="brand-text">
        <div class="company-name">${esc(companyName)}</div>
        <div class="company-line">${esc(companyAddress)}</div>
        <div class="company-line">هاتف: <span class="num">${esc(companyPhone)}</span></div>
      </div>
    </div>
    <div class="invoice-id">
      <div class="invoice-id-label">رقم الفاتورة</div>
      <div class="invoice-id-number num">${esc(invoice.invoiceNumber)}</div>
      <div class="invoice-id-date">${esc(formatPdfDate(invoice.createdAt))}</div>
    </div>
  </header>

  <section class="info-strip">
    <div class="info-card">
      <div class="info-card-title">بيانات العميل</div>
      <div class="field-grid">
        <div class="field">
          <div class="field-label">الاسم</div>
          <div class="field-value">${esc(customer.name)}</div>
        </div>
        <div class="field">
          <div class="field-label">الهاتف</div>
          <div class="field-value num">${esc(customer.phone)}</div>
        </div>
        ${
          location
            ? `<div class="field full">
          <div class="field-label">العنوان</div>
          <div class="field-value">${esc(location)}</div>
        </div>`
            : ""
        }
      </div>
    </div>
    <div class="info-card">
      <div class="info-card-title">تفاصيل الطلب</div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">رقم الطلب</div>
          <div class="meta-value num">${esc(item.refNumber)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">العملة</div>
          <div class="meta-value">${esc(currencyName)}</div>
        </div>
      </div>
    </div>
  </section>

  <div class="section-title">تفاصيل المنتج</div>
  <table class="products">
    <thead>
      <tr>
        <th style="width:32px">#</th>
        <th style="width:60px">الصورة</th>
        <th>المنتج</th>
        <th style="width:80px">الكمية</th>
        <th style="width:90px">سعر الوحدة</th>
        <th style="width:90px">المجموع</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="num">1</td>
        <td>${productImgHtml}</td>
        <td class="col-name">
          <div class="product-name">${esc(productName)}</div>
          ${productNameEn ? `<div class="product-name-en">${esc(productNameEn)}</div>` : ""}
        </td>
        <td class="qty-cell"><span class="num">${esc(item.quantity)}</span> ${esc(unitLabel)}</td>
        <td class="num">${esc(fmt(item.unitPrice ?? 0))}</td>
        <td class="num">${esc(fmt(invoice.subtotal))}</td>
      </tr>
    </tbody>
  </table>

  <section class="bottom">
    <div class="panel">
      <div class="panel-head">الوزن والمواصفات</div>
      <div class="panel-body">
        ${specs.join("") || `<div class="note" style="margin-top:0;background:var(--paper)">لا توجد مواصفات إضافية</div>`}
        ${item.pricerNotes ? `<div class="note">ملاحظة المُسعّر: ${esc(item.pricerNotes)}</div>` : ""}
      </div>
    </div>
    <div class="panel">
      <div class="panel-head">ملخص المبالغ</div>
      <div class="panel-body">
        ${moneyRow("تكلفة المنتج", fmt(invoice.subtotal))}
        ${moneyRow("أجور الشحن الداخلي", `+ ${fmt(invoice.shipping)}`)}
        ${moneyRow(markupLabel, markupValue, invoice.markup > 0)}
        <div class="grand-box">
          <span class="grand-label">الإجمالي النهائي</span>
          <span class="grand-value num">${esc(fmt(invoice.grandTotal))}</span>
        </div>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-main">شكراً لثقتكم بنا — نسعد بخدمتكم دائماً</div>
    <div class="footer-sub">الأسعار لا تشمل الشحن الدولي · ${esc(companyName)}</div>
    <div class="footer-sub">هاتف: <span class="num">${esc(companyPhone)}</span></div>
  </footer>
</div>
</body>
</html>`;
}
