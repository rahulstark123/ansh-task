import type { ChargeCurrency } from "@/lib/billing/charge-region";
import {
  getFullPeriodMinorPerSeat,
  getMonthlyMinorPerSeat,
  minorToMajor,
} from "@/lib/billing/charge-region";

/** Public INR prices (must match billing settings UI). */
export const BILLING_MONTHLY_PRICE_INR = 299;
export const BILLING_YEARLY_DISCOUNT = 0.81;

export type BillingCycle = "monthly" | "yearly";

export type ProratedAddSeatsQuote = {
  currency: ChargeCurrency;
  amountPaisa: number;
  amountInr: number;
  amountMajor: number;
  fullPeriodAmountInr: number;
  fullPeriodAmountMajor: number;
  fullPeriodAmountPaisa: number;
  remainingDays: number;
  totalDays: number;
  prorationFactor: number;
  periodExpiresAt: string;
  periodStartsAt: string;
};

function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getMonthlyPaisaPerSeat(monthlyPaisaFromEnv?: number): number {
  const configured = monthlyPaisaFromEnv ?? BILLING_MONTHLY_PRICE_INR * 100;
  return configured > 0 ? Math.trunc(configured) : BILLING_MONTHLY_PRICE_INR * 100;
}

/** @deprecated Use getFullPeriodMinorPerSeat from charge-region */
export function getFullPeriodPaisaPerSeat(
  billingCycle: BillingCycle,
  monthlyPaisaPerSeat: number
): number {
  return getFullPeriodMinorPerSeat(billingCycle, monthlyPaisaPerSeat);
}

export function getFullPeriodAmountInr(
  billingCycle: BillingCycle,
  seatCount: number,
  monthlyPaisaPerSeat?: number
): number {
  const paisa =
    getFullPeriodPaisaPerSeat(
      billingCycle,
      getMonthlyPaisaPerSeat(monthlyPaisaPerSeat)
    ) * seatCount;
  return Math.round(paisa / 100);
}

export function inferPeriodStart(
  periodExpiresAt: Date,
  billingCycle: BillingCycle,
  periodStartsAt?: Date | null
): Date {
  if (periodStartsAt && periodStartsAt < periodExpiresAt) {
    return periodStartsAt;
  }
  const start = new Date(periodExpiresAt);
  if (billingCycle === "yearly") {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setMonth(start.getMonth() - 1);
  }
  return start;
}

/**
 * Prorated charge for extra seats until the workspace/subscription expiry.
 * Each add-on purchase uses remaining days at payment time (repeat buys cost less).
 */
export function calculateProratedAddSeats(params: {
  billingCycle: BillingCycle;
  additionalSeats: number;
  periodExpiresAt: Date;
  periodStartsAt?: Date | null;
  now?: Date;
  currency?: ChargeCurrency;
  monthlyPaisaPerSeat?: number;
  monthlyMinorPerSeat?: number;
  razorpayConfig?: { inrPaisa?: number; usdCents?: number };
}): ProratedAddSeatsQuote {
  const now = params.now ?? new Date();
  const seats = Math.max(1, Math.floor(params.additionalSeats));
  const currency = params.currency ?? "INR";
  const monthlyMinor =
    params.monthlyMinorPerSeat ??
    getMonthlyMinorPerSeat(currency, {
      inrPaisa:
        params.monthlyPaisaPerSeat ?? params.razorpayConfig?.inrPaisa,
      usdCents: params.razorpayConfig?.usdCents,
    });
  const fullPeriodPaisaPerSeat = getFullPeriodMinorPerSeat(
    params.billingCycle,
    monthlyMinor
  );
  const fullPeriodAmountPaisa = fullPeriodPaisaPerSeat * seats;
  const fullPeriodAmountMajor = minorToMajor(fullPeriodAmountPaisa, currency);
  const fullPeriodAmountInr = fullPeriodAmountMajor;

  const periodStartsAt = inferPeriodStart(
    params.periodExpiresAt,
    params.billingCycle,
    params.periodStartsAt
  );

  const totalDays = daysBetween(periodStartsAt, params.periodExpiresAt);
  const remainingDays = Math.min(
    totalDays,
    Math.max(0, daysBetween(now, params.periodExpiresAt))
  );

  if (remainingDays <= 0) {
    throw new Error(
      "Your subscription period has ended. Renew your plan before adding seats."
    );
  }

  const prorationFactor = remainingDays / totalDays;
  const minMinor = currency === "USD" ? 50 : 100;
  const amountPaisa = Math.max(
    minMinor,
    Math.round(fullPeriodAmountPaisa * prorationFactor)
  );
  const amountMajor = minorToMajor(amountPaisa, currency);

  return {
    currency,
    amountPaisa,
    amountInr: amountMajor,
    amountMajor,
    fullPeriodAmountInr: fullPeriodAmountMajor,
    fullPeriodAmountMajor,
    fullPeriodAmountPaisa,
    remainingDays,
    totalDays,
    prorationFactor,
    periodExpiresAt: params.periodExpiresAt.toISOString(),
    periodStartsAt: periodStartsAt.toISOString(),
  };
}
