import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { verifyRazorpaySignature } from "@/lib/billing/razorpay-signature";

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

    const now = new Date();
    const expiresAt = new Date(now);
    const billingCycle = transaction.subscription.billingCycle;
    if (billingCycle === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 4. Update DB atomically
    await prisma.$transaction([
      // Mark transaction SUCCESS
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      }),
      // Mark subscription ACTIVE
      prisma.subscription.update({
        where: { id: transaction.subscriptionId },
        data: {
          status: "ACTIVE",
          startsAt: now,
          expiresAt,
        },
      }),
      // Upgrade workspace plan
      prisma.workspace.update({
        where: { id: wid },
        data: {
          plan: "pro",
          planExpiresAt: expiresAt,
        },
      }),
    ]);

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
