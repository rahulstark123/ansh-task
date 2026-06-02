"use client";

import type { BillingLocaleInfo } from "@/lib/billing/charge-region";
import { formatChargeAmount } from "@/lib/billing/charge-region";

type ChargePriceDisplayProps = {
  amountMajor: number;
  locale: BillingLocaleInfo | null;
  suffix?: string;
  className?: string;
  priceClassName?: string;
  suffixClassName?: string;
};

export function ChargePriceDisplay({
  amountMajor,
  locale,
  suffix = "",
  className = "",
  priceClassName = "",
  suffixClassName = "",
}: ChargePriceDisplayProps) {
  const currency = locale?.chargeCurrency ?? "INR";
  const formatted = formatChargeAmount(amountMajor, currency);

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 ${className}`}
    >
      <span className={priceClassName}>{formatted}</span>
      {suffix ? <span className={suffixClassName}>{suffix}</span> : null}
    </span>
  );
}

/** @deprecated Use ChargePriceDisplay */
export function InrPriceDisplay({
  amountInr,
  fx,
  suffix = "",
  className = "",
  inrClassName = "",
  suffixClassName = "",
}: {
  amountInr: number;
  fx: { chargeCurrency?: "INR" | "USD" } | null;
  suffix?: string;
  className?: string;
  inrClassName?: string;
  estimateClassName?: string;
  suffixClassName?: string;
}) {
  const currency = fx?.chargeCurrency ?? "INR";
  return (
    <ChargePriceDisplay
      amountMajor={amountInr}
      locale={
        currency === "USD"
          ? ({
              chargeCurrency: "USD",
            } as BillingLocaleInfo)
          : ({
              chargeCurrency: "INR",
            } as BillingLocaleInfo)
      }
      suffix={suffix}
      className={className}
      priceClassName={inrClassName}
      suffixClassName={suffixClassName}
    />
  );
}

export function FxDisclaimerBanner({
  locale,
}: {
  locale: BillingLocaleInfo | null;
}) {
  if (!locale) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">
        {locale.chargeCurrency === "USD" ? "USD pricing" : "INR pricing"}
      </p>
      <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
        {locale.disclaimer}
      </p>
      <p className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-300/70">
        Billing region: {locale.countryCode}
      </p>
    </div>
  );
}
