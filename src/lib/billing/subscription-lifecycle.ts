import { prisma } from "@/lib/prisma";
import { isStoredTrialPlan } from "@/lib/plans";

export function addBillingPeriod(
  start: Date,
  billingCycle: string
): Date {
  const expiresAt = new Date(start);
  if (billingCycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}

export function isActiveTrialWorkspace(
  plan: string,
  planExpiresAt: Date | null | undefined,
  now = new Date()
) {
  const notExpired =
    planExpiresAt === null || planExpiresAt === undefined || planExpiresAt > now;
  const isLegacyTrial = plan === "pro" && planExpiresAt != null && notExpired;
  return (isStoredTrialPlan(plan) || isLegacyTrial) && notExpired;
}

export async function activateDueSubscriptions(workspaceId: number) {
  const now = new Date();
  const due = await prisma.subscription.findFirst({
    where: {
      workspaceId,
      status: "SCHEDULED",
      plan: "pro",
      startsAt: { lte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!due) {
    return null;
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: due.id },
      data: { status: "ACTIVE" },
    }),
    prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: "pro",
        planExpiresAt: due.expiresAt,
      },
    }),
  ]);

  return due;
}

export async function getScheduledProSubscription(workspaceId: number) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      workspaceId,
      status: "SCHEDULED",
      plan: "pro",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      startsAt: true,
      expiresAt: true,
      billingCycle: true,
      seatsCount: true,
    },
  });
}
