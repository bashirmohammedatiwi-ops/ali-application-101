import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {props.required && <span className="text-accent ms-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "field-input field-textarea",
          error && "border-red-400! bg-red-50",
          className
        )}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
