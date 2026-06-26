import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
      <div className="flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-accent shrink-0" />
        <h2 className="text-base font-bold text-brand">{title}</h2>
      </div>
      {action}
    </div>
  );
}
