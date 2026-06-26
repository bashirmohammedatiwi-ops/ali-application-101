import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";

export function PricerEmptyState({
  icon: Icon,
  title,
  message,
  locale,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  locale: Locale;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="pricer-empty">
      <span className="pricer-empty-icon">
        <Icon className="h-8 w-8" />
      </span>
      <p className="text-base font-bold text-brand mt-4">{title}</p>
      <p className="text-sm text-gray-400 mt-1.5 max-w-[260px] mx-auto leading-relaxed">
        {message}
      </p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-block mt-5">
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
