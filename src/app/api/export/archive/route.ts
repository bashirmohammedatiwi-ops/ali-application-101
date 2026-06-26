import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UNITS } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.orderItem.findMany({
    where: { status: "ARCHIVED" },
    orderBy: { archivedAt: "desc" },
    include: {
      request: { include: { customer: true } },
      invoice: true,
    },
  });

  const headers = [
    "Invoice",
    "Order",
    "Customer",
    "Phone",
    "Product AR",
    "Product EN",
    "Quantity",
    "Unit",
    "Unit Price",
    "Grand Total",
    "Currency",
    "Weight kg",
    "Volume cbm",
    "Archived At",
  ];

  const rows = items.map((item) => [
    item.invoice?.invoiceNumber ?? "",
    item.refNumber,
    item.request.customer.name,
    item.request.customer.phone,
    item.productNameAr,
    item.productNameEn ?? "",
    String(item.quantity),
    UNITS[item.unit].en,
    item.unitPrice != null ? String(item.unitPrice) : "",
    item.invoice ? String(item.invoice.grandTotal) : "",
    item.currency,
    item.weightKg != null ? String(item.weightKg) : "",
    item.volumeCbm != null ? String(item.volumeCbm) : "",
    item.archivedAt ? item.archivedAt.toISOString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="archive-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
