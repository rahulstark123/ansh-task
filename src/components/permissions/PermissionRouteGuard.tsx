"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePermissionAccess } from "@/lib/usePermissionAccess";
import { getRequiredPermissionForPath } from "@/lib/permissions";

export function PermissionRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, canAccessPath, alertNoPermission } = usePermissionAccess();

  useEffect(() => {
    if (!ready) return;
    if (!pathname) return;

    const requiredPermission = getRequiredPermissionForPath(pathname);
    if (!requiredPermission) return;

    if (!canAccessPath(pathname)) {
      alertNoPermission();
      router.replace("/dashboard");
    }
  }, [alertNoPermission, canAccessPath, pathname, ready, router]);

  return null;
}
