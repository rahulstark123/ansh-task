import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspaceSeatsInfo } from "@/lib/billing/seats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "1", 10);

    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: { plan: true, planExpiresAt: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const seats = await getWorkspaceSeatsInfo(wid);

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        workspaceId: wid,
        status: "ACTIVE",
        plan: "pro",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      select: { startsAt: true, expiresAt: true },
    });

    const subscriptionExpiresAt =
      activeSubscription?.expiresAt ?? workspace.planExpiresAt;

    return NextResponse.json({
      success: true,
      plan: seats.plan,
      planExpiresAt: workspace.planExpiresAt?.toISOString() ?? null,
      subscriptionStartsAt:
        activeSubscription?.startsAt?.toISOString() ?? null,
      subscriptionExpiresAt: subscriptionExpiresAt?.toISOString() ?? null,
      isTrial: seats.isTrial,
      trialEndsAt: seats.isTrial
        ? workspace.planExpiresAt?.toISOString() ?? null
        : null,
      hasScheduledPro: seats.hasScheduledPro,
      scheduledProStartsAt: seats.scheduledProStartsAt?.toISOString() ?? null,
      seatsUsed: seats.seatsUsed,
      seatsPurchased: seats.seatsPurchased,
      seatsVacant: seats.seatsVacant,
      billingCycle: seats.billingCycle,
      canAddSeats: seats.plan === "pro",
    });
  } catch (error: any) {
    console.error("[billing/status] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch plan" },
      { status: 500 }
    );
  }
}
