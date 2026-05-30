import { NextResponse } from "next/server";
import {
  buildDisplayFxInfo,
  detectCountryFromRequest,
  fetchInrFxRates,
} from "@/lib/billing/display-currency";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const countryCode = detectCountryFromRequest(request);
    const { rates, updatedAt } = await fetchInrFxRates();
    const fx = buildDisplayFxInfo(countryCode, rates, updatedAt);

    return NextResponse.json({
      success: true,
      ...fx,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load FX rates";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
