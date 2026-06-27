import { resolveWorkspaceBillingState } from "@/lib/billing/subscription-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_PROJECTS_LIMIT,
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  WorkspacePlan,
  getUpgradeMessage,
  isProFeaturePlan,
  ProFeatureKey,
  UPGRADE_REQUIRED_CODE,
} from "@/lib/plans";
import { NextResponse } from "next/server";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function getEffectiveWorkspacePlan(workspaceId: number): Promise<WorkspacePlan> {
  const billing = await resolveWorkspaceBillingState(workspaceId);
  return billing.effectivePlan;
}

export async function getWorkspaceMemberCount(workspaceId: number) {
  return prisma.user.count({
    where: { workspaceId },
  });
}

export async function getWorkspaceProjectCount(workspaceId: number) {
  return prisma.project.count({
    where: { workspaceId },
  });
}

export async function getWorkspaceTaskCountThisMonth(workspaceId: number) {
  const { start, end } = getCurrentMonthRange();
  return prisma.task.count({
    where: {
      workspaceId,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });
}

export {
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  FREE_PLAN_PROJECTS_LIMIT,
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
};

export async function requireProFeaturePlan(workspaceId: number, feature: ProFeatureKey) {
  const plan = await getEffectiveWorkspacePlan(workspaceId);
  if (isProFeaturePlan(plan)) return null;

  return NextResponse.json(
    {
      success: false,
      code: UPGRADE_REQUIRED_CODE,
      feature,
      error: getUpgradeMessage(feature),
    },
    { status: 403 }
  );
}
