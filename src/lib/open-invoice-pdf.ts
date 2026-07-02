import { PDF_TEMPLATE_VERSION } from "@/lib/pdf-constants";

/** Fetch PDF fresh (bypasses mobile browser URL cache) and open or download it. */
export async function openInvoicePdf(
  invoiceId: string,
  invoiceNumber: string,
  updatedAt: Date | string
) {
  const stamp = new Date(updatedAt).getTime();
  const url = `/api/invoices/${invoiceId}/pdf?tpl=${PDF_TEMPLATE_VERSION}&u=${stamp}&_=${Date.now()}`;

  const res = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

  if (!res.ok) {
    throw new Error("PDF_FAILED");
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = `${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
