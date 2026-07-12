import { prisma } from "@/lib/prisma";
import {
  TRIAL_PLAN,
  WorkspacePlan,
  isStoredTrialPlan,
} from "@/lib/plans";

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

export function isPlanNotExpired(
  planExpiresAt: Date | null | undefined,
  now = new Date()
) {
  return (
    planExpiresAt === null ||
    planExpiresAt === undefined ||
    planExpiresAt > now
  );
}

export function isActiveTrialWorkspace(
  plan: string,
  planExpiresAt: Date | null | undefined,
  now = new Date()
) {
  return isStoredTrialPlan(plan) && isPlanNotExpired(planExpiresAt, now);
}

const ACTIVE_SUBSCRIPTION_SELECT = {
  startsAt: true,
  expiresAt: true,
  seatsCount: true,
  billingCycle: true,
} as const;

export type WorkspaceBillingState = {
  effectivePlan: WorkspacePlan;
  isTrial: boolean;
  hasScheduledPro: boolean;
  scheduledProStartsAt: Date | null;
  billingCycle: "monthly" | "yearly" | null;
  activeSubscription: {
    startsAt: Date | null;
    expiresAt: Date | null;
    seatsCount: number;
    billingCycle: string;
  } | null;
  latestPaidSubscription: {
    seatsCount: number;
    billingCycle: string;
    status: string;
  } | null;
  storedPlan: string;
  planExpiresAt: Date | null;
};

function normalizeBillingCycle(
  value: string | null | undefined
): "monthly" | "yearly" | null {
  if (value === "yearly") return "yearly";
  if (value === "monthly") return "monthly";
  return null;
}

async function healPendingPaidSubscriptions(workspaceId: number, now = new Date()) {
  const pendingPaid = await prisma.subscription.findMany({
    where: {
      workspaceId,
      status: "PENDING",
      plan: "pro",
      transactions: { some: { status: "SUCCESS" } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const sub of pendingPaid) {
    const startsAt = sub.startsAt ?? now;
    const expiresAt =
      sub.expiresAt ?? addBillingPeriod(startsAt, sub.billingCycle);
    const shouldSchedule = startsAt > now;

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: shouldSchedule ? "SCHEDULED" : "ACTIVE",
        startsAt,
        expiresAt,
      },
    });

    if (!shouldSchedule) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan: "pro",
          planExpiresAt: expiresAt,
        },
      });
    }
  }
}

export async function reconcileWorkspaceBilling(
  workspaceId: number,
  now = new Date()
) {
  await healPendingPaidSubscriptions(workspaceId, now);
  await activateDueSubscriptions(workspaceId);

  await prisma.subscription.updateMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      expiresAt: { not: null, lte: now },
    },
    data: { status: "EXPIRED" },
  });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, planExpiresAt: true },
  });

  if (!workspace) return;

  if (
    !isPlanNotExpired(workspace.planExpiresAt, now) &&
    workspace.plan !== "free"
  ) {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan: "free" },
    });
  }
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

export async function resolveWorkspaceBillingState(
  workspaceId: number
): Promise<WorkspaceBillingState> {
  await reconcileWorkspaceBilling(workspaceId);
  const now = new Date();

  const [workspace, activeSubscription, scheduledPro, latestPaidSubscription] =
    await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { plan: true, planExpiresAt: true },
      }),
      prisma.subscription.findFirst({
        where: {
          workspaceId,
          status: "ACTIVE",
          plan: "pro",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: { createdAt: "desc" },
        select: ACTIVE_SUBSCRIPTION_SELECT,
      }),
      getScheduledProSubscription(workspaceId),
      prisma.subscription.findFirst({
        where: {
          workspaceId,
          plan: "pro",
          status: { in: ["ACTIVE", "EXPIRED", "SCHEDULED", "CANCELLED"] },
          transactions: { some: { status: "SUCCESS" } },
        },
        orderBy: { createdAt: "desc" },
        select: {
          seatsCount: true,
          billingCycle: true,
          status: true,
        },
      }),
    ]);

  const storedPlan = workspace?.plan ?? "free";
  const planExpiresAt = workspace?.planExpiresAt ?? null;
  const notExpired = isPlanNotExpired(planExpiresAt, now);

  const baseState = {
    storedPlan,
    planExpiresAt,
    latestPaidSubscription: latestPaidSubscription
      ? {
          seatsCount: latestPaidSubscription.seatsCount,
          billingCycle: latestPaidSubscription.billingCycle,
          status: latestPaidSubscription.status,
        }
      : null,
  };

  if (activeSubscription) {
    return {
      ...baseState,
      effectivePlan: "pro",
      isTrial: false,
      hasScheduledPro: Boolean(scheduledPro),
      scheduledProStartsAt: scheduledPro?.startsAt ?? null,
      billingCycle: normalizeBillingCycle(activeSubscription.billingCycle),
      activeSubscription,
    };
  }

  if (isStoredTrialPlan(storedPlan) && notExpired) {
    return {
      ...baseState,
      effectivePlan: TRIAL_PLAN,
      isTrial: true,
      hasScheduledPro: Boolean(scheduledPro),
      scheduledProStartsAt: scheduledPro?.startsAt ?? null,
      billingCycle: scheduledPro
        ? normalizeBillingCycle(scheduledPro.billingCycle)
        : null,
      activeSubscription: null,
    };
  }

  if (storedPlan === "pro" && notExpired) {
    const billingCycle =
      normalizeBillingCycle(latestPaidSubscription?.billingCycle) ??
      normalizeBillingCycle(scheduledPro?.billingCycle);

    return {
      ...baseState,
      effectivePlan: "pro",
      isTrial: false,
      hasScheduledPro: Boolean(scheduledPro),
      scheduledProStartsAt: scheduledPro?.startsAt ?? null,
      billingCycle,
      activeSubscription: null,
    };
  }

  return {
    ...baseState,
    effectivePlan: "free",
    isTrial: false,
    hasScheduledPro: false,
    scheduledProStartsAt: null,
    billingCycle: null,
    activeSubscription: null,
  };
}
