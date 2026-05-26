"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { supabase } from "@/lib/supabase";

type RecoveryState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");

  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [confirmPassword, password]
  );

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return false;
      }

      if (error) {
        setRecoveryState("invalid");
        setErrorMsg(error.message || "This password reset link is invalid or has expired.");
        return false;
      }

      if (data.session) {
        setRecoveryState("ready");
        setErrorMsg("");
        return true;
      }

      return false;
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setRecoveryState("ready");
        setErrorMsg("");
      }
    });

    void resolveSession();

    const fallbackTimer = window.setTimeout(async () => {
      const hasSession = await resolveSession();
      if (!hasSession && isMounted) {
        setRecoveryState("invalid");
        setErrorMsg("This password reset link is invalid or has expired. Request a new link and try again.");
      }
    }, 1200);

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSuccessMsg("New password created successfully. Redirecting you to sign in...");
      await supabase.auth.signOut();
      window.setTimeout(() => {
        router.push(
          `/login?message=${encodeURIComponent("New password created successfully. Please sign in with your new password.")}`
        );
      }, 1200);
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to update your password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white light-theme-forced">
      <AuthMarketingPanel />

      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-900">
              Create New Password
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Choose a new password for your account and confirm it below to get back into your workspace.
            </p>
          </div>

          {recoveryState === "checking" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">
              <div className="flex items-center gap-3">
                <ArrowPathIcon className="h-5 w-5 animate-spin text-teal-600" />
                Verifying your reset link...
              </div>
            </div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-600"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700"
            >
              <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {recoveryState === "ready" && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  New Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                    <LockClosedIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    className="block w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-12 pr-12 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 transition-colors hover:text-zinc-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                    <LockClosedIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your new password"
                    className="block w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-12 pr-12 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 transition-colors hover:text-zinc-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`mt-2 text-xs font-semibold ${passwordsMatch ? "text-emerald-600" : "text-rose-500"}`}>
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Creating password...
                  </>
                ) : (
                  "Create New Password"
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm font-medium text-zinc-500">
            <Link
              href={recoveryState === "invalid" ? "/forgot-password" : "/login"}
              className="font-bold text-teal-600 hover:text-teal-500"
            >
              {recoveryState === "invalid" ? "Request a new reset link" : "Back to Sign in"}
            </Link>
          </p>

          <div className="pt-8 pb-4 text-center">
            <p className="text-xs text-zinc-400">
              © 2026 ANSH Task. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
