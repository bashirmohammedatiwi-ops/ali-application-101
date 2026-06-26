"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Step = { id: number; label: string };

export function StepIndicator({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  const progress = ((current - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden mb-5">
        <div
          className="absolute inset-y-0 start-0 bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between gap-2">
        {steps.map((step) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0",
                  done && "bg-emerald-500 text-white",
                  active && "bg-accent text-white ring-4 ring-accent/20 scale-110",
                  !done && !active && "bg-gray-100 text-gray-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.id}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold text-center leading-tight",
                  active ? "text-accent" : done ? "text-emerald-600" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
