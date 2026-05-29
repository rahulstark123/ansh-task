import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL =
  (process.env.ADMIN_EMAIL || "tasks@anshapps.com").trim().toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

/** Resolve Bearer token from request and verify admin email via Supabase. */
export async function getAdminUserFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: "Unauthorized" as const };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "Unauthorized" as const };
  }

  if (!isAdminEmail(data.user.email)) {
    return { user: null, error: "Forbidden" as const };
  }

  return { user: data.user, error: null };
}

export async function getBearerTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/** Any authenticated Supabase user (for workspace ticket replies). */
export async function getAuthUserFromRequest(request: Request) {
  const token = await getBearerTokenFromRequest(request);
  if (!token) {
    return { user: null, error: "Unauthorized" as const };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "Unauthorized" as const };
  }

  return { user: data.user, error: null };
}
