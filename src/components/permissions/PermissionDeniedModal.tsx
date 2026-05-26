"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExclamationTriangleIcon, ShieldExclamationIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  PERMISSION_DENIED_EVENT,
  PERMISSION_DENIED_MESSAGE,
} from "@/lib/permissions";

type PermissionDeniedPayload = {
  message?: string;
};

export function PermissionDeniedModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(PERMISSION_DENIED_MESSAGE);

  useEffect(() => {
    const onPermissionDenied = (event: Event) => {
      const custom = event as CustomEvent<PermissionDeniedPayload>;
      setMessage(custom.detail?.message || PERMISSION_DENIED_MESSAGE);
      setOpen(true);
    };

    window.addEventListener(PERMISSION_DENIED_EVENT, onPermissionDenied as EventListener);
    return () => {
      window.removeEventListener(PERMISSION_DENIED_EVENT, onPermissionDenied as EventListener);
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
            aria-label="Permission denied"
          >
            <div className="relative p-6">
              <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-rose-500/15 to-amber-500/10 blur-2xl" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="relative z-10">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/50">
                  <ShieldExclamationIcon className="h-6 w-6" />
                </div>

                <h3 className="font-heading text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                  Permission Required
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">
                  {message}
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                  Request access from workspace Admin or Owner.
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-5 w-full rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  Understood
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
