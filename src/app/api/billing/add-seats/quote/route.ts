import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { calculateProratedAddSeats } from "@/lib/billing/proration";
import { getWorkspaceSeatsInfo } from "@/lib/billing/seats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "1", 10);
    const additionalSeats = Math.max(
      1,
      Math.floor(Number(searchParams.get("seats") ?? "1"))
    );

    const seatsInfo = await getWorkspaceSeatsInfo(wid);
    if (seatsInfo.plan !== "pro" || seatsInfo.isTrial) {
      return NextResponse.json(
        {
          success: false,
          error: "Prorated seat quotes require an active paid Pro subscription.",
        },
        { status: 400 }
      );
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        workspaceId: wid,
        status: "ACTIVE",
        plan: "pro",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        billingCycle: true,
        startsAt: true,
        expiresAt: true,
      },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: { planExpiresAt: true },
    });

    const periodExpiresAt =
      activeSubscription?.expiresAt ??
      workspace?.planExpiresAt ??
      null;

    if (!periodExpiresAt || periodExpiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription renewal date not found or already passed.",
        },
        { status: 400 }
      );
    }

    const billingCycle =
      activeSubscription?.billingCycle === "yearly" ? "yearly" : "monthly";
    const cfg = getRazorpayConfig();

    const quote = calculateProratedAddSeats({
      billingCycle,
      additionalSeats,
      periodExpiresAt,
      periodStartsAt: activeSubscription?.startsAt,
      monthlyPaisaPerSeat: cfg?.proPlanAmountPaisa,
    });

    return NextResponse.json({
      success: true,
      ...quote,
      additionalSeats,
      billingCycle,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to calculate quote";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
