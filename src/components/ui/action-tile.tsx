import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function ListActionRow({
  icon: Icon,
  label,
  sublabel,
  trailingIcon: TrailingIcon,
  onClick,
  href,
  download,
  variant = "default",
  disabled,
  pending,
}: {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  trailingIcon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  download?: string;
  variant?: "default" | "accent";
  disabled?: boolean;
  pending?: boolean;
}) {
  const styles = {
    default: "bg-white border-border hover:border-accent/25",
    accent: "bg-accent-light border-accent/20 hover:bg-accent/10",
  };

  const iconStyles = {
    default: "bg-[var(--field-bg)] text-accent",
    accent: "stat-glow text-white shadow-md shadow-accent/20",
  };

  const content = (
    <>
      <span
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          iconStyles[variant]
        )}
      >
        <Icon className={cn("h-5 w-5", pending && "animate-spin")} strokeWidth={2.25} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-brand">{label}</span>
        {sublabel && (
          <span className="block text-xs text-gray-400 mt-0.5">{sublabel}</span>
        )}
      </span>
      {TrailingIcon && <TrailingIcon className="h-4 w-4 text-accent shrink-0" />}
    </>
  );

  const className = cn(
    "w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-start transition-all active:scale-[0.99] disabled:opacity-60 card-elevated",
    styles[variant]
  );

  if (href) {
    return (
      <a href={href} download={download} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled || pending} className={className}>
      {content}
    </button>
  );
}

export function ActionTile({
  icon: Icon,
  label,
  sublabel,
  onClick,
  href,
  variant = "default",
  external,
}: {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "accent" | "success" | "whatsapp";
  external?: boolean;
}) {
  const styles = {
    default: "bg-white border-border hover:border-accent/30",
    accent: "bg-accent-light border-accent/20 hover:border-accent/40",
    success: "bg-emerald-50 border-emerald-200/80 hover:border-emerald-300",
    whatsapp: "stat-glow border-transparent text-white shadow-lg shadow-accent/20",
  };

  const iconStyles = {
    default: "bg-[var(--field-bg)] text-brand",
    accent: "bg-white text-accent",
    success: "bg-white text-emerald-600",
    whatsapp: "bg-white/20 text-white",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all active:scale-[0.97] min-h-[88px]",
        styles[variant],
        (href || onClick) && "cursor-pointer card-interactive"
      )}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          iconStyles[variant]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "text-xs font-bold leading-tight",
          variant === "whatsapp" ? "text-white" : "text-brand"
        )}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className={cn(
            "text-[10px] leading-tight",
            variant === "whatsapp" ? "text-white/75" : "text-gray-400"
          )}
        >
          {sublabel}
        </span>
      )}
    </div>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-start">
        {content}
      </button>
    );
  }

  return content;
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "w-10 h-10 text-xs rounded-xl",
    md: "w-12 h-12 text-sm rounded-2xl",
    lg: "w-16 h-16 text-lg rounded-2xl",
  };

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center font-black text-accent bg-accent-light ring-2 ring-white shadow-sm",
        sizes[size]
      )}
    >
      {initials || "?"}
    </div>
  );
}

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-border p-3 space-y-3 card-elevated">
      {children}
    </div>
  );
}

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 pt-2">
      <div className="rounded-2xl bg-white border border-border p-3 space-y-2 card-elevated">
        {children}
      </div>
    </div>
  );
}
