import { renderToBuffer, Document, Page, Text } from "@react-pdf/renderer";
import ArabicReshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";
import fs from "fs";
import { registerPdfFonts } from "../src/lib/pdf-fonts";

registerPdfFonts();
const font = "NotoArabic";
const text = "فاتورة تسعير — شكراً لثقتكم بنا — نسعد بخدمتكم دائماً";

const bidi = bidiFactory();
function fullShape(s: string) {
  const reshaped = ArabicReshaper.convertArabic(s);
  const levels = bidi.getEmbeddingLevels(reshaped);
  return bidi.getReorderedString(reshaped, levels);
}

const modes = [
  { label: "1-raw", value: text },
  { label: "2-reshaped-only", value: ArabicReshaper.convertArabic(text) },
  { label: "3-full-bidi", value: fullShape(text) },
];

async function main() {
  const pages = modes.map(
    (m) => (
      <Page key={m.label} size="A4" style={{ padding: 40, fontFamily: font }}>
        <Text style={{ fontSize: 10, marginBottom: 12 }}>{m.label}</Text>
        <Text style={{ fontSize: 14, textAlign: "right" }}>{m.value}</Text>
      </Page>
    )
  );

  const buf = await renderToBuffer(<Document>{pages}</Document>);
  fs.writeFileSync("/tmp/arabic-test.pdf", buf);
  console.log("wrote /tmp/arabic-test.pdf");
}

main().catch(console.error);
