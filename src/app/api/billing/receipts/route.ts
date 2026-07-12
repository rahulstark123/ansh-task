import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wid = parseInt(searchParams.get("wid") ?? "0", 10);
    if (!Number.isFinite(wid) || wid <= 0) {
      return NextResponse.json(
        { success: false, error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const rows = await prisma.receipt.findMany({
      where: { workspaceId: wid },
      orderBy: { issuedAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        receiptNumber: true,
        issuedAt: true,
        amountPaisa: true,
        currency: true,
        planLabel: true,
        billingCycle: true,
        seats: true,
        label: true,
        fileUrl: true,
        fileKey: true,
        transaction: {
          select: {
            razorpayPaymentId: true,
            razorpayOrderId: true,
          },
        },
      },
    });

    const receipts = rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      receiptNumber: r.receiptNumber,
      date: r.issuedAt.toISOString(),
      amountMinor: r.amountPaisa,
      currency: r.currency || "INR",
      plan: r.planLabel,
      billingCycle: r.billingCycle || "monthly",
      seats: r.seats ?? 1,
      label: r.label || r.planLabel || "Payment receipt",
      fileUrl: r.fileUrl,
      razorpayPaymentId: r.transaction.razorpayPaymentId,
      razorpayOrderId: r.transaction.razorpayOrderId,
    }));

    return NextResponse.json({ success: true, receipts });
  } catch (error: unknown) {
    console.error("[billing/receipts] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load receipts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
