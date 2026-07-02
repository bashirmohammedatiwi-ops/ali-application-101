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
  const markupValue =
    invoice.markup > 0 ? `+ ${fmt(markupAmount)}` : "—";

  const fontCss = await getEmbeddedFontCss();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${fontCss}
:root {
  --primary: #3C3C3B;
  --accent: #E85C24;
  --muted: #8A8580;
  --border: #E5E0DA;
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

.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  background: var(--primary);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  color: #fff;
}
.badge {
  background: var(--accent);
  border-radius: 6px;
  padding: 10px 14px;
  text-align: center;
  min-width: 90px;
}
.badge-title { font-size: 12pt; font-weight: 700; }
.badge-sub { font-size: 8pt; opacity: 0.85; margin-top: 2px; }
.company { text-align: right; padding: 0 8px; }
.company-name { font-size: 14pt; font-weight: 700; line-height: 1.35; }
.company-sub { font-size: 8pt; color: #ccc; margin-top: 3px; line-height: 1.5; }
.logo-wrap {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  padding: 6px;
}
.logo-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 0;
  object-fit: contain;
  background: transparent;
}
.logo-ph {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 18pt;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
}

.meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.meta-box {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  text-align: right;
}
.meta-label { font-size: 7pt; color: var(--muted); margin-bottom: 4px; }
.meta-value { font-size: 9pt; font-weight: 700; line-height: 1.4; word-break: break-word; }

.block-title {
  font-size: 10pt;
  font-weight: 700;
  color: var(--accent);
  text-align: right;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid var(--accent);
}

.customer {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 14px;
}
.field {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  align-items: start;
}
.field:last-child { border-bottom: none; }
.field-label { font-size: 8pt; color: var(--muted); text-align: right; }
.field-value { font-size: 9pt; font-weight: 700; text-align: right; line-height: 1.45; word-break: break-word; }

table.products {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 14px;
}
table.products th {
  background: var(--primary);
  color: #fff;
  font-size: 8pt;
  font-weight: 700;
  padding: 8px 6px;
  text-align: center;
}
table.products td {
  font-size: 9pt;
  padding: 10px 6px;
  text-align: center;
  vertical-align: middle;
  border-top: 1px solid var(--border);
}
.product-name {
  text-align: right;
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
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid var(--border);
}
.thumb-ph {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  border: 1px dashed var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 7pt;
}

.bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.panel {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
}
.panel-title {
  font-size: 9pt;
  font-weight: 700;
  color: var(--primary);
  text-align: right;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}
.spec-row, .money-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 0;
  font-size: 8.5pt;
  border-bottom: 1px solid var(--border);
}
.spec-row:last-child, .money-row:last-child { border-bottom: none; }
.spec-label { color: var(--muted); }
.spec-value { font-weight: 700; text-align: left; }
.money-row span:first-child { color: var(--muted); text-align: right; flex: 1; }
.money-row.accent span:first-child { color: var(--accent); }
.money-row .num { font-weight: 700; white-space: nowrap; }
.note {
  margin-top: 8px;
  font-size: 8pt;
  color: var(--muted);
  text-align: right;
  line-height: 1.5;
}
.grand {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 2px solid var(--accent);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.grand-label { font-size: 10pt; font-weight: 700; color: var(--accent); }
.grand-value { font-size: 12pt; font-weight: 700; color: var(--primary); white-space: nowrap; }

.footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.footer-main { font-size: 9pt; font-weight: 700; margin-bottom: 4px; }
.footer-sub { font-size: 7.5pt; color: var(--muted); line-height: 1.5; }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <div class="badge">
      <div class="badge-title">فاتورة تسعير</div>
      <div class="badge-sub">عرض سعر رسمي</div>
    </div>
    <div class="company">
      <div class="company-name">${esc(companyName)}</div>
      <div class="company-sub">${esc(companyAddress)}</div>
      <div class="company-sub">هاتف: <span class="num">${esc(companyPhone)}</span></div>
    </div>
    <div class="logo-wrap">
      ${
        logoDataUri
          ? `<img src="${logoDataUri}" alt="logo">`
          : `<div class="logo-ph">م</div>`
      }
    </div>
  </header>

  <section class="meta">
    <div class="meta-box">
      <div class="meta-label">رقم الفاتورة</div>
      <div class="meta-value num">${esc(invoice.invoiceNumber)}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">التاريخ</div>
      <div class="meta-value">${esc(formatPdfDate(invoice.createdAt))}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">رقم الطلب</div>
      <div class="meta-value num">${esc(item.refNumber)}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">العملة</div>
      <div class="meta-value">${esc(currencyName)}</div>
    </div>
  </section>

  <h2 class="block-title">بيانات العميل</h2>
  <section class="customer">
    <div class="field">
      <span class="field-label">الاسم</span>
      <span class="field-value">${esc(customer.name)}</span>
    </div>
    <div class="field">
      <span class="field-label">الهاتف</span>
      <span class="field-value num">${esc(customer.phone)}</span>
    </div>
    ${
      location
        ? `<div class="field">
      <span class="field-label">العنوان</span>
      <span class="field-value">${esc(location)}</span>
    </div>`
        : ""
    }
  </section>

  <h2 class="block-title">تفاصيل المنتج</h2>
  <table class="products">
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th style="width:52px">صورة</th>
        <th>اسم المنتج</th>
        <th style="width:72px">الكمية</th>
        <th style="width:88px">سعر القطعة</th>
        <th style="width:88px">المجموع</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="num">1</td>
        <td>
          ${
            productImageDataUri
              ? `<img class="thumb" src="${productImageDataUri}" alt="">`
              : `<span class="thumb-ph">—</span>`
          }
        </td>
        <td>
          <div class="product-name">${esc(productName)}</div>
          ${productNameEn ? `<div class="product-name-en">${esc(productNameEn)}</div>` : ""}
        </td>
        <td><span class="num">${esc(item.quantity)}</span> ${esc(unitLabel)}</td>
        <td class="num">${esc(fmt(item.unitPrice ?? 0))}</td>
        <td class="num">${esc(fmt(invoice.subtotal))}</td>
      </tr>
    </tbody>
  </table>

  <section class="bottom">
    <div class="panel">
      <div class="panel-title">الوزن والمواصفات</div>
      ${specs.join("") || `<div class="note">—</div>`}
      ${
        item.pricerNotes
          ? `<div class="note">ملاحظة: ${esc(item.pricerNotes)}</div>`
          : ""
      }
    </div>
    <div class="panel">
      <div class="panel-title">ملخص المبالغ</div>
      ${moneyRow("تكلفة المنتج", fmt(invoice.subtotal))}
      ${moneyRow("أجور الشحن الداخلي", `+ ${fmt(invoice.shipping)}`)}
      ${moneyRow(markupLabel, markupValue, invoice.markup > 0)}
      <div class="grand">
        <span class="grand-label">الإجمالي النهائي</span>
        <span class="grand-value num">${esc(fmt(invoice.grandTotal))}</span>
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
