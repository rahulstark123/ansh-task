/** Public INR prices (must match billing settings UI). */
export const BILLING_MONTHLY_PRICE_INR = 199;
export const BILLING_YEARLY_DISCOUNT = 0.81;

export type BillingCycle = "monthly" | "yearly";

export type ProratedAddSeatsQuote = {
  amountPaisa: number;
  amountInr: number;
  fullPeriodAmountInr: number;
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
  const configured = monthlyPaisaFromEnv ?? 19900;
  return configured > 0 ? Math.trunc(configured) : 19900;
}

export function getFullPeriodPaisaPerSeat(
  billingCycle: BillingCycle,
  monthlyPaisaPerSeat: number
): number {
  if (billingCycle === "yearly") {
    return Math.round(monthlyPaisaPerSeat * 12 * BILLING_YEARLY_DISCOUNT);
  }
  return monthlyPaisaPerSeat;
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
  monthlyPaisaPerSeat?: number;
}): ProratedAddSeatsQuote {
  const now = params.now ?? new Date();
  const seats = Math.max(1, Math.floor(params.additionalSeats));
  const monthlyPaisa = getMonthlyPaisaPerSeat(params.monthlyPaisaPerSeat);
  const fullPeriodPaisaPerSeat = getFullPeriodPaisaPerSeat(
    params.billingCycle,
    monthlyPaisa
  );
  const fullPeriodAmountPaisa = fullPeriodPaisaPerSeat * seats;
  const fullPeriodAmountInr = Math.round(fullPeriodAmountPaisa / 100);

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
  const amountPaisa = Math.max(
    100,
    Math.round(fullPeriodAmountPaisa * prorationFactor)
  );

  return {
    amountPaisa,
    amountInr: Math.round(amountPaisa / 100),
    fullPeriodAmountInr,
    fullPeriodAmountPaisa,
    remainingDays,
    totalDays,
    prorationFactor,
    periodExpiresAt: params.periodExpiresAt.toISOString(),
    periodStartsAt: periodStartsAt.toISOString(),
  };
}
