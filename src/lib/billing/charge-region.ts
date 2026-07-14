import {
  BILLING_MONTHLY_PRICE_INR,
  BILLING_YEARLY_DISCOUNT,
} from "@/lib/billing/proration";

/** Fixed USD list price per seat / month (outside India). */
export const BILLING_MONTHLY_PRICE_USD = 4;

export type ChargeCurrency = "INR" | "USD";

export type BillingLocaleInfo = {
  countryCode: string;
  chargeCurrency: ChargeCurrency;
  monthlyPriceMajor: number;
  yearlyPriceMajorPerSeat: number;
  yearlyPriceTotalPerSeat: number;
  monthlyMinorPerSeat: number;
  disclaimer: string;
};

export function normalizeCountryCode(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "IN";
  const upper = code.toUpperCase();
  if (upper === "XX") return "IN";
  return upper;
}

export function resolveChargeCurrency(countryCode: string): ChargeCurrency {
  return countryCode === "IN" ? "INR" : "USD";
}

export function getMonthlyPriceMajor(currency: ChargeCurrency): number {
  return currency === "INR" ? BILLING_MONTHLY_PRICE_INR : BILLING_MONTHLY_PRICE_USD;
}

export function getMonthlyMinorPerSeat(
  currency: ChargeCurrency,
  config?: { inrPaisa?: number; usdCents?: number }
): number {
  if (currency === "INR") {
    const paisa = config?.inrPaisa ?? BILLING_MONTHLY_PRICE_INR * 100;
    return paisa > 0 ? Math.trunc(paisa) : BILLING_MONTHLY_PRICE_INR * 100;
  }
  const cents =
    config?.usdCents ?? Math.round(BILLING_MONTHLY_PRICE_USD * 100);
  return cents > 0 ? Math.trunc(cents) : Math.round(BILLING_MONTHLY_PRICE_USD * 100);
}

export function getFullPeriodMinorPerSeat(
  billingCycle: "monthly" | "yearly",
  monthlyMinorPerSeat: number
): number {
  if (billingCycle === "yearly") {
    return Math.round(monthlyMinorPerSeat * 12 * BILLING_YEARLY_DISCOUNT);
  }
  return monthlyMinorPerSeat;
}

export function minorToMajor(minor: number, currency: ChargeCurrency): number {
  return Math.round(minor) / 100;
}

export function getYearlyPriceMajorPerSeat(currency: ChargeCurrency): number {
  const monthly = getMonthlyPriceMajor(currency);
  return Math.round((monthly * 12 * BILLING_YEARLY_DISCOUNT) / 12);
}

export function getYearlyPriceTotalPerSeat(currency: ChargeCurrency): number {
  return Math.round(
    getMonthlyPriceMajor(currency) * 12 * BILLING_YEARLY_DISCOUNT
  );
}

export function computeUpgradeAmountMinor(params: {
  currency: ChargeCurrency;
  billingCycle: "monthly" | "yearly";
  seats: number;
  monthlyMinorPerSeat?: number;
  config?: { inrPaisa?: number; usdCents?: number };
}): number {
  const seats = Math.max(1, params.seats);
  const monthlyMinor = getMonthlyMinorPerSeat(params.currency, params.config);
  const perSeatPeriod = getFullPeriodMinorPerSeat(
    params.billingCycle,
    monthlyMinor
  );
  return perSeatPeriod * seats;
}

export function buildBillingLocaleInfo(
  countryCode: string
): BillingLocaleInfo {
  const normalized = normalizeCountryCode(countryCode);
  const chargeCurrency = resolveChargeCurrency(normalized);
  const monthlyPriceMajor = getMonthlyPriceMajor(chargeCurrency);
  const yearlyPriceTotalPerSeat = getYearlyPriceTotalPerSeat(chargeCurrency);

  return {
    countryCode: normalized,
    chargeCurrency,
    monthlyPriceMajor,
    yearlyPriceMajorPerSeat: getYearlyPriceMajorPerSeat(chargeCurrency),
    yearlyPriceTotalPerSeat,
    monthlyMinorPerSeat: getMonthlyMinorPerSeat(chargeCurrency),
    disclaimer:
      chargeCurrency === "USD"
        ? "Prices shown in USD. Checkout charges in USD via Razorpay (international cards)."
        : "Prices shown in INR. UPI, cards, and netbanking available via Razorpay.",
  };
}

export function formatChargeAmount(
  amountMajor: number,
  currency: ChargeCurrency
): string {
  if (currency === "INR") {
    return `₹${amountMajor.toLocaleString("en-IN")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amountMajor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountMajor);
}

export function resolveBillingCountry(
  detectedCountry: string,
  override?: string | null
): string {
  if (override) {
    const o = normalizeCountryCode(override);
    if (o === "IN") return "IN";
    return o;
  }
  return normalizeCountryCode(detectedCountry);
}
