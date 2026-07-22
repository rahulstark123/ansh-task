import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { resolveCheckoutFromRequest } from "@/lib/billing/checkout-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import { captureServerEvent } from "@/lib/posthog-server";
import { withGstForCurrency } from "@/lib/billing/gst";

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

    const credits = Math.floor(Number(body.credits) || 50);
    const basePriceInr = Math.floor(Number(body.priceInr) || 99);

    // 3. Get Razorpay config
    const cfg = getRazorpayConfig();
    if (!cfg) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway is not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    const { countryCode, currency } = resolveCheckoutFromRequest(
      request,
      body.billingCountry
    );

    // Convert price to Paisa / Cents
    let exclusiveMinor = basePriceInr * 100;
    
    // Support non-INR if billingCountry is international (though Razorpay is mainly INR)
    if (currency !== "INR") {
      // rough USD conversion if international: ₹99 -> $1.49, ₹299 -> $3.99, ₹699 -> $7.99
      const usdPriceMap: Record<number, number> = {
        99: 149,
        299: 399,
        699: 799,
      };
      exclusiveMinor = usdPriceMap[basePriceInr] || 149;
    }

    const { exclusiveMinor: taxableMinor, gstMinor, totalMinor: amountMinor } =
      withGstForCurrency(exclusiveMinor, currency);

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: amountMinor,
      currency,
      receipt: `wid_${wid}_ai_${Date.now()}`,
      notes: {
        workspaceId: String(wid),
        plan: "ai_addon",
        aiCredits: String(credits),
        countryCode,
        chargeCurrency: currency,
        taxableMinor: String(taxableMinor),
        gstMinor: String(gstMinor),
        gstPercent: currency === "INR" ? "18" : "0",
      },
    });

    // 4. Create Subscription with status PENDING and plan = "ai_addon"
    const sub = await prisma.subscription.create({
      data: {
        workspaceId: wid,
        status: "PENDING",
        plan: "ai_addon",
        seatsCount: 1,
        amountPaisa: amountMinor,
        billingCycle: "monthly",
        razorpayOrderId: order.id,
        aiCredits: credits,
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
      event: "ai_credits_order_created",
      properties: {
        workspace_id: wid,
        credits_purchased: credits,
        amount_minor: amountMinor,
        taxable_minor: taxableMinor,
        gst_minor: gstMinor,
        gst_percent: currency === "INR" ? 18 : 0,
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
      credits,
    });
  } catch (error: any) {
    console.error("[billing/ai-credits] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create payment order",
      },
      { status: 500 }
    );
  }
}
