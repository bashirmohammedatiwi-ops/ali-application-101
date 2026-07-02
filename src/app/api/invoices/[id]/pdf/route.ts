import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PDF_TEMPLATE_VERSION } from "@/lib/pdf-constants";
import { getOrCreateSettings } from "@/lib/orders";
import { UNITS } from "@/lib/constants";
import { resolveLogoDataUri, resolveProductImageForPdf } from "@/lib/pdf-assets";
import { normalizeCurrency } from "@/lib/currency";
import { prepareInvoiceForPdfDisplay } from "@/lib/pdf-invoice";
import { buildInvoiceHtml } from "@/lib/pdf/invoice-html";
import { renderHtmlToPdf } from "@/lib/pdf/render-chromium-pdf";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      orderItem: {
        include: {
          images: true,
          request: { include: { customer: true } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const settings = await getOrCreateSettings();
    const item = invoice.orderItem;
    const customer = item.request.customer;
    const displayCurrency = normalizeCurrency(
      new URL(req.url).searchParams.get("currency") ?? item.currency
    );
    const rates = {
      usdToCnyRate: settings.usdToCnyRate,
      usdToIqdRate: settings.usdToIqdRate,
    };
    const pdfData = prepareInvoiceForPdfDisplay(invoice, item, displayCurrency, rates);
    const [productImageDataUri, logoDataUri] = await Promise.all([
      resolveProductImageForPdf(item.images),
      resolveLogoDataUri(),
    ]);

    const html = await buildInvoiceHtml({
      invoice: pdfData.invoice,
      item: pdfData.item,
      customer,
      settings,
      unitLabel: UNITS[pdfData.item.unit].ar,
      markupAmount: pdfData.markupAmount,
      logoDataUri,
      productImageDataUri,
    });

    const buffer = await renderHtmlToPdf(html);
    const version = new Date(invoice.updatedAt).getTime();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}-${PDF_TEMPLATE_VERSION}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, private",
        Pragma: "no-cache",
        Expires: "0",
        "X-PDF-Template": PDF_TEMPLATE_VERSION,
        ETag: `"${PDF_TEMPLATE_VERSION}-${invoice.id}-${version}"`,
      },
    });
  } catch (error) {
    console.error("[pdf] render failed:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
