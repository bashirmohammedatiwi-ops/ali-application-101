"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Plus,
  Package,
  DollarSign,
  FileText,
  Archive,
  ClipboardCheck,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, MORE_NAV_ITEMS, FAB_HREF } from "@/lib/constants";
import { MoreMenu } from "@/components/layout/more-menu";
import { AppLogo } from "@/components/ui/app-logo";
import type { Role } from "@/generated/prisma/client";
import { t, type Locale } from "@/lib/i18n";

const ICONS: Record<string, LucideIcon> = {
  Home,
  Plus,
  Package,
  DollarSign,
  FileText,
  Archive,
  ClipboardCheck,
  LayoutGrid,
};

function NavBadge({ count }: { count: number }) {
  return (
    <span className="nav-dock-badge" aria-hidden>
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppNavigation({
  role,
  locale,
  navBadges = {},
}: {
  role: Role;
  locale: Locale;
  navBadges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = NAV_ITEMS[role];
  const moreItems = MORE_NAV_ITEMS[role] ?? [];
  const fabHref = FAB_HREF[role];
  const hasMore = moreItems.length > 0;

  function isActive(href: string) {
    if (href === "more") {
      return moreItems.some((m) => pathname.startsWith(m.href));
    }
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderDockLink(
    item: (typeof items)[number],
    variant: "dock" | "sidebar"
  ) {
    const Icon = ICONS[item.icon];
    const label = locale === "en" ? item.labelEn : item.labelAr;

    if (item.href === "more") {
      if (!hasMore) return null;
      if (variant === "sidebar") {
        return (
          <button
            key="more"
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn("app-sidebar-link", isActive("more") && "app-sidebar-link--active")}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-start truncate">{label}</span>
          </button>
        );
      }
      return (
        <button
          key="more"
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn("nav-dock-link", isActive("more") && "nav-dock-link--active")}
          aria-label={label}
        >
          <span className="nav-dock-icon-wrap">
            <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
          </span>
          <span className="nav-dock-label">{label}</span>
        </button>
      );
    }

    const active = isActive(item.href);
    const isFab = fabHref === item.href;
    const badge = navBadges[item.href];

    if (variant === "sidebar") {
      if (isFab) {
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn("app-sidebar-fab", active && "app-sidebar-fab--active")}
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
            <span>{label}</span>
          </a>
        );
      }
      return (
        <a
          key={item.href}
          href={item.href}
          className={cn("app-sidebar-link", active && "app-sidebar-link--active")}
          aria-current={active ? "page" : undefined}
        >
          <span className="relative shrink-0">
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {badge != null && badge > 0 && <NavBadge count={badge} />}
          </span>
          <span className="flex-1 text-start truncate">{label}</span>
        </a>
      );
    }

    return (
      <a
        key={item.href}
        href={item.href}
        className={cn(
          "nav-dock-link",
          active && !isFab && "nav-dock-link--active",
          isFab && "nav-dock-fab"
        )}
        aria-current={active ? "page" : undefined}
      >
        <span
          className={cn(
            "nav-dock-icon-wrap",
            isFab && "nav-dock-fab-inner",
            isFab && active && "nav-dock-fab-inner--active"
          )}
        >
          <Icon className={cn(isFab ? "h-6 w-6" : "h-[21px] w-[21px]")} strokeWidth={active || isFab ? 2.5 : 2} />
          {badge != null && badge > 0 && <NavBadge count={badge} />}
        </span>
        <span className="nav-dock-label">{label}</span>
      </a>
    );
  }

  return (
    <>
      {/* Desktop / laptop sidebar */}
      <aside className="app-sidebar" aria-label={locale === "en" ? "Main navigation" : "التنقل الرئيسي"}>
        <a href="/dashboard" className="app-sidebar-brand">
          <AppLogo size={40} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand truncate">{t("appName", locale)}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {locale === "en" ? "Import orders" : "طلبات الاستيراد"}
            </p>
          </div>
        </a>
        <nav className="app-sidebar-nav">
          {items.map((item) => renderDockLink(item, "sidebar"))}
        </nav>
      </aside>

      {/* Mobile / tablet bottom dock */}
      <div className="nav-dock-wrap lg:hidden">
        <nav className="nav-dock" aria-label={locale === "en" ? "Main navigation" : "التنقل الرئيسي"}>
          {items.map((item) => renderDockLink(item, "dock"))}
        </nav>
      </div>

      {hasMore && (
        <MoreMenu
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          role={role}
          locale={locale}
          badges={navBadges}
        />
      )}
    </>
  );
}
