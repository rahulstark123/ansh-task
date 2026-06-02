import { NextResponse } from "next/server";
import {
  buildBillingLocaleInfo,
  resolveBillingCountry,
} from "@/lib/billing/charge-region";
import { detectCountryFromRequest } from "@/lib/billing/display-currency";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const override = searchParams.get("country");
    const countryCode = resolveBillingCountry(
      detectCountryFromRequest(request),
      override
    );
    const locale = buildBillingLocaleInfo(countryCode);

    return NextResponse.json({
      success: true,
      ...locale,
      // Back-compat for older clients
      chargeCurrency: locale.chargeCurrency,
      displayCurrency: locale.chargeCurrency === "USD" ? "USD" : null,
      rateFromInr: null,
      ratesUpdatedAt: null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load billing locale";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
