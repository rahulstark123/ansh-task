"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const presetEmail = params.get("email");
    if (presetEmail) {
      setEmail(presetEmail);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg(
        "If an account exists for this email, we sent a password reset link. Please check your inbox."
      );
    } catch (error: any) {
      setErrorMsg(error.message || "Unable to send reset email right now. Please try again.");
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
              Welcome back
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Log in to your account to manage your tasks and team.
            </p>
          </div>

          <div>
            <div className="space-y-3">
              <h3 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-900">
                Forgot Password
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-600"
              >
                {errorMsg}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700"
              >
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
                    <EnvelopeIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="alex@example.com"
                    className="block w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-12 pr-4 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send Reset Confirmation"
                )}
              </button>
            </form>

            <p className="mt-10 text-center text-sm font-medium text-zinc-500">
              <Link href="/login" className="font-bold text-teal-600 hover:text-teal-500">
                Back to Sign in
              </Link>
            </p>
          </div>

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
