"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  CreditCardIcon,
  XMarkIcon,
  CheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function getWid(): string {
  if (typeof window === "undefined") return "1";
  return sessionStorage.getItem("ansh_onboarding_wid") ?? "1";
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

interface UsageLog {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  creditConsumed: number;
  createdAt: string;
}

interface Receipt {
  id: string;
  invoiceNumber: string;
  receiptNumber: string;
  date: string;
  amountMinor: number;
  currency: string;
  label: string;
  billingCycle: string;
  seats: number;
}

const CREDIT_PACKAGES = [
  { credits: 100, priceInr: 99, priceUsd: 1.49, label: "Starter Booster" },
  { credits: 500, priceInr: 299, priceUsd: 3.99, label: "Growth Booster" },
  { credits: 1000, priceInr: 699, priceUsd: 7.99, label: "Enterprise Booster" },
];

const SHOW_TEST_RECEIPT_BUTTON = false;

export default function AiUsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCredits, setTotalCredits] = useState(20);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState(20);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [billingLocale, setBillingLocale] = useState<{
    countryCode: string;
    chargeCurrency: "INR" | "USD";
  }>({ countryCode: "IN", chargeCurrency: "INR" });

  // Buy Credits state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(1); // default 500 credits
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [checkoutError, setCheckoutError] = useState("");

  // Receipts state
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const wid = getWid();
      const res = await fetch(`/api/ai/usage?wid=${wid}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setTotalCredits(json.totalCredits);
        setCreditsUsed(json.creditsUsed);
        setCreditsRemaining(json.creditsRemaining);
        setLogs(json.logs);
        setCurrentPage(1);
      } else {
        setError(json.error || "Failed to load usage data.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while loading AI statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadFx() {
      try {
        const queryParams = typeof window !== "undefined" ? window.location.search : "";
        const res = await fetch(`/api/billing/fx${queryParams}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setBillingLocale({
            countryCode: json.countryCode || "IN",
            chargeCurrency: json.chargeCurrency || "INR",
          });
        }
      } catch {
        /* Fallback to IN */
      }
    }
    loadFx();
  }, []);

  useEffect(() => {
    fetchUsageData();
    // Listen for custom trigger to update credits (e.g. from Copilot/Summary Modals)
    const handleUpdate = () => {
      fetchUsageData();
    };
    window.addEventListener("update-ai-credits", handleUpdate);
    return () => window.removeEventListener("update-ai-credits", handleUpdate);
  }, [fetchUsageData]);

  // Calculate percentage used for display
  const percentUsed = totalCredits > 0 ? (creditsUsed / totalCredits) * 100 : 0;

  const handleBuyCredits = async () => {
    setCheckoutStatus("processing");
    setCheckoutError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay SDK. Please check your network.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      const accessToken = session?.access_token;

      if (!email) {
        throw new Error("You must be logged in to proceed with payment.");
      }

      const pkg = CREDIT_PACKAGES[selectedPackageIdx];
      const wid = getWid();

      // Create order
      const orderRes = await fetch("/api/billing/checkout/ai-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          workspaceId: parseInt(wid, 10),
          credits: pkg.credits,
          priceInr: pkg.priceInr,
          email,
          billingCountry: billingLocale.countryCode,
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderJson.success) {
        throw new Error(orderJson.error || "Failed to create payment order");
      }

      const { orderId, amount, currency, keyId } = orderJson;

      // Open Razorpay Checkout popup
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          order_id: orderId,
          amount,
          currency: currency || "INR",
          name: "ANSH Tasks",
          description: `Buy AI Credits — ${pkg.label} (${pkg.credits} credits)`,
          image: `${window.location.origin}/logoAnshapps.png`,
          prefill: {
            email,
            name: session?.user?.user_metadata?.full_name || email.split("@")[0],
          },
          theme: { color: "#6366f1" }, // Indigo theme for AI products
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Verify payment on server
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
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
        });
        rzp.open();
      });

      setCheckoutStatus("success");
      await fetchUsageData();
    } catch (err: any) {
      console.error(err);
      setCheckoutStatus("error");
      setCheckoutError(err.message || "Something went wrong during payment.");
    }
  };

  const loadReceipts = async () => {
    setReceiptsLoading(true);
    setReceiptsError("");
    try {
      const wid = getWid();
      const res = await fetch(`/api/billing/receipts?wid=${wid}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load receipts");
      }
      
      // Filter only AI Credits Pack receipts
      const aiReceipts = (json.receipts || []).filter(
        (r: any) => r.label && r.label.includes("AI Credits")
      );
      setReceipts(aiReceipts);
    } catch (err: unknown) {
      setReceiptsError(
        err instanceof Error ? err.message : "Failed to load receipts"
      );
      setReceipts([]);
    } finally {
      setReceiptsLoading(false);
    }
  };

  const handleOpenReceipts = () => {
    setIsReceiptsOpen(true);
    void loadReceipts();
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

  const [sampleReceiptLoading, setSampleReceiptLoading] = useState(false);
  const handleDownloadSampleReceipt = async () => {
    setSampleReceiptLoading(true);
    try {
      const res = await fetch("/api/billing/receipts/sample-ai");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to generate sample receipt");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ANSH-Apps-sample-ai-receipt.pdf";
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

  const isUsd = billingLocale.chargeCurrency === "USD";
  const selectedPkg = CREDIT_PACKAGES[selectedPackageIdx];
  const pkgPrice = isUsd ? selectedPkg.priceUsd : selectedPkg.priceInr;
  const currencySymbol = isUsd ? "$" : "₹";
  const gstAmount = isUsd ? 0 : Math.round(selectedPkg.priceInr * 18) / 100;
  const totalAmount = isUsd ? selectedPkg.priceUsd : selectedPkg.priceInr + gstAmount;

  // Pagination for Consumption Logs (10 per page)
  const pageSize = 10;
  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, logs.length);
  const paginatedLogs = logs.slice(startIndex, endIndex);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
            AI Usage & Credits
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
            Monitor task generation, summary credits, and workspace consumption logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenReceipts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <DocumentTextIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            Receipts
          </button>
          <button
            onClick={() => setIsCostModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <CpuChipIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            Credit Cost
          </button>
          <button
            onClick={() => {
              setCheckoutStatus("idle");
              setCheckoutError("");
              setIsBuyModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-250 bg-indigo-50/50 hover:bg-indigo-100/50 dark:border-indigo-500/20 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 px-3.5 py-1.5 text-xs font-bold text-indigo-650 dark:text-indigo-400 transition-colors shadow-sm cursor-pointer"
          >
            <SparklesIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            Buy AI Credits
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-450">
            Analyzing consumption logs...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 text-xs font-semibold text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-400 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Credit Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card 1: Credits Remaining */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Credits Remaining
                </span>
                <CpuChipIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {creditsRemaining}
                </span>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  / {totalCredits} credits
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-500"
                  style={{ width: `${Math.max(0, Math.min(100, 100 - percentUsed))}%` }}
                />
              </div>
            </div>

            {/* Card 2: Credits Used */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Credits Used
                </span>
                <CheckCircleIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {creditsUsed}
                </span>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  credits consumed
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(0, Math.min(100, percentUsed))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-150 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">
                Consumption Logs & Credits
              </h3>
              <button
                onClick={fetchUsageData}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <ArrowPathIcon className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Refresh Logs
              </button>
            </div>
            
            <div className="overflow-x-auto min-w-full">
              {logs.length === 0 ? (
                <div className="py-12 text-center">
                  <CpuChipIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450">
                    No AI actions logged in this workspace yet.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-zinc-200/50 dark:divide-white/[0.04]">
                  <thead className="bg-stone-50/50 dark:bg-zinc-950/20">
                    <tr>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Action
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Used By
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Credit Consumed
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.03]">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/20 dark:hover:bg-zinc-950/5 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {log.action}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-505">
                              {log.userEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400">
                            {log.creditConsumed} {log.creditConsumed === 1 ? "credit" : "credits"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-450">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {logs.length > 0 && (
              <div className="px-5 py-3 border-t border-zinc-150 dark:border-white/[0.06] flex items-center justify-between bg-stone-50/40 dark:bg-zinc-950/10">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-semibold text-zinc-700 dark:text-zinc-200">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{endIndex}</span> of{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">{logs.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    title="Previous Page"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    title="Next Page"
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buy AI Credits Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              if (checkoutStatus !== "processing") {
                setIsBuyModalOpen(false);
              }
            }}
            disabled={checkoutStatus === "processing"}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm dark:bg-black/80"
          />

          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-2xl dark:border-indigo-500/15 dark:bg-zinc-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

            <div className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-white/[0.06]">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <SparklesIcon className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  Buy AI Credits
                </h3>
                <button
                  onClick={() => setIsBuyModalOpen(false)}
                  disabled={checkoutStatus === "processing"}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {checkoutStatus === "success" ? (
                <div className="my-6 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckIcon className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      Recharge Successful!
                    </h4>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-[320px] mx-auto leading-relaxed">
                      Successfully purchased {CREDIT_PACKAGES[selectedPackageIdx].credits} AI Credits. Your remaining credits have been updated.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsBuyModalOpen(false)}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md transition-colors"
                    >
                      Awesome
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {checkoutStatus === "error" && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-450 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                      {checkoutError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-505">
                      Choose Credit Booster
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {CREDIT_PACKAGES.map((pkg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (checkoutStatus !== "processing") setSelectedPackageIdx(idx);
                          }}
                          disabled={checkoutStatus === "processing"}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all ${
                            selectedPackageIdx === idx
                              ? "border-indigo-500 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/20 scale-[1.01]"
                              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-950/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                              selectedPackageIdx === idx ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" : "bg-zinc-100 text-zinc-550 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>
                              <CpuChipIcon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-50">
                                {pkg.label}
                              </span>
                              <span className="block text-[10px] text-indigo-650 dark:text-indigo-400 font-bold mt-0.5">
                                + {pkg.credits} AI Credits
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-heading font-black text-zinc-900 dark:text-zinc-50">
                              {isUsd ? `$${pkg.priceUsd}` : `₹${pkg.priceInr}`}
                            </span>
                            <span className="block text-[9px] font-medium text-zinc-450 dark:text-zinc-505">
                              One-time purchase
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown & GST */}
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/[0.04] dark:bg-zinc-950/20 space-y-2.5">
                    <div className="flex justify-between text-xs text-zinc-550 dark:text-zinc-400">
                      <span>Base Amount</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {currencySymbol}{pkgPrice.toFixed(2)}
                      </span>
                    </div>
                    {!isUsd && (
                      <div className="flex justify-between text-xs text-zinc-550 dark:text-zinc-400">
                        <span>IGST / CGST + SGST (18%)</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">₹{gstAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-zinc-200/60 pt-2.5 flex justify-between text-xs font-bold dark:border-white/5">
                      <span className="text-zinc-800 dark:text-zinc-100">Total Payable Amount</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {currencySymbol}{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBuyModalOpen(false)}
                      disabled={checkoutStatus === "processing"}
                      className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-900 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyCredits}
                      disabled={checkoutStatus === "processing"}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {checkoutStatus === "processing" ? (
                        <>
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-3.5 w-3.5" />
                          Recharge Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipts List Modal */}
      {isReceiptsOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsReceiptsOpen(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm dark:bg-black/80"
          />

          <div className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

            <div className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-150 pb-3 dark:border-white/[0.06]">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <DocumentTextIcon className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
                  AI Credit Receipts
                </h3>
                <button
                  onClick={() => setIsReceiptsOpen(false)}
                  className="text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              {receiptsError && (
                <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-455">
                  {receiptsError}
                </div>
              )}

              <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1">
                {receiptsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <ArrowPathIcon className="h-6 w-6 text-indigo-500 animate-spin" />
                    <span className="text-[11px] font-semibold text-zinc-400">Loading receipts...</span>
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <DocumentTextIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-650" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-550">No AI Credit Receipts</h4>
                    <p className="text-[11px] text-zinc-450 leading-relaxed max-w-[280px] mx-auto">
                      Receipts will be generated here automatically after you purchase a Credit Booster package.
                    </p>
                  </div>
                ) : (
                  receipts.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-150 bg-stone-50/20 p-3.5 hover:bg-stone-50/60 dark:border-white/[0.04] dark:bg-zinc-950/10 dark:hover:bg-zinc-950/25 transition-all"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {r.label || "AI Credits Pack"}
                        </span>
                        <span className="block text-[10px] text-zinc-450 font-semibold">
                          Invoice: {r.invoiceNumber} · {new Date(r.date || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                          ₹{Math.round(r.amountMinor / 100)}
                        </span>
                        <button
                          onClick={() => handleDownloadReceipt(r.id, r.receiptNumber)}
                          disabled={downloadingReceiptId === r.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-150 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 disabled:opacity-50 cursor-pointer"
                          title="Download PDF Invoice"
                        >
                          {downloadingReceiptId === r.id ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={`mt-6 flex ${SHOW_TEST_RECEIPT_BUTTON ? "justify-between" : "justify-end"} items-center`}>
                {SHOW_TEST_RECEIPT_BUTTON && (
                  <button
                    type="button"
                    onClick={handleDownloadSampleReceipt}
                    disabled={sampleReceiptLoading}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/20 hover:bg-indigo-100/30 px-4 py-2 text-xs font-bold text-indigo-650 dark:border-indigo-500/25 dark:bg-indigo-950/20 dark:text-indigo-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sampleReceiptLoading ? "Generating..." : "Download Test Receipt"}
                  </button>
                )}
                <button
                  onClick={() => setIsReceiptsOpen(false)}
                  className="rounded-xl bg-zinc-150 hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Cost Modal */}
      {isCostModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsCostModalOpen(false)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm dark:bg-black/80"
          />

          <div className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-2xl dark:border-indigo-500/15 dark:bg-zinc-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

            <div className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-white/[0.06]">
                <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <CpuChipIcon className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
                  AI Operation Credit Costs
                </h3>
                <button
                  onClick={() => setIsCostModalOpen(false)}
                  className="text-zinc-455 hover:text-zinc-650 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { icon: "✨", name: "Create Task", cost: "1 credit" },
                  { icon: "📝", name: "Task Summarization", cost: "2 credits" },
                  { icon: "👤", name: "Employee Summary (tasks, projects, progress, overdue)", cost: "5 credits" },
                  { icon: "📊", name: "Weekly Team Summary", cost: "5 credits" },
                  { icon: "🧠", name: "Create Brain Board", cost: "1 credit" },
                  { icon: "📋", name: "Create Complete Project", cost: "2 credits" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-xl bg-stone-50/50 px-3.5 py-2.5 border border-zinc-100 dark:bg-zinc-950/40 dark:border-white/[0.04] hover:bg-stone-50/80 dark:hover:bg-zinc-950/60 transition-colors">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <span className="text-sm shrink-0">{item.icon}</span> {item.name}
                    </span>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/30">
                      {item.cost}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsCostModalOpen(false)}
                  className="rounded-xl bg-[var(--app-primary)] hover:bg-[var(--app-primary-hover)] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
