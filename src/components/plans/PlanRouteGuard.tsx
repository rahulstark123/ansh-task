"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRestrictedPlanFeatureForPath } from "@/lib/plans";
import { useWorkspacePlan } from "@/lib/useWorkspacePlan";

export function PlanRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, isPro, guardPlanFeature } = useWorkspacePlan();

  useEffect(() => {
    if (!ready) return;
    if (!pathname) return;

    const requiredFeature = getRestrictedPlanFeatureForPath(pathname);
    if (!requiredFeature) return;

    if (!isPro) {
      guardPlanFeature(requiredFeature);
      router.replace("/dashboard");
    }
  }, [guardPlanFeature, isPro, pathname, ready, router]);

  return null;
}
