"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRightIcon,
  RocketLaunchIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  PLAN_UPGRADE_EVENT,
  UpgradeRequiredPayload,
  getUpgradeMessage,
  getUpgradeTitle,
} from "@/lib/plans";

export function PlanUpgradeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(getUpgradeTitle("teamSpace"));
  const [message, setMessage] = useState(getUpgradeMessage("teamSpace"));

  useEffect(() => {
    const onUpgradeRequired = (event: Event) => {
      const custom = event as CustomEvent<UpgradeRequiredPayload>;
      const feature = custom.detail?.feature || "teamSpace";
      setTitle(custom.detail?.title || getUpgradeTitle(feature));
      setMessage(custom.detail?.message || getUpgradeMessage(feature));
      setOpen(true);
    };

    window.addEventListener(PLAN_UPGRADE_EVENT, onUpgradeRequired as EventListener);
    return () => {
      window.removeEventListener(PLAN_UPGRADE_EVENT, onUpgradeRequired as EventListener);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.16 }}
            className="fixed inset-0 z-[120] m-auto h-fit w-[92%] max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#13161c]"
            role="dialog"
            aria-modal="true"
            aria-label="Upgrade to pro"
          >
            <div className="relative p-6">
              <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/10 blur-2xl" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="relative z-10">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:ring-teal-900/50">
                  <RocketLaunchIcon className="h-6 w-6" />
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-teal-500/15 bg-teal-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-300">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Upgrade to PRO
                </div>

                <h3 className="mt-4 font-heading text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">
                  {message}
                </p>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-350">
                  This feature is not included in the Free plan. Upgrade to PRO to unlock the full workspace experience.
                </div>

                <div className="mt-5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-650 transition-all hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push("/settings/billing");
                    }}
                    className="flex-1 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.99]"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Upgrade to PRO
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
