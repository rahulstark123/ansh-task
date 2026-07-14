/** Indian GST on ANSH Apps subscription charges (INR only). */
export const GST_RATE = 0.18;
export const GST_RATE_PERCENT = 18;

export type GstBreakdown = {
  exclusiveMinor: number;
  gstMinor: number;
  totalMinor: number;
};

/** GST applies only when charging in Indian Rupees. */
export function appliesIndianGst(currency: string | null | undefined): boolean {
  return (currency ?? "").toUpperCase() === "INR";
}

/** Add GST on top of a tax-exclusive amount (minor units). */
export function addGst(exclusiveMinor: number): GstBreakdown {
  const exclusive = Math.max(0, Math.round(exclusiveMinor));
  const gstMinor = Math.round(exclusive * GST_RATE);
  return {
    exclusiveMinor: exclusive,
    gstMinor,
    totalMinor: exclusive + gstMinor,
  };
}

/**
 * Apply GST only for INR; other currencies stay tax-exclusive (= total).
 */
export function withGstForCurrency(
  exclusiveMinor: number,
  currency: string | null | undefined
): GstBreakdown {
  const exclusive = Math.max(0, Math.round(exclusiveMinor));
  if (!appliesIndianGst(currency)) {
    return { exclusiveMinor: exclusive, gstMinor: 0, totalMinor: exclusive };
  }
  return addGst(exclusive);
}

/**
 * Split a tax-inclusive INR total into exclusive + GST.
 * Prefer `addGst` when creating charges so totals reconcile exactly.
 */
export function splitGstInclusive(totalMinor: number): GstBreakdown {
  const total = Math.max(0, Math.round(totalMinor));
  const exclusiveMinor = Math.round(total / (1 + GST_RATE));
  const gstMinor = total - exclusiveMinor;
  return { exclusiveMinor, gstMinor, totalMinor: total };
}

/** Convert minor → major with 2 decimal places for UI. */
export function minorToMajorAmount(minor: number): number {
  return Math.round(minor) / 100;
}
