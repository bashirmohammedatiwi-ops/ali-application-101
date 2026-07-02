import path from "path";
import fs from "fs";
import { Font } from "@react-pdf/renderer";

let registered = false;

export const PDF_FONT_FAMILY = "NotoArabic";

export function registerPdfFonts() {
  if (registered) return PDF_FONT_FAMILY;

  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const regular = path.join(fontsDir, "NotoSansArabic-Regular.ttf");
  const bold = path.join(fontsDir, "NotoSansArabic-Bold.ttf");

  if (!fs.existsSync(regular) || !fs.existsSync(bold)) {
    console.error("[pdf] Arabic fonts missing at", fontsDir);
    return "Helvetica";
  }

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  registered = true;
  return PDF_FONT_FAMILY;
}
