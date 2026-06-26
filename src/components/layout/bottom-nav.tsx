"use client";

import Link from "next/link";
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
import type { Role } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";

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

function NavDockLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  isFab,
  onClick,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
  isFab?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "nav-dock-link",
    active && !isFab && "nav-dock-link--active",
    isFab && "nav-dock-fab"
  );

  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={label}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </Link>
  );
}

export function BottomNav({
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

  return (
    <>
      <div className="nav-dock-wrap">
        <nav className="nav-dock" aria-label={locale === "en" ? "Main navigation" : "التنقل الرئيسي"}>
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const label = locale === "en" ? item.labelEn : item.labelAr;

            if (item.href === "more") {
              if (!hasMore) return null;
              return (
                <NavDockLink
                  key="more"
                  label={label}
                  icon={Icon}
                  active={isActive("more")}
                  onClick={() => setMoreOpen(true)}
                />
              );
            }

            const active = isActive(item.href);
            const isFab = fabHref === item.href;
            const badge = navBadges[item.href];

            return (
              <NavDockLink
                key={item.href}
                href={item.href}
                label={label}
                icon={Icon}
                active={active}
                badge={badge}
                isFab={isFab}
              />
            );
          })}
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
