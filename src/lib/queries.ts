import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

export async function getOrderItems(filters?: {
  status?: OrderStatus | OrderStatus[];
  search?: string;
  limit?: number;
  pricedById?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status;
  }

  if (filters?.pricedById) {
    where.pricedById = filters.pricedById;
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { productNameAr: { contains: q } },
      { productNameEn: { contains: q } },
      { refNumber: { contains: q } },
      { request: { customer: { name: { contains: q } } } },
      { request: { customer: { phone: { contains: q } } } },
      { invoice: { invoiceNumber: { contains: q } } },
    ];
  }

  return prisma.orderItem.findMany({
    where,
    take: filters?.limit ?? 50,
    orderBy: { updatedAt: "desc" },
    include: {
      images: { take: 1 },
      invoice: true,
      request: { include: { customer: true } },
      pricedBy: { select: { name: true } },
    },
  });
}

export async function getOrderItem(id: string) {
  return prisma.orderItem.findUnique({
    where: { id },
    include: {
      images: true,
      invoice: true,
      request: { include: { customer: true, createdBy: { select: { name: true } } } },
      pricedBy: { select: { name: true } },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      language: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function getAuditLogs(limit = 30) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search?.trim()
      ? {
          OR: [
            { name: { contains: search.trim() } },
            { phone: { contains: search.trim() } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      _count: { select: { requests: true } },
    },
  });
}

export async function getCustomerDetail(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: { invoice: true, images: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
}

export async function getPricerStats(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [pendingCount, myPricedCount, pricedToday, overdueCount, recentQueue, recentPriced] =
    await Promise.all([
      prisma.orderItem.count({ where: { status: "PRICING" } }),
      prisma.orderItem.count({ where: { pricedById: userId } }),
      prisma.orderItem.count({
        where: { pricedById: userId, pricedAt: { gte: today } },
      }),
      prisma.orderItem.count({
        where: { status: "PRICING", updatedAt: { lt: overdueCutoff } },
      }),
      prisma.orderItem.findMany({
        where: { status: "PRICING" },
        take: 5,
        orderBy: [{ priority: "desc" }, { updatedAt: "asc" }],
        include: {
          images: { take: 1 },
          request: { include: { customer: true } },
          invoice: true,
        },
      }),
      prisma.orderItem.findMany({
        where: { pricedById: userId },
        take: 5,
        orderBy: { pricedAt: "desc" },
        include: {
          images: { take: 1 },
          request: { include: { customer: true } },
          invoice: true,
        },
      }),
    ]);

  return {
    pendingCount,
    myPricedCount,
    pricedToday,
    overdueCount,
    recentQueue,
    recentPriced,
  };
}

export async function getKanbanItems() {
  return prisma.orderItem.findMany({
    where: {
      status: { in: ["RECEIVED", "PRICING", "PRICED", "ARCHIVED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      request: { include: { customer: true } },
    },
  });
}
