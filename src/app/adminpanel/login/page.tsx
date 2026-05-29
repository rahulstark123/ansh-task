"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL_CLIENT, ensureAdminSession } from "@/lib/admin-client";
import { LifebuoyIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    ensureAdminSession().then((ok) => {
      if (ok) router.replace("/adminpanel");
      else setChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL_CLIENT,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      const email = data.user?.email?.trim().toLowerCase();
      if (email !== ADMIN_EMAIL_CLIENT) {
        await supabase.auth.signOut();
        setErrorMsg("This account is not authorized for the admin panel.");
        setLoading(false);
        return;
      }

      router.replace("/adminpanel");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
            <LifebuoyIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-zinc-900 dark:text-white">
              Support Admin
            </h1>
            <p className="text-xs text-zinc-500">Ticket reply panel</p>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Admin email
            </label>
            <input
              type="email"
              readOnly
              value={ADMIN_EMAIL_CLIENT}
              className="mt-2 block w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Sign in to admin panel
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
