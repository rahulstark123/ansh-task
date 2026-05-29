"use client";

import Link from "next/link";
import { BoltIcon, CheckCircleIcon, ClockIcon, ChatBubbleLeftRightIcon, SquaresPlusIcon } from "@heroicons/react/24/solid";
import { EyeIcon, EyeSlashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import posthog from "@/lib/posthog-noop";

const SLIDES = [
  {
    id: 0,
    badge: "Smart Workflows",
    badgeIcon: BoltIcon,
    badgeColor: "text-orange-400",
    title: (
      <>
        Elevate your
        <br />
        <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Task Management
        </span>
        <br />
        <span className="text-blue-500">with ANSH</span>
      </>
    ),
    copy: "Focus on what actually matters. Let our system automatically track priorities, set reminders, and organize your day without the manual busywork.",
  },
  {
    id: 1,
    badge: "Team Collaboration",
    badgeIcon: ChatBubbleLeftRightIcon,
    badgeColor: "text-indigo-400",
    title: (
      <>
        Connect your
        <br />
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Entire Team
        </span>
        <br />
        <span className="text-indigo-500">instantly</span>
      </>
    ),
    copy: "Move faster with built-in rich chat, direct messages, and team channels. Keep conversations and tasks completely in sync.",
  },
  {
    id: 2,
    badge: "Visual Boards",
    badgeIcon: SquaresPlusIcon,
    badgeColor: "text-rose-400",
    title: (
      <>
        Track progress
        <br />
        <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
          Without friction
        </span>
        <br />
        <span className="text-rose-500">beautifully</span>
      </>
    ),
    copy: "Visualize your workload using lightning-fast Kanban boards. Drag, drop, and complete tasks effortlessly with real-time updates.",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConnecting, setShowConnecting] = useState(false);

  // Read error parameter from URL if redirected from auth callback with failure
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        setErrorMsg(err);
      }
    }
  }, []);

  const handleGoogleSignup = async () => {
    setErrorMsg("");
    setShowConnecting(true);
    posthog.capture("google_auth_started", { source: "signup" });
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
      setErrorMsg(err.message || "An error occurred during Google registration");
      setShowConnecting(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);

  const strengthCount = [hasMinLength, hasUppercase, hasLowercase, hasNumberOrSymbol].filter(Boolean).length;
  
  const getStrengthText = () => {
    if (!password) return "";
    if (strengthCount <= 1) return "Weak";
    if (strengthCount <= 3) return "Medium";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (strengthCount <= 1) return "bg-rose-500";
    if (strengthCount <= 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const isPasswordStrong = strengthCount === 4;
  const isMatch = password === confirmPassword;
  const canSubmit = isPasswordStrong && isMatch && password.length > 0;

  const slide = SLIDES[currentSlide];
  return (
    <div className="flex min-h-screen bg-white light-theme-forced">
      
      {/* LEFT PANE - Marketing & Branding (Hidden on mobile) */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-[#0a0a0a]">
        
        {/* Subtle background grid pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col p-12 xl:p-20 h-full">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                <slide.badgeIcon className={`h-4 w-4 ${slide.badgeColor}`} />
                <span className="text-xs font-semibold tracking-wide text-zinc-300">{slide.badge}</span>
              </div>

              {/* Typography */}
              <h1 className="mt-8 font-heading text-5xl font-extrabold tracking-tight text-white xl:text-6xl leading-[1.1]">
                {slide.title}
              </h1>
              
              <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
                {slide.copy}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Floating UI Mockups */}
          <div className="relative mt-auto h-[300px] w-full">
            <AnimatePresence mode="wait">
              {currentSlide === 0 && (
                <motion.div
                  key="slide0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute bottom-10 left-10 w-72 rounded-2xl border border-white/5 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <BoltIcon className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className="mt-4 text-center text-sm font-bold text-white">Workflow Active</h3>
                    <p className="mt-1 text-center text-xs text-zinc-500">Reminder sent to 12 participants</p>
                    <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-2/3 rounded-full bg-orange-500" />
                    </div>
                  </div>
                  <div className="absolute bottom-32 left-[360px] flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-md">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-200">Email Sent</span>
                  </div>
                </motion.div>
              )}
              {currentSlide === 1 && (
                <motion.div
                  key="slide1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute bottom-16 left-16 w-80 rounded-2xl border border-white/5 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">AR</div>
                      <div>
                        <p className="text-[13px] font-bold text-white">Alex Rivera <span className="text-[10px] font-normal text-zinc-500">9:45 AM</span></p>
                        <p className="text-xs text-zinc-300">Design looks spot on. The new drawer interactions are buttery smooth. ✨</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {currentSlide === 2 && (
                <motion.div
                  key="slide2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute bottom-12 left-20 w-64 rounded-xl border border-white/5 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-zinc-300">Done</span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">Ship Task Dashboard</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">High</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">ME</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Carousel Indicators */}
          <div className="absolute bottom-10 left-12 flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${currentSlide === i ? "w-8 bg-teal-500" : "w-4 bg-white/20 hover:bg-white/40"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* RIGHT PANE - Signup Form */}
      <div className="flex w-full items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-zinc-900">
              Create your account
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Get started with your free ANSH workspace today.
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
            >
              {errorMsg}
            </motion.div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[10px] font-bold tracking-widest text-zinc-400">Or register email</span>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setErrorMsg("");
              
              try {
                const { data, error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: fullName,
                    }
                  }
                });
                
                if (error) {
                  setErrorMsg(error.message);
                  setLoading(false);
                  return;
                }
                
                sessionStorage.setItem("ansh_onboarding_name", fullName);
                sessionStorage.setItem("ansh_onboarding_email", email);
                if (data?.user?.id) {
                  sessionStorage.setItem("ansh_onboarding_uid", data.user.id);
                  posthog.identify(data.user.id, { email, name: fullName });
                }
                posthog.capture("user_signed_up", { method: "email", name: fullName, email });

                router.push("/onboarding");
              } catch (err: any) {
                setErrorMsg(err.message || "An unexpected error occurred during registration");
                setLoading(false);
              }
            }}>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Full Name
                </label>
                <div className="mt-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="block w-full rounded-xl border border-zinc-300 bg-white pl-4 pr-10 py-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">Password Strength:</span>
                      <span className={
                        strengthCount <= 1 ? "text-rose-500" :
                        strengthCount <= 3 ? "text-amber-500" :
                        "text-emerald-500"
                      }>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(strengthCount / 4) * 100}%` }}
                      />
                    </div>
                    
                    {/* Checklist */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <span className={hasMinLength ? "text-emerald-500" : "text-zinc-350"}>
                          {hasMinLength ? "✓" : "○"}
                        </span>
                        <span>Min. 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={hasUppercase ? "text-emerald-500" : "text-zinc-350"}>
                          {hasUppercase ? "✓" : "○"}
                        </span>
                        <span>Uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={hasLowercase ? "text-emerald-500" : "text-zinc-350"}>
                          {hasLowercase ? "✓" : "○"}
                        </span>
                        <span>Lowercase letter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={hasNumberOrSymbol ? "text-emerald-500" : "text-zinc-350"}>
                          {hasNumberOrSymbol ? "✓" : "○"}
                        </span>
                        <span>Number or symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Confirm Password
                </label>
                <div className="mt-2 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full rounded-xl border border-zinc-300 bg-white pl-4 pr-10 py-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-1.5 text-[10px] font-bold">
                    {isMatch ? (
                      <span className="text-emerald-600">✓ Passwords match</span>
                    ) : (
                      <span className="text-rose-500">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    "Create free account"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm font-medium text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-teal-600 hover:text-teal-500">
                Sign in
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
