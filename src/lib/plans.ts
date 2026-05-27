export type WorkspacePlan = "free" | "pro";

export type ProFeatureKey =
  | "teamSpace"
  | "advancedAnalytics"
  | "teamMembersLimit"
  | "projectsLimit"
  | "tasksLimit";

export type UpgradeRequiredPayload = {
  feature: ProFeatureKey;
  title?: string;
  message?: string;
};

export const UPGRADE_REQUIRED_CODE = "UPGRADE_REQUIRED";
export const PLAN_UPGRADE_EVENT = "ansh:plan-upgrade-required";

export const FREE_TRIAL_DAYS = 14;
export const FREE_PLAN_TEAM_MEMBERS_LIMIT = 2;
export const FREE_PLAN_PROJECTS_LIMIT = 3;
export const FREE_PLAN_TASKS_PER_MONTH_LIMIT = 50;

const PRO_FEATURE_ROUTE_RULES: Array<{ prefix: string; feature: ProFeatureKey }> = [
  { prefix: "/tasks/team", feature: "teamSpace" },
];

export function resolveWorkspaceIdFromSession() {
  if (typeof window === "undefined") return 1;
  const raw = window.sessionStorage.getItem("ansh_onboarding_wid") ?? "1";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function getTrialEndsAt(fromDate: Date = new Date()) {
  const trialEndsAt = new Date(fromDate);
  trialEndsAt.setDate(trialEndsAt.getDate() + FREE_TRIAL_DAYS);
  return trialEndsAt;
}

export function getUpgradeTitle(feature: ProFeatureKey) {
  if (feature === "teamMembersLimit") return "Free Team Limit Reached";
  if (feature === "projectsLimit") return "Free Project Limit Reached";
  if (feature === "tasksLimit") return "Free Task Limit Reached";
  return "Not Included in Free Plan";
}

export function getUpgradeMessage(feature: ProFeatureKey) {
  switch (feature) {
    case "teamSpace":
      return "Team Space is not included in the Free plan. Upgrade to PRO to unlock channels, direct messages, and team discussions.";
    case "advancedAnalytics":
      return "Advanced analytics is not included in the Free plan. Upgrade to PRO to unlock deeper workload, priority, and status insights.";
    case "teamMembersLimit":
      return `Free plan workspaces can have up to ${FREE_PLAN_TEAM_MEMBERS_LIMIT} team members. Upgrade to PRO to add more teammates.`;
    case "projectsLimit":
      return `Free plan workspaces can create up to ${FREE_PLAN_PROJECTS_LIMIT} projects. Upgrade to PRO to create more projects.`;
    case "tasksLimit":
      return `Free plan workspaces can create up to ${FREE_PLAN_TASKS_PER_MONTH_LIMIT} tasks per month. Upgrade to PRO to keep creating tasks.`;
    default:
      return "Upgrade to PRO to unlock this workspace feature.";
  }
}

export function getRestrictedPlanFeatureForPath(pathname: string): ProFeatureKey | null {
  const matchedRule = PRO_FEATURE_ROUTE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  return matchedRule?.feature ?? null;
}

export function showPlanUpgradeModal(feature: ProFeatureKey, message?: string, title?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<UpgradeRequiredPayload>(PLAN_UPGRADE_EVENT, {
      detail: {
        feature,
        title: title || getUpgradeTitle(feature),
        message: message || getUpgradeMessage(feature),
      },
    })
  );
}

export function isUpgradeRequiredError(value: unknown): value is {
  code: string;
  feature?: ProFeatureKey;
  error?: string;
} {
  return Boolean(
    value &&
      typeof value === "object" &&
      "code" in value &&
      (value as { code?: string }).code === UPGRADE_REQUIRED_CODE
  );
}
