"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

function RobotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 8V4M10 4h4" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M9 13h.01M15 13h.01" />
      <path d="M9 17h6" />
      <path d="M2 13h2M20 13h2" />
    </svg>
  );
}

type Task = {
  title: string;
  project: string;
  status: string;
  progress: number;
};

type EmployeeSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  role: string;
  department: string;
  designation?: string;
  joinedDate: string;
  reportsTo: string;
  tasks: Task[];
  /** Existing summary (if already generated once) */
  existingSummary?: string | null;
  /** Called when a new summary is generated, so parent can persist it */
  onSummaryGenerated?: (summary: string) => void;
};

/** Renders markdown-ish bold section headers nicely */
function SummaryRenderer({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Bold section header: **Some Header**
        const headerMatch = trimmed.match(/^\*\*(.+)\*\*$/);
        if (headerMatch) {
          return (
            <p
              key={i}
              className="mt-3 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400"
            >
              {headerMatch[1]}
            </p>
          );
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{trimmed.replace(/^[-•]\s/, "")}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function EmployeeSummaryModal({
  open,
  onClose,
  employeeName,
  role,
  department,
  designation,
  joinedDate,
  reportsTo,
  tasks,
  existingSummary,
  onSummaryGenerated,
}: EmployeeSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(existingSummary ?? null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync existingSummary prop
  useEffect(() => {
    if (existingSummary) {
      setSummary(existingSummary);
    }
  }, [existingSummary]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unknown User";
      const userEmail = user?.email || "unknown@domain.com";
      const wid = typeof window !== "undefined"
        ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
        : 1;

      const response = await fetch("/api/ai/employee-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName,
          role,
          department,
          designation,
          joinedDate,
          reportsTo,
          tasks,
          workspaceId: wid,
          userName,
          userEmail,
        }),
      });

      const data = await response.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
        setGeneratedAt(new Date());
        onSummaryGenerated?.(data.summary);
        window.dispatchEvent(new Event("update-ai-credits"));
      } else {
        setError(data.error || "Failed to generate summary. Please try again.");
      }
    } catch (err) {
      console.error("Employee summary error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const initials = employeeName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md dark:bg-black/80"
          aria-label="Close"
        />

        {/* Modal */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-[0_20px_50px_rgba(99,102,241,0.18)] dark:border-indigo-500/15 dark:bg-zinc-900/95"
        >
          {/* Neon top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-150 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] text-sm font-bold text-white shadow-md">
                {initials}
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  AI Summary — {employeeName}
                </h2>
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {role} · {department}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 [scrollbar-width:thin] [scrollbar-color:theme(colors.indigo.300)_transparent] dark:[scrollbar-color:theme(colors.indigo.700)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-indigo-300 dark:[&::-webkit-scrollbar-thumb]:bg-indigo-700">
            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-14 space-y-4">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/10 border-t-indigo-500" />
                  <RobotIcon className="h-6 w-6 text-indigo-500 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                    Analysing employee data...
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Reviewing tasks, progress, and performance
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/40 dark:bg-rose-950/20">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
              </div>
            )}

            {/* No summary yet */}
            {!loading && !error && !summary && (
              <div className="flex flex-col items-center justify-center py-14 text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
                  <DocumentTextIcon className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    No summary yet
                  </h3>
                  <p className="max-w-[320px] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Click <strong>Generate Summary</strong> below to let ANSH Copilot analyse this employee's tasks, progress, and performance.
                  </p>
                </div>
              </div>
            )}

            {/* Summary display */}
            {!loading && !error && summary && (
              <div className="space-y-4">
                {/* Stale summary notice */}
                {existingSummary && !generatedAt && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 dark:border-amber-700/25 dark:bg-amber-950/20">
                    <ClockIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      This is a previously generated summary. Click <strong>Re-summarise</strong> to get an updated one.
                    </p>
                  </div>
                )}

                {generatedAt && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                    <ClockIcon className="h-3 w-3" />
                    Generated just now
                  </div>
                )}

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-white/5 dark:bg-zinc-950/30">
                  <SummaryRenderer text={summary} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-150 bg-stone-50/50 px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/40">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
              <RobotIcon className="h-4 w-4 text-indigo-500 animate-pulse" />
              <span>Credit Cost:</span>
              <span className="text-indigo-600 dark:text-indigo-400">5 Credits</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-xl border border-zinc-250 bg-white px-4 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 text-xs font-bold text-white shadow-sm transition-colors hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : summary ? (
                  <>
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Re-summarise
                  </>
                ) : (
                  <>
                    <RobotIcon className="h-3.5 w-3.5" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
