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

    // 4. Seat count — prefer checkout selection, fall back to current members
    const seatsCount = await prisma.user.count({
      where: { workspaceId: wid },
    });
    const requestedSeats = Math.floor(Number(body.seats) || 0);
    const seats = Math.max(requestedSeats > 0 ? requestedSeats : seatsCount, 1);

    const { countryCode, currency } = resolveCheckoutFromRequest(
      request,
      body.billingCountry
    );

    const exclusiveMinor = computeUpgradeCheckoutMinor({
      currency,
      billingCycle,
      seats,
      cfg,
    });
    const { exclusiveMinor: taxableMinor, gstMinor, totalMinor: amountMinor } =
      withGstForCurrency(exclusiveMinor, currency);

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
        taxableMinor: String(taxableMinor),
        gstMinor: String(gstMinor),
        gstPercent: currency === "INR" ? "18" : "0",
      },
    });

    // 7. Upsert Subscription (PENDING) + create Transaction (CREATED)
    const helpedBySaathi = Boolean(body.helpedBySaathi);
    let saathiCode: string | null = null;
    if (helpedBySaathi) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: wid },
        select: { saathiCode: true },
      });
      const fromWorkspace = workspace?.saathiCode?.trim().toUpperCase() || null;
      const fromBody =
        typeof body.saathiCode === "string"
          ? body.saathiCode.trim().toUpperCase()
          : "";
      const normalizedBody =
        fromBody.length > 0 && fromBody.length <= 32 ? fromBody : null;

      saathiCode = fromWorkspace || normalizedBody;

      if (!saathiCode) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Saathi code is required when Helped by ANSH Saathi is enabled.",
          },
          { status: 400 }
        );
      }

      // Backfill workspace if signup did not capture a code.
      if (!fromWorkspace) {
        await prisma.workspace.update({
          where: { id: wid },
          data: { saathiCode },
        });
      }
    }

    const sub = await prisma.subscription.create({
      data: {
        workspaceId: wid,
        status: "PENDING",
        plan: "pro",
        seatsCount: seats,
        amountPaisa: amountMinor,
        billingCycle,
        razorpayOrderId: order.id,
        saathiCode,
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
        taxable_minor: taxableMinor,
        gst_minor: gstMinor,
        gst_percent: 18,
        currency,
        country_code: countryCode,
        razorpay_order_id: order.id,
        helped_by_saathi: helpedBySaathi,
        saathi_code: saathiCode,
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
