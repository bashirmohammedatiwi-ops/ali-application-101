"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { AppLogo } from "@/components/ui/app-logo";
import type { Role } from "@/generated/prisma/client";
import { getLocaleFromRole, t, type Locale } from "@/lib/i18n";
import { ROLES } from "@/lib/constants";

export function AppShell({
  children,
  user,
  navBadges,
}: {
  children: React.ReactNode;
  user: { name: string; role: Role };
  navBadges?: Record<string, number>;
}) {
  const locale: Locale = getLocaleFromRole(user.role);

  return (
    <div className="app-layout min-h-dvh app-bg" dir={locale === "ar" ? "rtl" : "ltr"}>
      <AppNavigation role={user.role} locale={locale} navBadges={navBadges} />

      <div className="app-layout-body">
        <header className="app-header glass-header sticky top-0 z-40">
          <div className="app-content-width flex items-center justify-between py-3 gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 min-w-0 lg:hidden">
              <AppLogo size={44} className="h-11 w-11 shrink-0" priority />
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand leading-tight truncate">
                  {t("appName", locale)}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {ROLES[user.role][locale === "en" ? "en" : "ar"]}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0 ms-auto">
              <span className="hidden sm:inline text-xs font-medium text-gray-500 max-w-[120px] truncate">
                {user.name.split(" ")[0]}
              </span>
              <span className="hidden md:inline-flex text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-1 rounded-full">
                {ROLES[user.role][locale === "en" ? "en" : "ar"]}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label={t("logout", locale)}
                className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-gray-500 hover:text-accent hover:border-accent/30 transition-colors shadow-sm"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>

        <main className="app-main animate-fade-in">
          <div className="app-content-width">{children}</div>
        </main>
        <div className="mobile-nav-spacer lg:hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
