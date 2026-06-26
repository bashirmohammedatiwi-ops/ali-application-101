import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-1", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-1 h-6 rounded-full bg-accent shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand tracking-tight leading-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-400 ps-3.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
    </div>
  );
}
