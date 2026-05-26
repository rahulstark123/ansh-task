import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Auth — get current user via JWT or body.email
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    let user = null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data?.user;
    }

    const email = body.email || user?.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Resolve workspace from body
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

    // 5. Compute amount (prefer client-provided dynamic amount, fallback to calculation)
    let amountPaisa = body.amountPaisa ?? body.amount;
    if (!amountPaisa || typeof amountPaisa !== "number" || amountPaisa <= 0) {
      const monthlyPaisa = cfg.proPlanAmountPaisa ?? 19900; // per seat per month (default ₹199)
      const subtotal =
        billingCycle === "yearly"
          ? Math.round(monthlyPaisa * seats * 12 * 0.83)
          : monthlyPaisa * seats;
      const gst = Math.round(subtotal * 0.18);
      amountPaisa = subtotal + gst;
    }

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
