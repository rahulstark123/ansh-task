"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  FolderIcon,
  Squares2X2Icon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";

const PRIORITY_OPTIONS = [
  { value: "high", label: "High", dot: "bg-rose-500", activeColor: "border-rose-350 bg-rose-50/50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300" },
  { value: "medium", label: "Medium", dot: "bg-amber-400", activeColor: "border-amber-300 bg-amber-50/50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300" },
  { value: "low", label: "Low", dot: "bg-emerald-500", activeColor: "border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300" },
];

function getStatusOption(statusId: string, index: number) {
  if (statusId === "todo") {
    return { value: "todo", label: "To Do", dot: "bg-zinc-400", activeColor: "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300" };
  }
  if (statusId === "in_progress") {
    return { value: "in_progress", label: "In Progress", dot: "bg-teal-500", activeColor: "border-teal-300 bg-teal-50/50 text-teal-700 dark:border-teal-900/40 dark:bg-teal-950/20 dark:text-teal-300" };
  }
  if (statusId === "blocked") {
    return { value: "blocked", label: "Blocked", dot: "bg-rose-500", activeColor: "border-rose-300 bg-rose-50/50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300" };
  }
  if (statusId === "overdue") {
    return { value: "overdue", label: "Overdue", dot: "bg-red-600", activeColor: "border-red-300 bg-red-50/50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300" };
  }
  if (statusId === "done") {
    return { value: "done", label: "Done", dot: "bg-emerald-500", activeColor: "border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300" };
  }

  // Custom status formatting
  const label = statusId
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Cycle colors: indigo, purple, amber, fuchsia, cyan
  const colors = [
    { dot: "bg-indigo-500", activeColor: "border-indigo-300 bg-indigo-50/50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300" },
    { dot: "bg-purple-500", activeColor: "border-purple-300 bg-purple-50/50 text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-300" },
    { dot: "bg-amber-500", activeColor: "border-amber-300 bg-amber-50/50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300" },
    { dot: "bg-fuchsia-500", activeColor: "border-fuchsia-300 bg-fuchsia-50/50 text-fuchsia-700 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20 dark:text-fuchsia-300" },
    { dot: "bg-cyan-500", activeColor: "border-cyan-300 bg-cyan-50/50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300" },
  ];

  return {
    value: statusId,
    label,
    ...colors[index % colors.length]
  };
}

export default function WorkspaceDefaultsPage() {
  const {
    priority,
    status,
    category,
    labels,
    customCategories,
    customLabels,
    kanbanColumnOrder,
    loading,
    fetchDefaults,
    updateDefaults,
  } = useWorkspaceDefaultsStore();

  const [workspaceId, setWorkspaceId] = useState(1);
  const [selPriority, setSelPriority] = useState("medium");
  const [selStatus, setSelStatus] = useState("todo");
  const [selCategory, setSelCategory] = useState("General");
  const [selLabels, setSelLabels] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  const dynamicStatusOptions = useMemo(() => {
    const order = kanbanColumnOrder && kanbanColumnOrder.length > 0
      ? kanbanColumnOrder
      : ["todo", "in_progress", "blocked", "overdue", "done"];
    return order.map((id, index) => getStatusOption(id, index));
  }, [kanbanColumnOrder]);

  // Get workspace id from session storage on mount
  useEffect(() => {
    const wid = typeof window !== "undefined"
      ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
      : 1;
    setWorkspaceId(wid);
    fetchDefaults(wid);
  }, [fetchDefaults]);

  // Sync state values with store defaults
  useEffect(() => {
    setSelPriority(priority || "medium");
    setSelStatus(status || "todo");
    setSelCategory(category || "General");
    setSelLabels(labels || []);
  }, [priority, status, category, labels]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateDefaults(workspaceId, {
      priority: selPriority,
      status: selStatus,
      category: selCategory,
      labels: selLabels,
    });
    if (success) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleResetToStandard = () => {
    setSelPriority("medium");
    setSelStatus("todo");
    setSelCategory("General");
    setSelLabels([]);
  };

  const toggleLabel = (label: string) => {
    setSelLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="relative">
      {/* Header section matching profile/company layout */}
      <div className="flex flex-col gap-1.5 pb-6 border-b border-zinc-200/60 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Task Creation Defaults
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Configure default attributes populated automatically when creating new tasks.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetToStandard}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-250/60 bg-white/50 px-3 text-xs font-semibold text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-800 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          Reset Standard
        </button>
      </div>

      {loading && !priority ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--app-primary)] border-t-transparent" />
            <span className="text-xs text-zinc-450">Loading defaults…</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-8 space-y-8 max-w-3xl">
          
          {/* Default Priority Select */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <ExclamationCircleIcon className="h-4 w-4" />
              Default Priority
            </label>
            <div className="grid grid-cols-3 gap-3.5">
              {PRIORITY_OPTIONS.map((opt) => {
                const selected = selPriority === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelPriority(opt.value)}
                    className={[
                      "flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]",
                      selected
                        ? `${opt.activeColor} border-2 ring-2 ring-indigo-400/10`
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-950/30 dark:text-zinc-450 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Status Select */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <Squares2X2Icon className="h-4 w-4" />
              Default Status
            </label>
            <div className="flex flex-wrap gap-3">
              {dynamicStatusOptions.map((opt) => {
                const selected = selStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelStatus(opt.value)}
                    className={[
                      "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] min-w-[110px] cursor-pointer",
                      selected
                        ? `${opt.activeColor} border-2 ring-2 ring-indigo-400/10`
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-zinc-950/30 dark:text-zinc-400 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Category Dropdown */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <FolderIcon className="h-4 w-4" />
              Default Category
            </label>
            <div className="relative max-w-md">
              <select
                value={selCategory}
                onChange={(e) => setSelCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-200"
              >
                {customCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Default Labels Selection */}
          <div className="space-y-3.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <TagIcon className="h-4 w-4" />
              Default Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {customLabels.map((lbl) => {
                const active = selLabels.includes(lbl);
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => toggleLabel(lbl)}
                    className={[
                      "rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]",
                      active
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
                        : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-350 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {active && <span className="mr-1.5 text-indigo-400">✓</span>}
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-5 border-t border-zinc-100 dark:border-white/5 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
              Save default settings
            </button>
          </div>
        </form>
      )}

      {/* Floating success toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 rounded-2xl border border-emerald-500/10 bg-emerald-500 px-4 py-3 text-xs font-semibold text-white shadow-xl shadow-emerald-950/20"
          >
            <CheckIcon className="h-5 w-5 shrink-0" />
            <span>Workspace defaults updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
