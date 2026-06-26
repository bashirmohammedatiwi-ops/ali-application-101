"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type ImageLightboxProps = {
  images: string[];
  initialIndex: number;
  locale?: Locale;
  onClose: () => void;
};

export function ImageLightbox({
  images,
  initialIndex,
  locale = "ar",
  onClose,
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const isRtl = locale === "ar";
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const resetZoom = useCallback(() => setScale(1), []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
    resetZoom();
  }, [images.length, resetZoom]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    resetZoom();
  }, [images.length, resetZoom]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") (isRtl ? goNext : goPrev)();
      if (e.key === "ArrowRight") (isRtl ? goPrev : goNext)();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext, isRtl]);

  useEffect(() => {
    resetZoom();
  }, [index, resetZoom]);

  if (!mounted || !images.length) return null;

  const src = images[index];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={locale === "en" ? "Image viewer" : "عارض الصور"}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform"
          aria-label={locale === "en" ? "Close" : "إغلاق"}
        >
          <X className="h-5 w-5" />
        </button>
        {images.length > 1 && (
          <p className="text-sm font-semibold text-white/80 tabular-nums">
            {index + 1} / {images.length}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(1, s - 0.5))}
            disabled={scale <= 1}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-40 active:scale-95"
            aria-label={locale === "en" ? "Zoom out" : "تصغير"}
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4, s + 0.5))}
            disabled={scale >= 4}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center disabled:opacity-40 active:scale-95"
            aria-label={locale === "en" ? "Zoom in" : "تكبير"}
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative overflow-hidden touch-none select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const a = e.touches[0];
            const b = e.touches[1];
            pinchStart.current = {
              distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
              scale,
            };
          } else if (e.touches.length === 1 && scale === 1) {
            swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchStart.current) {
            const a = e.touches[0];
            const b = e.touches[1];
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const ratio = dist / pinchStart.current.distance;
            setScale(Math.min(4, Math.max(1, pinchStart.current.scale * ratio)));
          }
        }}
        onTouchEnd={(e) => {
          if (pinchStart.current) {
            pinchStart.current = null;
            return;
          }
          if (swipeStart.current && scale === 1 && e.changedTouches.length === 1) {
            const dx = e.changedTouches[0].clientX - swipeStart.current.x;
            const dy = e.changedTouches[0].clientY - swipeStart.current.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              if (dx > 0) goPrev();
              else goNext();
            }
          }
          swipeStart.current = null;
        }}
        onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out will-change-transform"
            style={{ transform: `scale(${scale})` }}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute inset-y-0 start-0 w-14 flex items-center justify-center text-white/70 hover:text-white active:bg-white/5"
              aria-label={locale === "en" ? "Previous" : "السابق"}
            >
              <PrevIcon className="h-8 w-8 drop-shadow-lg" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute inset-y-0 end-0 w-14 flex items-center justify-center text-white/70 hover:text-white active:bg-white/5"
              aria-label={locale === "en" ? "Next" : "التالي"}
            >
              <NextIcon className="h-8 w-8 drop-shadow-lg" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
          <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "shrink-0 w-14 h-14 rounded-xl overflow-hidden ring-2 transition-all",
                  i === index ? "ring-accent scale-105" : "ring-white/20 opacity-60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
