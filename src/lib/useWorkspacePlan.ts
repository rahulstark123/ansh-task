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
      } else {
        setPlan("free");
      }
    } catch (error) {
      console.error("Error loading workspace plan:", error);
      setPlan("free");
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

  return {
    plan,
    ready,
    isPro: plan === "pro",
    refreshPlan,
    canAccessPlanPath,
    guardPlanFeature,
    guardPlanPathAccess,
  };
}
