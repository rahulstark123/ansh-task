"use client";

import { useCallback, useEffect, useState } from "react";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { authFetch } from "@/lib/admin-client";

type Stats = {
  openTickets: number;
  totalTickets: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  successfulTransactions: number;
  totalRevenuePaisa: number;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export function AdminDashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/stats");
      const json = await res.json();
      if (json.success) setStats(json.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const revenue = stats
    ? `₹${(stats.totalRevenuePaisa / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : "—";

  return (
    <>
      <header className="border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-2">
          <Squares2X2Icon className="h-5 w-5 text-violet-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
            <p className="text-xs text-zinc-500">Overview of support and billing activity</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Open Tickets" value={stats.openTickets} sub={`${stats.totalTickets} total tickets`} />
            <StatCard
              label="Active Subscriptions"
              value={stats.activeSubscriptions}
              sub={`${stats.totalSubscriptions} total subscriptions`}
            />
            <StatCard
              label="Successful Payments"
              value={stats.successfulTransactions}
              sub={`${revenue} total revenue`}
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Unable to load dashboard stats.</p>
        )}
      </div>
    </>
  );
}
