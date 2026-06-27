import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  WorkspacePlan,
} from "@/lib/plans";
import { resolveWorkspaceBillingState } from "@/lib/billing/subscription-lifecycle";

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
  const [memberCount, billing] = await Promise.all([
    prisma.user.count({ where: { workspaceId } }),
    resolveWorkspaceBillingState(workspaceId),
  ]);

  if (billing.effectivePlan === "free") {
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

  if (billing.isTrial) {
    return {
      plan: billing.effectivePlan,
      isTrial: true,
      hasScheduledPro: billing.hasScheduledPro,
      scheduledProStartsAt: billing.scheduledProStartsAt,
      seatsUsed: memberCount,
      seatsPurchased: billing.latestPaidSubscription?.seatsCount ?? null,
      seatsVacant: null,
      billingCycle: billing.billingCycle,
    };
  }

  const seatHint =
    billing.activeSubscription?.seatsCount ??
    billing.latestPaidSubscription?.seatsCount ??
    memberCount;
  const purchased = Math.max(seatHint, memberCount, 1);

  return {
    plan: "pro",
    isTrial: false,
    hasScheduledPro: false,
    scheduledProStartsAt: null,
    seatsUsed: memberCount,
    seatsPurchased: purchased,
    seatsVacant: Math.max(0, purchased - memberCount),
    billingCycle: billing.billingCycle,
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
