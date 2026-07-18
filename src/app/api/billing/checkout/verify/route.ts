import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay-signature";
import {
  addBillingPeriod,
  isActiveTrialWorkspace,
} from "@/lib/billing/subscription-lifecycle";
import { createAndStoreReceiptForTransaction } from "@/lib/billing/create-receipt";
import { TRIAL_PLAN } from "@/lib/plans";
import { captureServerEvent } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

async function ensureReceipt(transactionId: string) {
  try {
    await createAndStoreReceiptForTransaction(transactionId);
  } catch (error) {
    // Payment must still succeed even if PDF/R2 fails — log for follow-up.
    console.error("[billing/verify] Receipt store failed:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      workspaceId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    // 1. Get Razorpay config
    const cfg = getRazorpayConfig();
    if (!cfg) {
      return NextResponse.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // 2. Verify HMAC signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cfg.keySecret
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed" },
        { status: 400 }
      );
    }

    // 3. Find the transaction and subscription
    const transaction = await prisma.transaction.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { subscription: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    const wid = workspaceId
      ? parseInt(workspaceId, 10)
      : transaction.workspaceId;

    if (transaction.status === "SUCCESS") {
      await ensureReceipt(transaction.id);
      return NextResponse.json({
        success: true,
        message: "Payment already verified.",
        plan: "pro",
      });
    }

    const now = new Date();
    const subscription = transaction.subscription;

    if (subscription.plan === "seat_addon") {
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          workspaceId: wid,
          status: "ACTIVE",
          plan: "pro",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: "desc" },
      });

      if (!activeSubscription) {
        return NextResponse.json(
          {
            success: false,
            error: "No active Pro subscription to add seats to.",
          },
          { status: 400 }
        );
      }

      const newSeatTotal =
        activeSubscription.seatsCount + subscription.seatsCount;

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          },
        }),
        prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELLED" },
        }),
        prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: { seatsCount: newSeatTotal },
        }),
      ]);

      await ensureReceipt(transaction.id);

      await captureServerEvent({
        distinctId: `workspace_${wid}`,
        event: "add_seats_verified",
        properties: {
          workspace_id: wid,
          additional_seats: subscription.seatsCount,
          seats_total: newSeatTotal,
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Added ${subscription.seatsCount} seat${subscription.seatsCount === 1 ? "" : "s"} to your plan.`,
        mode: "add_seats",
        seatsPurchased: newSeatTotal,
      });
    }

    if (subscription.plan === "ai_addon") {
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          workspaceId: wid,
          status: "ACTIVE",
          plan: "pro",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: "desc" },
      });

      const creditsPurchased = subscription.aiCredits;

      if (activeSubscription) {
        const newCreditsTotal = activeSubscription.aiCredits + creditsPurchased;

        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "SUCCESS",
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            },
          }),
          prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          }),
          prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: { aiCredits: newCreditsTotal },
          }),
        ]);

        await ensureReceipt(transaction.id);

        return NextResponse.json({
          success: true,
          message: `Successfully purchased ${creditsPurchased} AI credits. Your total is now ${newCreditsTotal}.`,
          mode: "ai_addon",
        });
      } else {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: "SUCCESS",
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
            },
          }),
          prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          }),
        ]);

        await ensureReceipt(transaction.id);

        return NextResponse.json({
          success: true,
          message: `Successfully purchased ${creditsPurchased} AI credits.`,
          mode: "ai_addon",
        });
      }
    }

    const billingCycle = subscription.billingCycle;
    const workspace = await prisma.workspace.findUnique({
      where: { id: wid },
      select: { plan: true, planExpiresAt: true },
    });

    const onActiveTrial = isActiveTrialWorkspace(
      workspace?.plan ?? "free",
      workspace?.planExpiresAt,
      now
    );

    // Defer start until current period ends for active trial OR paid Pro renewals.
    const currentPeriodEnd =
      workspace?.planExpiresAt && workspace.planExpiresAt > now
        ? new Date(workspace.planExpiresAt)
        : null;
    const shouldDeferStart =
      Boolean(currentPeriodEnd) &&
      (onActiveTrial || workspace?.plan === "pro");

    const startsAt = shouldDeferStart && currentPeriodEnd
      ? currentPeriodEnd
      : new Date(now);
    const expiresAt = addBillingPeriod(startsAt, billingCycle);
    const scheduled = shouldDeferStart && startsAt > now;

    let defaultAiCredits = 100;
    const amount = subscription.amountPaisa / 100;
    const seats = subscription.seatsCount || 1;
    const cycleMonths = subscription.billingCycle === "yearly" ? 12 : 1;
    const baseMonthlyPricePerSeat = amount / seats / cycleMonths;
    if (baseMonthlyPricePerSeat >= 350) {
      defaultAiCredits = 500;
    }

    const subscriptionUpdate = {
      status: scheduled ? "SCHEDULED" : "ACTIVE",
      startsAt,
      expiresAt,
      aiCredits: defaultAiCredits,
    } as const;

    const workspaceUpdates = scheduled
      ? []
      : [
          prisma.workspace.update({
            where: { id: wid },
            data: {
              plan: "pro",
              planExpiresAt: expiresAt,
            },
          }),
        ];

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      }),
      prisma.subscription.update({
        where: { id: transaction.subscriptionId },
        data: subscriptionUpdate,
      }),
      ...workspaceUpdates,
    ]);

    await ensureReceipt(transaction.id);

    await captureServerEvent({
      distinctId: `workspace_${wid}`,
      event: "payment_verified",
      properties: {
        workspace_id: wid,
        billing_cycle: billingCycle,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        plan: scheduled ? (onActiveTrial ? TRIAL_PLAN : "pro") : "pro",
        scheduled,
        renewal: scheduled && !onActiveTrial,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
    });

    const startLabel = startsAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return NextResponse.json({
      success: true,
      message: scheduled
        ? onActiveTrial
          ? `Payment verified. Your Pro plan will start when your trial ends on ${startLabel}.`
          : `Payment verified. Your renewed Pro plan will start when your current plan ends on ${startLabel}.`
        : "Payment verified. Workspace upgraded to Pro!",
      plan: scheduled && onActiveTrial ? TRIAL_PLAN : "pro",
      scheduled,
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[billing/verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
