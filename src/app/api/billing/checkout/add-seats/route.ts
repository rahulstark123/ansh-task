import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import {
  resolveCheckoutFromRequest,
  razorpayAmountConfig,
} from "@/lib/billing/checkout-region";
import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
import { calculateProratedAddSeats } from "@/lib/billing/proration";
import { getWorkspaceSeatsInfo } from "@/lib/billing/seats";
import { captureServerEvent } from "@/lib/posthog-server";
import { withGstForCurrency } from "@/lib/billing/gst";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

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

    const wid: number = body.workspaceId ?? (parseInt(body.wid ?? "0", 10) || 1);
    const additionalSeats = Math.max(
      1,
      Math.floor(Number(body.additionalSeats) || 0)
    );

    const seatsInfo = await getWorkspaceSeatsInfo(wid);
    if (seatsInfo.plan !== "pro" || seatsInfo.isTrial) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Add more seats is available on an active paid Pro subscription. Complete your trial checkout first.",
        },
        { status: 400 }
      );
    }

    const [activeSubscription, workspace] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          workspaceId: wid,
          status: "ACTIVE",
          plan: "pro",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workspace.findUnique({
        where: { id: wid },
        select: { planExpiresAt: true },
      }),
    ]);

    if (!activeSubscription) {
      return NextResponse.json(
        { success: false, error: "No active subscription found for this workspace." },
        { status: 400 }
      );
    }

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

    const billingCycle =
      activeSubscription.billingCycle === "yearly" ? "yearly" : "monthly";

    const periodExpiresAt =
      activeSubscription.expiresAt ?? workspace?.planExpiresAt;

    if (!periodExpiresAt || periodExpiresAt <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your subscription period has ended. Renew your plan before adding seats.",
        },
        { status: 400 }
      );
    }

    const { countryCode, currency } = resolveCheckoutFromRequest(
      request,
      body.billingCountry
    );
    const pricingConfig = razorpayAmountConfig(cfg);

    let quote;
    try {
      quote = calculateProratedAddSeats({
        billingCycle,
        additionalSeats,
        periodExpiresAt,
        periodStartsAt: activeSubscription.startsAt,
        currency,
        razorpayConfig: pricingConfig,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not calculate prorated amount";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const exclusiveMinor = quote.amountPaisa;
    const { exclusiveMinor: taxableMinor, gstMinor, totalMinor: amountMinor } =
      withGstForCurrency(exclusiveMinor, currency);

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: amountMinor,
      currency,
      receipt: `wid_${wid}_seats_${Date.now()}`,
      notes: {
        workspaceId: String(wid),
        billingCycle,
        mode: "add_seats",
        additionalSeats: String(additionalSeats),
        parentSubscriptionId: activeSubscription.id,
        prorated: "true",
        periodExpiresAt: periodExpiresAt.toISOString(),
        countryCode,
        chargeCurrency: currency,
        taxableMinor: String(taxableMinor),
        gstMinor: String(gstMinor),
        gstPercent: currency === "INR" ? "18" : "0",
      },
    });

    const addonSub = await prisma.subscription.create({
      data: {
        workspaceId: wid,
        status: "PENDING",
        plan: "seat_addon",
        seatsCount: additionalSeats,
        amountPaisa: amountMinor,
        billingCycle,
        razorpayOrderId: order.id,
      },
    });

    await prisma.transaction.create({
      data: {
        workspaceId: wid,
        subscriptionId: addonSub.id,
        status: "CREATED",
        amountPaisa: amountMinor,
        currency,
        razorpayOrderId: order.id,
      },
    });

    await captureServerEvent({
      distinctId: email,
      event: "add_seats_order_created",
      properties: {
        workspace_id: wid,
        additional_seats: additionalSeats,
        billing_cycle: billingCycle,
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
      additionalSeats,
      billingCycle,
      proration: {
        amountInr: quote.amountMajor,
        amountMajor: quote.amountMajor,
        currency: quote.currency,
        fullPeriodAmountInr: quote.fullPeriodAmountMajor,
        fullPeriodAmountMajor: quote.fullPeriodAmountMajor,
        remainingDays: quote.remainingDays,
        totalDays: quote.totalDays,
        prorationFactor: quote.prorationFactor,
        periodExpiresAt: quote.periodExpiresAt,
      },
    });
  } catch (error: unknown) {
    console.error("[billing/add-seats] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
