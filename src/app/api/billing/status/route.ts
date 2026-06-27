import { NextResponse } from "next/server";
import { getWorkspaceSeatsInfo } from "@/lib/billing/seats";
import { resolveWorkspaceBillingState } from "@/lib/billing/subscription-lifecycle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "1", 10);

    const billing = await resolveWorkspaceBillingState(wid);
    const seats = await getWorkspaceSeatsInfo(wid);

    const subscriptionExpiresAt =
      billing.activeSubscription?.expiresAt ?? billing.planExpiresAt;

    return NextResponse.json({
      success: true,
      plan: seats.plan,
      storedPlan: billing.storedPlan,
      planExpiresAt: billing.planExpiresAt?.toISOString() ?? null,
      subscriptionStartsAt:
        billing.activeSubscription?.startsAt?.toISOString() ?? null,
      subscriptionExpiresAt: subscriptionExpiresAt?.toISOString() ?? null,
      isTrial: seats.isTrial,
      trialEndsAt: seats.isTrial
        ? billing.planExpiresAt?.toISOString() ?? null
        : null,
      hasScheduledPro: seats.hasScheduledPro,
      scheduledProStartsAt: seats.scheduledProStartsAt?.toISOString() ?? null,
      seatsUsed: seats.seatsUsed,
      seatsPurchased: seats.seatsPurchased,
      seatsVacant: seats.seatsVacant,
      billingCycle: seats.billingCycle,
      canAddSeats: seats.plan === "pro" && !seats.isTrial,
    });
  } catch (error: unknown) {
    console.error("[billing/status] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch plan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
