"use client";

import type { DisplayFxInfo, FormattedInrPrice } from "@/lib/billing/display-currency";
import { formatInrWithEstimate } from "@/lib/billing/display-currency";

type InrPriceDisplayProps = {
  amountInr: number;
  fx: DisplayFxInfo | null;
  /** e.g. "/mo", "/yr", "/ user / month" */
  suffix?: string;
  className?: string;
  inrClassName?: string;
  estimateClassName?: string;
  suffixClassName?: string;
};

export function formatPriceParts(
  amountInr: number,
  fx: DisplayFxInfo | null
): FormattedInrPrice {
  return formatInrWithEstimate(amountInr, fx);
}

export function InrPriceDisplay({
  amountInr,
  fx,
  suffix = "",
  className = "",
  inrClassName = "",
  estimateClassName = "text-[11px] font-semibold text-zinc-500 dark:text-zinc-400",
  suffixClassName = "",
}: InrPriceDisplayProps) {
  const { inr, estimate } = formatInrWithEstimate(amountInr, fx);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 ${className}`}>
      <span className={inrClassName}>{inr}</span>
      {estimate && (
        <span className={estimateClassName} title={fx?.disclaimer}>
          (~{estimate}
          {suffix ? ` ${suffix.trim()}` : ""})
        </span>
      )}
      {!estimate && suffix ? (
        <span className={suffixClassName}>{suffix}</span>
      ) : null}
    </span>
  );
}

export function FxDisclaimerBanner({ fx }: { fx: DisplayFxInfo | null }) {
  if (!fx?.displayCurrency) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-semibold">USD pricing estimate</p>
      <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">{fx.disclaimer}</p>
      {fx.ratesUpdatedAt && (
        <p className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-300/70">
          Rates updated {fx.ratesUpdatedAt} · detected region {fx.countryCode}
        </p>
      )}
    </div>
  );
}
