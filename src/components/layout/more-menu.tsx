"use client";

import { usePathname } from "next/navigation";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MORE_NAV_ITEMS } from "@/lib/constants";
import type { Role } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";
import { Archive, Settings, Users, FileText } from "lucide-react";

const MORE_ICONS: Record<string, LucideIcon> = {
  Archive,
  Settings,
  Users,
  FileText,
};

export function MoreMenu({
  open,
  onClose,
  role,
  locale,
  badges = {},
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  locale: Locale;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const items = MORE_NAV_ITEMS[role] ?? [];

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in nav-more-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed bottom-0 inset-x-0 z-[70] animate-slide-up pb-[calc(var(--nav-height)+var(--safe-bottom)+8px)] nav-more-panel">
        <div className="mx-auto max-w-lg nav-more-sheet">
          <div className="nav-more-handle" aria-hidden />
          <div className="flex items-center justify-between px-6 pt-2 pb-4">
            <h2 className="text-lg font-bold text-brand">
              {locale === "en" ? "More options" : "خيارات إضافية"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[var(--field-bg)] flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm transition-colors"
              aria-label={locale === "en" ? "Close" : "إغلاق"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 pb-8">
            {items.map((item) => {
              const Icon = MORE_ICONS[item.icon];
              const active = pathname.startsWith(item.href);
              const label = locale === "en" ? item.labelEn : item.labelAr;
              const badge = badges[item.href];

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "nav-more-item",
                    active && "nav-more-item--active"
                  )}
                >
                  <div className="nav-more-item-icon">
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                    {badge != null && badge > 0 && (
                      <span className="nav-dock-badge">{badge > 99 ? "99+" : badge}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
