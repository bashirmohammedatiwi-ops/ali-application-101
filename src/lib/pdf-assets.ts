import fs from "fs";
import path from "path";

/** Resolve a public URL or relative path to an absolute filesystem path for react-pdf. */
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
