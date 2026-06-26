"use client";

import { useCallback, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageGallery } from "@/components/ui/image-gallery";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const MAX_SIZE_MB = 25;

export function ImageUploader({
  images,
  onChange,
  locale = "ar",
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  locale?: Locale;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!fileArray.length) {
        toast(locale === "en" ? "Please select image files" : "يرجى اختيار ملفات صور", "error");
        return;
      }

      const oversized = fileArray.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (oversized.length) {
        toast(
          locale === "en"
            ? `Max ${MAX_SIZE_MB}MB per image`
            : `الحد الأقصى ${MAX_SIZE_MB} ميغابايت لكل صورة`,
          "error"
        );
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        fileArray.forEach((f) => formData.append("files", f));
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data.urls?.length) {
          toast(t("error", locale), "error");
          return;
        }
        onChange([...images, ...data.urls]);
        toast(t("success", locale));
      } catch {
        toast(t("error", locale), "error");
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, locale, toast]
  );

  return (
    <div className="space-y-4">
      {(images.length > 0 || uploading) && (
        <div className="space-y-2">
          {images.length > 0 && (
            <ImageGallery
              images={images}
              locale={locale}
              size="md"
              editable
              onRemove={(i) => onChange(images.filter((_, idx) => idx !== i))}
            />
          )}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              {locale === "en" ? "Uploading..." : "جاري الرفع..."}
            </div>
          )}
          {images.length > 0 && (
            <p className="text-[11px] text-gray-400 px-1">
              {locale === "en"
                ? "Tap to enlarge · images are optimized on upload"
                : "اضغط للتكبير · الصور تُضغط تلقائياً عند الرفع"}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className={cn("cursor-pointer", uploading && "pointer-events-none opacity-60")}>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span
            className={cn(
              "flex items-center justify-center gap-2 min-h-[52px] rounded-2xl border-2 border-dashed text-sm font-semibold transition-all active:scale-[0.99]",
              "border-accent/25 bg-accent-light/40 text-accent hover:bg-accent-light hover:border-accent/40"
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            {t("uploadPhotos", locale)}
          </span>
        </label>
        <label className={cn("cursor-pointer", uploading && "pointer-events-none opacity-60")}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-[var(--field-bg)] text-brand hover:bg-white hover:ring-2 hover:ring-accent/20 transition-all active:scale-95">
            <Camera className="h-5 w-5" />
          </span>
        </label>
      </div>
    </div>
  );
}
