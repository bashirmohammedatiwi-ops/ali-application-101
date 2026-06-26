import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/pdf/invoice-document";
import { getOrCreateSettings } from "@/lib/orders";
import { UNITS } from "@/lib/constants";

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

  const settings = await getOrCreateSettings();
  const item = invoice.orderItem;
  const customer = item.request.customer;

  const buffer = await renderToBuffer(
    InvoiceDocument({
      invoice,
      item,
      customer,
      settings,
      unitLabel: UNITS[item.unit].en,
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
