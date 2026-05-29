import { supabase } from "@/lib/supabase";

export const ADMIN_EMAIL_CLIENT =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "tasks@anshapps.com").trim().toLowerCase();

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}

export async function ensureAdminSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email?.trim().toLowerCase();
  return Boolean(email && email === ADMIN_EMAIL_CLIENT);
}
