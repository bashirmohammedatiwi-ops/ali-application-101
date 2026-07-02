import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  InvoiceDocument,
  PDF_TEMPLATE_VERSION,
} from "@/components/pdf/invoice-document";
import { getOrCreateSettings } from "@/lib/orders";
import { UNITS } from "@/lib/constants";
import { resolveLogoPath, resolvePublicAsset } from "@/lib/pdf-assets";
import { registerPdfFonts } from "@/lib/pdf-fonts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
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
    registerPdfFonts();
    const settings = await getOrCreateSettings();
    const item = invoice.orderItem;
    const customer = item.request.customer;
    const productImageSrc = resolvePublicAsset(item.images?.[0]?.url);
    const logoSrc = resolveLogoPath();

    const buffer = await renderToBuffer(
      InvoiceDocument({
        invoice,
        item,
        customer,
        settings,
        unitLabel: UNITS[item.unit].ar,
        logoSrc,
        productImageSrc,
      })
    );

    const version = new Date(invoice.updatedAt).getTime();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-PDF-Template": PDF_TEMPLATE_VERSION,
        ETag: `"${invoice.id}-${version}"`,
      },
    });
  } catch (error) {
    console.error("[pdf] render failed:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
