"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  StarIcon,
  UsersIcon,
  CreditCardIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

/* ─── pricing data ───────────────────────────────────────── */

const MONTHLY_PRICE = 199; // ₹ per seat / month (must match RAZORPAY_PRO_PLAN_AMOUNT_PAISA / 100)
const YEARLY_DISCOUNT = 0.83; // 17% off
const YEARLY_PRICE = Math.round(MONTHLY_PRICE * 12 * YEARLY_DISCOUNT);
const YEARLY_PER_MONTH = Math.round(YEARLY_PRICE / 12);

type Feature = { label: string; free: boolean | string; pro: boolean | string };

const FEATURES: Feature[] = [
  { label: "Tasks",                         free: "50 / month",   pro: "Unlimited"      },
  { label: "Projects",                      free: "3 projects",   pro: "Unlimited"      },
  { label: "Team members",                  free: "2 members",    pro: "Per paid seat"  },
  { label: "Brain Board",                   free: true,           pro: true             },
  { label: "Kanban & table views",          free: true,           pro: true             },
  { label: "Team Space (channels & DMs)",   free: false,          pro: true             },
  { label: "Advanced analytics",            free: false,          pro: true             },
  { label: "Custom roles & permissions",    free: false,          pro: true             },
  { label: "File attachments",              free: "5 MB / file",  pro: "250 MB / file"  },
  { label: "Integrations (Slack, GitHub…)", free: false,          pro: true             },
  { label: "Activity audit log",            free: false,          pro: true             },
  { label: "Export to CSV / PDF",           free: false,          pro: true             },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ─── helpers ────────────────────────────────────────────── */

function FeatureValue({ val }: { val: boolean | string }) {
  if (val === false)
    return <XMarkIcon className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-600" />;
  if (val === true)
    return <CheckIcon className="mx-auto h-4 w-4 stroke-[2.5] text-[var(--app-primary)]" />;
  return (
    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">{val}</span>
  );
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getWid(): string {
  if (typeof window === "undefined") return "1";
  return sessionStorage.getItem("ansh_onboarding_wid") ?? "1";
}

/* ─── page ───────────────────────────────────────────────── */

export default function BillingSettingsPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [userCount, setUserCount] = useState<number>(1);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free");
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutUsers, setCheckoutUsers] = useState<number>(1);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [paymentError, setPaymentError] = useState<string>("");

  // Fetch current plan from DB
  const fetchPlan = useCallback(async () => {
    try {
      const wid = getWid();
      const res = await fetch(`/api/billing/status?wid=${wid}`);
      const json = await res.json();
      if (json.success) {
        setCurrentPlan(json.plan as "free" | "pro");
        setPlanExpiresAt(json.planExpiresAt);
      }
    } catch {
      /* ignore */
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // Fetch real member count from /api/team
  useEffect(() => {
    async function load() {
      try {
        const wid = getWid();
        const res = await fetch(`/api/team?wid=${wid}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.members)) {
          setUserCount(json.members.length || 1);
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingUsers(false);
      }
    }
    load();
    fetchPlan();
    loadRazorpayScript(); // pre-load in background
  }, [fetchPlan]);

  const pricePerUser = billing === "monthly" ? MONTHLY_PRICE : YEARLY_PER_MONTH;
  const totalMonthly = pricePerUser * userCount;
  const totalYearlyFull = YEARLY_PRICE * userCount;

  const subtotal = billing === "monthly"
    ? MONTHLY_PRICE * checkoutUsers
    : YEARLY_PRICE * checkoutUsers;
  const gst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gst;
  const grandTotalPaisa = grandTotal * 100;

  const handleOpenCheckout = () => {
    setCheckoutUsers(userCount || 1);
    setPaymentStatus("idle");
    setPaymentError("");
    setIsCheckoutOpen(true);
  };

  const handleProceedToPay = async () => {
    setPaymentStatus("processing");
    setPaymentError("");

    try {
      const wid = getWid();

      // Load Razorpay script if not already loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Check your internet connection.");
      }

      // Fetch current session for authentication token and email
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const email = session?.user?.email;

      if (!email) {
        throw new Error("You must be logged in to proceed with payment.");
      }

      // Step 1: Create Razorpay order on server
      const orderRes = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          workspaceId: parseInt(wid, 10),
          billingCycle: billing,
          seats: checkoutUsers,
          amountPaisa: grandTotalPaisa,
          email,
        }),
      });
      const orderJson = await orderRes.json();

      if (!orderJson.success) {
        throw new Error(orderJson.error || "Failed to create payment order");
      }

      const { orderId, amount, currency, keyId } = orderJson;

      // Step 2: Open Razorpay Checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          order_id: orderId,
          amount,
          currency: currency || "INR",
          name: "Ansh Task",
          description: `Pro Plan — ${billing === "yearly" ? "Yearly" : "Monthly"} (${checkoutUsers} seat${checkoutUsers > 1 ? "s" : ""})`,
          image: "/favicon.ico",
          prefill: {},
          theme: { color: "#0d9488" },
          modal: {
            ondismiss: () => {
              // User closed the checkout popup without paying
              reject(new Error("Payment cancelled"));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 3: Verify signature on server
              const verifyRes = await fetch("/api/billing/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  workspaceId: parseInt(wid, 10),
                }),
              });
              const verifyJson = await verifyRes.json();
              if (!verifyJson.success) {
                throw new Error(verifyJson.error || "Payment verification failed");
              }
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
        });
        rzp.open();
      });

      // Payment + verification succeeded
      setCurrentPlan("pro");
      setPaymentStatus("success");
      await fetchPlan(); // refresh expiry date from DB

      // Auto-close after 2.5s
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setPaymentStatus("idle");
      }, 2500);
    } catch (err: any) {
      if (err?.message === "Payment cancelled") {
        // User dismissed — just go back to idle
        setPaymentStatus("idle");
      } else {
        setPaymentError(err.message || "Something went wrong. Please try again.");
        setPaymentStatus("error");
      }
    }
  };

  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Billing &amp; Plans
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Choose the right plan for your team. Upgrade or downgrade any time.
        </p>
      </div>

      {/* ── Active plan status banner ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/60">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] dark:bg-teal-950/40">
            <CreditCardIcon className="h-5 w-5 text-[var(--app-primary)]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Current Plan
            </p>
            {planLoading ? (
              <div className="mt-1 h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            ) : (
              <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {currentPlan === "pro"
                  ? `Pro Plan — Active${formattedExpiry ? ` · Renews ${formattedExpiry}` : ""}`
                  : "Free Plan — No active subscription"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* User count chip */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 dark:border-white/[0.07] dark:bg-zinc-900">
            <UsersIcon className="h-4 w-4 text-zinc-400" />
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Seats
              </p>
              {loadingUsers ? (
                <div className="mt-0.5 h-4 w-8 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              ) : (
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  {userCount}
                </p>
              )}
            </div>
          </div>

          {/* Monthly cost chip */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 dark:border-white/[0.07] dark:bg-zinc-900">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {currentPlan === "free" ? "Estimated cost" : "Monthly cost"}
              </p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                {currentPlan === "free"
                  ? "₹0"
                  : `₹${totalMonthly.toLocaleString("en-IN")}/mo`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Billing cycle switcher ── */}
      <div className="flex items-center justify-center">
        <div
          className="relative inline-flex items-center rounded-[14px] p-1"
          style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <span
            className="pointer-events-none absolute inset-1 rounded-[10px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.35,1.2,0.5,1)]"
            style={{ width: "calc(50% - 4px)", left: billing === "monthly" ? "4px" : "calc(50%)" }}
          />
          <button
            type="button"
            id="billing-monthly-tab"
            onClick={() => setBilling("monthly")}
            className={`relative z-10 flex h-9 min-w-[90px] items-center justify-center rounded-[10px] px-5 text-sm font-semibold transition-colors duration-200 ${
              billing === "monthly" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            id="billing-yearly-tab"
            onClick={() => setBilling("yearly")}
            className={`relative z-10 flex h-9 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-semibold transition-colors duration-200 ${
              billing === "yearly" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Yearly
            <span className="rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[10px] font-black text-white leading-tight">
              −17%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* ─ Free card ─ */}
        <motion.div
          layout
          className={`relative flex flex-col rounded-3xl border p-7 ${
            currentPlan === "free"
              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] shadow-[0_0_0_4px_rgba(13,148,136,0.1)] dark:border-teal-600/60 dark:bg-teal-950/10"
              : "border-zinc-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/50"
          }`}
        >
          {currentPlan === "free" && (
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--app-primary)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Active
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-zinc-800">
              <ShieldCheckIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Plan</p>
              <h2 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">Free</h2>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-1">
            <span className="font-heading text-4xl font-black text-zinc-900 dark:text-zinc-50">₹0</span>
            <span className="mb-1 text-sm font-medium text-zinc-400">/ user / month</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Forever free · no credit card required.
          </p>

          <button
            type="button"
            disabled={currentPlan === "free"}
            id="free-plan-cta"
            className="mt-6 w-full rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-default disabled:opacity-60 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300"
          >
            {currentPlan === "free" ? "Current Plan" : "Downgrade to Free"}
          </button>

          <ul className="mt-6 space-y-2.5">
            {[
              "50 tasks per month",
              "3 projects",
              "2 workspace members",
              "Brain Board included",
              "Kanban & table views",
              "5 MB file uploads",
              "No Team Space or advanced analytics",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.5] text-[var(--app-primary)]" />
                <span className="text-zinc-600 dark:text-zinc-300">{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ─ Pro card ─ */}
        <motion.div
          layout
          className={`relative flex flex-col rounded-3xl border p-7 ${
            currentPlan === "pro"
              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] shadow-[0_0_0_4px_rgba(13,148,136,0.1)] dark:border-teal-600/60 dark:bg-teal-950/10"
              : "border-transparent bg-zinc-900 shadow-xl shadow-zinc-900/20 dark:bg-zinc-800/80"
          }`}
        >
          {/* Most popular badge */}
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-teal-600/30">
            <StarIcon className="h-3 w-3" />
            Most Popular
          </span>

          {currentPlan === "pro" && (
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Active
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--app-primary)] to-emerald-500 shadow-md shadow-teal-600/30">
              <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Plan</p>
              <h2 className="font-heading text-xl font-extrabold text-white">Pro</h2>
            </div>
          </div>

          {/* Animated price */}
          <div className="mt-6">
            <div className="flex items-end gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={billing}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.16 }}
                  className="font-heading text-4xl font-black text-white"
                >
                  ₹{pricePerUser.toLocaleString("en-IN")}
                </motion.span>
              </AnimatePresence>
              <span className="mb-1 text-sm font-medium text-zinc-400">/ user / month</span>
            </div>

            {!loadingUsers && userCount > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${billing}-${userCount}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5"
                >
                  <UsersIcon className="h-3.5 w-3.5 text-teal-300" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {userCount} {userCount === 1 ? "user" : "users"} ={" "}
                    <span className="font-black text-white">
                      ₹{totalMonthly.toLocaleString("en-IN")}/mo
                    </span>
                    {billing === "yearly" && (
                      <span className="ml-1 text-teal-300">
                        · ₹{totalYearlyFull.toLocaleString("en-IN")}/yr
                      </span>
                    )}
                  </span>
                </motion.div>
              </AnimatePresence>
            )}

            <AnimatePresence mode="wait">
              {billing === "yearly" ? (
                <motion.p
                  key="yearly-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-xs font-semibold text-teal-400"
                >
                  Billed annually — save&nbsp;
                  <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-teal-300">
                    ₹{(MONTHLY_PRICE * 12 - YEARLY_PRICE).toLocaleString("en-IN")} per user
                  </span>
                </motion.p>
              ) : (
                <motion.p
                  key="monthly-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-xs text-zinc-500"
                >
                  Switch to yearly to save 17% per user.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <button
            type="button"
            id="pro-plan-cta"
            onClick={handleOpenCheckout}
            disabled={currentPlan === "pro" || planLoading}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${
              currentPlan === "pro"
                ? "bg-teal-500/20 text-teal-300"
                : "bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 text-white shadow-lg shadow-teal-600/25 hover:brightness-110"
            }`}
          >
            {currentPlan === "pro" ? (
              "Current Plan"
            ) : (
              <>
                Upgrade to Pro
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>

          <ul className="mt-6 space-y-2.5">
            {[
              "Unlimited tasks & projects",
              "Add team members based on paid seats",
              "Team Space channels & DMs",
              "Brain Board included",
              "250 MB file uploads",
              "Advanced analytics & reports",
              "Custom roles & permissions",
              "Priority email & chat support",
              "Slack, GitHub & more integrations",
              "Activity audit log",
              "CSV / PDF export",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <span className="text-zinc-300">{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── Feature comparison table ── */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900/50">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-white/[0.05]">
          <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
            Compare plans
          </h3>
          <div className="grid grid-cols-2 gap-8 pr-1">
            <span className="text-center text-xs font-bold uppercase tracking-wider text-zinc-400">Free</span>
            <span className="text-center text-xs font-bold uppercase tracking-wider text-[var(--app-primary)]">Pro</span>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.label}
              className={`flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] ${
                i % 2 !== 0 ? "bg-zinc-50/30 dark:bg-white/[0.01]" : ""
              }`}
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{feat.label}</span>
              <div className="grid w-32 grid-cols-2 gap-8 text-center">
                <FeatureValue val={feat.free} />
                <FeatureValue val={feat.pro} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/40 px-6 py-4 dark:border-white/[0.05] dark:bg-white/[0.01]">
          <p className="text-xs text-zinc-400">SSL encrypted · 99.9% uptime SLA · Secured by Razorpay</p>
          <button
            type="button"
            id="compare-upgrade-cta"
            onClick={handleOpenCheckout}
            disabled={currentPlan === "pro"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
          >
            Get Pro <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Trust footer ── */}
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-6 py-5 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Flexible billing, no lock-in.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Upgrade, downgrade, or cancel at any time. Unused time on a paid plan is
          credited proportionally. Payments are processed securely via Razorpay —
          your card details are never stored on our servers.
        </p>
      </div>

      {/* ── Checkout Upgrade Modal ── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => paymentStatus === "idle" && setIsCheckoutOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-sm dark:bg-black/60"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 z-50 m-auto flex h-fit w-full max-w-[440px] flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              {/* ── idle: show order summary ── */}
              {paymentStatus === "idle" && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-4 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-primary)] to-emerald-500 text-white shadow-md">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                          Upgrade to Pro Plan
                        </h3>
                        <p className="text-[10px] text-zinc-400">Secure checkout powered by Razorpay</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-750 dark:hover:bg-zinc-800 dark:hover:text-zinc-250"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="mt-5 space-y-4">
                    {/* Billing Cycle */}
                    <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
                      <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Billing Cycle</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-600 dark:text-teal-300 capitalize">
                        {billing}
                      </span>
                    </div>

                    {/* Seats */}
                    <div className="text-left">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                        Number of Seats / Users
                      </label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <UsersIcon className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={checkoutUsers}
                          onChange={(e) =>
                            setCheckoutUsers(Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="block w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-xs font-semibold text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="rounded-2xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-900/30 space-y-2.5 text-left">
                      <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                        <span>Price per seat</span>
                        <span>₹{billing === "monthly" ? `${MONTHLY_PRICE} / mo` : `${YEARLY_PER_MONTH} / mo`}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                        <span>Subtotal ({checkoutUsers} {checkoutUsers === 1 ? "user" : "users"})</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                        <span>GST (18%)</span>
                        <span>₹{gst.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-[1px] bg-zinc-200 dark:bg-white/5 my-1" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Grand Total</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                            ₹{grandTotal.toLocaleString("en-IN")}
                          </span>
                          <span className="block text-[9px] text-zinc-400 font-medium">
                            {billing === "monthly" ? "billed monthly" : "billed annually"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-5 border-t border-zinc-150 dark:border-white/5 mt-5">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPay}
                      className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Proceed to Pay ₹{grandTotal.toLocaleString("en-IN")}
                    </button>
                  </div>
                </>
              )}

              {/* ── processing ── */}
              {paymentStatus === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative flex h-14 w-14 items-center justify-center">
                    <div className="absolute h-full w-full animate-spin rounded-full border-4 border-teal-500/20 border-t-teal-500" />
                    <BoltIcon className="h-6 w-6 text-teal-500 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      Opening Razorpay Checkout…
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Please complete the payment in the Razorpay popup.
                    </p>
                  </div>
                </div>
              )}

              {/* ── success ── */}
              {paymentStatus === "success" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-md">
                    <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Upgrade Successful! 🎉
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Your workspace has been upgraded to the Pro plan.
                    </p>
                  </div>
                </div>
              )}

              {/* ── error ── */}
              {paymentStatus === "error" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                    <ExclamationCircleIcon className="h-8 w-8 text-rose-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      Payment Failed
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px]">
                      {paymentError || "Something went wrong. Please try again."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus("idle")}
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-6 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
