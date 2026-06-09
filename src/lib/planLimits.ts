import { activateDueSubscriptions } from "@/lib/billing/subscription-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  FREE_PLAN_PROJECTS_LIMIT,
  FREE_PLAN_TASKS_PER_MONTH_LIMIT,
  FREE_PLAN_TEAM_MEMBERS_LIMIT,
  TRIAL_PLAN,
  WorkspacePlan,
  isStoredTrialPlan,
} from "@/lib/plans";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function getEffectiveWorkspacePlan(workspaceId: number): Promise<WorkspacePlan> {
  await activateDueSubscriptions(workspaceId);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, planExpiresAt: true },
  });

  const storedPlan = workspace?.plan ?? "free";
  const notExpired =
    workspace?.planExpiresAt === null ||
    workspace?.planExpiresAt === undefined ||
    workspace.planExpiresAt > new Date();

  if (isStoredTrialPlan(storedPlan) && notExpired) {
    return TRIAL_PLAN;
  }

  if (storedPlan === "pro" && notExpired) {
    return "pro";
  }

  return "free";
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
