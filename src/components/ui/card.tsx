import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  padding = true,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border bg-white card-elevated",
        interactive && "card-interactive",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-brand">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("section-card", className)}>
      <div className="section-card-header">
        {icon && <div className="section-card-icon">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-brand">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="section-card-body">{children}</div>
    </div>
  );
}
