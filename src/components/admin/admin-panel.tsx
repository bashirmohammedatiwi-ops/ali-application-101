"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SectionCard, Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/action-tile";
import { createUser, updateSettings, toggleUserActive } from "@/actions/orders";
import { ROLES } from "@/lib/constants";
import { t, type Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import type { AppSettings } from "@/generated/prisma/client";
import { Loader2, Settings, Users, ScrollText } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof ROLES;
  language: string;
  active: boolean;
  createdAt: Date;
};

type AuditRow = {
  id: string;
  entityType: string;
  action: string;
  details: string | null;
  createdAt: Date;
  user: { name: string };
};

export function AdminPanel({
  locale,
  users,
  auditLogs,
  settings,
}: {
  locale: Locale;
  users: UserRow[];
  auditLogs: AuditRow[];
  settings: AppSettings | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "ORDER_TAKER" as "ORDER_TAKER" | "PRICER" | "MANAGER",
  });
  const [appSettings, setAppSettings] = useState({
    companyAddressAr: settings?.companyAddressAr ?? "",
    companyPhone: settings?.companyPhone ?? "",
    usdToCnyRate: String(settings?.usdToCnyRate ?? 7.2),
    usdToIqdRate: String(settings?.usdToIqdRate ?? 1310),
  });

  function handleCreateUser() {
    startTransition(async () => {
      await createUser(newUser);
      setNewUser({ name: "", email: "", password: "", role: "ORDER_TAKER" });
      router.refresh();
    });
  }

  function handleSaveSettings() {
    startTransition(async () => {
      await updateSettings({
        companyAddressAr: appSettings.companyAddressAr.trim(),
        companyPhone: appSettings.companyPhone.trim(),
        usdToCnyRate: parseFloat(appSettings.usdToCnyRate) || 7.2,
        usdToIqdRate: parseFloat(appSettings.usdToIqdRate) || 1310,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pb-4">
      <SectionCard
        title={t("settings", locale)}
        icon={<Settings className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <Input
            label={t("companyAddress", locale)}
            hint={t("companyAddressHint", locale)}
            value={appSettings.companyAddressAr}
            onChange={(e) =>
              setAppSettings({ ...appSettings, companyAddressAr: e.target.value })
            }
          />
          <Input
            label={t("companyPhone", locale)}
            hint={t("companyPhoneHint", locale)}
            value={appSettings.companyPhone}
            onChange={(e) =>
              setAppSettings({ ...appSettings, companyPhone: e.target.value })
            }
            dir="ltr"
          />
          <Input
            label={t("exchangeRate", locale)}
            hint={t("exchangeRateHint", locale)}
            type="number"
            step="0.01"
            min="0"
            value={appSettings.usdToCnyRate}
            onChange={(e) =>
              setAppSettings({ ...appSettings, usdToCnyRate: e.target.value })
            }
            dir="ltr"
          />
          <Input
            label={t("exchangeRateIqd", locale)}
            hint={t("exchangeRateIqdHint", locale)}
            type="number"
            step="1"
            min="0"
            value={appSettings.usdToIqdRate}
            onChange={(e) =>
              setAppSettings({ ...appSettings, usdToIqdRate: e.target.value })
            }
            dir="ltr"
          />
          <Button fullWidth disabled={pending} onClick={handleSaveSettings}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save", locale)}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t("users", locale)}
        subtitle={`${users.length} ${locale === "en" ? "accounts" : "حساب"}`}
        icon={<Users className="h-5 w-5" />}
      >
        <div className="space-y-3 mb-5">
          {users.map((u) => (
            <div
              key={u.id}
              className={`rounded-2xl p-4 flex items-start gap-3 ${
                !u.active ? "opacity-50 bg-gray-50" : "bg-[var(--field-bg)]"
              }`}
            >
              <Avatar name={u.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-brand">{u.name}</p>
                <p className="text-xs text-gray-400 mt-0.5" dir="ltr">
                  {u.email}
                </p>
                <p className="text-xs text-accent font-semibold mt-1.5">
                  {ROLES[u.role][locale === "en" ? "en" : "ar"]}
                  {!u.active && (
                    <span className="text-red-500 ms-2">
                      ({locale === "en" ? "Inactive" : "معطّل"})
                    </span>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant={u.active ? "danger" : "secondary"}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await toggleUserActive(u.id, !u.active);
                    router.refresh();
                  })
                }
              >
                {u.active
                  ? locale === "en"
                    ? "Disable"
                    : "تعطيل"
                  : locale === "en"
                    ? "Enable"
                    : "تفعيل"}
              </Button>
            </div>
          ))}
        </div>
        <div className="space-y-4 pt-4 border-t border-border">
          <p className="text-sm font-bold text-brand">
            {locale === "en" ? "Add User" : "إضافة مستخدم"}
          </p>
          <Input
            label={t("customerName", locale)}
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <Input
            label={t("email", locale)}
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            dir="ltr"
          />
          <Input
            label={t("password", locale)}
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            dir="ltr"
          />
          <Select
            label={t("role", locale)}
            value={newUser.role}
            onChange={(e) =>
              setNewUser({
                ...newUser,
                role: e.target.value as typeof newUser.role,
              })
            }
            options={Object.entries(ROLES).map(([value, labels]) => ({
              value,
              label: locale === "en" ? labels.en : labels.ar,
            }))}
          />
          <Button fullWidth disabled={pending} onClick={handleCreateUser}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save", locale)}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t("auditLog", locale)}
        icon={<ScrollText className="h-5 w-5" />}
      >
        {auditLogs.length === 0 ? (
          <Card className="text-center py-8 text-gray-400 text-sm" padding>
            {t("noResults", locale)}
          </Card>
        ) : (
          <div className="space-y-0 max-h-72 overflow-y-auto divide-y divide-border/60">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 first:pt-0">
                <p className="text-sm font-semibold text-brand">
                  {log.user.name}{" "}
                  <span className="text-gray-400 font-normal">· {log.action}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.entityType} · {formatDate(log.createdAt, locale)}
                </p>
                {log.details && (
                  <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
