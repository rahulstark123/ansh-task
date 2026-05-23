"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const DashboardWidgetGrid = dynamic(
  () =>
    import("./DashboardWidgetGrid").then((mod) => mod.DashboardWidgetGrid),
  {
    ssr: false,
    loading: () => (
      <div className="grid animate-pulse grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-2xl border border-zinc-200/80 bg-stone-100/90 dark:border-white/[0.07] dark:bg-zinc-900/40"
          />
        ))}
      </div>
    ),
  },
);

export function MainDashboardView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10"
    >
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Dashboard</p>
        <h1 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem] dark:text-zinc-50">
          Morning overview
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          A few cards you actually glance at — drag them into an order that matches your
          week. Nothing here is saved to the server yet.
        </p>
      </div>

      <DashboardWidgetGrid />
    </motion.div>
  );
}
