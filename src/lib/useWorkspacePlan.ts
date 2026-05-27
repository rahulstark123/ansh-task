"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ProFeatureKey,
  WorkspacePlan,
  getRestrictedPlanFeatureForPath,
  resolveWorkspaceIdFromSession,
  showPlanUpgradeModal,
} from "@/lib/plans";

export function useWorkspacePlan() {
  const [plan, setPlan] = useState<WorkspacePlan>("free");
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshPlan = useCallback(async () => {
    try {
      const wid = resolveWorkspaceIdFromSession();
      const res = await fetch(`/api/billing/status?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        setPlan(json.plan === "pro" ? "pro" : "free");
        setIsTrial(Boolean(json.isTrial));
        setTrialEndsAt(json.trialEndsAt || null);
      } else {
        setPlan("free");
        setIsTrial(false);
        setTrialEndsAt(null);
      }
    } catch (error) {
      console.error("Error loading workspace plan:", error);
      setPlan("free");
      setIsTrial(false);
      setTrialEndsAt(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  const canAccessPlanPath = useCallback(
    (pathname: string) => {
      const feature = getRestrictedPlanFeatureForPath(pathname);
      if (!feature) return true;
      return plan === "pro";
    },
    [plan]
  );

  const guardPlanFeature = useCallback(
    (feature: ProFeatureKey, message?: string, title?: string) => {
      if (plan === "pro") return true;
      showPlanUpgradeModal(feature, message, title);
      return false;
    },
    [plan]
  );

  const guardPlanPathAccess = useCallback(
    (pathname: string) => {
      const feature = getRestrictedPlanFeatureForPath(pathname);
      if (!feature) return true;
      return guardPlanFeature(feature);
    },
    [guardPlanFeature]
  );

  const trialDaysLeft =
    isTrial && trialEndsAt
      ? Math.max(
          0,
          Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      : null;

  return {
    plan,
    isTrial,
    trialEndsAt,
    trialDaysLeft,
    ready,
    isPro: plan === "pro",
    refreshPlan,
    canAccessPlanPath,
    guardPlanFeature,
    guardPlanPathAccess,
  };
}
