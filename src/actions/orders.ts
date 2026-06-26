"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { translateFields, buildTranslatedOrderFields } from "@/lib/translation";
import { nextRefNumber, upsertInvoiceForOrder, getOrCreateSettings } from "@/lib/orders";
import { logAudit, logStatusChange } from "@/lib/audit";
import { canTransitionStatus, hasPermission, canEditOrder, canEditPricedQuantity } from "@/lib/permissions";
import { invalidateAppData } from "@/lib/revalidate";
import type { Unit, Priority, Availability, OrderStatus } from "@/generated/prisma/client";
import { calculateCbm } from "@/lib/utils";
import { calculateInvoiceGrandTotal } from "@/lib/markup";
import { cnyToUsd, normalizeCurrency } from "@/lib/currency";
import { stringifySpecs, type ProductSpecs } from "@/lib/specs";

export async function searchCustomers(query: string) {
  await requireAuth();
  if (!query.trim()) return [];
  return prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  notes?: string;
}) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "create_customer")) throw new Error("FORBIDDEN");

  const customer = await prisma.customer.create({ data });
  await logAudit({
    entityType: "customer",
    entityId: customer.id,
    action: "create",
    userId: user.id,
  });
  return customer;
}

type ProductInput = {
  productNameAr: string;
  quantity: number;
  unit: Unit;
  productLink?: string;
  notesAr?: string;
  priority?: Priority;
  imageUrls?: string[];
  specs?: ProductSpecs;
};

export async function createOrderRequest(data: {
  customerId?: string;
  newCustomer?: {
    name: string;
    phone: string;
    whatsapp?: string;
    address?: string;
    city?: string;
  };
  source?: string;
  notes?: string;
  products: ProductInput[];
  sendToPricing?: boolean;
}) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "create_order")) throw new Error("FORBIDDEN");

  if (!data.products.length) throw new Error("NO_PRODUCTS");

  let customerId = data.customerId;
  if (!customerId && data.newCustomer) {
    const customer = await prisma.customer.create({ data: data.newCustomer });
    customerId = customer.id;
  }
  if (!customerId) throw new Error("NO_CUSTOMER");

  const refNumber = await nextRefNumber("REQ");
  const request = await prisma.customerRequest.create({
    data: {
      refNumber,
      customerId,
      source: data.source ?? "whatsapp",
      notes: data.notes,
      createdById: user.id,
    },
  });

  const createdItems = [];
  for (const product of data.products) {
    const specsJson = stringifySpecs(product.specs ?? {});
    const { productNameEn, notesEn } = await translateFields({
      productNameAr: product.productNameAr,
      notesAr: product.notesAr,
      specsJson,
    });

    const ordRef = await nextRefNumber("ORD");
    const status: OrderStatus = data.sendToPricing ? "PRICING" : "RECEIVED";

    const item = await prisma.orderItem.create({
      data: {
        refNumber: ordRef,
        requestId: request.id,
        status,
        priority: product.priority ?? "NORMAL",
        productNameAr: product.productNameAr,
        productNameEn,
        quantity: product.quantity,
        unit: product.unit,
        productLink: product.productLink || null,
        notesAr: product.notesAr || null,
        notesEn: notesEn || null,
        specsJson,
        images: product.imageUrls?.length
          ? {
              create: product.imageUrls.map((url, i) => ({
                url,
                filename: `image-${i + 1}`,
              })),
            }
          : undefined,
      },
      include: { images: true },
    });

    if (data.sendToPricing) {
      await logStatusChange({
        orderItemId: item.id,
        fromStatus: "RECEIVED",
        toStatus: "PRICING",
        changedById: user.id,
      });
    }

    await logAudit({
      entityType: "order_item",
      entityId: item.id,
      action: "create",
      details: `Created order ${ordRef}`,
      userId: user.id,
    });

    createdItems.push(item);
  }

  invalidateAppData();
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/pricing");

  return { request, items: createdItems };
}

