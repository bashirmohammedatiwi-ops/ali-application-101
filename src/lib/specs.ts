export type ProductSpecs = {
  color?: string;
  size?: string;
  model?: string;
};

export function parseSpecs(json: string | null | undefined): ProductSpecs {
  if (!json) return {};
  try {
    return JSON.parse(json) as ProductSpecs;
  } catch {
    return {};
  }
}

export function stringifySpecs(specs: ProductSpecs): string | null {
  const filtered = Object.fromEntries(
    Object.entries(specs).filter(([, v]) => v?.trim())
  );
  return Object.keys(filtered).length ? JSON.stringify(filtered) : null;
}

export function specsToNotes(specs: ProductSpecs, locale: "ar" | "en" = "ar"): string {
  const parts: string[] = [];
  if (specs.color) parts.push(locale === "en" ? `Color: ${specs.color}` : `اللون: ${specs.color}`);
  if (specs.size) parts.push(locale === "en" ? `Size: ${specs.size}` : `المقاس: ${specs.size}`);
  if (specs.model) parts.push(locale === "en" ? `Model: ${specs.model}` : `الموديل: ${specs.model}`);
  return parts.join(" · ");
}
