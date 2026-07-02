import path from "path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "NotoArabic",
    fonts: [
      {
        src: path.join(fontsDir, "NotoSansArabic-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "NotoSansArabic-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });
  registered = true;
}
