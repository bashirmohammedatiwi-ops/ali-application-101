import type { OrderStatus } from "@/generated/prisma/client";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { AlertTriangle, RotateCcw } from "lucide-react";

type HistoryEntry = {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  createdAt: Date;
  changedBy: { name: string };
};

export function getRepricingNote(history: HistoryEntry[]) {
  return history.find(
    (h) =>
      h.toStatus === "PRICING" &&
      h.reason &&
      (h.fromStatus === "PRICED" || h.fromStatus === "ARCHIVED")
  );
}

export function RepricingNoteBanner({
  note,
  locale,
}: {
  note: HistoryEntry;
  locale: Locale;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border-2 border-amber-300/80 px-4 py-4 shadow-sm shadow-amber-100/50">
      <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <RotateCcw className="h-5 w-5 text-amber-700" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-amber-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {locale === "en" ? "Re-pricing Request" : "طلب إعادة تسعير"}
        </p>
        <p className="text-sm text-amber-900/90 mt-2 leading-relaxed whitespace-pre-wrap">
          {note.reason}
        </p>
        <p className="text-xs text-amber-700/70 mt-2">
          {note.changedBy.name} · {formatDate(note.createdAt, locale)}
        </p>
      </div>
    </div>
  );
}
