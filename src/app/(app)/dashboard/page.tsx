import { getSessionUser } from "@/lib/session-user";
import { getPricerStats } from "@/lib/queries";
import { getLocaleFromRole } from "@/lib/i18n";
import { PricerDashboard } from "@/components/pricing/pricer-dashboard";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const locale = getLocaleFromRole(user!.role);
  const firstName = user!.name.split(" ")[0];

  if (user!.role === "PRICER") {
    const stats = await getPricerStats(user!.id);
    return <PricerDashboard stats={stats} locale={locale} firstName={firstName} />;
  }

  const { default: OtherDashboard } = await import("./other-dashboard");
  return <OtherDashboard user={user!} locale={locale} firstName={firstName} />;
}
