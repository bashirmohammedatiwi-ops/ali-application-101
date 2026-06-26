"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { ListActionRow } from "@/components/ui/action-tile";
import type { Locale } from "@/lib/i18n";

export function ExportArchiveButton({ locale }: { locale: Locale }) {
  return (
    <ListActionRow
      icon={FileSpreadsheet}
      label={locale === "en" ? "Export Archive" : "تصدير الأرشيف"}
      sublabel="CSV"
      trailingIcon={Download}
      href="/api/export/archive"
      download="archive-export.csv"
    />
  );
}
