import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  TRIAL_PLAN,
  WorkspacePlan,
} from "@/lib/plans";
import {
  activateDueSubscriptions,
  getScheduledProSubscription,
  isActiveTrialWorkspace,
} from "@/lib/billing/subscription-lifecycle";

export type WorkspaceSeatsInfo = {
  plan: WorkspacePlan;
  isTrial: boolean;
  hasScheduledPro: boolean;
  scheduledProStartsAt: Date | null;
  seatsUsed: number;
  seatsPurchased: number | null;
  seatsVacant: number | null;
  billingCycle: "monthly" | "yearly" | null;
};

export async function getWorkspaceSeatsInfo(
  workspaceId: number
): Promise<WorkspaceSeatsInfo> {
  await activateDueSubscriptions(workspaceId);

  const now = new Date();

  const [memberCount, workspace, activeSubscription] = await Promise.all([
    prisma.user.count({ where: { workspaceId } }),
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
      select: { seatsCount: true, billingCycle: true },
    }),
  ]);

  const storedPlan = workspace?.plan ?? "free";
  const isTrial = isActiveTrialWorkspace(
    storedPlan,
    workspace?.planExpiresAt,
    now
  );
  const scheduledPro = isTrial
    ? await getScheduledProSubscription(workspaceId)
    : null;

  if (storedPlan === "free" || (!isTrial && !activeSubscription)) {
    const purchased = FREE_PLAN_TEAM_MEMBERS_LIMIT;
    return {
      plan: "free",
      isTrial: false,
      hasScheduledPro: false,
      scheduledProStartsAt: null,
      seatsUsed: memberCount,
      seatsPurchased: purchased,
      seatsVacant: Math.max(0, purchased - memberCount),
      billingCycle: null,
    };
  }

  if (isTrial) {
    return {
      plan: TRIAL_PLAN,
      isTrial: true,
      hasScheduledPro: Boolean(scheduledPro),
      scheduledProStartsAt: scheduledPro?.startsAt ?? null,
      seatsUsed: memberCount,
      seatsPurchased: scheduledPro?.seatsCount ?? null,
      seatsVacant: null,
      billingCycle:
        scheduledPro?.billingCycle === "yearly"
          ? "yearly"
          : scheduledPro?.billingCycle === "monthly"
            ? "monthly"
            : null,
    };
  }

  const purchased = Math.max(activeSubscription!.seatsCount, memberCount);
  const billingCycle =
    activeSubscription!.billingCycle === "yearly" ? "yearly" : "monthly";

  return {
    plan: "pro",
    isTrial: false,
    hasScheduledPro: false,
    scheduledProStartsAt: null,
    seatsUsed: memberCount,
    seatsPurchased: purchased,
    seatsVacant: Math.max(0, purchased - memberCount),
    billingCycle,
  };
}

export async function assertCanAddTeamMember(workspaceId: number): Promise<{
  allowed: boolean;
  error?: string;
  code?: string;
}> {
  const seats = await getWorkspaceSeatsInfo(workspaceId);

  if (seats.plan === "free") {
    if (seats.seatsUsed >= FREE_PLAN_TEAM_MEMBERS_LIMIT) {
      return {
        allowed: false,
        code: "UPGRADE_REQUIRED",
        error: `Free plan workspaces can have up to ${FREE_PLAN_TEAM_MEMBERS_LIMIT} team members. Upgrade to PRO to add more teammates.`,
      };
    }
    return { allowed: true };
  }

  if (seats.isTrial) {
    return { allowed: true };
  }

  const purchased = seats.seatsPurchased ?? seats.seatsUsed;
  if (seats.seatsUsed >= purchased) {
    return {
      allowed: false,
      code: "SEATS_LIMIT",
      error: `All ${purchased} paid seat${purchased === 1 ? "" : "s"} are in use. Add more seats in Billing to invite another teammate.`,
    };
  }

  return { allowed: true };
}
