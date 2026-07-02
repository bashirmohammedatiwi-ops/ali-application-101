import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const LATIN_OR_DIGIT_RE = /[A-Za-z0-9]/;

/** Wrap Latin/numbers so they stay LTR inside RTL paragraphs (react-pdf). */
export function pdfLtr(value: string): string {
  if (!value) return value;
  return `\u2066${value}\u2069`;
}

/**
 * react-pdf shapes pure Arabic via fontkit (Noto Sans Arabic).
 * Mixed Arabic + Latin/numbers needs explicit bidi reorder — without arabic-reshaper.
 */
export function shapeArabicText(text: string): string {
  if (!text || !ARABIC_RE.test(text)) return text;

  // Pure Arabic — fontkit handles joining/ligatures
  if (!LATIN_OR_DIGIT_RE.test(text)) return text;

  try {
    const levels = bidi.getEmbeddingLevels(text, "rtl");
    return bidi.getReorderedString(text, levels);
  } catch {
    return text;
  }
}

export function hasArabic(text: string): boolean {
  return ARABIC_RE.test(text);
}
