/** Markup is stored as a percentage (e.g. 10 = 10%). */

export function calculateMarkupAmount(
  subtotal: number,
  shipping: number,
  markupPercent: number
): number {
  const base = subtotal + shipping;
  return base * (markupPercent / 100);
}

export function calculateInvoiceGrandTotal(
  subtotal: number,
  shipping: number,
  markupPercent: number,
  extraFees = 0
): number {
  return subtotal + shipping + calculateMarkupAmount(subtotal, shipping, markupPercent) + extraFees;
}

export function formatMarkupPercent(percent: number): string {
  const rounded = Math.round(percent * 100) / 100;
  return `${rounded}%`;
}

/** Pricer's entered price — subtotal + shipping, no markup or extra fees */
export function getPricerPriceTotal(subtotal: number, shipping: number): number {
  return subtotal + shipping;
}
