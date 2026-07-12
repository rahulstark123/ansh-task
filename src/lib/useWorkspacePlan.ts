"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ProFeatureKey,
  TRIAL_PLAN,
  WorkspacePlan,
  getRestrictedPlanFeatureForPath,
  isProFeaturePlan,
  isStoredTrialPlan,
  resolveWorkspaceIdFromSession,
  showPlanUpgradeModal,
} from "@/lib/plans";

/** Show paid-plan expiry CTA when this many days or fewer remain. */
export const PLAN_EXPIRY_WARN_DAYS = 14;

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function useWorkspacePlan() {
  const [plan, setPlan] = useState<WorkspacePlan>("free");
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [hasScheduledPro, setHasScheduledPro] = useState(false);
  const [scheduledProStartsAt, setScheduledProStartsAt] = useState<string | null>(
    null
  );
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [seatsPurchased, setSeatsPurchased] = useState<number | null>(null);
  const [seatsVacant, setSeatsVacant] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly" | null>(
    null
  );
  const [canAddSeats, setCanAddSeats] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshPlan = useCallback(async () => {
    try {
      const wid = resolveWorkspaceIdFromSession();
      const res = await fetch(`/api/billing/status?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        const nextPlan: WorkspacePlan =
          json.plan === "pro"
            ? "pro"
            : isStoredTrialPlan(json.plan)
              ? TRIAL_PLAN
              : "free";
        setPlan(nextPlan);
        setIsTrial(Boolean(json.isTrial));
        setTrialEndsAt(json.trialEndsAt || null);
        setPlanExpiresAt(
          json.subscriptionExpiresAt || json.planExpiresAt || null
        );
        setHasScheduledPro(Boolean(json.hasScheduledPro));
        setScheduledProStartsAt(json.scheduledProStartsAt || null);
        setSeatsUsed(typeof json.seatsUsed === "number" ? json.seatsUsed : 0);
        setSeatsPurchased(
          typeof json.seatsPurchased === "number" ? json.seatsPurchased : null
        );
        setSeatsVacant(
          typeof json.seatsVacant === "number" ? json.seatsVacant : null
        );
        setBillingCycle(
          json.billingCycle === "yearly"
            ? "yearly"
            : json.billingCycle === "monthly"
              ? "monthly"
              : null
        );
        setCanAddSeats(Boolean(json.canAddSeats));
      } else {
        setPlan("free");
        setIsTrial(false);
        setTrialEndsAt(null);
        setPlanExpiresAt(null);
        setHasScheduledPro(false);
        setScheduledProStartsAt(null);
        setSeatsUsed(0);
        setSeatsPurchased(null);
        setSeatsVacant(null);
        setBillingCycle(null);
        setCanAddSeats(false);
      }
    } catch (error) {
      console.error("Error loading workspace plan:", error);
      setPlan("free");
      setIsTrial(false);
      setTrialEndsAt(null);
      setPlanExpiresAt(null);
      setHasScheduledPro(false);
      setScheduledProStartsAt(null);
      setSeatsUsed(0);
      setSeatsPurchased(null);
      setSeatsVacant(null);
      setBillingCycle(null);
      setCanAddSeats(false);
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
      return isProFeaturePlan(plan);
    },
    [plan]
  );

  const guardPlanFeature = useCallback(
    (feature: ProFeatureKey, message?: string, title?: string) => {
      if (isProFeaturePlan(plan)) return true;
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

  const trialDaysLeft = isTrial ? daysUntil(trialEndsAt) : null;
  const planDaysLeft =
    !isTrial && plan === "pro" ? daysUntil(planExpiresAt) : null;
  const isPlanExpiringSoon =
    planDaysLeft !== null &&
    planDaysLeft <= PLAN_EXPIRY_WARN_DAYS &&
    !hasScheduledPro;

  return {
    plan,
    isTrial,
    trialEndsAt,
    trialDaysLeft,
    planExpiresAt,
    planDaysLeft,
    isPlanExpiringSoon,
    hasScheduledPro,
    scheduledProStartsAt,
    seatsUsed,
    seatsPurchased,
    seatsVacant,
    billingCycle,
    canAddSeats,
    ready,
    isPro: isProFeaturePlan(plan),
    refreshPlan,
    canAccessPlanPath,
    guardPlanFeature,
    guardPlanPathAccess,
  };
}
