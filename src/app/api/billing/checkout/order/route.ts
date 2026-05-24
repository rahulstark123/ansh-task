import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Auth — get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Resolve workspace from session / body
    const body = await request.json().catch(() => ({}));
    const wid: number =
      body.workspaceId ??
      (parseInt(body.wid ?? "0", 10) || 1);

    const billingCycle: "monthly" | "yearly" =
      body.billingCycle === "yearly" ? "yearly" : "monthly";

    // 3. Get Razorpay config
    const cfg = getRazorpayConfig();
    if (!cfg) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment gateway is not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // 4. Count workspace seats
    const seatsCount = await prisma.user.count({
      where: { workspaceId: wid },
    });
    const seats = Math.max(seatsCount, 1);

    // 5. Compute amount (yearly = monthly × 12 × 0.83 ≈ 17% off)
    const monthlyPaisa = cfg.proPlanAmountPaisa; // per seat per month
    const amountPaisa =
      billingCycle === "yearly"
        ? Math.round(monthlyPaisa * seats * 12 * 0.83)
        : monthlyPaisa * seats;

    // 6. Create Razorpay order
    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: amountPaisa,
      currency: "INR",
      receipt: `wid_${wid}_${Date.now()}`,
      notes: {
        workspaceId: String(wid),
        billingCycle,
        seats: String(seats),
      },
    });

    // 7. Upsert Subscription (PENDING) + create Transaction (CREATED)
    const sub = await prisma.subscription.create({
      data: {
        workspaceId: wid,
        status: "PENDING",
        plan: "pro",
        seatsCount: seats,
        amountPaisa,
        billingCycle,
        razorpayOrderId: order.id,
      },
    });

    await prisma.transaction.create({
      data: {
        workspaceId: wid,
        subscriptionId: sub.id,
        status: "CREATED",
        amountPaisa,
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amountPaisa,
      currency: "INR",
      keyId: cfg.keyId,
      seats,
      billingCycle,
    });
  } catch (error: any) {
    console.error("[billing/order] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payment order",
      },
      { status: 500 }
    );
  }
}
