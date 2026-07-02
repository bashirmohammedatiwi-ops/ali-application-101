import { readFile } from "fs/promises";
import path from "path";

let cached: string | null = null;

export async function getEmbeddedFontCss(): Promise<string> {
  if (cached) return cached;

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const [regular, bold] = await Promise.all([
    readFile(path.join(fontsDir, "NotoSansArabic-Regular.ttf")),
    readFile(path.join(fontsDir, "NotoSansArabic-Bold.ttf")),
  ]);

  cached = `
@font-face {
  font-family: 'Noto Arabic';
  src: url(data:font/ttf;base64,${regular.toString("base64")}) format('truetype');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Noto Arabic';
  src: url(data:font/ttf;base64,${bold.toString("base64")}) format('truetype');
  font-weight: 700;
  font-style: normal;
}`;
  return cached;
}
