import fs from "fs";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/** Absolute filesystem path for a public asset (PNG/JPEG logos). */
export function resolvePublicAsset(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;

  const relative = src.startsWith("/") ? src.slice(1) : src;
  const filePath = path.join(process.cwd(), "public", relative);
  return fs.existsSync(filePath) ? filePath : null;
}

export function resolveLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "brand", "logo.png"),
    path.join(process.cwd(), "public", "logo.png"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

export async function resolveLogoDataUri(): Promise<string | null> {
  const filePath = resolveLogoPath();
  if (!filePath) return null;

  try {
    const input = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${input.toString("base64")}`;
  } catch (error) {
    console.error("[pdf] logo read failed:", error);
    return null;
  }
}

/** PDFKit only embeds JPEG/PNG — uploads are WebP, so convert for the invoice. */
export async function resolveProductImageForPdf(
  urls?: { url: string }[]
): Promise<string | null> {
  if (!urls?.length) return null;

  for (const { url } of urls) {
    const dataUri = await fileUrlToPdfImageDataUri(url);
    if (dataUri) return dataUri;
  }
  return null;
}

async function fileUrlToPdfImageDataUri(url: string): Promise<string | null> {
  const filePath = resolvePublicAsset(url);
  if (!filePath) {
    console.warn("[pdf] product image missing on disk:", url);
    return null;
  }

  try {
    const input = await readFile(filePath);
    const jpeg = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("[pdf] product image convert failed:", url, error);
    return null;
  }
}
