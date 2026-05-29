import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay-signature";
import { captureServerEvent } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

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

    const expiresAt = new Date(now);
    const billingCycle = subscription.billingCycle;
    if (billingCycle === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

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
        data: {
          status: "ACTIVE",
          startsAt: now,
          expiresAt,
        },
      }),
      prisma.workspace.update({
        where: { id: wid },
        data: {
          plan: "pro",
          planExpiresAt: expiresAt,
        },
      }),
    ]);

    await captureServerEvent({
      distinctId: `workspace_${wid}`,
      event: "payment_verified",
      properties: {
        workspace_id: wid,
        billing_cycle: billingCycle,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        plan: "pro",
        expires_at: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified. Workspace upgraded to Pro!",
      plan: "pro",
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
