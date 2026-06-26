import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export function AlertBanner({
  title,
  message,
  href,
  locale = "ar",
}: {
  title: string;
  message: string;
  href?: string;
  locale?: "ar" | "en";
}) {
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  const content = (
    <Card
      className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/80 p-3.5 card-interactive"
      padding
      interactive={!!href}
    >
      <div className="flex gap-3 items-center">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">{title}</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{message}</p>
        </div>
        {href && <Chevron className="h-5 w-5 text-amber-500 shrink-0" />}
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
