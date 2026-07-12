import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import {
  computeUpgradeCheckoutMinor,
  resolveCheckoutFromRequest,
} from "@/lib/billing/checkout-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import { getScheduledProSubscription } from "@/lib/billing/subscription-lifecycle";
import { captureServerEvent } from "@/lib/posthog-server";

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

    const scheduledPro = await getScheduledProSubscription(wid);

    if (scheduledPro) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have a Pro renewal scheduled. It will start automatically when your current period ends.",
        },
        { status: 400 }
      );
    }

    // Active Pro can renew — checkout creates a SCHEDULED subscription that
    // starts when the current planExpiresAt elapses (same as trial → Pro).
    // Do not block here; verify route defers startsAt when appropriate.

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

    const { countryCode, currency } = resolveCheckoutFromRequest(
      request,
      body.billingCountry
    );

    const amountMinor = computeUpgradeCheckoutMinor({
      currency,
      billingCycle,
      seats,
      cfg,
    });

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: amountMinor,
      currency,
      receipt: `wid_${wid}_${Date.now()}`,
      notes: {
        workspaceId: String(wid),
        billingCycle,
        seats: String(seats),
        countryCode,
        chargeCurrency: currency,
      },
    });

    // 7. Upsert Subscription (PENDING) + create Transaction (CREATED)
    const sub = await prisma.subscription.create({
      data: {
        workspaceId: wid,
        status: "PENDING",
        plan: "pro",
        seatsCount: seats,
        amountPaisa: amountMinor,
        billingCycle,
        razorpayOrderId: order.id,
      },
    });

    await prisma.transaction.create({
      data: {
        workspaceId: wid,
        subscriptionId: sub.id,
        status: "CREATED",
        amountPaisa: amountMinor,
        currency,
        razorpayOrderId: order.id,
      },
    });

    await captureServerEvent({
      distinctId: email,
      event: "payment_order_created",
      properties: {
        workspace_id: wid,
        billing_cycle: billingCycle,
        seat_count: seats,
        amount_minor: amountMinor,
        currency,
        country_code: countryCode,
        razorpay_order_id: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amountMinor,
      currency,
      countryCode,
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
