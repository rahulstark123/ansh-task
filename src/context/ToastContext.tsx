"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from "@heroicons/react/24/outline";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = 
              toast.type === "success" 
                ? CheckCircleIcon 
                : toast.type === "error" 
                ? XCircleIcon 
                : InformationCircleIcon;
            
            const colorClass = 
              toast.type === "success" 
                ? "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20" 
                : toast.type === "error" 
                ? "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20" 
                : "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="pointer-events-auto flex min-w-0 max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 p-4 shadow-lg backdrop-blur-md dark:border-white/[0.08] dark:bg-zinc-900/80"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden pt-0.5">
                  <p
                    className="line-clamp-3 break-words text-xs font-semibold leading-relaxed text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-200"
                    title={toast.message}
                  >
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
