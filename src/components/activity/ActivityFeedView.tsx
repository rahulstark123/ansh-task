"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BoltIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
  MegaphoneIcon,
  TicketIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import type { ActivityCategory, ActivityFeedItem } from "@/lib/activity-feed";
import { readSessionWorkspaceId } from "@/lib/workspace-session";

const PAGE_SIZE = 10;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "tasks", label: "Tasks" },
  { id: "projects", label: "Projects" },
  { id: "team", label: "Team" },
  { id: "support", label: "Support" },
] as const;

function categoryIcon(category: ActivityCategory) {
  switch (category) {
    case "task":
      return ClipboardDocumentListIcon;
    case "project":
      return BriefcaseIcon;
    case "member":
      return UserPlusIcon;
    case "ticket":
      return TicketIcon;
    case "announcement":
      return MegaphoneIcon;
    case "brainboard":
      return LightBulbIcon;
    default:
      return BoltIcon;
  }
}

function categoryColor(category: ActivityCategory) {
  switch (category) {
    case "task":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
    case "project":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
    case "member":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    case "ticket":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
    case "announcement":
      return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20";
    case "brainboard":
      return "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20";
  }
}

function actionBadgeColor(action: ActivityFeedItem["action"]) {
  switch (action) {
    case "created":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "updated":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "joined":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300";
    case "posted":
      return "bg-teal-500/10 text-teal-700 dark:text-teal-300";
    case "resolved":
      return "bg-green-500/10 text-green-700 dark:text-green-300";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActivityRow({ item }: { item: ActivityFeedItem }) {
  const Icon = categoryIcon(item.category);

  const row = (
    <div className="group grid gap-4 px-5 py-5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] lg:grid-cols-[minmax(0,1fr)_220px_180px_120px] lg:items-center">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${categoryColor(item.category)}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${categoryColor(item.category)}`}
            >
              {item.categoryLabel}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${actionBadgeColor(item.action)}`}
            >
              {item.actionLabel}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {item.description}
            </p>
          )}
          {item.context && (
            <p className="mt-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
              {item.context}
            </p>
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Actor / Source</p>
        <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {item.actorName || "System activity"}
        </p>
      </div>

      <div className="hidden lg:block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Destination</p>
        <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {item.destination || "Workspace"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end lg:justify-center">
        <div className="text-left lg:text-right">
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatRelativeTime(item.timestamp)}</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{formatFullTime(item.timestamp)}</p>
        </div>
        {item.link && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--app-primary)] opacity-0 transition-opacity group-hover:opacity-100 lg:mt-2 lg:opacity-100">
            Open
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link href={item.link} className="block border-b border-zinc-100 last:border-0 dark:border-white/[0.04]">
        {row}
      </Link>
    );
  }

  return <div className="border-b border-zinc-100 last:border-0 dark:border-white/[0.04]">{row}</div>;
}

function ActivityRowSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-100 px-5 py-5 dark:border-white/[0.04] lg:grid lg:grid-cols-[minmax(0,1fr)_220px_180px_120px] lg:items-center lg:gap-4">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/80" />
        </div>
      </div>
    </div>
  );
}

export function ActivityFeedView() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [workspaceId, setWorkspaceId] = useState(1);

  const loadFeed = useCallback(
    async (wid: number, activeFilter: string, activePage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          wid: String(wid),
          page: String(activePage),
          pageSize: String(PAGE_SIZE),
        });
        if (activeFilter !== "all") params.set("filter", activeFilter);

        const res = await fetch(`/api/activity?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.items) {
          setItems(json.items);
          if (json.pagination) {
            setPagination({
              total: json.pagination.total ?? 0,
              totalPages: json.pagination.totalPages ?? 1,
              hasMore: Boolean(json.pagination.hasMore),
            });
          }
        } else {
          setItems([]);
          setPagination({ total: 0, totalPages: 1, hasMore: false });
        }
      } catch (err) {
        console.error("Failed to load activity feed:", err);
        setItems([]);
        setPagination({ total: 0, totalPages: 1, hasMore: false });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const wid = readSessionWorkspaceId();
    setWorkspaceId(wid);
    void loadFeed(wid, filter, page);
  }, [filter, page, loadFeed]);

  const handleFilterChange = (nextFilter: (typeof FILTERS)[number]["id"]) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const rangeStart = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = pagination.total === 0 ? 0 : Math.min(page * PAGE_SIZE, pagination.total);
  const canGoPrev = page > 1;
  const canGoNext = page < pagination.totalPages || pagination.hasMore;

  return (
    <div className="flex h-[calc(100vh-3.75rem)] w-full flex-col overflow-hidden bg-zinc-50/40 dark:bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-6 py-5 dark:border-white/[0.06] dark:bg-zinc-950/90 backdrop-blur-sm z-20 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
              <BoltIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Activity Feed
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                {loading
                  ? "Loading…"
                  : pagination.total > 0
                    ? `${pagination.total} event${pagination.total === 1 ? "" : "s"} · ${PAGE_SIZE} per page`
                    : "Full workspace timeline across tasks, projects, team, and support"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadFeed(workspaceId, filter, page)}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                filter === tab.id
                  ? "bg-[var(--app-primary)] text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-full w-full"
        >
          <div className="hidden border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:border-white/[0.06] dark:bg-zinc-900/40 lg:grid lg:grid-cols-[minmax(0,1fr)_220px_180px_120px]">
            <span>Activity</span>
            <span>Actor / Source</span>
            <span>Destination</span>
            <span className="text-right">When</span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-zinc-900/40">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <ActivityRowSkeleton key={index} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-32 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <BoltIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No activity yet</p>
              <p className="max-w-md text-xs text-zinc-500 dark:text-zinc-400">
                Task updates, new projects, team joins, announcements, and support tickets will show up here automatically.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-zinc-900/40">
                {items.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>

              {(pagination.totalPages > 1 || pagination.hasMore) && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 bg-white px-5 py-4 dark:border-white/[0.06] dark:bg-zinc-900/40 sm:flex-row">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Showing {rangeStart}–{rangeEnd} of {pagination.total}
                    {pagination.hasMore && page >= pagination.totalPages ? "+" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canGoPrev || loading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Previous
                    </button>
                    <span className="min-w-[88px] text-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!canGoNext || loading}
                      onClick={() => setPage((current) => current + 1)}
                      className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
