import { prisma } from "@/lib/db";
import { generateRef } from "@/lib/utils";
import { calculateInvoiceGrandTotal } from "@/lib/markup";

export async function nextRefNumber(type: "REQ" | "ORD" | "INV") {
  const year = new Date().getFullYear();
  const prefix = `${type}-${year}-`;

  let count = 0;
  if (type === "REQ") {
    count = await prisma.customerRequest.count({
      where: { refNumber: { startsWith: prefix } },
    });
  } else if (type === "ORD") {
    count = await prisma.orderItem.count({
      where: { refNumber: { startsWith: prefix } },
    });
  } else {
    count = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
  }

  return generateRef(type, count + 1);
}

export async function getOrCreateSettings() {
  let settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.appSettings.create({ data: { id: "default" } });
  }
  return settings;
}

/** Create or refresh invoice totals for a priced order (markup stays per-invoice) */
export async function upsertInvoiceForOrder(orderItemId: string) {
  const order = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { invoice: true },
  });
  if (!order || !order.unitPrice) return null;

  const subtotal = order.quantity * order.unitPrice;
  const shipping = order.internalShipping ?? 0;
  const extraFees = order.invoice?.extraFees ?? 0;
  const markupPercent = order.invoice?.markup ?? 0;
  const grandTotal = calculateInvoiceGrandTotal(subtotal, shipping, markupPercent, extraFees);

  if (order.invoice) {
    return prisma.invoice.update({
      where: { id: order.invoice.id },
      data: { subtotal, shipping, grandTotal },
    });
  }

  const invoiceNumber = await nextRefNumber("INV");
  return prisma.invoice.create({
    data: {
      invoiceNumber,
      orderItemId,
      subtotal,
      shipping,
      markup: 0,
      grandTotal: subtotal + shipping,
    },
  });
}
