import ArabicReshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Reshape + reorder Arabic for react-pdf (no native RTL shaping).
 * Mixed Latin/numbers are handled via the bidi algorithm.
 */
export function shapeArabicText(text: string): string {
  if (!text || !ARABIC_RE.test(text)) return text;
  const reshaped = ArabicReshaper.convertArabic(text);
  const levels = bidi.getEmbeddingLevels(reshaped);
  return bidi.getReorderedString(reshaped, levels);
}
