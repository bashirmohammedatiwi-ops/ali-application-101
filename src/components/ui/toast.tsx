"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { cn, randomId } from "@/lib/utils";

type ToastType = "success" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = randomId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-[calc(12px+env(safe-area-inset-top))] inset-x-4 z-[100] flex flex-col gap-2 max-w-lg mx-auto pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "toast-glass pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-xl border animate-slide-up",
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-50"
                : "bg-red-950/90 border-red-700/50 text-red-50"
            )}
          >
            {t.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <p className="text-sm font-semibold flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
