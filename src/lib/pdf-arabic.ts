const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * react-pdf 4.x shapes Arabic via fontkit when using an Arabic font.
 * Do NOT pre-reshape or bidi-reorder — that double-processes and breaks ligatures.
 */
export function shapeArabicText(text: string): string {
  if (!text || !ARABIC_RE.test(text)) return text;
  return text;
}