export async function updateOrderItem(
  id: string,
  data: Partial<{
    productNameAr: string;
    quantity: number;
    unit: Unit;
    productLink: string;
    notesAr: string;
    priority: Priority;
    imageUrls: string[];
    specs: ProductSpecs;
  }>
) {
  const user = await requireAuth();
  const item = await prisma.orderItem.findUnique({ where: { id } });
  if (!item) throw new Error("NOT_FOUND");
  if (!canEditOrder(user.role, item.status)) throw new Error("CANNOT_EDIT");

  const { imageUrls, specs, ...orderData } = data;

  let productNameEn = item.productNameEn;
  let notesEn = item.notesEn;
  const nextSpecsJson =
    specs !== undefined ? stringifySpecs(specs) : item.specsJson;
  const shouldRetranslate =
    data.productNameAr || data.notesAr || specs !== undefined;

  if (shouldRetranslate) {
    const translated = await translateFields({
      productNameAr: data.productNameAr ?? item.productNameAr,
      notesAr: data.notesAr ?? item.notesAr ?? undefined,
      specsJson: nextSpecsJson,
    });
    productNameEn = translated.productNameEn;
    notesEn = translated.notesEn;
  }

  const updated = await prisma.orderItem.update({
    where: { id },
    data: {
      ...orderData,
      productNameEn,
      notesEn,
      ...(specs !== undefined && { specsJson: stringifySpecs(specs) }),
    },
  });

  if (imageUrls) {
    await prisma.orderImage.deleteMany({ where: { orderItemId: id } });
    if (imageUrls.length) {
      await prisma.orderImage.createMany({
        data: imageUrls.map((url, i) => ({
          orderItemId: id,
          url,
          filename: `image-${i + 1}`,
        })),
      });
    }
  }

  await logAudit({
    entityType: "order_item",
    entityId: id,
    action: "update",
    userId: user.id,
  });

  invalidateAppData();
  revalidatePath(`/orders/${id}`);
  revalidatePath(`/pricing/${id}`);
  revalidatePath(`/archive/${id}`);
  revalidatePath("/orders");
  revalidatePath("/pricing");
  revalidatePath("/archive");
  return updated;
}

export async function updatePricedOrderQuantity(orderItemId: string, quantity: number) {
  const user = await requireAuth();
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { invoice: true },
  });
  if (!item) throw new Error("NOT_FOUND");
  if (!canEditPricedQuantity(user.role, item.status)) throw new Error("FORBIDDEN");
  if (!item.unitPrice || !item.invoice) throw new Error("NO_INVOICE");

  const qty = Math.max(0, quantity);
  if (qty <= 0) throw new Error("INVALID_QUANTITY");

  const subtotal = qty * item.unitPrice;
  const shipping = item.internalShipping ?? 0;
  const grandTotal = calculateInvoiceGrandTotal(
    subtotal,
    shipping,
    item.invoice.markup,
    item.invoice.extraFees
  );

  await prisma.$transaction([
    prisma.orderItem.update({
      where: { id: orderItemId },
      data: { quantity: qty },
    }),
    prisma.invoice.update({
      where: { id: item.invoice.id },
      data: { subtotal, grandTotal },
    }),
  ]);

  await logAudit({
    entityType: "order_item",
    entityId: orderItemId,
    action: "update_quantity",
    details: `quantity=${qty}`,
    userId: user.id,
  });

  invalidateAppData();
  revalidatePath(`/orders/${orderItemId}`);
  revalidatePath(`/invoices/${orderItemId}`);
  revalidatePath(`/pricing/${orderItemId}`);
  revalidatePath("/invoices");
}

export async function sendToPricing(orderItemId: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "send_to_pricing")) throw new Error("FORBIDDEN");

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");
  if (!canTransitionStatus(user.role, item.status, "PRICING")) throw new Error("FORBIDDEN");

  await ensureOrderItemTranslation(orderItemId);

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status: "PRICING" },
  });

  await logStatusChange({
    orderItemId,
    fromStatus: item.status,
    toStatus: "PRICING",
    changedById: user.id,
  });

  invalidateAppData();
  revalidatePath("/orders");
  revalidatePath("/pricing");
  revalidatePath("/dashboard");
}

