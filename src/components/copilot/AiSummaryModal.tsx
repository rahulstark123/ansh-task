"use client";

import { useEffect, useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

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

type AiSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  taskTitle: string;
  summaryText: string;
  loading: boolean;
  onResummarize: () => void;
};

export function AiSummaryModal({
  open,
  onClose,
  taskTitle,
  summaryText,
  loading,
  onResummarize,
}: AiSummaryModalProps) {
  const titleId = useId();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md dark:bg-black/80"
          aria-label="Close dialog"
        />

        {/* Modal Box */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-white shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:border-indigo-500/15 dark:bg-zinc-900/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
        >
          {/* Neon Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600" />

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-150 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                <RobotIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
              </div>
              <h2 id={titleId} className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">
                Task AI Summary
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors disabled:opacity-40"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500/10 border-t-indigo-500" />
                  <RobotIcon className="h-6 w-6 text-indigo-500 animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 text-center animate-pulse">
                  ANSH Copilot is reading task details & generating summary...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Task Title
                  </h4>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{taskTitle}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-center gap-1">
                    <DocumentTextIcon className="h-3.5 w-3.5" /> Summary
                  </h4>
                  <div className="rounded-xl border border-zinc-100 bg-stone-50/50 p-4 text-xs font-medium leading-relaxed text-zinc-700 dark:border-white/[0.05] dark:bg-zinc-950/40 dark:text-zinc-300">
                    <p className="whitespace-pre-line">{summaryText || "No summary available."}</p>
                  </div>
                </div>

                {/* Old Summary warning note at the bottom */}
                <div className="rounded-lg bg-amber-50/50 p-3 border border-amber-100/40 dark:bg-amber-950/10 dark:border-amber-900/20 text-[10.5px] font-semibold leading-relaxed text-amber-700 dark:text-amber-400">
                  <p>
                    ⚠️ Note: This summary may be of old. If you have updated the task description, status, or notes, please click Re-summarise below to generate a fresh summary.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-150 bg-stone-50/50 px-6 py-4 dark:border-white/[0.06] dark:bg-zinc-950/40">
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
              <RobotIcon className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>Powered by Llama 3.1</span>
            </div>
            <div className="flex gap-2">
              {!loading && (
                <button
                  type="button"
                  onClick={onResummarize}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-250 bg-white px-3.5 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Re-summarise
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 rounded-xl bg-[var(--app-primary)] hover:bg-[var(--app-primary-hover)] px-4 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
