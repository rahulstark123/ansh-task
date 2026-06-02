"use client";

import Link from "next/link";
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import posthog from "@/lib/posthog-noop";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showConnecting, setShowConnecting] = useState(false);

  // Read error parameter from URL if redirected from auth callback with failure
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      const message = params.get("message");
      if (err) {
        setErrorMsg(err);
      }
      if (message) {
        setSuccessMsg(message);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setShowConnecting(true);
    posthog.capture("google_auth_started", { source: "login" });
    try {
      setTimeout(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setErrorMsg(error.message);
          setShowConnecting(false);
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during Google login");
      setShowConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white light-theme-forced">
      <AuthMarketingPanel />

      {/* RIGHT PANE - Login Form */}
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

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700"
            >
              {successMsg}
            </motion.div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[10px] font-bold tracking-widest text-zinc-400">Or</span>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setErrorMsg("");
              setSuccessMsg("");
              
              try {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                
                if (error) {
                  setErrorMsg(error.message);
                  setLoading(false);
                  return;
                }

                const signedInEmail = data.user?.email || email;
                if (data.user?.id) {
                  posthog.identify(data.user.id, { email: signedInEmail });
                  posthog.capture("user_logged_in", { method: "email", email: signedInEmail });
                }
                const profileRes = await fetch(`/api/profile?email=${encodeURIComponent(signedInEmail)}`);
                const profileJson = await profileRes.json();

                if (profileJson?.success && profileJson?.user?.workspaceId) {
                  sessionStorage.setItem("ansh_onboarding_wid", String(profileJson.user.workspaceId));
                  sessionStorage.setItem(
                    "ansh_user_role",
                    String(profileJson.user.role || "editor").toLowerCase()
                  );
                  router.push("/dashboard");
                  return;
                }

                sessionStorage.removeItem("ansh_onboarding_wid");
                sessionStorage.removeItem("ansh_user_role");
                sessionStorage.setItem(
                  "ansh_onboarding_name",
                  data.user?.user_metadata?.full_name || signedInEmail.split("@")[0]
                );
                sessionStorage.setItem("ansh_onboarding_email", signedInEmail);
                if (data.user?.id) {
                  sessionStorage.setItem("ansh_onboarding_uid", data.user.id);
                }
                router.push("/onboarding");
              } catch (err: any) {
                setErrorMsg(err.message || "An unexpected error occurred during login");
                setLoading(false);
              }
            }}>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Email Address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    className="block w-full rounded-xl border border-zinc-300 bg-white pl-4 pr-10 py-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <Link
                    href={
                      email
                        ? `/forgot-password?email=${encodeURIComponent(email)}`
                        : "/forgot-password"
                    }
                    className="text-[10px] font-bold tracking-widest text-teal-600 hover:text-teal-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in to Workspace"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm font-medium text-zinc-500">
              New to ANSH?{" "}
              <Link href="/signup" className="font-bold text-teal-600 hover:text-teal-500">
                Create an account
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
      
      {/* Google Connecting Loader Modal */}
      <AnimatePresence>
        {showConnecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl"
            >
              <div className="flex justify-center mb-6">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                  <ArrowPathIcon className="h-6 w-6 animate-spin" />
                </div>
              </div>
              <h3 className="font-heading text-base font-bold text-white mb-2">Connecting with Google</h3>
              <p className="text-xs text-zinc-450">Securing connection to your account...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
