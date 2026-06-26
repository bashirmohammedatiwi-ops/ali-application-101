"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadImageProps = Omit<ImageProps, "onError"> & {
  fallbackClassName?: string;
};

/** User-uploaded images from /uploads — unoptimized for Docker volume serving. */
export function UploadImage({
  src,
  alt = "",
  className,
  fallbackClassName,
  ...props
}: UploadImageProps) {
  const [broken, setBroken] = useState(false);
  const srcStr = typeof src === "string" ? src : "";
  const isUpload = srcStr.startsWith("/uploads/");

  if (!srcStr || broken) {
    return (
      <div
        className={cn(
          "bg-[var(--field-bg)] border border-border flex items-center justify-center",
          fallbackClassName ?? className
        )}
      >
        <Package className="h-6 w-6 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      unoptimized={isUpload}
      onError={() => setBroken(true)}
      {...props}
    />
  );
}
