"use client";

import { FunnelIcon, MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

type TaskFiltersBarProps = {
  onAddClick?: () => void;
};

export function TaskFiltersBar({ onAddClick }: TaskFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-[0_1px_0_rgba(0,0,0,0.04),0_6px_20px_-10px_rgba(24,24,27,0.08)] dark:border-white/[0.07] dark:bg-zinc-900/50 dark:shadow-none">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-h-[46px] min-w-0 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-zinc-400" />
          <input
            readOnly
            placeholder="Search tasks"
            className="h-full min-h-[46px] w-full rounded-xl border border-zinc-200/90 bg-stone-50/80 py-2.5 pr-3 pl-9 text-sm font-normal text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-950/40 dark:text-zinc-100"
          />
        </div>
        {onAddClick ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onAddClick}
            className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.08)_inset,0_4px_12px_-2px_rgba(13,148,136,0.35)] transition-colors hover:bg-[var(--app-primary-hover)] sm:px-6"
          >
            <PlusIcon className="h-[1.1rem] w-[1.1rem]" />
            Add task
          </motion.button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["All", "Labels", "Priority", "Due date", "Assignee"].map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-stone-50/90 px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-white dark:border-white/[0.08] dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            {label === "All" ? null : <FunnelIcon className="h-3 w-3 opacity-50" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