export async function submitPricing(
  orderItemId: string,
  data: {
    unitPrice: number;
    internalShipping: number;
    weightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    volumeCbm?: number;
    moq?: number;
    leadTimeDays?: number;
    pricerNotes?: string;
    available?: Availability;
    alternativeLink?: string;
    currency?: string;
  }
) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "price_order")) throw new Error("FORBIDDEN");

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");
  if (item.status !== "PRICING") throw new Error("INVALID_STATUS");

  const volumeCbm =
    data.volumeCbm ??
    calculateCbm(data.lengthCm, data.widthCm, data.heightCm) ??
    undefined;

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      unitPrice: data.unitPrice,
      internalShipping: data.internalShipping,
      weightKg: data.weightKg,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      volumeCbm,
      moq: data.moq,
      leadTimeDays: data.leadTimeDays,
      pricerNotes: data.pricerNotes,
      available: data.available,
      alternativeLink: data.alternativeLink,
      currency: normalizeCurrency(data.currency),
      status: "PRICED",
      pricedAt: new Date(),
      pricedById: user.id,
    },
  });

  await logStatusChange({
    orderItemId,
    fromStatus: "PRICING",
    toStatus: "PRICED",
    changedById: user.id,
  });

  await upsertInvoiceForOrder(orderItemId);

  invalidateAppData();
  revalidatePath("/pricing");
  revalidatePath("/priced");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function returnToReceived(orderItemId: string, reason: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "return_to_received")) throw new Error("FORBIDDEN");

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");
  if (!canTransitionStatus(user.role, item.status, "RECEIVED")) throw new Error("FORBIDDEN");

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      status: "RECEIVED",
      unitPrice: null,
      internalShipping: null,
      pricedAt: null,
      pricedById: null,
    },
  });

  await logStatusChange({
    orderItemId,
    fromStatus: item.status,
    toStatus: "RECEIVED",
    reason,
    changedById: user.id,
  });

  invalidateAppData();
  revalidatePath("/pricing");
  revalidatePath("/orders");
}

export async function returnToPricing(orderItemId: string, reason: string) {
  const user = await requireAuth();
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { invoice: true },
  });
  if (!item) throw new Error("NOT_FOUND");

  if (item.status === "PRICED") {
    if (!hasPermission(user.role, "return_from_priced")) throw new Error("FORBIDDEN");
  } else if (item.status === "ARCHIVED") {
    if (!hasPermission(user.role, "send_to_pricing")) throw new Error("FORBIDDEN");
  } else {
    throw new Error("INVALID_STATUS");
  }

  if (item.invoice) {
    await prisma.invoice.delete({ where: { id: item.invoice.id } });
  }

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      status: "PRICING",
      customerNotifiedAt: null,
      archivedAt: null,
    },
  });

  await logStatusChange({
    orderItemId,
    fromStatus: item.status,
    toStatus: "PRICING",
    reason,
    changedById: user.id,
  });

  invalidateAppData();
  revalidatePath("/invoices");
  revalidatePath("/pricing");
  revalidatePath(`/pricing/${orderItemId}`);
  revalidatePath("/archive");
  revalidatePath(`/archive/${orderItemId}`);
  revalidatePath("/orders");
}

export async function notifyAndArchive(orderItemId: string, sentVia = "whatsapp") {
  const user = await requireAuth();
  if (!hasPermission(user.role, "archive_order")) throw new Error("FORBIDDEN");

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { invoice: true },
  });
  if (!item || item.status !== "PRICED") throw new Error("INVALID_STATUS");

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      status: "ARCHIVED",
      customerNotifiedAt: new Date(),
      archivedAt: new Date(),
    },
  });

  if (item.invoice) {
    await prisma.invoice.update({
      where: { id: item.invoice.id },
      data: {
        sentAt: new Date(),
        sentVia,
        sentById: user.id,
      },
    });
  }

  await logStatusChange({
    orderItemId,
    fromStatus: "PRICED",
    toStatus: "ARCHIVED",
    changedById: user.id,
  });

  invalidateAppData();
  revalidatePath("/invoices");
  revalidatePath("/archive");
  revalidatePath("/dashboard");
}

export async function returnFromArchive(orderItemId: string, reason: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "return_from_archived")) throw new Error("FORBIDDEN");

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");
  if (item.status !== "ARCHIVED") throw new Error("INVALID_STATUS");

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      status: "PRICED",
      archivedAt: null,
    },
  });

  await logStatusChange({
    orderItemId,
    fromStatus: "ARCHIVED",
    toStatus: "PRICED",
    reason,
    changedById: user.id,
  });

  invalidateAppData();
  revalidatePath("/archive");
  revalidatePath("/invoices");
}

export async function updateInvoiceMarkup(invoiceId: string, markupPercent: number) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "edit_markup")) throw new Error("FORBIDDEN");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("NOT_FOUND");

  const markupPercentClamped = Math.max(0, markupPercent);
  const grandTotal = calculateInvoiceGrandTotal(
    invoice.subtotal,
    invoice.shipping,
    markupPercentClamped,
    invoice.extraFees
  );
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { markup: markupPercentClamped, grandTotal },
  });
}

