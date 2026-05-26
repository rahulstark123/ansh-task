"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AppRole,
  DEFAULT_PERMISSION_MATRIX,
  PermissionMatrix,
  USER_ROLE_SESSION_KEY,
  canAccessPermission,
  getPermissionStorageKey,
  getRequiredPermissionForPath,
  normalizeRole,
  parsePermissionMatrix,
  sanitizePermissionMatrix,
  showPermissionDeniedModal,
} from "@/lib/permissions";
import { resolveWorkspaceIdFromSession } from "@/lib/plans";

export function usePermissionAccess() {
  const [role, setRole] = useState<AppRole>("editor");
  const [matrix, setMatrix] = useState<PermissionMatrix>(DEFAULT_PERMISSION_MATRIX);
  const [ready, setReady] = useState(false);
  const [workspaceId] = useState(() => resolveWorkspaceIdFromSession());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getPermissionStorageKey(workspaceId);
    const loadMatrix = () => {
      const raw = window.localStorage.getItem(storageKey);
      setMatrix(parsePermissionMatrix(raw));
    };

    loadMatrix();
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setMatrix(parsePermissionMatrix(event.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [workspaceId]);

  useEffect(() => {
    let active = true;

    async function loadCurrentRole() {
      try {
        const cachedRole =
          typeof window !== "undefined" ? window.sessionStorage.getItem(USER_ROLE_SESSION_KEY) : null;
        if (cachedRole && active) {
          setRole(normalizeRole(cachedRole));
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const [profileRes, permissionsRes] = await Promise.all([
          fetch(`/api/profile?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/permissions?wid=${workspaceId}&email=${encodeURIComponent(user.email)}`, {
            cache: "no-store",
          }),
        ]);
        const [profileJson, permissionsJson] = await Promise.all([
          profileRes.json(),
          permissionsRes.json(),
        ]);
        const resolvedRole = normalizeRole(profileJson?.user?.role || cachedRole || "editor");
        const resolvedMatrix =
          permissionsRes.ok && permissionsJson?.success
            ? sanitizePermissionMatrix(permissionsJson.matrix)
            : null;

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(USER_ROLE_SESSION_KEY, resolvedRole);
          if (resolvedMatrix) {
            window.localStorage.setItem(
              getPermissionStorageKey(workspaceId),
              JSON.stringify(resolvedMatrix)
            );
          }
        }

        if (active) {
          setRole(resolvedRole);
          if (resolvedMatrix) {
            setMatrix(resolvedMatrix);
          }
        }
      } catch (err) {
        console.error("Error loading current role for permission access:", err);
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    loadCurrentRole();
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const can = useCallback(
    (permissionId: string | null | undefined) => canAccessPermission(role, permissionId, matrix),
    [role, matrix]
  );

  const canAccessPath = useCallback(
    (pathname: string) => can(getRequiredPermissionForPath(pathname)),
    [can]
  );

  const alertNoPermission = useCallback(() => {
    showPermissionDeniedModal();
  }, []);

  const guardPathAccess = useCallback(
    (pathname: string) => {
      const allowed = canAccessPath(pathname);
      if (!allowed) {
        alertNoPermission();
        return false;
      }
      return true;
    },
    [alertNoPermission, canAccessPath]
  );

  return {
    role,
    matrix,
    ready,
    can,
    canAccessPath,
    guardPathAccess,
    alertNoPermission,
  };
}
