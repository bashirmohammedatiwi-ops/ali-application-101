import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export const CACHE_TAGS = {
  dashboard: "dashboard-stats",
  settings: "app-settings",
} as const;

async function fetchDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    todayCount,
    receivedCount,
    pricingCount,
    pricedCount,
    archivedCount,
    overduePricing,
    recentItems,
  ] = await Promise.all([
    prisma.orderItem.count({ where: { createdAt: { gte: today } } }),
    prisma.orderItem.count({ where: { status: "RECEIVED" } }),
    prisma.orderItem.count({ where: { status: "PRICING" } }),
    prisma.orderItem.count({ where: { status: "PRICED" } }),
    prisma.orderItem.count({ where: { status: "ARCHIVED" } }),
    prisma.orderItem.count({
      where: { status: "PRICING", updatedAt: { lt: overdueCutoff } },
    }),
    prisma.orderItem.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { take: 1 },
        request: { include: { customer: true } },
        invoice: true,
      },
    }),
  ]);

  return {
    todayCount,
    receivedCount,
    pricingCount,
    pricedCount,
    archivedCount,
    overduePricing,
    recentItems,
  };
}

export const getDashboardStats = unstable_cache(
  fetchDashboardStats,
  ["dashboard-stats"],
  { revalidate: 30, tags: [CACHE_TAGS.dashboard] }
);

async function fetchSettings() {
  return prisma.appSettings.findUnique({ where: { id: "default" } });
}

export const getSettings = unstable_cache(fetchSettings, ["app-settings"], {
  revalidate: 120,
  tags: [CACHE_TAGS.settings],
});
