import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const widStr = searchParams.get("wid");

    if (!widStr) {
      return NextResponse.json(
        { success: false, error: "Workspace ID (wid) is required" },
        { status: 400 }
      );
    }

    const wid = parseInt(widStr, 10);
    if (Number.isNaN(wid)) {
      return NextResponse.json(
        { success: false, error: "Invalid Workspace ID" },
        { status: 400 }
      );
    }

    // Fetch workspace plan details
    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: {
        plan: true,
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        }
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Determine total allowed credits based on plan and subscriptions
    const plan = workspace.plan.toLowerCase();
    let totalCredits = 20; // free plan default: 20 credits

    const activeSub = workspace.subscriptions?.[0];
    if (activeSub) {
      if (activeSub.aiCredits > 0) {
        totalCredits = activeSub.aiCredits;
        // If they are not on pro plan but have purchased credits, add the 20 free credits
        if (plan !== "pro") {
          totalCredits += 20;
        }
      } else if (plan === "pro") {
        // Fallback for backwards compatibility with subscriptions created before aiCredits column
        const amount = activeSub.amountPaisa / 100;
        const seats = activeSub.seatsCount || 1;
        const cycleMonths = activeSub.billingCycle === "yearly" ? 12 : 1;
        const baseMonthlyPricePerSeat = amount / seats / cycleMonths;

        if (baseMonthlyPricePerSeat >= 350) {
          totalCredits = 500;
        } else {
          totalCredits = 100;
        }
      }
    } else if (plan === "pro") {
      totalCredits = 100;
    }

    // Calculate sum of credits used
    const aggregated = await prisma.aiUsageLog.aggregate({
      where: { workspaceId: wid },
      _sum: {
        creditConsumed: true,
      },
    });

    const creditsUsed = aggregated._sum.creditConsumed || 0;
    const creditsRemaining = Math.max(0, totalCredits - creditsUsed);

    // Fetch details of usage logs
    const logs = await prisma.aiUsageLog.findMany({
      where: { workspaceId: wid },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      totalCredits,
      creditsUsed,
      creditsRemaining,
      logs: logs.map(l => ({
        id: l.id,
        userName: l.userName,
        userEmail: l.userEmail,
        action: l.action,
        creditConsumed: l.creditConsumed,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("AI Usage API Error:", error);
    return NextResponse.json(
      { success: false, error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
