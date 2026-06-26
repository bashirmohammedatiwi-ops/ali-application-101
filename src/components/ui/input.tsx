import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {props.required && <span className="text-accent ms-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "field-input",
          error && "border-red-400! bg-red-50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgb(239_68_68/0.15)]",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
