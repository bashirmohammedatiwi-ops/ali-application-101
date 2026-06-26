import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PricerPageHeader({
  icon,
  title,
  subtitle,
  variant = "queue",
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  variant?: "queue" | "done";
  children?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "pricer-page-header",
        variant === "done" && "pricer-page-header--done"
      )}
    >
      <div className="pricer-page-header-glow" aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              variant === "done" ? "bg-emerald-500/25" : "bg-white/15"
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-white leading-tight">{title}</h1>
            <p className="text-sm text-white/60 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
