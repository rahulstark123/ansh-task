import { BILLING_MONTHLY_PRICE_INR } from "@/lib/billing/proration";

export const CHARGE_CURRENCY = "INR" as const;

/** All non-India estimates use USD for a single consistent reference price. */
export const DISPLAY_ESTIMATE_CURRENCY = "USD";

/** Re-export for UI — keep in sync with proration.ts */
export const DISPLAY_MONTHLY_PRICE_INR = BILLING_MONTHLY_PRICE_INR;

export type DisplayFxInfo = {
  countryCode: string;
  chargeCurrency: typeof CHARGE_CURRENCY;
  displayCurrency: string | null;
  rateFromInr: number | null;
  ratesUpdatedAt: string | null;
  disclaimer: string;
};

export function detectCountryFromRequest(request: Request): string {
  const headers = request.headers;
  const fromEdge =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code");

  if (fromEdge && fromEdge.length === 2 && fromEdge.toUpperCase() !== "XX") {
    return fromEdge.toUpperCase();
  }

  const acceptLanguage = headers.get("accept-language") || "";
  const regionMatch = acceptLanguage.match(/[a-z]{2}-([A-Za-z]{2})/i);
  if (regionMatch?.[1]) {
    return regionMatch[1].toUpperCase();
  }

  return "IN";
}

/** India: INR only. Everyone else: USD estimate next to ₹ prices. */
export function resolveDisplayCurrency(countryCode: string): string | null {
  if (countryCode === "IN") return null;
  return DISPLAY_ESTIMATE_CURRENCY;
}

export function buildDisplayFxInfo(
  countryCode: string,
  rates: Record<string, number>,
  ratesUpdatedAt: string | null
): DisplayFxInfo {
  const displayCurrency = resolveDisplayCurrency(countryCode);
  const rateFromInr =
    displayCurrency && rates[displayCurrency] != null
      ? rates[displayCurrency]
      : null;

  return {
    countryCode,
    chargeCurrency: CHARGE_CURRENCY,
    displayCurrency,
    rateFromInr,
    ratesUpdatedAt,
    disclaimer:
      "Approximate USD equivalent for reference. Payment is charged in INR via Razorpay; your bank may convert at its own rate.",
  };
}

export function formatConvertedAmount(
  inrAmount: number,
  currency: string,
  rateFromInr: number
): string {
  const converted = inrAmount * rateFromInr;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: converted < 10 ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(converted);
}

export function formatInrAmount(inr: number): string {
  return `₹${inr.toLocaleString("en-IN")}`;
}

export type FormattedInrPrice = {
  inr: string;
  estimate: string | null;
};

export function formatInrWithEstimate(
  inrAmount: number,
  fx: DisplayFxInfo | null
): FormattedInrPrice {
  const inr = formatInrAmount(inrAmount);
  if (!fx?.displayCurrency || fx.rateFromInr == null) {
    return { inr, estimate: null };
  }
  return {
    inr,
    estimate: formatConvertedAmount(inrAmount, fx.displayCurrency, fx.rateFromInr),
  };
}

type FxCache = {
  rates: Record<string, number>;
  updatedAt: string;
  fetchedAt: number;
};

let fxCache: FxCache | null = null;
const FX_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function fetchInrFxRates(): Promise<{
  rates: Record<string, number>;
  updatedAt: string | null;
}> {
  if (fxCache && Date.now() - fxCache.fetchedAt < FX_CACHE_TTL_MS) {
    return { rates: fxCache.rates, updatedAt: fxCache.updatedAt };
  }

  try {
    const url = `https://api.frankfurter.app/latest?from=INR&to=${DISPLAY_ESTIMATE_CURRENCY}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`FX API ${res.status}`);

    const data = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };

    const rates = data.rates ?? {};
    const updatedAt = data.date ?? new Date().toISOString().slice(0, 10);

    fxCache = { rates, updatedAt, fetchedAt: Date.now() };
    return { rates, updatedAt };
  } catch (error) {
    console.error("Failed to fetch INR FX rates:", error);
    if (fxCache) {
      return { rates: fxCache.rates, updatedAt: fxCache.updatedAt };
    }
    return { rates: {}, updatedAt: null };
  }
}
