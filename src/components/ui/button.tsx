import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-md shadow-accent/25 hover:bg-[#d14f1c] hover:shadow-accent/35",
        secondary:
          "bg-white text-brand border border-border shadow-sm hover:bg-gray-50 hover:border-gray-300",
        outline:
          "border-2 border-accent/30 text-accent bg-accent-light/50 hover:bg-accent-light hover:border-accent/50",
        ghost: "text-brand hover:bg-white/80",
        danger: "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700",
      },
      size: {
        sm: "min-h-[38px] px-3.5 text-xs rounded-xl",
        md: "min-h-[48px] px-5 text-sm rounded-2xl",
        lg: "min-h-[54px] px-6 text-base rounded-2xl",
        icon: "min-h-[44px] min-w-[44px] p-0 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
