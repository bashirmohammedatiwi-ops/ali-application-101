import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { getUsers, getAuditLogs } from "@/lib/queries";
import { getSettings } from "@/lib/cache";
import { getLocaleFromRole } from "@/lib/i18n";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";

const AdminPanel = dynamic(
  () =>
    import("@/components/admin/admin-panel").then((m) => ({
      default: m.AdminPanel,
    })),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    ),
  }
);

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!hasPermission(user!.role, "manage_users")) redirect("/dashboard");

  const locale = getLocaleFromRole(user!.role);
  const [users, auditLogs, settings] = await Promise.all([
    getUsers(),
    getAuditLogs(),
    getSettings(),
  ]);

  return (
    <div className="page-container">
      <PageHeader
        title={locale === "en" ? "Administration" : "الإدارة"}
        subtitle={
          locale === "en"
            ? "Users, settings & audit log"
            : "المستخدمون والإعدادات وسجل العمليات"
        }
      />
      <AdminPanel
        locale={locale}
        users={users}
        auditLogs={auditLogs}
        settings={settings}
      />
    </div>
  );
}
