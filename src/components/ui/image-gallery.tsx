"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { Locale } from "@/lib/i18n";

export type GalleryImage = string | { id?: string; url: string };

function normalizeImages(images: GalleryImage[]): { key: string; url: string }[] {
  return images.map((img, i) =>
    typeof img === "string"
      ? { key: img, url: img }
      : { key: img.id ?? img.url, url: img.url }
  );
}

const SIZES = {
  sm: { px: 72, class: "w-[72px] h-[72px]" },
  md: { px: 96, class: "w-24 h-24" },
  lg: { px: 112, class: "w-28 h-28" },
};

export function ImageGallery({
  images,
  locale = "ar",
  size = "md",
  editable,
  onRemove,
  className,
}: {
  images: GalleryImage[];
  locale?: Locale;
  size?: keyof typeof SIZES;
  editable?: boolean;
  onRemove?: (index: number) => void;
  className?: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const items = normalizeImages(images);
  const { px, class: sizeClass } = SIZES[size];
  const urls = items.map((i) => i.url);

  if (!items.length) return null;

  return (
    <>
      <div className={cn("flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory", className)}>
        {items.map((item, i) => (
          <div key={item.key} className={cn("relative shrink-0 snap-start group", sizeClass)}>
            <button
              type="button"
              onClick={() => setLightboxIndex(i)}
              className={cn(
                "relative block rounded-2xl overflow-hidden ring-2 ring-white shadow-md",
                "active:scale-[0.97] transition-transform",
                sizeClass
              )}
              aria-label={locale === "en" ? "View full size" : "عرض بالحجم الكامل"}
            >
              <Image
                src={item.url}
                alt=""
                width={px}
                height={px}
                sizes={`${px}px`}
                loading="lazy"
                className="object-cover w-full h-full"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-active:bg-black/15 transition-colors" />
              <span className="absolute bottom-1.5 end-1.5 w-7 h-7 rounded-lg bg-black/45 backdrop-blur-sm text-white flex items-center justify-center opacity-90">
                <Expand className="h-3.5 w-3.5" />
              </span>
            </button>
            {editable && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="absolute -top-1.5 -end-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-10 active:scale-90 transition-transform"
                aria-label={locale === "en" ? "Remove" : "حذف"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={urls}
          initialIndex={lightboxIndex}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

/** Single thumbnail that opens lightbox — for order cards */
export function ImageThumbnail({
  src,
  images,
  locale = "ar",
  className,
}: {
  src: string;
  images?: string[];
  locale?: Locale;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const allImages = images?.length ? images : [src];

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn("relative shrink-0 active:scale-[0.97] transition-transform", className)}
        aria-label={locale === "en" ? "View photo" : "عرض الصورة"}
      >
        <Image
          src={src}
          alt=""
          width={64}
          height={64}
          sizes="64px"
          loading="lazy"
          className="rounded-2xl object-cover w-16 h-16 ring-2 ring-white shadow-md"
        />
        <span className="absolute bottom-1 end-1 w-5 h-5 rounded-md bg-black/40 text-white flex items-center justify-center">
          <Expand className="h-3 w-3" />
        </span>
      </button>
      {open && (
        <ImageLightbox
          images={allImages}
          initialIndex={0}
          locale={locale}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
