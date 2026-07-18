"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { BillingLocaleInfo } from "@/lib/billing/charge-region";
import { formatChargeAmount } from "@/lib/billing/charge-region";
import { calculateProratedAddSeats } from "@/lib/billing/proration";
import { FxDisclaimerBanner } from "@/components/billing/InrPriceDisplay";
import {
  buildRazorpayPrefill,
  buildRazorpayReadonly,
} from "@/lib/billing/razorpay-prefill";
import { SITE_URL, GSTIN } from "@/lib/site";
import { GST_RATE_PERCENT, minorToMajorAmount, withGstForCurrency } from "@/lib/billing/gst";
import { TEAM_SPACE_ENABLED } from "@/config/features";
import { supabase } from "@/lib/supabase";
import posthog from "@/lib/posthog-noop";
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
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

/* ─── pricing data ───────────────────────────────────────── */

const YEARLY_DISCOUNT = 0.81; // 19% off

function formatPrice(amount: number, locale: BillingLocaleInfo | null): string {
  return formatChargeAmount(amount, locale?.chargeCurrency ?? "INR");
}

type Feature = { label: string; free: boolean | string; pro: boolean | string };

const FEATURES: Feature[] = [
  { label: "Tasks",                         free: "50 / month",   pro: "Unlimited"      },
  { label: "Projects",                      free: "3 projects",   pro: "Unlimited"      },
  { label: "Team members",                  free: "2 members",    pro: "Per paid seat"  },
  { label: "AI Credits",                    free: "20 credits",   pro: "100 credits included" },
  { label: "Brain Board",                   free: true,           pro: true             },
  { label: "Kanban & table views",          free: true,           pro: true             },
  { label: "Activity feed",                 free: false,          pro: true             },
  { label: "Announcements",                 free: false,          pro: "Post & pin"     },
  ...(TEAM_SPACE_ENABLED
    ? [{ label: "Team Space (channels & DMs)", free: false as const, pro: true as const }]
    : []),
  { label: "Advanced analytics",            free: false,          pro: true             },
  { label: "Custom roles & permissions",    free: false,          pro: true             },
  { label: "Mobile app (Soon)",             free: "Soon",         pro: "Soon"           },
  { label: "Activity audit log (Soon)",     free: false,          pro: "Soon"           },
  { label: "Export to CSV / PDF (Soon)",    free: false,          pro: "Soon"           },
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
  const [currentPlan, setCurrentPlan] = useState<"free" | "trial" | "pro">("free");
  const [isTrial, setIsTrial] = useState(false);
  const [hasScheduledPro, setHasScheduledPro] = useState(false);
  const [scheduledProStartsAt, setScheduledProStartsAt] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [seatsPurchased, setSeatsPurchased] = useState<number | null>(null);
  const [seatsVacant, setSeatsVacant] = useState<number | null>(null);
  const [canAddSeats, setCanAddSeats] = useState(false);
  const [subscriptionBilling, setSubscriptionBilling] = useState<"monthly" | "yearly">("monthly");
  const [subscriptionStartsAt, setSubscriptionStartsAt] = useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"upgrade" | "add_seats">("upgrade");
  const [checkoutUsers, setCheckoutUsers] = useState<number>(1);
  const [additionalSeats, setAdditionalSeats] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>("");
  const [billingLocale, setBillingLocale] = useState<BillingLocaleInfo | null>(
    null
  );
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [receipts, setReceipts] = useState<
    {
      id: string;
      invoiceNumber: string;
      receiptNumber: string;
      date: string;
      amountMinor: number;
      currency: string;
      label: string;
      billingCycle: string;
      seats: number;
    }[]
  >([]);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(
    null
  );
  const [helpedBySaathi, setHelpedBySaathi] = useState(false);
  const [workspaceSaathiCode, setWorkspaceSaathiCode] = useState<string | null>(null);
  const [saathiCodeInput, setSaathiCodeInput] = useState("");
  // Keep sample receipt tooling; set true only while previewing PDF layout.
  const SHOW_TEST_RECEIPT_BUTTON = false;
  const [sampleReceiptLoading, setSampleReceiptLoading] = useState(false);

  // Fetch current plan from DB
  const fetchPlan = useCallback(async () => {
    try {
      const wid = getWid();
      const res = await fetch(`/api/billing/status?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) {
        setCurrentPlan(json.plan as "free" | "trial" | "pro");
        setPlanExpiresAt(json.planExpiresAt);
        setIsTrial(Boolean(json.isTrial));
        setHasScheduledPro(Boolean(json.hasScheduledPro));
        setScheduledProStartsAt(json.scheduledProStartsAt ?? null);
        setSeatsUsed(typeof json.seatsUsed === "number" ? json.seatsUsed : 0);
        setSeatsPurchased(
          typeof json.seatsPurchased === "number" ? json.seatsPurchased : null
        );
        setSeatsVacant(
          typeof json.seatsVacant === "number" ? json.seatsVacant : null
        );
        setCanAddSeats(Boolean(json.canAddSeats));
        setSubscriptionStartsAt(json.subscriptionStartsAt ?? null);
        setSubscriptionExpiresAt(
          json.subscriptionExpiresAt ?? json.planExpiresAt ?? null
        );
        if (json.billingCycle === "yearly") {
          setSubscriptionBilling("yearly");
          setBilling("yearly");
        } else if (json.billingCycle === "monthly") {
          setSubscriptionBilling("monthly");
        }
      } else {
        setCurrentPlan("free");
        setPlanExpiresAt(null);
        setIsTrial(false);
        setHasScheduledPro(false);
        setScheduledProStartsAt(null);
        setSeatsUsed(0);
        setSeatsPurchased(null);
        setSeatsVacant(null);
        setCanAddSeats(false);
        setSubscriptionStartsAt(null);
        setSubscriptionExpiresAt(null);
      }
    } catch {
      setCurrentPlan("free");
      setPlanExpiresAt(null);
      setIsTrial(false);
      setHasScheduledPro(false);
      setScheduledProStartsAt(null);
      setSeatsUsed(0);
      setSeatsPurchased(null);
      setSeatsVacant(null);
      setCanAddSeats(false);
      setSubscriptionStartsAt(null);
      setSubscriptionExpiresAt(null);
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

  useEffect(() => {
    async function loadFx() {
      try {
        const queryParams = typeof window !== "undefined" ? window.location.search : "";
        const res = await fetch(`/api/billing/fx${queryParams}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setBillingLocale({
            countryCode: json.countryCode,
            chargeCurrency: json.chargeCurrency,
            monthlyPriceMajor: json.monthlyPriceMajor,
            yearlyPriceMajorPerSeat: json.yearlyPriceMajorPerSeat,
            yearlyPriceTotalPerSeat: json.yearlyPriceTotalPerSeat,
            monthlyMinorPerSeat: json.monthlyMinorPerSeat,
            disclaimer: json.disclaimer,
          });
        }
      } catch {
        /* INR-only fallback */
      }
    }
    loadFx();
  }, []);

  const billableSeatCount =
    currentPlan === "pro" && !isTrial && seatsPurchased != null
      ? seatsPurchased
      : userCount;

  const monthlyPrice = billingLocale?.monthlyPriceMajor ?? 299;
  const yearlyPriceTotal =
    billingLocale?.yearlyPriceTotalPerSeat ??
    Math.round(monthlyPrice * 12 * YEARLY_DISCOUNT);
  const yearlyPerMonth =
    billingLocale?.yearlyPriceMajorPerSeat ??
    Math.round(yearlyPriceTotal / 12);
  const chargeCurrency = billingLocale?.chargeCurrency ?? "INR";

  const pricePerUser = billing === "monthly" ? monthlyPrice : yearlyPerMonth;
  const totalMonthly = monthlyPrice * billableSeatCount;
  const totalYearlyFull = yearlyPriceTotal * billableSeatCount;
  const yearlySavingsPerUser = monthlyPrice * 12 - yearlyPriceTotal;

  const addSeatsProration = useMemo(() => {
    const expiryIso = subscriptionExpiresAt ?? planExpiresAt;
    if (!expiryIso) return null;
    try {
      return calculateProratedAddSeats({
        billingCycle: subscriptionBilling,
        additionalSeats,
        periodExpiresAt: new Date(expiryIso),
        periodStartsAt: subscriptionStartsAt
          ? new Date(subscriptionStartsAt)
          : null,
        currency: chargeCurrency,
      });
    } catch {
      return null;
    }
  }, [
    subscriptionExpiresAt,
    planExpiresAt,
    subscriptionStartsAt,
    subscriptionBilling,
    additionalSeats,
    chargeCurrency,
  ]);

  const subtotal =
    checkoutMode === "add_seats"
      ? addSeatsProration?.amountMajor ?? 0
      : billing === "monthly"
        ? monthlyPrice * checkoutUsers
        : yearlyPriceTotal * checkoutUsers;

  /** Tax-exclusive major units → GST only for INR. */
  const isInrCharge = chargeCurrency === "INR";
  const checkoutGst = withGstForCurrency(Math.round(subtotal * 100), chargeCurrency);
  const taxableAmount = minorToMajorAmount(checkoutGst.exclusiveMinor);
  const gstAmount = minorToMajorAmount(checkoutGst.gstMinor);
  const payableTotal = minorToMajorAmount(checkoutGst.totalMinor);

  const renewalDateLabel = (subscriptionExpiresAt ?? planExpiresAt)
    ? new Date(subscriptionExpiresAt ?? planExpiresAt!).toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "short", year: "numeric" }
      )
    : null;

  const handleOpenCheckout = async () => {
    setCheckoutMode("upgrade");
    setCheckoutUsers(userCount || 1);
    setPaymentStatus("idle");
    setPaymentError("");
    setPaymentSuccessMessage("");
    setHelpedBySaathi(false);
    setWorkspaceSaathiCode(null);
    setSaathiCodeInput("");
    setIsCheckoutOpen(true);
    posthog.capture("upgrade_checkout_opened", {
      billing_cycle: billing,
      seat_count: userCount || 1,
      current_plan: currentPlan,
    });
    try {
      const wid = getWid();
      const res = await fetch(`/api/workspace/company?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success && json?.company?.saathiCode) {
        setWorkspaceSaathiCode(String(json.company.saathiCode));
      }
    } catch {
      /* optional field */
    }
  };

  const loadReceipts = useCallback(async () => {
    setReceiptsLoading(true);
    setReceiptsError("");
    try {
      const wid = getWid();
      const res = await fetch(`/api/billing/receipts?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load receipts");
      }
      setReceipts(json.receipts || []);
    } catch (err: unknown) {
      setReceiptsError(
        err instanceof Error ? err.message : "Failed to load receipts"
      );
      setReceipts([]);
    } finally {
      setReceiptsLoading(false);
    }
  }, []);

  const handleOpenReceipts = () => {
    setIsReceiptsOpen(true);
    void loadReceipts();
  };

  const handleDownloadSampleReceipt = async () => {
    setSampleReceiptLoading(true);
    try {
      const res = await fetch("/api/billing/receipts/sample");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to generate sample receipt");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ANSH-Apps-sample-receipt.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate sample receipt");
    } finally {
      setSampleReceiptLoading(false);
    }
  };

  const handleDownloadReceipt = async (receiptId: string, receiptNumber: string) => {
    setDownloadingReceiptId(receiptId);
    try {
      const wid = getWid();
      const res = await fetch(
        `/api/billing/receipts/${encodeURIComponent(receiptId)}?wid=${wid}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to download receipt");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setReceiptsError(
        err instanceof Error ? err.message : "Failed to download receipt"
      );
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handleOpenAddSeats = () => {
    setCheckoutMode("add_seats");
    setAdditionalSeats(1);
    setPaymentStatus("idle");
    setPaymentError("");
    setHelpedBySaathi(false);
    setIsCheckoutOpen(true);
    posthog.capture("add_seats_checkout_opened", {
      seats_used: seatsUsed,
      seats_purchased: seatsPurchased,
    });
  };

  const effectiveSaathiCode =
    workspaceSaathiCode || saathiCodeInput.trim().toUpperCase() || null;
  const saathiRequiredMissing =
    checkoutMode === "upgrade" && helpedBySaathi && !effectiveSaathiCode;

  const handleProceedToPay = async () => {
    if (saathiRequiredMissing) {
      setPaymentError("Please enter your ANSH Saathi code to continue.");
      setPaymentStatus("error");
      return;
    }

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

      const profileRes = await fetch(
        `/api/profile?email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );
      const profileJson = await profileRes.json().catch(() => ({}));
      const profileUser = profileJson?.success ? profileJson.user : null;
      const checkoutPrefill = buildRazorpayPrefill(
        profileUser ?? { email }
      );
      const checkoutReadonly = buildRazorpayReadonly(checkoutPrefill);

      const orderEndpoint =
        checkoutMode === "add_seats"
          ? "/api/billing/checkout/add-seats"
          : "/api/billing/checkout/order";

      const orderBody =
        checkoutMode === "add_seats"
          ? {
              workspaceId: parseInt(wid, 10),
              additionalSeats,
              email,
              billingCountry: billingLocale?.countryCode,
            }
          : {
              workspaceId: parseInt(wid, 10),
              billingCycle: billing,
              seats: checkoutUsers,
              email,
              billingCountry: billingLocale?.countryCode,
              helpedBySaathi,
              ...(helpedBySaathi && effectiveSaathiCode
                ? { saathiCode: effectiveSaathiCode }
                : {}),
            };

      const orderRes = await fetch(orderEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(orderBody),
      });
      const orderJson = await orderRes.json();

      if (!orderJson.success) {
        throw new Error(orderJson.error || "Failed to create payment order");
      }

      const { orderId, amount, currency, keyId } = orderJson;

      // Step 2: Open Razorpay Checkout
      const verifyJson = await new Promise<{
        success: boolean;
        scheduled?: boolean;
        message?: string;
        startsAt?: string;
      }>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          order_id: orderId,
          amount,
          currency: currency || "INR",
          name: "ANSH Tasks",
          description:
            checkoutMode === "add_seats"
              ? `Additional seats — ${subscriptionBilling === "yearly" ? "Yearly" : "Monthly"} (${additionalSeats} seat${additionalSeats > 1 ? "s" : ""})`
              : `Pro Plan — ${billing === "yearly" ? "Yearly" : "Monthly"} (${checkoutUsers} seat${checkoutUsers > 1 ? "s" : ""})`,
          // Razorpay requires a public HTTPS URL (relative paths often fail → default/ wrong logo)
          image: `${SITE_URL.replace(/\/$/, "")}/logoAnshapps.png`,
          prefill: checkoutPrefill,
          ...(checkoutReadonly ? { readonly: checkoutReadonly } : {}),
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
              const verifyPayload = await verifyRes.json();
              if (!verifyPayload.success) {
                throw new Error(verifyPayload.error || "Payment verification failed");
              }
              resolve(verifyPayload);
            } catch (err: any) {
              reject(err);
            }
          },
        });
        rzp.open();
      });

      // Payment + verification succeeded — reload so billing + app chrome show Pro
      posthog.capture(
        checkoutMode === "add_seats" ? "add_seats_completed" : "upgrade_completed",
        {
          billing_cycle:
            checkoutMode === "add_seats" ? subscriptionBilling : billing,
          seat_count:
            checkoutMode === "add_seats" ? additionalSeats : checkoutUsers,
          amount: payableTotal,
          currency: chargeCurrency,
          gst_percent: isInrCharge ? GST_RATE_PERCENT : 0,
        }
      );
      setPaymentStatus("success");
      setPaymentSuccessMessage(
        verifyJson.message ||
          (verifyJson.scheduled
            ? isPaidProActive
              ? "Your renewed Pro plan is scheduled to start after your current plan ends."
              : "Your Pro plan is scheduled to start after your trial ends."
            : "Your workspace has been upgraded to the Pro plan.")
      );
      if (!verifyJson.scheduled) {
        setCurrentPlan("pro");
      } else {
        setHasScheduledPro(true);
        setScheduledProStartsAt(verifyJson.startsAt ?? null);
      }

      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err: any) {
      if (err?.message === "Payment cancelled") {
        // User dismissed — just go back to idle
        setPaymentStatus("idle");
      } else {
        posthog.capture("upgrade_failed", {
          billing_cycle: billing,
          seat_count: checkoutUsers,
          error_message: err.message || "Unknown error",
        });
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

  const formattedScheduledProStart = scheduledProStartsAt
    ? new Date(scheduledProStartsAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isPaidProActive = currentPlan === "pro" && !isTrial;
  // Paid Pro can renew (schedules after current expiry). Block only if already scheduled.
  const canPurchasePro = !hasScheduledPro;
  const canRenewPro = isPaidProActive && !hasScheduledPro;

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Billing &amp; Plans
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Choose the right plan for your team. Upgrade any time.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
          {SHOW_TEST_RECEIPT_BUTTON ? (
            <button
              type="button"
              onClick={() => void handleDownloadSampleReceipt()}
              disabled={sampleReceiptLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              <DocumentTextIcon className="h-4 w-4" />
              {sampleReceiptLoading ? "Generating…" : "Test receipt"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleOpenReceipts}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <DocumentTextIcon className="h-4 w-4 text-[var(--app-primary)]" />
            My receipts
          </button>
        </div>
      </div>

      <FxDisclaimerBanner locale={billingLocale} />

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
                {hasScheduledPro && (isTrial || currentPlan === "trial")
                  ? `Free Trial — Active${formattedExpiry ? ` · Ends ${formattedExpiry}` : ""}${formattedScheduledProStart ? ` · Pro starts ${formattedScheduledProStart}` : ""}`
                  : hasScheduledPro && isPaidProActive
                    ? `Pro Plan — Active${formattedExpiry ? ` · Ends ${formattedExpiry}` : ""}${formattedScheduledProStart ? ` · Renewal starts ${formattedScheduledProStart}` : ""}`
                    : isTrial || currentPlan === "trial"
                      ? `Free Trial — Active${formattedExpiry ? ` · Ends ${formattedExpiry}` : ""}`
                      : currentPlan === "pro"
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
              {loadingUsers || planLoading ? (
                <div className="mt-0.5 h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              ) : (
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  {seatsPurchased != null
                    ? `${seatsUsed} / ${seatsPurchased}`
                    : userCount}
                </p>
              )}
              {!planLoading && seatsVacant != null && (
                <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
                  {seatsVacant} vacant
                </p>
              )}
            </div>
          </div>

          {/* Monthly cost chip */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 dark:border-white/[0.07] dark:bg-zinc-900">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {currentPlan === "free" ? "Estimated cost" : isTrial ? "Trial cost" : "Monthly cost"}
              </p>
              <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                {currentPlan === "free" || isTrial
                  ? formatPrice(0, billingLocale)
                  : `${formatPrice(totalMonthly, billingLocale)}/mo`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {canAddSeats && (
        <div className="flex flex-col gap-4 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/80 to-emerald-50/40 px-5 py-4 dark:border-teal-900/50 dark:from-teal-950/30 dark:to-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Need more team members?
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {seatsPurchased != null
                ? `You have ${seatsVacant ?? 0} vacant seat${(seatsVacant ?? 0) === 1 ? "" : "s"} of ${seatsPurchased} purchased. New seats are charged at a prorated rate until your plan renews${renewalDateLabel ? ` on ${renewalDateLabel}` : ""} — same as your workspace owner.`
                : "Purchase additional seats for your active Pro subscription (prorated until renewal)."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddSeats}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <UsersIcon className="h-4 w-4" />
            Add more users
          </button>
        </div>
      )}

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
              −19%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {(() => {
          const isProActive = isPaidProActive;
          return (
            <>

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
            <span className="font-heading text-4xl font-black text-zinc-900 dark:text-zinc-50">
              {formatPrice(0, billingLocale)}
            </span>
            <span className="mb-1 text-sm font-medium text-zinc-400">/ user / month</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Forever free · no credit card required.
          </p>

          {currentPlan === "free" && (
            <button
              type="button"
              disabled
              id="free-plan-cta"
              className="mt-6 w-full rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 disabled:cursor-default disabled:opacity-60 dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-300"
            >
              Current Plan
            </button>
          )}

          <ul className="mt-6 space-y-2.5">
            {[
              "50 tasks per month",
              "3 projects",
              "2 workspace members",
              "Brain Board included",
              "Kanban & table views",
              "Mobile app (Soon)",
              TEAM_SPACE_ENABLED ? "No Team Space" : null,
              "No activity feed",
              "No announcements",
              "No advanced analytics",
            ].filter(Boolean).map((f) => (
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
            isProActive
              ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] shadow-[0_0_0_4px_rgba(13,148,136,0.1)] dark:border-teal-600/60 dark:bg-teal-950/10"
              : "border-transparent bg-zinc-900 shadow-xl shadow-zinc-900/20 dark:bg-zinc-800/80"
          }`}
        >
          {/* Most popular badge */}
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-teal-600/30">
            <StarIcon className="h-3 w-3" />
            Most Popular
          </span>

          {isPaidProActive && (
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Active
            </span>
          )}
          {hasScheduledPro && (
            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Pro Scheduled
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--app-primary)] to-emerald-500 shadow-md shadow-teal-600/30">
              <BoltIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isProActive ? "text-teal-600" : "text-teal-400"}`}>Plan</p>
              <h2 className={`font-heading text-xl font-extrabold ${isProActive ? "text-zinc-900 dark:text-zinc-50" : "text-white"}`}>Pro</h2>
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
                  className={`font-heading text-4xl font-black ${isProActive ? "text-zinc-900 dark:text-zinc-50" : "text-white"}`}
                >
                  {formatPrice(pricePerUser, billingLocale)}
                </motion.span>
              </AnimatePresence>
              <span className={`mb-1 text-sm font-medium ${isProActive ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400"}`}>/ user / month</span>
            </div>
            {chargeCurrency === "INR" && (
              <p className={`mt-1 text-[11px] font-semibold ${isProActive ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400"}`}>
                + GST 18%
              </p>
            )}

            {!loadingUsers && userCount > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${billing}-${userCount}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 ${isProActive ? "bg-teal-500/10" : "bg-white/10"}`}
                >
                  <UsersIcon className={`h-3.5 w-3.5 ${isProActive ? "text-teal-600" : "text-teal-300"}`} />
                  <span className={`text-xs font-semibold ${isProActive ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-200"}`}>
                    {userCount} {userCount === 1 ? "user" : "users"} ={" "}
                    <span className={`font-black ${isProActive ? "text-zinc-900 dark:text-white" : "text-white"}`}>
                      {formatPrice(totalMonthly, billingLocale)}/mo
                    </span>
                    {billing === "yearly" && (
                      <span className={`ml-1 ${isProActive ? "text-teal-700 dark:text-teal-300" : "text-teal-300"}`}>
                        · {formatPrice(totalYearlyFull, billingLocale)}/yr
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
                  className={`mt-2 text-xs font-semibold ${isProActive ? "text-teal-700 dark:text-teal-400" : "text-teal-400"}`}
                >
                  Billed annually — save&nbsp;
                  <span className={`rounded px-1.5 py-0.5 ${isProActive ? "bg-teal-500/15 text-teal-700 dark:text-teal-300" : "bg-teal-500/20 text-teal-300"}`}>
                    {formatPrice(yearlySavingsPerUser, billingLocale)} per user
                  </span>
                </motion.p>
              ) : (
                <motion.p
                  key="monthly-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`mt-2 text-xs ${isProActive ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-500"}`}
                >
                  Switch to yearly to save 19% per user.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <button
            type="button"
            id="pro-plan-cta"
            onClick={handleOpenCheckout}
            disabled={!canPurchasePro || planLoading}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-default disabled:opacity-60 ${
              hasScheduledPro
                ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                : "bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 text-white shadow-lg shadow-teal-600/25 hover:brightness-110"
            }`}
          >
            {hasScheduledPro ? (
              isPaidProActive ? "Renewal Scheduled" : "Pro Purchased"
            ) : canRenewPro ? (
              <>
                Renew now — starts after current plan
                <ArrowRightIcon className="h-4 w-4" />
              </>
            ) : isTrial ? (
              <>
                Buy Pro — starts after trial
                <ArrowRightIcon className="h-4 w-4" />
              </>
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
              "Activity feed included",
              "Announcements (post & pin)",
              ...(TEAM_SPACE_ENABLED ? ["Team Space channels & DMs"] : []),
              "Brain Board included",
              "Mobile app (Soon)",
              "Advanced analytics & reports",
              "Custom roles & permissions",
              "Priority email & chat support",
              "Activity audit log (Soon)",
              "CSV / PDF export (Soon)",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <SparklesIcon className={`mt-0.5 h-4 w-4 shrink-0 ${isProActive ? "text-teal-600 dark:text-teal-400" : "text-teal-400"}`} />
                <span className={isProActive ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-300"}>{f}</span>
              </li>
            ))}
          </ul>
        </motion.div>
            </>
          );
        })()}
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
            disabled={!canPurchasePro}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
          >
            {hasScheduledPro
              ? "Pro Scheduled"
              : canRenewPro
                ? "Renew now"
                : "Get Pro"}{" "}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
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
                          {checkoutMode === "add_seats"
                            ? "Add more team seats"
                            : canRenewPro
                              ? "Renew Pro Plan"
                              : "Upgrade to Pro Plan"}
                        </h3>
                        <p className="text-[10px] text-zinc-400">Secure checkout powered by Razorpay</p>
                        {checkoutMode === "upgrade" && isTrial && formattedExpiry && (
                          <p className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Pro billing starts after your trial ends on {formattedExpiry}.
                          </p>
                        )}
                        {checkoutMode === "upgrade" && canRenewPro && formattedExpiry && (
                          <p className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Renewal starts after your current plan ends on {formattedExpiry}.
                          </p>
                        )}
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
                        {checkoutMode === "add_seats" ? subscriptionBilling : billing}
                      </span>
                    </div>

                    {checkoutMode === "add_seats" && seatsPurchased != null && (
                      <p className="rounded-xl bg-teal-500/10 px-3 py-2 text-[11px] font-medium text-teal-800 dark:text-teal-200">
                        Current plan: {seatsUsed} of {seatsPurchased} seats used
                        {seatsVacant != null ? ` · ${seatsVacant} vacant` : ""}
                        {renewalDateLabel
                          ? ` · Renews ${renewalDateLabel} (new seats align to this date)`
                          : ""}
                      </p>
                    )}

                    {/* Seats */}
                    <div className="text-left">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                        {checkoutMode === "add_seats"
                          ? "Additional seats to purchase"
                          : "Number of Seats / Users"}
                      </label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <UsersIcon className="h-4 w-4 text-zinc-400" />
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={
                            checkoutMode === "add_seats" ? additionalSeats : checkoutUsers
                          }
                          onChange={(e) => {
                            const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                            if (checkoutMode === "add_seats") setAdditionalSeats(n);
                            else setCheckoutUsers(n);
                          }}
                          className="block w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-xs font-semibold text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="rounded-2xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-900/30 space-y-2.5 text-left">
                      {checkoutMode === "add_seats" && addSeatsProration ? (
                        <>
                          <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                            <span>Full period ({additionalSeats} seat{additionalSeats === 1 ? "" : "s"})</span>
                            <span className="line-through text-zinc-400">
                              {formatPrice(
                                addSeatsProration.fullPeriodAmountMajor,
                                billingLocale
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                            <span>Time remaining</span>
                            <span>
                              {addSeatsProration.remainingDays} of {addSeatsProration.totalDays} days
                              {" "}
                              ({Math.round(addSeatsProration.prorationFactor * 100)}%)
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200/80 dark:border-white/5">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              {isInrCharge
                                ? "Prorated subtotal (excl. GST)"
                                : "Prorated total (until renewal)"}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                                {formatPrice(
                                  addSeatsProration.amountMajor,
                                  billingLocale
                                )}
                              </span>
                              <span className="block text-[9px] text-zinc-400 font-medium">
                                {renewalDateLabel ? `renews ${renewalDateLabel}` : "aligned to owner plan"}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : checkoutMode === "add_seats" ? (
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          Cannot calculate prorated price — renew your subscription first.
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                            <span>Price per seat</span>
                            <span>
                              {formatPrice(
                                billing === "monthly" ? monthlyPrice : yearlyPerMonth,
                                billingLocale
                              )}{" "}
                              / mo
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              {isInrCharge
                                ? `Subtotal (${checkoutUsers} ${
                                    checkoutUsers === 1 ? "user" : "users"
                                  }, excl. GST)`
                                : `Total (${checkoutUsers} ${
                                    checkoutUsers === 1 ? "user" : "users"
                                  })`}
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                              {formatPrice(taxableAmount, billingLocale)}
                            </span>
                          </div>
                        </>
                      )}

                      {(checkoutMode === "upgrade" ||
                        (checkoutMode === "add_seats" && addSeatsProration)) &&
                        isInrCharge && (
                        <>
                          <div className="flex justify-between text-xs text-zinc-500 font-semibold pt-1 border-t border-zinc-200/80 dark:border-white/5">
                            <span>GST ({GST_RATE_PERCENT}%)</span>
                            <span>{formatPrice(gstAmount, billingLocale)}</span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Total payable
                            </span>
                            <div className="text-right">
                              <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                                {formatPrice(payableTotal, billingLocale)}
                              </span>
                              <span className="block text-[9px] text-zinc-400 font-medium">
                                {checkoutMode === "add_seats"
                                  ? `incl. GST · ${chargeCurrency}`
                                  : billing === "monthly"
                                    ? `billed monthly in ${chargeCurrency} · incl. GST`
                                    : `billed annually in ${chargeCurrency} · incl. GST`}
                              </span>
                            </div>
                          </div>
                          <p className="pt-1 text-[9px] font-medium tracking-wide text-zinc-400 dark:text-zinc-500">
                            GSTIN:{" "}
                            <span className="font-mono text-zinc-500 dark:text-zinc-400">
                              {GSTIN}
                            </span>
                          </p>
                        </>
                      )}

                      {(checkoutMode === "upgrade" ||
                        (checkoutMode === "add_seats" && addSeatsProration)) &&
                        !isInrCharge && (
                        <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200/80 dark:border-white/5">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Total payable
                          </span>
                          <div className="text-right">
                            <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                              {formatPrice(payableTotal, billingLocale)}
                            </span>
                            <span className="block text-[9px] text-zinc-400 font-medium">
                              {checkoutMode === "add_seats"
                                ? chargeCurrency
                                : billing === "monthly"
                                  ? `billed monthly in ${chargeCurrency}`
                                  : `billed annually in ${chargeCurrency}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {checkoutMode === "upgrade" && (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/40">
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Helped by ANSH Saathi
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={helpedBySaathi}
                            onClick={() => setHelpedBySaathi((v) => !v)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                              helpedBySaathi
                                ? "bg-[var(--app-primary)]"
                                : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                helpedBySaathi ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </label>
                        {helpedBySaathi && (
                          <div className="mt-2.5 space-y-2">
                            {workspaceSaathiCode ? (
                              <p className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 font-mono text-[11px] font-semibold tracking-wide text-zinc-800 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200">
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                  Saathi Code
                                </span>
                                <span className="mt-0.5 block">{workspaceSaathiCode}</span>
                              </p>
                            ) : (
                              <div>
                                <label
                                  htmlFor="checkout-saathi-code"
                                  className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-zinc-500"
                                >
                                  Saathi Code <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  id="checkout-saathi-code"
                                  type="text"
                                  value={saathiCodeInput}
                                  onChange={(e) => setSaathiCodeInput(e.target.value)}
                                  placeholder="Mention the Saathi Code here"
                                  maxLength={32}
                                  autoComplete="off"
                                  className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-zinc-900 outline-none transition-all placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                                <p className="mt-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                  Required when Helped by ANSH Saathi is on.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
                      disabled={
                        (checkoutMode === "add_seats" && !addSeatsProration) ||
                        saathiRequiredMissing
                      }
                      className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-[var(--app-primary)] to-emerald-500 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Proceed to Pay {formatPrice(payableTotal, billingLocale)}
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
                      {checkoutMode === "add_seats"
                        ? "Seats added successfully!"
                        : "Upgrade Successful! 🎉"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {checkoutMode === "add_seats"
                        ? "Your subscription now includes more team seats."
                        : paymentSuccessMessage ||
                          "Your workspace has been upgraded to the Pro plan."}
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

      {/* ── My receipts modal ── */}
      <AnimatePresence>
        {isReceiptsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceiptsOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm dark:bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="fixed inset-0 z-50 m-auto flex h-fit max-h-[min(80vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121418]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-primary-soft)] dark:bg-teal-950/40">
                    <DocumentTextIcon className="h-5 w-5 text-[var(--app-primary)]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                      My receipts
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Download ANSH Apps payment PDFs
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReceiptsOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {receiptsLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                      />
                    ))}
                  </div>
                ) : receiptsError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {receiptsError}
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="py-10 text-center">
                    <DocumentTextIcon className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                    <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      No receipts yet
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Receipts appear here after a successful Pro purchase or seat add-on.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {receipts.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3.5 py-3 dark:border-white/[0.08] dark:bg-zinc-900/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                            {r.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {r.invoiceNumber} · {r.receiptNumber} ·{" "}
                            {new Date(r.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
                            {formatChargeAmount(
                              r.amountMinor / 100,
                              r.currency === "USD" ? "USD" : "INR"
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void handleDownloadReceipt(r.id, r.receiptNumber)
                          }
                          disabled={downloadingReceiptId === r.id}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                          {downloadingReceiptId === r.id ? "…" : "PDF"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
