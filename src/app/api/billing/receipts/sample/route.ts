import { NextResponse } from "next/server";
import { buildReceiptPdf } from "@/lib/billing/receipt-pdf";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Preview-only sample receipt — does not touch the database. */
export async function GET() {
  try {
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const year = now.getFullYear();

    const pdf = await buildReceiptPdf({
      invoiceNumber: `INV-${year}-000001`,
      receiptNumber: `RCPT-${year}-000001`,
      issuedAt: now,
      workspaceName: "Demo Workspace",
      workspaceId: 1,
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul@demo.anshapps.com",
      ownerPhone: "+91 98765 43210",
      description: `Sample subscription for ${SITE_NAME} Pro (monthly billing) - preview only`,
      billingCycle: "monthly",
      seats: 3,
      amountMinor: 59700,
      currency: "INR",
      razorpayOrderId: "order_SAMPLE_PREVIEW_ONLY",
      razorpayPaymentId: "pay_SAMPLE_PREVIEW_ONLY",
      planLabel: `${SITE_NAME} Pro (Monthly)`,
      periodStart,
      periodEnd,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="ANSH-Apps-sample-receipt.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[billing/receipts/sample] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate sample receipt";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
