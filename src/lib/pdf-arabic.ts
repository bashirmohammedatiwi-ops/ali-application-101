/** Arabic / mixed-text helpers for react-pdf — no bidi pre-processing. */

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export type TextRun = { kind: "ar" | "lat"; value: string };

/** Split mixed Arabic/Latin into separate runs for isolated Text nodes. */
export function splitMixedText(text: string): TextRun[] {
  if (!text) return [];

  const runs: TextRun[] = [];
  let buf = "";
  let kind: "ar" | "lat" | null = null;

  const flush = () => {
    if (!buf) return;
    runs.push({ kind: kind!, value: buf });
    buf = "";
    kind = null;
  };

  for (const ch of text) {
    if (/\s/.test(ch)) {
      flush();
      continue;
    }
    const isAr = ARABIC_RE.test(ch);
    const k: "ar" | "lat" = isAr ? "ar" : "lat";
    if (kind === null) {
      kind = k;
      buf = ch;
    } else if (kind === k) {
      buf += ch;
    } else {
      flush();
      kind = k;
      buf = ch;
    }
  }
  flush();
  return runs;
}

export function isArabicText(text: string): boolean {
  return ARABIC_RE.test(text);
}
