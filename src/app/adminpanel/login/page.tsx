"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL_CLIENT, ensureAdminSession } from "@/lib/admin-client";
import { ShieldCheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
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
      const passcodeRes = await fetch("/api/admin/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
        credentials: "include",
      });
      const passcodeJson = await passcodeRes.json();

      if (!passcodeRes.ok || !passcodeJson.success) {
        setErrorMsg(passcodeJson.error || "Invalid passcode");
        setLoading(false);
        return;
      }

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
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const canSubmit = password.trim() && passcode.trim();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <ShieldCheckIcon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">ANSH Admin</h1>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Support Desk</p>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300">
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
              className="mt-2 block w-full cursor-not-allowed rounded-xl border border-white/10 bg-[#0b0f1a] px-4 py-3 text-sm font-semibold text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#0b0f1a] px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Passcode <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              autoComplete="off"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter admin passcode"
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#0b0f1a] px-4 py-3 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
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