export async function convertInvoiceToUsd(invoiceId: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "edit_markup")) throw new Error("FORBIDDEN");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { orderItem: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const item = invoice.orderItem;
  if (item.currency !== "CNY") throw new Error("NOT_CNY");
  if (!item.unitPrice) throw new Error("NO_PRICE");

  const settings = await getOrCreateSettings();
  if (settings.usdToCnyRate <= 0) throw new Error("INVALID_RATE");

  const unitPrice = cnyToUsd(item.unitPrice, settings.usdToCnyRate);
  const internalShipping = cnyToUsd(item.internalShipping ?? 0, settings.usdToCnyRate);
  const subtotal = cnyToUsd(invoice.subtotal, settings.usdToCnyRate);
  const shipping = cnyToUsd(invoice.shipping, settings.usdToCnyRate);
  const grandTotal = calculateInvoiceGrandTotal(subtotal, shipping, invoice.markup, invoice.extraFees);

  await prisma.$transaction([
    prisma.orderItem.update({
      where: { id: item.id },
      data: { unitPrice, internalShipping, currency: "USD" },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, shipping, grandTotal },
    }),
  ]);

  invalidateAppData();
  revalidatePath("/invoices");
  revalidatePath("/archive");
}

export async function updateSettings(data: { usdToCnyRate?: number }) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "manage_users")) throw new Error("FORBIDDEN");

  const updated = await prisma.appSettings.update({
    where: { id: "default" },
    data,
  });
  invalidateAppData();
  return updated;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ORDER_TAKER" | "PRICER" | "MANAGER";
  language?: string;
}) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "manage_users")) throw new Error("FORBIDDEN");

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      language: data.language ?? (data.role === "PRICER" ? "en" : "ar"),
    },
  });
}

export async function sendAllToPricing(requestId: string) {
  const user = await requireAuth();
  const items = await prisma.orderItem.findMany({
    where: { requestId, status: "RECEIVED" },
  });

  for (const item of items) {
    await sendToPricing(item.id);
  }

  invalidateAppData();
  revalidatePath("/orders");
  revalidatePath("/pricing");
  return items.length;
}

export async function bulkSendReceivedToPricing() {
  await requireAuth();
  const items = await prisma.orderItem.findMany({
    where: { status: "RECEIVED" },
  });

  for (const item of items) {
    await sendToPricing(item.id);
  }

  invalidateAppData();
  revalidatePath("/orders");
  revalidatePath("/pricing");
  revalidatePath("/dashboard");
  return items.length;
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    notes?: string;
  }
) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "create_customer")) throw new Error("FORBIDDEN");

  const updated = await prisma.customer.update({ where: { id }, data });
  await logAudit({
    entityType: "customer",
    entityId: id,
    action: "update",
    userId: user.id,
  });
  revalidatePath(`/customers/${id}`);
  return updated;
}

export async function toggleUserActive(userId: string, active: boolean) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "manage_users")) throw new Error("FORBIDDEN");
  if (user.id === userId) throw new Error("CANNOT_DEACTIVATE_SELF");

  return prisma.user.update({
    where: { id: userId },
    data: { active },
  });
}

/** Ensure Arabic fields are translated to English for the pricer */
export async function ensureOrderItemTranslation(orderItemId: string) {
  await requireAuth();

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");
  if (item.productNameEn?.trim()) return false;

  const translated = await buildTranslatedOrderFields(item);
  if (!translated) return false;

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      productNameEn: translated.productNameEn,
      notesEn: translated.notesEn || item.notesEn,
    },
  });
  return true;
}

/** Manual re-translate (pricer / manager) */
export async function retranslateOrderItem(orderItemId: string) {
  const user = await requireAuth();
  if (!hasPermission(user.role, "price_order") && user.role !== "MANAGER") {
    throw new Error("FORBIDDEN");
  }

  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
  if (!item) throw new Error("NOT_FOUND");

  const translated = await translateFields({
    productNameAr: item.productNameAr,
    notesAr: item.notesAr ?? undefined,
    specsJson: item.specsJson,
  });

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: {
      productNameEn: translated.productNameEn,
      notesEn: translated.notesEn,
    },
  });

  invalidateAppData();
  revalidatePath(`/pricing/${orderItemId}`);
  revalidatePath("/pricing");
  return updated;
}
