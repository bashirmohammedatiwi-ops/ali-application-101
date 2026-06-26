import { type ProductSpecs, parseSpecs, stringifySpecs } from "@/lib/specs";

const TERM_MAP: Record<string, string> = {
  كيلو: "kilo",
  متر: "meter",
  قطعة: "piece",
  كارتونة: "carton",
  صندوق: "box",
  رول: "roll",
  شريط: "strip",
  led: "LED",
  ملون: "colored",
  "مقاوم للماء": "waterproof",
  بلاستيك: "plastic",
  معدن: "metal",
  زجاج: "glass",
  خشب: "wood",
  قماش: "fabric",
  كابل: "cable",
  محول: "adapter",
  شاحن: "charger",
  بطارية: "battery",
  مصباح: "lamp",
  ضوء: "light",
  كاميرا: "camera",
  هاتف: "phone",
  حاسوب: "computer",
  طابعة: "printer",
  ورق: "paper",
  حبر: "ink",
  لاصق: "adhesive",
  غراء: "glue",
  دهان: "paint",
  برغي: "screw",
  مسمار: "nail",
  أداة: "tool",
  آلة: "machine",
  محرك: "motor",
  مضخة: "pump",
  أنبوب: "pipe",
  خرطوم: "hose",
  صمام: "valve",
  فلتر: "filter",
  مروحة: "fan",
  مكيف: "air conditioner",
  ثلاجة: "refrigerator",
  فرن: "oven",
  موقد: "stove",
  طاولة: "table",
  كرسي: "chair",
  سرير: "bed",
  خزانة: "cabinet",
  باب: "door",
  نافذة: "window",
  سيراميك: "ceramic",
  رخام: "marble",
  حديد: "iron",
  steel: "steel",
  ستيل: "stainless steel",
  نحاس: "copper",
  ألومنيوم: "aluminum",
  ذهب: "gold",
  فضة: "silver",
  أبيض: "white",
  أسود: "black",
  أحمر: "red",
  أزرق: "blue",
  أخضر: "green",
  أصفر: "yellow",
  كبير: "large",
  صغير: "small",
  متوسط: "medium",
};

export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function needsTranslation(
  translated: string | null | undefined,
  original: string
): boolean {
  if (!original?.trim()) return false;
  if (!translated?.trim()) return true;
  if (containsArabic(translated)) return true;
  if (translated.trim() === original.trim()) return true;
  return false;
}

function applyTermMap(text: string): string {
  let result = text;
  const sorted = Object.keys(TERM_MAP).sort((a, b) => b.length - a.length);
  for (const term of sorted) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(regex, TERM_MAP[term]);
  }
  return result;
}

function isValidTranslation(original: string, translated: string | null): translated is string {
  if (!translated?.trim()) return false;
  if (translated.includes("MYMEMORY WARNING")) return false;
  if (translated.includes("QUERY LENGTH LIMIT")) return false;
  if (translated.trim() === original.trim() && containsArabic(original)) return false;
  return true;
}

async function translateWithGoogle(text: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey?.trim() || !text.trim()) return null;

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "ar",
          target: "en",
          format: "text",
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.data?.translations?.[0]?.translatedText ?? null;
    return isValidTranslation(text, result) ? result : null;
  } catch {
    return null;
  }
}

async function translateWithMyMemory(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.responseData?.translatedText ?? null;
    return isValidTranslation(text, result) ? result : null;
  } catch {
    return null;
  }
}

async function translateWithLibreTranslate(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  const endpoints = [
    "https://libretranslate.de/translate",
    "https://translate.argosopentech.com/translate",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "ar",
          target: "en",
          format: "text",
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.translatedText ?? null;
      if (isValidTranslation(text, result)) return result;
    } catch {
      continue;
    }
  }
  return null;
}

export async function translateArToEn(text: string): Promise<string> {
  if (!text?.trim()) return "";

  const providers = [
    translateWithGoogle,
    translateWithMyMemory,
    translateWithLibreTranslate,
  ];

  for (const provider of providers) {
    const result = await provider(text);
    if (result && !containsArabic(result)) return result;
    if (result && containsArabic(text) && !containsArabic(result)) return result;
  }

  for (const provider of providers) {
    const result = await provider(text);
    if (isValidTranslation(text, result)) return result;
  }

  const mapped = applyTermMap(text.trim());
  if (mapped !== text.trim()) return mapped;

  return text.trim();
}

async function translateSpecsToEn(specs: ProductSpecs): Promise<string> {
  const parts: string[] = [];
  if (specs.color?.trim()) {
    parts.push(`Color: ${await translateArToEn(specs.color)}`);
  }
  if (specs.size?.trim()) {
    parts.push(`Size: ${await translateArToEn(specs.size)}`);
  }
  if (specs.model?.trim()) {
    parts.push(`Model: ${await translateArToEn(specs.model)}`);
  }
  return parts.join(" · ");
}

export async function translateFields(fields: {
  productNameAr?: string;
  notesAr?: string;
  specsJson?: string | null;
}) {
  const specs = parseSpecs(fields.specsJson);
  const specsEn = await translateSpecsToEn(specs);

  const [productNameEn, notesEnRaw] = await Promise.all([
    fields.productNameAr ? translateArToEn(fields.productNameAr) : Promise.resolve(""),
    fields.notesAr ? translateArToEn(fields.notesAr) : Promise.resolve(""),
  ]);

  let notesEn = notesEnRaw;
  if (specsEn) {
    notesEn = notesEn ? `${notesEn}\n${specsEn}` : specsEn;
  }

  return { productNameEn, notesEn };
}

export async function buildTranslatedOrderFields(item: {
  productNameAr: string;
  productNameEn: string | null;
  notesAr: string | null;
  notesEn: string | null;
  specsJson: string | null;
}) {
  const needsName = needsTranslation(item.productNameEn, item.productNameAr);
  const needsNotes =
    !!item.notesAr?.trim() && needsTranslation(item.notesEn, item.notesAr);
  const specs = parseSpecs(item.specsJson);
  const hasSpecs = !!(specs.color || specs.size || specs.model);
  const specsMissingFromNotes =
    hasSpecs &&
    (!item.notesEn ||
      (!item.notesEn.includes("Color:") &&
        !item.notesEn.includes("Size:") &&
        !item.notesEn.includes("Model:")));

  if (!needsName && !needsNotes && !specsMissingFromNotes) {
    return null;
  }

  return translateFields({
    productNameAr: item.productNameAr,
    notesAr: item.notesAr ?? undefined,
    specsJson: item.specsJson,
  });
}
