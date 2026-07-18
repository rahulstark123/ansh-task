import { prisma } from "@/lib/prisma";
import {
  buildReceiptPdf,
  documentNumbersFromTransaction,
  formatOwnerDisplayName,
} from "@/lib/billing/receipt-pdf";
import { SITE_NAME } from "@/lib/site";
import {
  buildWorkspaceStorageKey,
  bufferFromArrayBufferLike,
  uploadToR2,
} from "@/lib/storage/r2";

/**
 * Build PDF for a successful transaction, upload to R2 under the workspace
 * folder, and persist a Receipt row with the file link.
 * Idempotent: returns the existing receipt if one already exists for the tx.
 */
export async function createAndStoreReceiptForTransaction(
  transactionId: string
) {
  const existing = await prisma.receipt.findUnique({
    where: { transactionId },
  });
  if (existing) return existing;

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      subscription: true,
      workspace: { select: { name: true, id: true } },
    },
  });

  if (!tx) {
    throw new Error("Transaction not found");
  }
  if (tx.status !== "SUCCESS") {
    throw new Error("Receipt can only be created for successful payments");
  }

  const wid = tx.workspaceId;
  const isSeatAddon = tx.subscription.plan === "seat_addon";
  const cycle = tx.subscription.billingCycle;

  const owner = await prisma.user.findFirst({
    where: {
      workspaceId: wid,
      role: { equals: "owner", mode: "insensitive" },
    },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let periodStart = tx.subscription.startsAt;
  let periodEnd = tx.subscription.expiresAt;
  if (isSeatAddon && (!periodStart || !periodEnd)) {
    const proSub = await prisma.subscription.findFirst({
      where: {
        workspaceId: wid,
        plan: "pro",
        status: { in: ["ACTIVE", "SCHEDULED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { startsAt: true, expiresAt: true },
    });
    periodStart = proSub?.startsAt ?? periodStart;
    periodEnd = proSub?.expiresAt ?? periodEnd;
  }

  const { invoiceNumber, receiptNumber } = documentNumbersFromTransaction(
    tx.id,
    tx.createdAt
  );

  const isAiAddon = tx.subscription.plan === "ai_addon";

  const planLabel = isSeatAddon
    ? "Additional team seats"
    : isAiAddon
    ? "AI Credits Pack"
    : `${SITE_NAME} Pro (${cycle === "yearly" ? "Yearly" : "Monthly"})`;
  const label = isSeatAddon
    ? `Additional seats (${tx.subscription.seatsCount})`
    : isAiAddon
    ? `AI Credits Booster (+${tx.subscription.aiCredits} Credits)`
    : `ANSH Tasks Pro — ${cycle === "yearly" ? "Yearly" : "Monthly"}`;

  const pdf = await buildReceiptPdf({
    invoiceNumber,
    receiptNumber,
    issuedAt: tx.createdAt,
    workspaceName: tx.workspace.name,
    workspaceId: tx.workspace.id,
    ownerName: owner ? formatOwnerDisplayName(owner) : null,
    ownerEmail: owner?.email ?? null,
    ownerPhone: owner?.phone ?? null,
    description: isSeatAddon
      ? `Prorated seat add-on for the current ${cycle} billing period`
      : isAiAddon
      ? `One-time purchase of ${tx.subscription.aiCredits} AI Credits`
      : `Subscription for ${SITE_NAME} Pro (${cycle} billing)`,
    billingCycle: cycle,
    seats: tx.subscription.seatsCount,
    amountMinor: tx.amountPaisa,
    currency: tx.currency || "INR",
    razorpayOrderId: tx.razorpayOrderId,
    razorpayPaymentId: tx.razorpayPaymentId,
    planLabel,
    periodStart,
    periodEnd,
  });

  const fileKey = buildWorkspaceStorageKey(
    wid,
    "receipts",
    `${receiptNumber}.pdf`
  );

  const { url: fileUrl } = await uploadToR2({
    key: fileKey,
    body: bufferFromArrayBufferLike(pdf),
    contentType: "application/pdf",
  });

  try {
    return await prisma.receipt.create({
      data: {
        workspaceId: wid,
        transactionId: tx.id,
        invoiceNumber,
        receiptNumber,
        fileKey,
        fileUrl,
        amountPaisa: tx.amountPaisa,
        currency: tx.currency || "INR",
        planLabel,
        billingCycle: cycle,
        seats: tx.subscription.seatsCount,
        label,
        issuedAt: tx.createdAt,
      },
    });
  } catch (error: unknown) {
    // Race: another verify call may have inserted the row first.
    const again = await prisma.receipt.findUnique({
      where: { transactionId: tx.id },
    });
    if (again) return again;
    throw error;
  }
}
