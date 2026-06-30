import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL =
  (process.env.ADMIN_EMAIL || "tasks@anshapps.com").trim().toLowerCase();

export const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "Khushi@Simran";

export const ADMIN_PASSCODE_COOKIE = "admin_passcode_ok";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function verifyAdminPasscode(passcode: string | null | undefined): boolean {
  if (!passcode) return false;
  return passcode === ADMIN_PASSCODE;
}

export function hasAdminPasscodeCookie(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === ADMIN_PASSCODE_COOKIE && value === "1";
  });
}

/** Resolve Bearer token from request and verify admin email via Supabase. */
export async function getAdminUserFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: "Unauthorized" as const };
  }

  if (!hasAdminPasscodeCookie(request)) {
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
