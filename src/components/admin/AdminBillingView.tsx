"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { authFetch } from "@/lib/admin-client";

type Subscription = {
  id: string;
  status: string;
  plan: string;
  seatsCount: number;
  amountPaisa: number;
  billingCycle: string;
  startsAt: string | null;
  expiresAt: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
  workspace: { id: number; name: string; billingEmail: string | null; plan: string };
  _count: { transactions: number };
};

type Transaction = {
  id: string;
  status: string;
  amountPaisa: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  workspace: { id: number; name: string; billingEmail: string | null };
  subscription: { id: string; plan: string; billingCycle: string; status: string };
};

function formatAmount(paisa: number) {
  return `₹${(paisa / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function statusPill(status: string) {
  const upper = status.toUpperCase();
  if (upper === "ACTIVE" || upper === "SUCCESS") return "bg-emerald-500/15 text-emerald-300";
  if (upper === "PENDING" || upper === "CREATED" || upper === "SCHEDULED") return "bg-sky-500/15 text-sky-300";
  if (upper === "FAILED" || upper === "CANCELLED" || upper === "EXPIRED") return "bg-rose-500/15 text-rose-300";
  return "bg-zinc-500/15 text-zinc-300";
}

function countInMonth<T extends { createdAt: string }>(items: T[], year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return items.filter((item) => {
    const d = new Date(item.createdAt);
    return d >= start && d < end;
  }).length;
}

function sumInMonth(transactions: Transaction[], year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return transactions
    .filter((t) => t.status.toUpperCase() === "SUCCESS")
    .filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d < end;
    })
    .reduce((sum, t) => sum + t.amountPaisa, 0);
}

function monthTrend(current: number, previous: number): { value: string; positive: boolean } | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) return { value: `${current} new`, positive: current > 0 };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { value: "same as last mo", positive: true };
  return { value: `${Math.abs(pct)}% vs last mo`, positive: pct > 0 };
}

function AnalyticsCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && (
          <span
            className={`shrink-0 text-[11px] font-semibold ${
              trend.positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function computeSubscriptionAnalytics(subscriptions: Subscription[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const active = subscriptions.filter((s) => s.status.toUpperCase() === "ACTIVE");
  const pending = subscriptions.filter((s) =>
    ["PENDING", "SCHEDULED"].includes(s.status.toUpperCase())
  );
  const churned = subscriptions.filter((s) =>
    ["CANCELLED", "EXPIRED"].includes(s.status.toUpperCase())
  );

  const recurringPaisa = active.reduce((sum, s) => {
    const monthly = s.billingCycle === "yearly" ? s.amountPaisa / 12 : s.amountPaisa;
    return sum + monthly;
  }, 0);

  const avgSeats =
    active.length > 0
      ? (active.reduce((sum, s) => sum + s.seatsCount, 0) / active.length).toFixed(1)
      : "0";

  const newThisMonth = countInMonth(subscriptions, year, month);
  const newLastMonth = countInMonth(subscriptions, month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);

  return {
    total: subscriptions.length,
    active: active.length,
    pending: pending.length,
    churned: churned.length,
    recurringPaisa,
    avgSeats,
    newTrend: monthTrend(newThisMonth, newLastMonth),
    newThisMonth,
  };
}

function computeTransactionAnalytics(transactions: Transaction[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const successful = transactions.filter((t) => t.status.toUpperCase() === "SUCCESS");
  const failed = transactions.filter((t) => t.status.toUpperCase() === "FAILED");
  const pending = transactions.filter((t) =>
    ["CREATED", "PENDING"].includes(t.status.toUpperCase())
  );

  const totalRevenuePaisa = successful.reduce((sum, t) => sum + t.amountPaisa, 0);
  const successRate =
    transactions.length > 0 ? Math.round((successful.length / transactions.length) * 100) : 0;

  const revenueThisMonth = sumInMonth(transactions, year, month);
  const revenueLastMonth = sumInMonth(
    transactions,
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1
  );

  const txnsThisMonth = countInMonth(transactions, year, month);
  const txnsLastMonth = countInMonth(
    transactions,
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1
  );

  const avgOrderPaisa =
    successful.length > 0 ? Math.round(totalRevenuePaisa / successful.length) : 0;

  return {
    total: transactions.length,
    successful: successful.length,
    failed: failed.length,
    pending: pending.length,
    totalRevenuePaisa,
    successRate,
    revenueThisMonth,
    revenueTrend: monthTrend(revenueThisMonth, revenueLastMonth),
    volumeTrend: monthTrend(txnsThisMonth, txnsLastMonth),
    avgOrderPaisa,
    txnsThisMonth,
  };
}

type BillingTab = "subscriptions" | "transactions";

export function AdminBillingView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BillingTab>("subscriptions");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, txRes] = await Promise.all([
        authFetch("/api/admin/subscriptions"),
        authFetch("/api/admin/transactions"),
      ]);
      const [subJson, txJson] = await Promise.all([subRes.json(), txRes.json()]);
      if (subJson.success) setSubscriptions(subJson.subscriptions);
      if (txJson.success) setTransactions(txJson.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const subAnalytics = useMemo(() => computeSubscriptionAnalytics(subscriptions), [subscriptions]);
  const txAnalytics = useMemo(() => computeTransactionAnalytics(transactions), [transactions]);

  return (
    <>
      <header className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-violet-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Subscriptions & Transactions</h1>
            <p className="text-xs text-zinc-500">All workspace billing activity</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex flex-wrap gap-1">
          {(
            [
              { id: "subscriptions" as const, label: "Subscriptions" },
              { id: "transactions" as const, label: "Transactions" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === id
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === "subscriptions" ? (
              <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard
                  label="Active Subscriptions"
                  value={subAnalytics.active}
                  sub={`${subAnalytics.total} total · ${subAnalytics.pending} pending`}
                />
                <AnalyticsCard
                  label="Monthly Recurring"
                  value={formatAmount(subAnalytics.recurringPaisa)}
                  sub="From active plans (monthly equiv.)"
                />
                <AnalyticsCard
                  label="New This Month"
                  value={subAnalytics.newThisMonth}
                  sub={`${subAnalytics.churned} cancelled / expired`}
                  trend={subAnalytics.newTrend}
                />
                <AnalyticsCard
                  label="Avg Seats / Plan"
                  value={subAnalytics.avgSeats}
                  sub={`${subAnalytics.active} active workspaces`}
                />
              </div>
            ) : (
              <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard
                  label="Total Revenue"
                  value={formatAmount(txAnalytics.totalRevenuePaisa)}
                  sub={`${txAnalytics.successful} successful payments`}
                />
                <AnalyticsCard
                  label="Success Rate"
                  value={`${txAnalytics.successRate}%`}
                  sub={`${txAnalytics.failed} failed · ${txAnalytics.pending} pending`}
                />
                <AnalyticsCard
                  label="This Month"
                  value={formatAmount(txAnalytics.revenueThisMonth)}
                  sub={`${txAnalytics.txnsThisMonth} transactions`}
                  trend={txAnalytics.revenueTrend}
                />
                <AnalyticsCard
                  label="Avg Order Value"
                  value={formatAmount(txAnalytics.avgOrderPaisa)}
                  sub={`${txAnalytics.total} total transactions`}
                  trend={txAnalytics.volumeTrend}
                />
              </div>
            )}

            {activeTab === "subscriptions" ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[#111827] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Seats</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Cycle</th>
                  <th className="px-4 py-3 font-semibold">Starts</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Txns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-200">{s.workspace.name}</p>
                        <p className="text-[10px] text-zinc-500">{s.workspace.billingEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-300">{s.plan}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{s.seatsCount}</td>
                      <td className="px-4 py-3 font-medium text-zinc-200">{formatAmount(s.amountPaisa)}</td>
                      <td className="px-4 py-3 capitalize text-zinc-400">{s.billingCycle}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(s.startsAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(s.expiresAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{s._count.transactions}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[#111827] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-200">{t.workspace.name}</p>
                        <p className="text-[10px] text-zinc-500">{t.workspace.billingEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-200">{formatAmount(t.amountPaisa)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${statusPill(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-300">
                        {t.subscription.plan} · {t.subscription.billingCycle}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-zinc-400">{t.razorpayOrderId}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-zinc-400">
                        {t.razorpayPaymentId || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(t.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
