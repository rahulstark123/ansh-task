"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useWorkspaceDefaultsStore } from "@/store/workspaceDefaultsStore";

function getStatusOption(statusId: string, index: number) {
  if (statusId === "todo") {
    return { label: "To Do", dot: "bg-zinc-400" };
  }
  if (statusId === "in_progress") {
    return { label: "In Progress", dot: "bg-teal-500" };
  }
  if (statusId === "blocked") {
    return { label: "Blocked", dot: "bg-rose-500" };
  }
  if (statusId === "overdue") {
    return { label: "Overdue", dot: "bg-red-600" };
  }
  if (statusId === "done") {
    return { label: "Done", dot: "bg-emerald-500" };
  }

  // Custom status formatting
  const label = statusId
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Cycle colors: indigo, purple, amber, fuchsia, cyan
  const colors = [
    "bg-indigo-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-fuchsia-500",
    "bg-cyan-500",
  ];

  return {
    label,
    dot: colors[index % colors.length]
  };
}

export default function StatusesSettingsPage() {
  const {
    kanbanColumnOrder,
    loading,
    fetchDefaults,
    updateDefaults,
  } = useWorkspaceDefaultsStore();

  const [workspaceId, setWorkspaceId] = useState(1);
  const [newStatusName, setNewStatusName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Get workspace id from session storage on mount
  useEffect(() => {
    const wid = typeof window !== "undefined"
      ? parseInt(sessionStorage.getItem("ansh_onboarding_wid") ?? "1", 10)
      : 1;
    setWorkspaceId(wid);
    fetchDefaults(wid);
  }, [fetchDefaults]);

  const currentOrder = kanbanColumnOrder && kanbanColumnOrder.length > 0
    ? kanbanColumnOrder
    : ["todo", "in_progress", "blocked", "overdue", "done"];

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStatusName.trim();
    if (!name) return;

    // Convert spaces to underscores for the raw ID to prevent selector errors
    const rawId = name.toLowerCase().replace(/\s+/g, "_");

    if (currentOrder.some((s) => s.toLowerCase() === rawId.toLowerCase() || s.toLowerCase() === name.toLowerCase())) {
      setErrorMessage("Status already exists.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const updatedList = [...currentOrder, rawId];
    const success = await updateDefaults(workspaceId, {
      kanbanColumnOrder: updatedList,
    });

    if (success) {
      setNewStatusName("");
      setToastMessage(`Status "${name}" added successfully!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  const handleDeleteStatus = async (statusToDelete: string) => {
    if (currentOrder.length <= 1) {
      setErrorMessage("Workspace must have at least one status column.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const updatedList = currentOrder.filter((s) => s !== statusToDelete);
    const success = await updateDefaults(workspaceId, {
      kanbanColumnOrder: updatedList,
    });

    if (success) {
      const displayObj = getStatusOption(statusToDelete, 0);
      setToastMessage(`Status "${displayObj.label}" deleted.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-1.5 pb-6 border-b border-zinc-200/60 dark:border-white/5">
        <h1 className="font-heading text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Manage Task Statuses
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Create, view, and delete custom columns for your Kanban Board.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 max-w-4xl">
        {/* Left column: Add status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.06] dark:bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Squares2X2Icon className="h-4 w-4 text-indigo-500" />
              Add Custom Status
            </h3>
            
            <form onSubmit={handleAddStatus} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Review"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-stone-50/50 px-3.5 text-xs font-semibold text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-300 focus:shadow-[0_0_0_3px_var(--app-ring)] dark:border-white/[0.08] dark:bg-zinc-900/30 dark:text-zinc-100"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 bg-rose-50/50 border border-rose-100 p-2.5 rounded-lg dark:bg-rose-950/10 dark:border-rose-900/20">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newStatusName.trim()}
                className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--app-primary)] text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--app-primary-hover)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" />
                Add Status
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Current status list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/[0.06] dark:bg-zinc-900/50">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-4">
              Kanban Status Columns ({currentOrder.length})
            </h3>

            {loading && currentOrder.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {currentOrder.map((statusId, idx) => {
                  const statusObj = getStatusOption(statusId, idx);
                  return (
                    <div
                      key={statusId}
                      className="flex items-center justify-between py-3 group first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 transition-colors">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusObj.dot}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-750 dark:text-zinc-200">
                            {statusObj.label}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider dark:text-zinc-500">
                            ID: {statusId}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStatus(statusId)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 transition-all cursor-pointer"
                        title={`Delete ${statusObj.label}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
