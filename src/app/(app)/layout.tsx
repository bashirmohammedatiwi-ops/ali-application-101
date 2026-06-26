import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { initDatabase } from "@/lib/db-init";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

async function getNavBadges(role: Role): Promise<Record<string, number>> {
  const badges: Record<string, number> = {};

  const [pricingCount, pricedCount] = await Promise.all([
    prisma.orderItem.count({ where: { status: "PRICING" } }),
    prisma.orderItem.count({ where: { status: "PRICED" } }),
  ]);

  if ((role === "PRICER" || role === "MANAGER") && pricingCount > 0) {
    badges["/pricing"] = pricingCount;
  }
  if ((role === "ORDER_TAKER" || role === "MANAGER") && pricedCount > 0) {
    badges["/invoices"] = pricedCount;
  }

  return badges;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await initDatabase();
  const session = await auth();
  if (!session?.user) redirect("/login");

  const navBadges = await getNavBadges(session.user.role);

  return (
    <AppShell user={session.user} navBadges={navBadges}>
      {children}
    </AppShell>
  );
}
