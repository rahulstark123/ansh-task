import { NextResponse } from "next/server";
import { buildReceiptPdf } from "@/lib/billing/receipt-pdf";
import { addGst } from "@/lib/billing/gst";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const exclusiveMinor = 29900; // ₹299
    const { totalMinor } = addGst(exclusiveMinor);

    const pdf = await buildReceiptPdf({
      invoiceNumber: `INV-${year}-AI-000001`,
      receiptNumber: `RCPT-${year}-AI-000001`,
      issuedAt: now,
      workspaceName: "Demo Workspace",
      workspaceId: 1,
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul@demo.anshapps.com",
      ownerPhone: "+91 98765 43210",
      description: "One-time purchase of 500 AI Credits - preview only",
      billingCycle: "monthly",
      seats: 1,
      amountMinor: totalMinor,
      currency: "INR",
      razorpayOrderId: "order_SAMPLE_AI_PREVIEW",
      razorpayPaymentId: "pay_SAMPLE_AI_PREVIEW",
      planLabel: "AI Credits Pack",
      periodStart: now,
      periodEnd: now,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="ANSH-Apps-sample-ai-receipt.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[billing/receipts/sample-ai] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate sample AI receipt";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
