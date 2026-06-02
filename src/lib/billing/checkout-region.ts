import {
  buildBillingLocaleInfo,
  computeUpgradeAmountMinor,
  resolveBillingCountry,
  resolveChargeCurrency,
  type ChargeCurrency,
} from "@/lib/billing/charge-region";
import { detectCountryFromRequest } from "@/lib/billing/display-currency";
import type { RazorpayConfig } from "@/lib/billing/razorpay";

export function resolveCheckoutFromRequest(
  request: Request,
  billingCountryOverride?: string | null
) {
  const detected = detectCountryFromRequest(request);
  const countryCode = resolveBillingCountry(detected, billingCountryOverride);
  const locale = buildBillingLocaleInfo(countryCode);
  const currency = resolveChargeCurrency(countryCode);

  return { countryCode, currency, locale };
}

export function razorpayAmountConfig(cfg: RazorpayConfig) {
  return {
    inrPaisa: cfg.proPlanAmountPaisa,
    usdCents: cfg.proPlanAmountCents,
  };
}

export function computeUpgradeCheckoutMinor(params: {
  currency: ChargeCurrency;
  billingCycle: "monthly" | "yearly";
  seats: number;
  cfg: RazorpayConfig;
}): number {
  return computeUpgradeAmountMinor({
    currency: params.currency,
    billingCycle: params.billingCycle,
    seats: params.seats,
    config: razorpayAmountConfig(params.cfg),
  });
}
